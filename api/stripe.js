// Stripe — platební subscripce pro tarifní plány šikulů.
// Volá Stripe REST API přímo přes fetch — bez npm 'stripe' balíčku.
//
// POST /api/stripe?action=checkout  → vytvoří Stripe Checkout session (subscripce)
// GET  /api/stripe?action=portal    → vytvoří Customer Portal session (správa/zrušení)
// POST /api/stripe?action=webhook   → Stripe webhook handler (podpis přes STRIPE_WEBHOOK_SECRET)

import crypto from 'node:crypto';
import { sendPlanCancelledEmail } from './_email.js';

// ── Stripe REST helpers ────────────────────────────────────────────────────────

function flattenParams(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === 'object' && item !== null) {
          Object.assign(out, flattenParams(item, `${key}[${i}]`));
        } else {
          out[`${key}[${i}]`] = String(item);
        }
      });
    } else if (typeof v === 'object') {
      Object.assign(out, flattenParams(v, key));
    } else {
      out[key] = String(v);
    }
  }
  return out;
}

async function stripeRequest(method, path, data) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY není nastaven.');
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Stripe-Version': '2024-11-20.acacia',
    },
  };
  if (data) {
    opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    opts.body = new URLSearchParams(flattenParams(data)).toString();
  }
  const res = await fetch(`https://api.stripe.com/v1${path}`, opts);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `Stripe HTTP ${res.status}`);
  return json;
}

// ── Webhook signature verification (HMAC-SHA256) ──────────────────────────────

function constructStripeEvent(rawBody, sig, secret) {
  const parts = Object.fromEntries(sig.split(',').map(s => s.split('=')));
  const expected = crypto.createHmac('sha256', secret)
    .update(`${parts.t}.${rawBody}`)
    .digest('hex');
  if (expected !== parts.v1) throw new Error('Webhook signature mismatch');
  return JSON.parse(rawBody);
}

// ── Plan konfigurace ───────────────────────────────────────────────────────────

// Forward lookup (checkout): plan + billing period → Stripe Price ID.
// 'yearly' má smysl jen u subscripčních tarifů aktiv/aktiv-plus.
const PRICE_IDS = {
  aktiv:        (billing) => billing === 'yearly' ? process.env.STRIPE_PRICE_AKTIV_YEARLY : process.env.STRIPE_PRICE_AKTIV,
  'aktiv-plus': (billing) => billing === 'yearly' ? process.env.STRIPE_PRICE_PLUS_YEARLY  : process.env.STRIPE_PRICE_PLUS,
  plus:         () => process.env.STRIPE_PRICE_PLUS,
  profi:        () => process.env.STRIPE_PRICE_PROFI,
};

const ENV_NAMES = {
  aktiv:        (billing) => billing === 'yearly' ? 'STRIPE_PRICE_AKTIV_YEARLY' : 'STRIPE_PRICE_AKTIV',
  'aktiv-plus': (billing) => billing === 'yearly' ? 'STRIPE_PRICE_PLUS_YEARLY'  : 'STRIPE_PRICE_PLUS',
  plus:         () => 'STRIPE_PRICE_PLUS',
  profi:        () => 'STRIPE_PRICE_PROFI',
};

// Reverzní lookup (webhook): Stripe Price ID → kanonický plan ('aktiv'/'aktiv-plus').
// Měsíční i roční cena stejného tarifu se musí namapovat na STEJNÝ plan id —
// do users.plan se nikdy nezapisuje "-yearly" varianta (viz DB constraint).
// STRIPE_PRICE_PLUS je aktuální cena za "Aktivní šikula Plus" a mapuje se na
// 'aktiv-plus' — NE na starý plan 'plus' (to je jen název proměnné, ne
// hodnota planu). 'top' (99 Kč zvýraznění) a 'profi' jsou od 2026-08 vypnuté
// a záměrně tu chybí — jejich staré price ID se už na žádný plan nemapuje,
// ať by ani starý/replayovaný webhook event nemohl zapsat neplatnou hodnotu
// do users.plan (viz ACTIVE_PLAN_IDS).
function planFromPriceId(priceId) {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_AKTIV || priceId === process.env.STRIPE_PRICE_AKTIV_YEARLY) return 'aktiv';
  if (priceId === process.env.STRIPE_PRICE_PLUS  || priceId === process.env.STRIPE_PRICE_PLUS_YEARLY)  return 'aktiv-plus';
  return null;
}

const PLAN_NAMES = {
  aktiv:        'Aktivní šikula',
  'aktiv-plus': 'Aktivní šikula Plus',
  plus:         'Plus',
  profi:        'Profi',
};

// Jediné dvě hodnoty, které smí (a) založit nový checkout, (b) skončit
// zapsané do users.plan webhookem. 'plus'/'profi'/'top' a cokoliv jiného
// jsou staré/vyřazené hodnoty — PRICE_IDS/ENV_NAMES/PLAN_NAMES pro ně výše
// zůstávají kvůli starým datům a diagnostice, ale nikdy se přes tenhle
// allowlist nedostanou dál.
const ACTIVE_PLAN_IDS = new Set(['aktiv', 'aktiv-plus']);

// Očekávaná cena v Kč pro aktiv/aktiv-plus — použije se jen jako bezpečnostní
// pojistka (viz handleCheckout), nikde neurčuje/nemění skutečnou cenu ve Stripe.
const EXPECTED_AMOUNT_CZK = {
  aktiv:        { monthly: 199, yearly: 2240 },
  'aktiv-plus': { monthly: 299, yearly: 3300 },
};

// ── Raw body ze streamu (pro webhook) ─────────────────────────────────────────

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ── Hlavní handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const action = req.query?.action;

  // Dynamický import — pokud _db.js nebo _auth.js selžou při inicializaci,
  // chyba je zachycena a vrácena jako JSON místo Vercel FUNCTION_INVOCATION_FAILED
  let sql, requireUser;
  try {
    const db   = await import('./_db.js');
    const auth = await import('./_auth.js');
    sql         = db.sql;
    requireUser = auth.requireUser;
  } catch (err) {
    console.error('[/api/stripe] module init failed:', err);
    return res.status(500).json({ error: `Inicializace selhala: ${err.message}` });
  }

  try {
    if (action === 'webhook' && req.method === 'POST') {
      return handleWebhook(req, res, sql);
    }

    const me = await requireUser(req, res);
    if (!me) return;
    if (me.role !== 'sikula') return res.status(403).json({ error: 'Pouze šikulové mohou upgradovat.' });

    if (action === 'checkout' && req.method === 'POST') return handleCheckout(req, res, me, sql);
    if (action === 'portal'   && req.method === 'GET')  return handlePortal(req, res, me, sql);

    res.setHeader('Allow', 'POST, GET');
    return res.status(404).json({ error: 'Neznámá akce.' });
  } catch (err) {
    console.error('[/api/stripe]', action, err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

// ── POST /api/stripe?action=checkout ──────────────────────────────────────────

async function handleCheckout(req, res, me, sql) {
  const { plan = 'aktiv', billing = 'monthly' } = req.body ?? {};
  // Nový checkout smí založit jen na aktuální veřejné tarify (aktiv,
  // aktiv-plus). Staré hodnoty (plus, profi, top) i cokoliv neznámé se
  // odmítnou, i kdyby pro ně PRICE_IDS/PLAN_NAMES pořád měly legacy záznam.
  if (!ACTIVE_PLAN_IDS.has(plan)) {
    return res.status(400).json({ error: 'Neplatný plán.' });
  }
  if (billing !== 'monthly' && billing !== 'yearly') {
    return res.status(400).json({ error: 'Neplatné zúčtovací období.' });
  }
  const priceId = PRICE_IDS[plan](billing);
  if (!priceId) {
    return res.status(503).json({ error: `${ENV_NAMES[plan]?.(billing) || 'STRIPE_PRICE_?'} není nastaven v env.` });
  }

  // Bezpečnostní pojistka: ověříme u Stripe, že cena za priceId skutečně
  // odpovídá tarifu, který si zákazník vybral — jinak by špatně nastavená
  // env proměnná (např. STRIPE_PRICE_PLUS ukazující na cenu 199 Kč místo
  // 299 Kč) tiše poslala zákazníka na checkout se špatnou částkou.
  const expectedKc = EXPECTED_AMOUNT_CZK[plan]?.[billing];
  if (expectedKc != null) {
    let priceObj;
    try {
      priceObj = await stripeRequest('GET', `/prices/${priceId}`);
    } catch (e) {
      console.error('[stripe/checkout] nepodařilo se ověřit cenu u Stripe:', e.message);
      return res.status(500).json({ error: 'Nepodařilo se ověřit cenu tarifu u Stripe. Zkuste to prosím znovu.' });
    }
    const actualKc = priceObj.unit_amount != null ? priceObj.unit_amount / 100 : null;
    if (priceObj.currency !== 'czk' || actualKc !== expectedKc) {
      console.error('[stripe/checkout] PRICE MISMATCH — checkout zastaven:', {
        plan, billing,
        envVar: ENV_NAMES[plan]?.(billing),
        priceIdPrefix: priceId.slice(0, 12),
        expectedKc, actualKc, currency: priceObj.currency,
      });
      return res.status(500).json({
        error: `Nastavení ceny pro tarif ${PLAN_NAMES[plan] || plan} (${billing === 'yearly' ? 'ročně' : 'měsíčně'}) neodpovídá očekávané částce — checkout byl kvůli bezpečnosti zastaven. Kontaktujte prosím podporu.`,
      });
    }
  }

  // Bezpečný diagnostický log — nikdy nevypisuje celý klíč, jen režim (live/test),
  // aby šlo z Vercel logů poznat, proč vznikl cs_test_/cs_live_ checkout.
  const secretKey = process.env.STRIPE_SECRET_KEY || '';
  const keyMode = secretKey.startsWith('sk_live_') ? 'live'
                : secretKey.startsWith('sk_test_') ? 'test'
                : 'unknown';
  console.log('[stripe/checkout] diagnostics:', {
    keyMode,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    plan,
    billing,
    priceIdPrefix: priceId.slice(0, 12),
  });
  if (keyMode !== 'live' && process.env.VERCEL_ENV === 'production') {
    console.warn(`[stripe/checkout] POZOR: produkční nasazení používá ${keyMode} Stripe klíč!`);
  }

  const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://sikuladoma.vercel.app';
  const [user] = await sql`SELECT stripe_customer_id FROM users WHERE id = ${me.id}`;

  // Zajistíme Stripe Customera s preferred_locales=['cs'] — session `locale` (níže)
  // ovlivňuje jen platební stránku, ale e-maily s fakturou/účtenkou od Stripe
  // se řídí Customer.preferred_locales, ne session locale.
  let customerId = user?.stripe_customer_id || null;
  try {
    if (customerId) {
      await stripeRequest('POST', `/customers/${customerId}`, { preferred_locales: ['cs'] });
    } else {
      const customer = await stripeRequest('POST', '/customers', {
        email: me.email,
        name: me.name,
        preferred_locales: ['cs'],
      });
      customerId = customer.id;
    }
  } catch (e) {
    console.warn('[stripe/checkout] nepodařilo se nastavit preferred_locales:', e.message);
  }

  const sessionData = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    // page=dashboard — bez toho App.jsx při startu neví, že se má vrátit do
    // dashboardu (řídí se jen ?page= URL parametrem), a přihlášeného uživatele
    // by to poslalo na homepage místo zpět do jeho dashboardu.
    success_url: `${origin}/?page=dashboard&stripe=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?page=dashboard&stripe=cancel`,
    metadata: { user_id: String(me.id), plan },
    payment_method_types: ['card'],
    locale: 'cs',
    subscription_data: { metadata: { user_id: String(me.id), plan } },
  };

  if (customerId) {
    sessionData.customer = customerId;
  } else {
    sessionData.customer_email = me.email;
  }

  const session = await stripeRequest('POST', '/checkout/sessions', sessionData);
  console.log('[stripe/checkout] session created:', session.id?.startsWith('cs_live_') ? 'cs_live_…' : session.id?.startsWith('cs_test_') ? 'cs_test_…' : session.id);
  return res.status(200).json({ url: session.url });
}

// ── GET /api/stripe?action=portal ─────────────────────────────────────────────

async function handlePortal(req, res, me, sql) {
  const [user] = await sql`SELECT stripe_customer_id FROM users WHERE id = ${me.id}`;
  if (!user?.stripe_customer_id) {
    return res.status(400).json({ error: 'Nemáte aktivní Stripe předplatné.' });
  }

  const origin = req.headers.origin || 'https://sikuladoma.cz';
  const session = await stripeRequest('POST', '/billing_portal/sessions', {
    customer: user.stripe_customer_id,
    return_url: `${origin}/dashboard`,
  });

  return res.status(200).json({ url: session.url });
}

// ── POST /api/stripe?action=webhook ───────────────────────────────────────────

async function handleWebhook(req, res, sql) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    let rawBody;
    try {
      rawBody = await getRawBody(req);
      if (!rawBody || rawBody.length === 0) throw new Error('empty stream');
    } catch {
      rawBody = Buffer.from(JSON.stringify(req.body));
    }

    const rawStr = rawBody.toString('utf8');
    if (webhookSecret && sig) {
      event = constructStripeEvent(rawStr, sig, webhookSecret);
    } else {
      event = typeof req.body === 'object' ? req.body : JSON.parse(rawStr);
      console.warn('[stripe/webhook] Webhook secret není nastaven — podpis se neverifikuje!');
    }
  } catch (err) {
    console.error('[stripe/webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Bezpečný diagnostický log — potvrdí, že webhook vůbec dorazil a jestli jde
  // o live nebo test event (bez vypsání citlivých dat).
  console.log('[stripe/webhook] event received:', event.type, 'livemode:', event.livemode);

  try {
    await processEvent(event, sql);
  } catch (err) {
    console.error('[stripe/webhook] processEvent error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  return res.status(200).json({ received: true });
}

// Informační e-mail o zrušení tarifu — selhání e-mailu nesmí shodit
// zpracování webhooku, jen se zaloguje. Oznámení v profilu ("Oznámení")
// se odvozuje přímo z subscription_status/plan_expires_at při načtení
// profilu, nic se tu zvlášť neukládá.
async function notifyPlanCancelled(sql, userId, expiresAt) {
  try {
    const [user] = await sql`SELECT email, name FROM users WHERE id = ${userId}`;
    if (!user?.email) return;
    await sendPlanCancelledEmail({ to: user.email, name: user.name, expiresAt });
  } catch (err) {
    console.error('[stripe] plan cancelled email failed:', err);
  }
}

// ── Zpracování Stripe eventů ───────────────────────────────────────────────────

async function processEvent(event, sql) {
  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = Number(session.metadata?.user_id);
      const plan   = session.metadata?.plan || 'aktiv';
      if (!userId) {
        console.warn('[stripe/webhook] checkout.session.completed bez metadata.user_id — přeskočeno', session.id);
        break;
      }

      // Do users.plan smí dojít zápis jen pro aktuální tarify (aktiv,
      // aktiv-plus). Staré/vyřazené hodnoty (plus, profi, top) i cokoliv
      // neznámé se zahodí — checkout je sice od teď negeneruje (viz
      // handleCheckout), ale webhook musí být odolný i vůči starému/
      // replayovanému eventu s takovou hodnotou v metadata.plan.
      if (!ACTIVE_PLAN_IDS.has(plan)) {
        console.warn('[stripe/webhook] checkout.session.completed s neplatným/vyřazeným plánem — přeskočeno', { userId, plan, sessionId: session.id });
        break;
      }

      const customerId     = session.customer;
      const subscriptionId = session.subscription;

      let expiresAt = null;

      if (subscriptionId) {
        try {
          const sub = await stripeRequest('GET', `/subscriptions/${subscriptionId}`);
          if (sub.current_period_end) {
            expiresAt = new Date(sub.current_period_end * 1000).toISOString();
          }
        } catch (e) {
          console.warn('[stripe/webhook] Could not retrieve subscription:', e.message);
        }
      }

      await sql`
        UPDATE users
        SET plan                   = ${plan},
            stripe_customer_id     = ${customerId},
            stripe_subscription_id = ${subscriptionId},
            plan_expires_at        = ${expiresAt},
            subscription_status    = 'active',
            updated_at             = NOW()
        WHERE id = ${userId}
      `;
      console.log(`[stripe] User ${userId} aktivován: ${plan}`);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const userId = Number(sub.metadata?.user_id);
      if (!userId) break;

      const priceId = sub.items?.data?.[0]?.price?.id;
      const plan = planFromPriceId(priceId) || 'aktiv';

      const expiresAt = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString() : null;

      // cancel_at_period_end = zákazník tarif zrušil, ale Stripe subscripci
      // ukončí až na konci už zaplaceného období — do té doby (plan_expires_at)
      // zůstává profil plně funkční, žádné okamžité zamčení.
      const subStatus = sub.cancel_at_period_end ? 'cancelled'
                       : ['active', 'trialing'].includes(sub.status) ? 'active'
                       : sub.status === 'past_due' ? 'payment_failed'
                       : 'inactive';

      const [prev] = await sql`SELECT subscription_status FROM users WHERE id = ${userId}`;

      await sql`
        UPDATE users
        SET plan                   = ${plan},
            stripe_subscription_id = ${sub.id},
            plan_expires_at        = ${expiresAt},
            subscription_status    = ${subStatus},
            updated_at             = NOW()
        WHERE id = ${userId}
      `;
      console.log(`[stripe] User ${userId} subscription updated: ${subStatus}`);

      // E-mail + zdroj pro "Oznámení" jen při skutečném přechodu do
      // 'cancelled' — Stripe posílá 'updated' i opakovaně/idempotentně,
      // tohle zajistí, že se nepošle víckrát za sebou.
      if (subStatus === 'cancelled' && prev?.subscription_status !== 'cancelled') {
        await notifyPlanCancelled(sql, userId, expiresAt);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const userId = Number(sub.metadata?.user_id);
      if (!userId) break;

      // current_period_end na deleted eventu je poslední známý konec
      // zaplaceného období — pokud je v budoucnu (např. okamžité zrušení
      // uprostřed období), profil zůstává funkční až do něj (viz
      // api/_plan.js), ne hned teď. plan a plan_expires_at se NEnulují —
      // auto-expiry v _auth.js je stáhne na 'start' samo, jakmile
      // plan_expires_at skutečně uplyne.
      const expiresAt = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString() : null;

      const [prev] = await sql`SELECT subscription_status, plan_expires_at FROM users WHERE id = ${userId}`;

      await sql`
        UPDATE users
        SET stripe_subscription_id = NULL,
            plan_expires_at        = COALESCE(${expiresAt}, plan_expires_at),
            subscription_status    = 'cancelled',
            updated_at             = NOW()
        WHERE id = ${userId}
      `;
      console.log(`[stripe] User ${userId} subscription deleted -> cancelled`);

      if (prev?.subscription_status !== 'cancelled') {
        await notifyPlanCancelled(sql, userId, expiresAt || prev?.plan_expires_at || null);
      }
      break;
    }

    case 'invoice.paid':
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const [user] = await sql`SELECT id FROM users WHERE stripe_customer_id = ${invoice.customer}`;
      if (!user) {
        console.warn(`[stripe/webhook] ${event.type}: uživatel pro customer ${invoice.customer} nenalezen`);
        break;
      }

      let expiresAt = null;
      let plan = null;
      if (invoice.subscription) {
        try {
          const sub = await stripeRequest('GET', `/subscriptions/${invoice.subscription}`);
          if (sub.current_period_end) {
            expiresAt = new Date(sub.current_period_end * 1000).toISOString();
          }
          const priceId = sub.items?.data?.[0]?.price?.id;
          plan = planFromPriceId(priceId);
        } catch (e) {
          console.warn('[stripe/webhook] Could not retrieve subscription for invoice:', e.message);
        }
      }

      await sql`
        UPDATE users
        SET subscription_status = 'active',
            plan_expires_at      = COALESCE(${expiresAt}, plan_expires_at),
            plan                 = COALESCE(${plan}, plan),
            updated_at           = NOW()
        WHERE id = ${user.id}
      `;
      console.log(`[stripe] User ${user.id} invoice paid (${event.type}) — subscription_status active`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const [user] = await sql`SELECT id FROM users WHERE stripe_customer_id = ${invoice.customer}`;
      if (user) {
        await sql`UPDATE users SET subscription_status = 'payment_failed', updated_at = NOW() WHERE id = ${user.id}`;
      }
      console.warn(`[stripe] Payment failed pro customer ${invoice.customer}`);
      break;
    }

    default:
      break;
  }
}

// Stripe — platební subscripce pro tarifní plány šikulů.
// Volá Stripe REST API přímo přes fetch — bez npm 'stripe' balíčku.
//
// POST /api/stripe?action=checkout  → vytvoří Stripe Checkout session (subscripce)
// GET  /api/stripe?action=portal    → vytvoří Customer Portal session (správa/zrušení)
// POST /api/stripe?action=webhook   → Stripe webhook handler (podpis přes STRIPE_WEBHOOK_SECRET)

import crypto from 'node:crypto';

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

const PRICE_IDS = {
  aktiv:        () => process.env.STRIPE_PRICE_AKTIV,
  'aktiv-plus': () => process.env.STRIPE_PRICE_PLUS,
  plus:         () => process.env.STRIPE_PRICE_PLUS,
  profi:        () => process.env.STRIPE_PRICE_PROFI,
  top:          () => process.env.STRIPE_PRICE_TOP,
};

const ENV_NAMES = {
  aktiv:        'STRIPE_PRICE_AKTIV',
  'aktiv-plus': 'STRIPE_PRICE_PLUS',
  plus:         'STRIPE_PRICE_PLUS',
  profi:        'STRIPE_PRICE_PROFI',
  top:          'STRIPE_PRICE_TOP',
};

const PLAN_NAMES = {
  aktiv:        'Aktivní šikula',
  'aktiv-plus': 'Aktivní šikula Plus',
  plus:         'Plus',
  profi:        'Profi',
  top:          'Přednostní zobrazení',
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
  const { plan = 'aktiv' } = req.body ?? {};
  if (!PLAN_NAMES[plan]) {
    return res.status(400).json({ error: 'Neplatný plán.' });
  }
  const priceId = PRICE_IDS[plan]();
  if (!priceId) {
    return res.status(503).json({ error: `${ENV_NAMES[plan] || 'STRIPE_PRICE_?'} není nastaven v env.` });
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

  // 'top' je jednorázová platba (99 Kč / 30 dní), ostatní jsou subscripce
  const isSubscription = plan !== 'top';

  const sessionData = {
    mode: isSubscription ? 'subscription' : 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/?stripe=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?stripe=cancel`,
    metadata: { user_id: String(me.id), plan },
    payment_method_types: ['card'],
    locale: 'cs',
  };

  if (isSubscription) {
    sessionData.subscription_data = { metadata: { user_id: String(me.id), plan } };
  } else {
    // Jednorázová platba (top) — subscripce fakturu vytváří automaticky,
    // u mode:'payment' je nutné si o ni říct explicitně.
    sessionData.invoice_creation = { enabled: true };
  }

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

      const customerId     = session.customer;
      const subscriptionId = session.subscription;

      let expiresAt = null;

      if (session.mode === 'payment' && plan === 'top') {
        // Jednorázové topování — platné 30 dní od zaplacení
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (subscriptionId) {
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
      const plan = Object.entries(PRICE_IDS).find(([, fn]) => fn() === priceId)?.[0] || 'aktiv';

      const expiresAt = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString() : null;

      const subStatus = ['active', 'trialing'].includes(sub.status) ? 'active'
                       : sub.status === 'past_due' ? 'payment_failed'
                       : 'inactive';

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
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const userId = Number(sub.metadata?.user_id);
      if (!userId) break;

      await sql`
        UPDATE users
        SET plan                   = 'start',
            stripe_subscription_id = NULL,
            plan_expires_at        = NULL,
            subscription_status    = 'inactive',
            updated_at             = NOW()
        WHERE id = ${userId}
      `;
      console.log(`[stripe] User ${userId} zrušil předplatné → inactive`);
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
          plan = Object.entries(PRICE_IDS).find(([, fn]) => fn() === priceId)?.[0] || null;
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

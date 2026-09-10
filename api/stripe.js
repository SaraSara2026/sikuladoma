// Stripe — platební subscripce pro tarifní plány šikulů.
// Volá Stripe REST API přímo přes fetch — bez npm 'stripe' balíčku.
//
// POST /api/stripe?action=checkout  → vytvoří Stripe Checkout session (subscripce)
// GET  /api/stripe?action=portal    → vytvoří Customer Portal session (správa/zrušení)
// POST /api/stripe?action=webhook   → Stripe webhook handler (podpis přes STRIPE_WEBHOOK_SECRET)

import crypto from 'node:crypto';
import { sendPlanCancelledEmail } from './_email.js';
import { isStatusActiveOrGrace } from './_plan.js';

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

// idempotencyKey je volitelný — používá se výhradně pro operace, kde by
// zopakování stejného požadavku (ztracená odpověď, retry po timeoutu) mohlo
// jinak vytvořit druhý vedlejší efekt (viz POST /refunds v
// refundSubscriptionLatestInvoice). Stripe s ním vrátí přesně stejnou
// odpověď jako napoprvé, aniž by akci provedl znovu.
async function stripeRequest(method, path, data, idempotencyKey) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY není nastaven.');
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Stripe-Version': '2024-11-20.acacia',
    },
  };
  if (idempotencyKey) {
    opts.headers['Idempotency-Key'] = idempotencyKey;
  }
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
  if (!parts.t || !parts.v1) throw new Error('Webhook signature malformed');
  const expected = crypto.createHmac('sha256', secret)
    .update(`${parts.t}.${rawBody}`)
    .digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(parts.v1, 'hex');
  if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
    throw new Error('Webhook signature mismatch');
  }
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
// Který TARIF (aktiv/aktiv-plus) předplatné patří — NIKDY hádáním přes
// aktuální STRIPE_PRICE_* (ty rotují, viz 2026-09-08). V pořadí spolehlivosti:
//
// 1) sub.metadata.plan — appka ho ukládá sama při založení checkoutu
//    (handleCheckout → subscription_data.metadata.plan), takže je to přesně
//    to, co si zákazník koupil, bez ohledu na jakoukoliv pozdější změnu cen.
// 2) Stripe Product ID položky předplatného (sub.items[0].price.product) —
//    na rozdíl od Price ID je STABILNÍ i když pod stejným produktem vznikne
//    nová cena. STRIPE_PRODUCT_AKTIV/STRIPE_PRODUCT_PLUS jsou produkty, ne
//    ceny, takže se nemění při každé úpravě ceníku.
// 3) Nejde-li určit ani jedno (starý/testovací/neznámý subscription bez
//    metadat i bez rozpoznaného produktu) — vrátí se null. Volající NESMÍ
//    v tom případě dosadit žádný default (zejména ne 'aktiv') — u staré
//    Plus ceny nebo skutečně neznámého produktu by to byl tichý downgrade
//    tarifu. Musí se místo toho nechat stávající users.plan beze změny.
export function planFromSubscription(sub) {
  const metaPlan = sub?.metadata?.plan;
  if (ACTIVE_PLAN_IDS.has(metaPlan)) return metaPlan;

  const productId = sub?.items?.data?.[0]?.price?.product;
  if (productId && productId === process.env.STRIPE_PRODUCT_AKTIV) return 'aktiv';
  if (productId && productId === process.env.STRIPE_PRODUCT_PLUS)  return 'aktiv-plus';

  return null;
}

// Měsíční/roční se odvozuje ze SKUTEČNÉHO recurring.interval dané položky
// předplatného ('month'/'year'), ne porovnáním s aktuálními STRIPE_PRICE_*
// env proměnnými. Ty se můžou kdykoliv změnit (jako 2026-09-08, kdy vznikly
// nové ceny/Price ID) — starší předplatné na dřívějším Price ID by pak touhle
// metodou přestalo jít rozpoznat, i když je pořád validní a platí se. Stripe
// vrací interval přímo na price objektu bez ohledu na to, jestli je Price ID
// pořád "aktuální", takže tohle funguje pro libovolně staré i budoucí ceny.
// Pozor: tohle se týká jen ČTENÍ/zobrazení existujícího předplatného — pro
// ZALOŽENÍ nového checkoutu se pořád smí použít jen dnešní STRIPE_PRICE_*
// (viz PRICE_IDS / ACTIVE_PLAN_IDS / EXPECTED_AMOUNT_CZK výše).
function billingFromInterval(interval) {
  if (interval === 'year') return 'yearly';
  if (interval === 'month') return 'monthly';
  return null;
}

// Jediné místo, které rozhoduje, co se má zapsat do users.plan_billing —
// použité shodně ve všech třech webhook větvích, co ten sloupec píšou
// (checkout.session.completed, customer.subscription.updated/.deleted).
// Nesmí se zapsat období u účtu, který právě není opravdu aktivní ani v
// doběhu (viz isStatusActiveOrGrace) — jinak by sloupec tvrdil "má měsíční
// tarif" i u dávno zrušeného předplatného bez nároku na cokoliv.
export function resolvePlanBilling(subscriptionStatus, planExpiresAt, interval) {
  return isStatusActiveOrGrace(subscriptionStatus, planExpiresAt) ? billingFromInterval(interval) : null;
}

// Blokuje jen PŘESNĚ tu samou variantu, kterou uživatel už aktivně platí
// (stejný tarif A stejné zúčtovací období) — ne jen stejný tarif. Přepnutí
// měsíc↔rok u stejného tarifu, upgrade/downgrade na jiný tarif nebo aktivace
// s neznámým (null) plan_billing musí jít vždycky rovnou koupit; případné
// staré souběžné předplatné se řeší až při dokončení checkoutu (viz
// checkout.session.completed — zruší se tam, ne tady blokováním).
export function wouldDuplicateSubscription(userPlan, userPlanBilling, requestedPlan, requestedBilling, subscriptionStatus, planExpiresAt) {
  return userPlan === requestedPlan
    && userPlanBilling === requestedBilling
    && isStatusActiveOrGrace(subscriptionStatus, planExpiresAt);
}

// ── Ochrana proti opožděným/přeslechnutým webhookům (2026-09-09) ──────────────
// Webhooky od Stripe nejsou garantovaně doručené v pořadí a mohou přijít i
// opakovaně. Když uživatel přejde z předplatného A na B, dřívější kód
// dopočítával "co zapsat" ze SELECTu a pak zapsal UPDATEm — mezi tím se ale
// mohl stihnout zpracovat jiný event (typicky deleted/updated/invoice pro A,
// vyvolaný naším vlastním zrušením A), a nevědomky přepsat B zpátky na
// zrušené. Řešení: každý zápis v processEvent níže musí mít v samotném SQL
// WHERE podmínku na stripe_subscription_id, aby se UPDATE aplikoval jen
// tehdy, když se opravdu týká předplatného, které je PRÁVĚ TEĎ (atomicky, v
// okamžiku zápisu) uložené jako uživatelovo. Funkce níže jsou čisté zrcadlo
// těch SQL podmínek — testovatelné bez DB — ale o samotnou atomicitu se za
// běhu stará vždy přímo Postgres WHERE, ne tahle JS funkce (ta by se dala
// obejít souběžností stejně jako původní SELECT-then-UPDATE).

// checkout.session.completed: zápis smí projít, jen když je uživatelovo
// AKTUÁLNÍ stripe_subscription_id pořád stejné, jako bylo v okamžiku
// VYTVOŘENÍ tohohle checkoutu (běžný případ, včetně null→null u úplně
// prvního předplatného), NEBO už je rovnou rovné tomuhle novému předplatnému
// (opakované/duplicitní doručení stejného eventu — bezpečné zapsat znovu).
// Cokoliv jiného znamená, že mezitím proběhl JINÝ, novější checkout.
export function checkoutCompletionShouldApply(currentSubscriptionId, previousSubscriptionId, incomingSubscriptionId) {
  return currentSubscriptionId === previousSubscriptionId || currentSubscriptionId === incomingSubscriptionId;
}

// updated/deleted/invoice.*: zápis smí projít, jen když je událost o
// předplatném, které je aktuálně uložené jako uživatelovo.
export function subscriptionEventShouldApply(currentSubscriptionId, eventSubscriptionId) {
  return currentSubscriptionId === eventSubscriptionId;
}

// Zrušení předplatného u Stripe musí jít bezpečně zopakovat. Pokud je
// předplatné už zrušené (ať už naším dřívějším úspěšným pokusem, nebo
// jakoukoliv jinou cestou) nebo už vůbec neexistuje, Stripe na DELETE
// odpoví chybou — to se ale musí počítat jako ÚSPĚCH (cílový stav "staré
// předplatné neběží" je splněný), jinak by retry nikdy neskončil úspěchem.
export function isAlreadyCanceledError(message) {
  return /already.*cancel/i.test(message || '') || /no such subscription/i.test(message || '');
}

// Stejná logika pro refundaci (2026-09-10) — Stripe odmítne vrátit platbu,
// která je už celá vrácená, chybou obsahující "already ... refunded" — i to
// je nutné brát jako ÚSPĚCH (cílový stav "zákazník peníze dostal zpátky" je
// splněný), jinak by se retry nikdy nezastavil.
export function isAlreadyRefundedError(message) {
  return /already.*refund/i.test(message || '');
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
  aktiv:        { monthly: 299, yearly: 2990 },
  'aktiv-plus': { monthly: 399, yearly: 3990 },
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
    return res.status(500).json({ error: 'Server error' });
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
    // Checkout/portal odpovídá přímo přihlášenému šikulovi v prohlížeči —
    // syrová err.message (klidně detail z sql/Stripe API) se nesmí posílat
    // ven, jen do serverového logu výše.
    return res.status(500).json({ error: 'Server error' });
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

  // Bezpečnostní pojistka nezávislá na frontendu: blokuje jen přesně tu
  // samou variantu (stejný tarif A stejné období), kterou uživatel už
  // aktivně platí. Přepnutí měsíc↔rok, upgrade/downgrade na jiný tarif,
  // nebo aktivace u účtu s neznámým plan_billing (starší data) se vždycky
  // pustí dál — případné staré souběžné předplatné se ukončí až po úspěšném
  // dokončení tohohle checkoutu (viz checkout.session.completed).
  if (wouldDuplicateSubscription(me.plan, me.plan_billing, plan, billing, me.subscription_status, me.plan_expires_at)) {
    return res.status(409).json({
      error: 'Tuhle variantu tarifu už máte aktivní. Správu nebo zrušení najdete v zákaznickém portálu.',
      code: 'already_subscribed',
    });
  }

  const priceId = PRICE_IDS[plan](billing);
  if (!priceId) {
    return res.status(503).json({ error: `${ENV_NAMES[plan]?.(billing) || 'STRIPE_PRICE_?'} není nastaven v env.` });
  }

  // 21% DPH je na cenách (299/399/2990/3990 Kč) nastavená jako Inclusive
  // ruční Tax Rate ve Stripe (ne automatický Stripe Tax) — musí se explicitně
  // připojit k předplatnému přes default_tax_rates, jinak by se do faktur
  // vůbec nepropsala. Bez ID radši checkout odmítnout, než tiše poslat
  // zákazníka na platbu bez správně rozepsaného DPH na dokladu.
  const taxRateId = process.env.STRIPE_TAX_RATE_ID;
  if (!taxRateId) {
    return res.status(503).json({ error: 'STRIPE_TAX_RATE_ID není nastaven v env.' });
  }

  // Bezpečnostní pojistka: ověříme u Stripe, že cena za priceId skutečně
  // odpovídá tarifu, který si zákazník vybral — jinak by špatně nastavená
  // env proměnná (např. STRIPE_PRICE_PLUS ukazující na cenu 299 Kč místo
  // 399 Kč) tiše poslala zákazníka na checkout se špatnou částkou.
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
  const [user] = await sql`SELECT stripe_customer_id, stripe_subscription_id FROM users WHERE id = ${me.id}`;
  // Snímek uživatelova AKTUÁLNÍHO předplatného v okamžiku vytvoření tohohle
  // checkoutu — uloží se do metadat checkoutu i nového předplatného, aby ho
  // webhook (checkout.session.completed) mohl bezpečně zrušit po úspěšném
  // přechodu, a aby šlo poznat opožděný/duplicitní event ze STARŠÍHO checkoutu
  // (viz checkoutCompletionShouldApply výše).
  const previousSubscriptionId = user?.stripe_subscription_id || null;

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
    metadata: { user_id: String(me.id), plan, previous_subscription_id: previousSubscriptionId || undefined },
    payment_method_types: ['card'],
    locale: 'cs',
    subscription_data: {
      metadata: { user_id: String(me.id), plan, previous_subscription_id: previousSubscriptionId || undefined },
      default_tax_rates: [taxRateId],
    },
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

  // Bez secretu nejde podpis ověřit vůbec — dřív se v tom případě událost
  // tiše přijala bez verifikace, což by šlo zneužít k podvržení platby
  // (aktivace tarifu zdarma). Radši selhat nahlas (503) než věřit nepodepsaným datům.
  if (!webhookSecret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET není nastaven — webhook odmítnut.');
    return res.status(503).json({ error: 'Webhook není nakonfigurován.' });
  }

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
    // Chybějící Stripe-Signature hlavička se nesmí tiše propustit jako
    // neověřená událost (jinak by šlo webhook podvrhnout jen tím, že se
    // hlavička vynechá).
    if (!sig) throw new Error('Chybí Stripe-Signature hlavička.');
    event = constructStripeEvent(rawStr, sig, webhookSecret);
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

// ── Bezpečně opakovatelné rušení starého předplatného ─────────────────────────
//
// stripeRequestFn je vždy injektovaný parametr (výchozí = skutečný
// stripeRequest) — testy v scripts/test-plan-billing.js si sem dosadí fake
// implementaci a ověří chování bez skutečného volání Stripe API.

export async function cancelSubscriptionSafely(subscriptionId, stripeRequestFn) {
  try {
    await stripeRequestFn('DELETE', `/subscriptions/${subscriptionId}`);
    return { ok: true };
  } catch (e) {
    if (isAlreadyCanceledError(e.message)) {
      return { ok: true, alreadyCanceled: true };
    }
    return { ok: false, error: e.message };
  }
}

// Rušení STARÉHO předplatného v rámci ZÁMĚRNÉHO, potvrzeného přepnutí tarifu
// (uživatel si vědomě koupil jiný/jiné období, staré se ihned ruší BEZ
// refundace nevyužitého zbytku — potvrzeno 2026-09-09) se od zrušení
// SKUTEČNĚ duplicitního/odmítnutého předplatného (viz refundSubscriptionLatestInvoice
// níže) liší v tom, že se tady navíc na staré předplatné natrvalo poznačí
// superseded_by. Tenhle marker je nezávislý na live stavu (`status`), který
// naše vlastní zrušení stejně změní — díky tomu jde spolehlivě odlišit
// "tohle bylo záměrně nahrazeno, refundace se NESMÍ dít" i při opožděném/
// opakovaném doručení STARÉHO checkoutu dlouho po přepnutí (viz nález
// 2026-09-10: bez tohohle markeru by orphan-větev níže mohla omylem
// refundovat dávno vyřešený, záměrně zrušený přechod).
async function cancelSupersededSubscription(oldSubscriptionId, newSubscriptionId, stripeRequestFn) {
  const result = await cancelSubscriptionSafely(oldSubscriptionId, stripeRequestFn);
  if (result.ok) {
    try {
      await stripeRequestFn('POST', `/subscriptions/${oldSubscriptionId}`, {
        metadata: { superseded_by: newSubscriptionId },
      });
    } catch (e) {
      console.warn(`[stripe/webhook] nepodařilo se označit ${oldSubscriptionId} jako superseded_by ${newSubscriptionId} (nekritické, jen diagnostický marker):`, e.message);
    }
  }
  return result;
}

// Vrátí platbu za poslední fakturu SKUTEČNĚ duplicitního/odmítnutého
// předplatného — na rozdíl od záměrného přepnutí tarifu (viz
// cancelSupersededSubscription výše) tady zákazník za tohle předplatné
// nedostal a nikdy nedostane žádnou službu, takže "bez refundace nevyužitého
// zbytku" pravidlo (potvrzeno 2026-09-09) se sem NEVZTAHUJE — muselo by jít
// jen o skutečně nevyužitý ZBYTEK PLATNÉHO tarifu, ne o celou zaplacenou,
// ale nikdy neposkytnutou službu.
export async function refundSubscriptionLatestInvoice(subscriptionId, stripeRequestFn) {
  try {
    const sub = await stripeRequestFn('GET', `/subscriptions/${subscriptionId}`);
    const invoiceId = sub.latest_invoice;
    if (!invoiceId) return { ok: true, skipped: true };

    const invoice = await stripeRequestFn('GET', `/invoices/${invoiceId}`);
    const paymentIntentId = invoice.payment_intent;
    if (!paymentIntentId || !invoice.amount_paid) return { ok: true, skipped: true };

    // Stabilní Idempotency Key odvozený jen z ID duplicitního předplatného —
    // žádný e-mail ani jiný osobní údaj. I kdyby Stripe refundaci provedl, ale
    // odpověď se ztratila (timeout, výpadek sítě) a webhook se kvůli tomu
    // zopakoval, druhé volání se STEJNÝM klíčem u Stripe nezaloží druhou
    // refundaci — vrátí se přesně stejná odpověď jako napoprvé.
    // isAlreadyRefundedError níže zůstává jako druhá pojistka (např. pro
    // případ, kdy by z nějakého důvodu klíč chyběl nebo se nepoužil).
    const idempotencyKey = `duplicate-subscription-refund:${subscriptionId}`;
    await stripeRequestFn('POST', '/refunds', { payment_intent: paymentIntentId }, idempotencyKey);
    return { ok: true };
  } catch (e) {
    if (isAlreadyRefundedError(e.message)) {
      return { ok: true, alreadyRefunded: true };
    }
    return { ok: false, error: e.message };
  }
}

// Vyčistí marker previous_subscription_id z metadat NOVÉHO předplatného,
// jakmile se staré úspěšně zrušilo — prázdný string ve Stripe metadatech
// znamená "smaž tenhle klíč". Bez tohohle by retryPendingCancellation
// zkoušel rušit už zrušené předplatné při každé další události donekonečna
// (neškodilo by to — viz isAlreadyCanceledError — ale zbytečně by to plnilo
// logy).
async function clearPreviousSubscriptionMarker(subscriptionId, stripeRequestFn) {
  try {
    await stripeRequestFn('POST', `/subscriptions/${subscriptionId}`, {
      metadata: { previous_subscription_id: '' },
    });
  } catch (e) {
    console.warn(`[stripe/webhook] nepodařilo se vyčistit previous_subscription_id metadata u ${subscriptionId}:`, e.message);
  }
}

// Voláno z updated/invoice handlerů PO úspěšném zápisu do DB (tedy jen když
// se událost prokazatelně týká uživatelova aktuálního předplatného) — pokud
// tohle předplatné pořád nese metadata.previous_subscription_id (znamená to,
// že dřívější pokus o zrušení starého předplatného v checkout.session.completed
// selhal a ID se schválně nezahodilo, viz handleCheckout), zkusí se zrušení
// zopakovat. Každá další Stripe událost pro tohle předplatné (invoice každý
// měsíc, updated při jakékoliv změně) je tak přirozenou příležitostí k retry,
// aniž by bylo potřeba vlastní cron/frontu.
async function retryPendingCancellation(sub, stripeRequestFn) {
  const prevId = sub.metadata?.previous_subscription_id;
  if (!prevId || prevId === sub.id) return;

  const result = await cancelSupersededSubscription(prevId, sub.id, stripeRequestFn);
  if (result.ok) {
    console.log(`[stripe/webhook] staré předplatné ${prevId} doklizeno (retry) při zpracování ${sub.id}${result.alreadyCanceled ? ' — už bylo zrušené' : ''}`);
    await clearPreviousSubscriptionMarker(sub.id, stripeRequestFn);
  } else {
    console.error(`[stripe/webhook] KRITICKÉ — opakovaný pokus zrušit staré předplatné ${prevId} pro aktuální ${sub.id} stále selhává, zkusí se znovu při příští události:`, result.error);
  }
}

// ── Zpracování Stripe eventů ───────────────────────────────────────────────────
//
// stripeRequestFn injektovaný stejně jako u helperů výše — v produkci vždy
// skutečný stripeRequest (výchozí hodnota), v testech fake bez síťového volání.

export async function processEvent(event, sql, stripeRequestFn = stripeRequest) {
  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = Number(session.metadata?.user_id);
      const plan   = session.metadata?.plan || 'aktiv';
      // Snímek uživatelova stripe_subscription_id z OKAMŽIKU VYTVOŘENÍ
      // tohohle checkoutu (viz handleCheckout) — ne jeho aktuální hodnota.
      // Díky tomu níže atomická podmínka v UPDATE pozná, jestli mezitím
      // (typicky souběžným novějším checkoutem) nedošlo k přechodu na jiné
      // předplatné, a tenhle opožděný/duplicitní event ho nepřepíše.
      const previousSubscriptionId = session.metadata?.previous_subscription_id || null;

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
      if (!subscriptionId) {
        console.warn('[stripe/webhook] checkout.session.completed bez subscription id — přeskočeno', session.id);
        break;
      }

      let expiresAt = null;
      let planBilling = null;
      let sub = null;
      try {
        sub = await stripeRequestFn('GET', `/subscriptions/${subscriptionId}`);
        if (sub.current_period_end) {
          expiresAt = new Date(sub.current_period_end * 1000).toISOString();
        }
        // subscription_status se tady vždy zapisuje jako 'active' (viz UPDATE
        // níže) — resolvePlanBilling to dostává explicitně, ať se řídí stejným
        // pravidlem jako ostatní webhooky, ne natvrdo billingFromInterval.
        planBilling = resolvePlanBilling('active', expiresAt, sub.items?.data?.[0]?.price?.recurring?.interval);
      } catch (e) {
        console.warn('[stripe/webhook] Could not retrieve subscription:', e.message);
      }

      // Atomická podmínka nahrazuje dřívější SELECT-then-UPDATE (race
      // condition, viz nález 2026-09-09). Zapíše se jen tehdy, když
      // checkoutCompletionShouldApply platí — viz definice výše. IS NOT
      // DISTINCT FROM (místo obyčejného =) je nutné, aby se správně
      // porovnávalo i null (úplně první předplatné uživatele).
      const rows = await sql`
        -- webhook: checkout.session.completed
        UPDATE users
        SET plan                   = ${plan},
            plan_billing           = ${planBilling},
            stripe_customer_id     = ${customerId},
            stripe_subscription_id = ${subscriptionId},
            plan_expires_at        = ${expiresAt},
            subscription_status    = 'active',
            updated_at             = NOW()
        WHERE id = ${userId}
          AND (
            stripe_subscription_id IS NOT DISTINCT FROM ${previousSubscriptionId}
            OR stripe_subscription_id = ${subscriptionId}
          )
        RETURNING id
      `;

      if (rows.length === 0) {
        // Uživatel má v DB uložené jiné (novější) předplatné, než jaké bylo
        // aktuální v okamžiku vytvoření tohohle checkoutu — tohle je
        // opožděný nebo duplicitní checkout.session.completed ze staršího
        // checkoutu. Nesmí přepsat aktuální stav; místo toho se zruší TOHLE
        // (teď osiřelé) předplatné, aby uživateli nezůstala dvě souběžně placená.
        console.warn(`[stripe/webhook] checkout.session.completed pro user ${userId}: DB má jiné aktuální stripe_subscription_id, než odpovídá tomuto checkoutu (očekáváno ${previousSubscriptionId ?? 'null'}) — nepřepisuji, ruším osiřelé duplicitní předplatné ${subscriptionId}`);
        const cancelResult = await cancelSubscriptionSafely(subscriptionId, stripeRequestFn);
        if (!cancelResult.ok) {
          console.error(`[stripe/webhook] KRITICKÉ — nepodařilo se zrušit osiřelé duplicitní předplatné ${subscriptionId} pro user ${userId}:`, cancelResult.error);
          // Selhání nesmí čekat na náhodnou další událost — nahlásit webhook
          // jako neúspěšný, ať ho Stripe brzy (řádově minuty, ne dny) doručí
          // znovu. Atomický guard výše zaručuje, že je opakování bezpečné.
          throw new Error(`Cancellation of orphaned duplicate subscription ${subscriptionId} failed, will retry on webhook redelivery: ${cancelResult.error}`);
        }

        // superseded_by je natrvalo poznačené markerem u předplatných, která
        // byla ZÁMĚRNĚ nahrazená v rámci potvrzeného přepnutí tarifu (viz
        // cancelSupersededSubscription) — u takových se refundace NESMÍ dít,
        // protože zákazník je za dobu, kdy platila, reálně využíval (jen se
        // nevrací nevyužitý zbytek, potvrzeno 2026-09-09). Bez markeru jde o
        // opravdovou, nikdy neposkytnutou duplicitu — zaplaceno, ale
        // uživatel z toho nic nemá, takže se to musí vrátit, ne jen zrušit.
        if (sub?.metadata?.superseded_by) {
          console.log(`[stripe/webhook] checkout.session.completed pro user ${userId}: osiřelé předplatné ${subscriptionId} bylo dřív záměrně nahrazeno (superseded_by=${sub.metadata.superseded_by}) — beze refundace, jde o starý/vyřešený přechod, ne o novou duplicitu`);
        } else {
          const refundResult = await refundSubscriptionLatestInvoice(subscriptionId, stripeRequestFn);
          if (!refundResult.ok) {
            console.error(`[stripe/webhook] KRITICKÉ — uživatel ${userId} zaplatil duplicitní předplatné ${subscriptionId}, které bylo zrušeno, ale platbu se nepodařilo vrátit:`, refundResult.error);
            throw new Error(`Refund of orphaned duplicate subscription ${subscriptionId} failed, will retry on webhook redelivery: ${refundResult.error}`);
          } else if (!refundResult.skipped) {
            console.log(`[stripe/webhook] User ${userId}: platba za duplicitní předplatné ${subscriptionId} byla vrácena (${refundResult.alreadyRefunded ? 'už byla vrácená dřív' : 'nová refundace'})`);
          }
        }
        break;
      }

      console.log(`[stripe] User ${userId} aktivován: ${plan}`);

      if (previousSubscriptionId && previousSubscriptionId !== subscriptionId) {
        const cancelResult = await cancelSupersededSubscription(previousSubscriptionId, subscriptionId, stripeRequestFn);
        if (cancelResult.ok) {
          console.log(`[stripe/webhook] User ${userId}: staré předplatné ${previousSubscriptionId} zrušeno (nahrazeno ${subscriptionId})`);
        } else {
          // previous_subscription_id zůstává uložené v metadatech NOVÉHO
          // předplatného (nastaveno v handleCheckout) — staré ID se tedy
          // neztrácí. Selhání navíc nesmí čekat na náhodnou další (třeba i
          // za měsíc splatnou) událost — vrácením chyby webhook odpoví
          // neúspěchem a Stripe stejný checkout.session.completed brzy
          // (řádově minuty) doručí znovu; atomický guard výše zaručuje, že
          // je opakované zpracování bezpečné (idempotentní).
          console.error(`[stripe/webhook] KRITICKÉ — nepodařilo se zrušit staré předplatné ${previousSubscriptionId} pro user ${userId} po přechodu na ${subscriptionId}, zkusí se znovu při rychlém opakovaném doručení webhooku:`, cancelResult.error);
          throw new Error(`Cancellation of superseded subscription ${previousSubscriptionId} failed, will retry on webhook redelivery: ${cancelResult.error}`);
        }
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const userId = Number(sub.metadata?.user_id);
      if (!userId) break;

      const plan = planFromSubscription(sub);
      if (plan === null) {
        console.warn('[stripe/webhook] customer.subscription.updated: tarif se nedal určit (bez metadata.plan i bez rozpoznaného produktu) — users.plan se nemění', {
          userId, subscriptionId: sub.id, priceId: sub.items?.data?.[0]?.price?.id,
        });
      }

      const expiresAt = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString() : null;

      // cancel_at_period_end = zákazník tarif zrušil, ale Stripe subscripci
      // ukončí až na konci už zaplaceného období — do té doby (plan_expires_at)
      // zůstává profil plně funkční, žádné okamžité zamčení.
      const subStatus = sub.cancel_at_period_end ? 'cancelled'
                       : ['active', 'trialing'].includes(sub.status) ? 'active'
                       : sub.status === 'past_due' ? 'payment_failed'
                       : 'inactive';

      // plan_billing se smí zapsat jen u opravdu aktivního/v doběhu účtu —
      // jinak by u zrušeného předplatného bez doběhu zůstala zavádějící
      // "poslední známá" hodnota, jako by pořád něco platil (viz resolvePlanBilling).
      // Interval bereme přímo z ceny na položce předplatného, ne z priceId
      // (ten se používá jen pro určení TARIFU/plan, viz planFromSubscription výše).
      const planBilling = resolvePlanBilling(subStatus, expiresAt, sub.items?.data?.[0]?.price?.recurring?.interval);

      // Čistě informativní SELECT pro dedup e-mailu o zrušení (viz níže) —
      // na rozdíl od dřívějšího SELECT-then-UPDATE tady stará hodnota
      // NEROZHODUJE, jestli/co se zapíše (to hlídá výhradně WHERE v UPDATu
      // pod tím), takže i kdyby byla mezitím zastaralá, nejhorší důsledek je
      // chybějící/duplicitní e-mail, ne poškozený stav předplatného.
      const [prev] = await sql`SELECT subscription_status FROM users WHERE id = ${userId}`;

      // Atomická podmínka (subscriptionEventShouldApply výše): zapsat smí,
      // jen když je tahle událost o předplatném, které je PRÁVĚ TEĎ uložené
      // jako uživatelovo aktuální — jinak by opožděná událost o STARÉM, už
      // nahrazeném předplatném mohla přepsat čerstvě aktivní nové (přesně
      // nález z 2026-09-09).
      const rows = await sql`
        -- webhook: customer.subscription.updated
        UPDATE users
        SET plan                   = COALESCE(${plan}, plan),
            plan_billing           = ${planBilling},
            plan_expires_at        = ${expiresAt},
            subscription_status    = ${subStatus},
            updated_at             = NOW()
        WHERE id = ${userId} AND stripe_subscription_id = ${sub.id}
        RETURNING id
      `;

      if (rows.length === 0) {
        console.warn(`[stripe/webhook] customer.subscription.updated pro ${sub.id} (user ${userId}): neshoduje se s aktuálním stripe_subscription_id v DB — přeskočeno (staré/nahrazené předplatné)`);
        break;
      }

      console.log(`[stripe] User ${userId} subscription updated: ${subStatus}`);

      // E-mail + zdroj pro "Oznámení" jen při skutečném přechodu do
      // 'cancelled' — Stripe posílá 'updated' i opakovaně/idempotentně,
      // tohle zajistí, že se nepošle víckrát za sebou.
      if (subStatus === 'cancelled' && prev?.subscription_status !== 'cancelled') {
        await notifyPlanCancelled(sql, userId, expiresAt);
      }

      // Self-healing retry dřívějšího neúspěšného zrušení STARÉHO předplatného
      // (viz retryPendingCancellation) — bezpečné volat při každé aktualizaci
      // tohohle (aktuálního) předplatného.
      await retryPendingCancellation(sub, stripeRequestFn);
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

      // Stejně jako u updated — čistě informativní SELECT, atomicitu zápisu
      // hlídá výhradně WHERE v UPDATu pod tím.
      const [prev] = await sql`SELECT subscription_status, plan_expires_at FROM users WHERE id = ${userId}`;

      // Gate na plan_billing musí použít stejnou expiraci, co skutečně skončí
      // v DB po COALESCE níže (nová hodnota, nebo když ta chybí, ta stará) —
      // jinak by se mohlo omylem vynulovat i u účtu, co má doběh z dřívějška.
      const finalExpiresAt = expiresAt || prev?.plan_expires_at || null;
      const planBilling = resolvePlanBilling('cancelled', finalExpiresAt, sub.items?.data?.[0]?.price?.recurring?.interval);

      // NEJDŮLEŽITĚJŠÍ místo z celého nálezu 2026-09-09: naše vlastní
      // DELETE /subscriptions/:oldId (checkout.session.completed výše /
      // cancelSubscriptionSafely) vyvolá u Stripe přesně tenhle event pro
      // STARÉ předplatné. Bez podmínky na stripe_subscription_id by přepsal
      // čerstvě aktivní NOVÉ předplatné na 'cancelled', jen proto, že přišel
      // o pár vteřin později.
      const rows = await sql`
        -- webhook: customer.subscription.deleted
        UPDATE users
        SET stripe_subscription_id = NULL,
            plan_billing           = ${planBilling},
            plan_expires_at        = COALESCE(${expiresAt}, plan_expires_at),
            subscription_status    = 'cancelled',
            updated_at             = NOW()
        WHERE id = ${userId} AND stripe_subscription_id = ${sub.id}
        RETURNING id
      `;

      if (rows.length === 0) {
        console.warn(`[stripe/webhook] customer.subscription.deleted pro ${sub.id} (user ${userId}): neshoduje se s aktuálním stripe_subscription_id v DB — přeskočeno (uživatel má už novější předplatné)`);
        break;
      }

      console.log(`[stripe] User ${userId} subscription deleted -> cancelled`);

      if (prev?.subscription_status !== 'cancelled') {
        await notifyPlanCancelled(sql, userId, expiresAt || prev?.plan_expires_at || null);
      }
      break;
    }

    case 'invoice.paid':
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const [user] = await sql`SELECT id, stripe_subscription_id FROM users WHERE stripe_customer_id = ${invoice.customer}`;
      if (!user) {
        console.warn(`[stripe/webhook] ${event.type}: uživatel pro customer ${invoice.customer} nenalezen`);
        break;
      }

      let expiresAt = null;
      let plan = null;
      let planBilling = null;
      let sub = null;
      if (invoice.subscription) {
        try {
          sub = await stripeRequestFn('GET', `/subscriptions/${invoice.subscription}`);
          if (sub.current_period_end) {
            expiresAt = new Date(sub.current_period_end * 1000).toISOString();
          }
          plan = planFromSubscription(sub);
          // Úspěšná platba = subscription_status tady vždy 'active', takže
          // resolvePlanBilling prakticky vždy vrátí období podle interval —
          // tohle je zároveň přirozený samoopravný bod pro starší účty, co
          // ještě plan_billing nemají (doplní se při nejbližší další platbě,
          // ne až za cenu ruční zásahu/backfillu).
          planBilling = resolvePlanBilling('active', expiresAt, sub.items?.data?.[0]?.price?.recurring?.interval);
        } catch (e) {
          console.warn('[stripe/webhook] Could not retrieve subscription for invoice:', e.message);
        }
      }

      // Faktura se vždycky váže ke KONKRÉTNÍMU předplatnému (invoice.subscription).
      // Pokud se neshoduje s aktuálně uloženým stripe_subscription_id
      // uživatele, jde o opožděnou fakturu ze STARÉHO, už nahrazeného
      // předplatného (typicky poslední fakturovaný cyklus těsně před
      // přechodem na nové) — nesmí přepsat aktuální/novější stav. Chybí-li
      // invoice.subscription úplně (mimo-subscripční faktura), guard na
      // stripe_subscription_id se nepoužije, jen se potvrdí status 'active'.
      const rows = invoice.subscription
        ? await sql`
            -- webhook: invoice.paid (subscription)
            UPDATE users
            SET subscription_status = 'active',
                plan_expires_at      = COALESCE(${expiresAt}, plan_expires_at),
                plan                 = COALESCE(${plan}, plan),
                plan_billing         = COALESCE(${planBilling}, plan_billing),
                updated_at           = NOW()
            WHERE id = ${user.id} AND stripe_subscription_id = ${invoice.subscription}
            RETURNING id
          `
        : await sql`
            -- webhook: invoice.paid (no subscription)
            UPDATE users
            SET subscription_status = 'active', updated_at = NOW()
            WHERE id = ${user.id}
            RETURNING id
          `;

      if (rows.length === 0) {
        console.warn(`[stripe/webhook] ${event.type} pro subscription ${invoice.subscription} (user ${user.id}): neshoduje se s aktuálním stripe_subscription_id — přeskočeno (opožděná faktura ze starého předplatného)`);
        break;
      }

      console.log(`[stripe] User ${user.id} invoice paid (${event.type}) — subscription_status active`);

      if (sub) {
        await retryPendingCancellation(sub, stripeRequestFn);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const [user] = await sql`SELECT id FROM users WHERE stripe_customer_id = ${invoice.customer}`;
      if (user) {
        // Stejný guard jako u invoice.paid výše — opožděné payment_failed ze
        // STARÉHO, už nahrazeného předplatného nesmí označit aktuální,
        // mezitím úspěšně aktivované předplatné jako "platba selhala".
        const rows = invoice.subscription
          ? await sql`
              -- webhook: invoice.payment_failed (subscription)
              UPDATE users SET subscription_status = 'payment_failed', updated_at = NOW()
              WHERE id = ${user.id} AND stripe_subscription_id = ${invoice.subscription}
              RETURNING id
            `
          : await sql`
              -- webhook: invoice.payment_failed (no subscription)
              UPDATE users SET subscription_status = 'payment_failed', updated_at = NOW()
              WHERE id = ${user.id}
              RETURNING id
            `;
        if (rows.length === 0) {
          console.warn(`[stripe/webhook] invoice.payment_failed pro subscription ${invoice.subscription} (user ${user.id}): neshoduje se s aktuálním stripe_subscription_id — přeskočeno (stará/nahrazená)`);
        }
      }
      console.warn(`[stripe] Payment failed pro customer ${invoice.customer}`);
      break;
    }

    default:
      break;
  }
}

// Stripe — platební subscripce pro tarifní plány šikulů.
//
// POST /api/stripe?action=checkout  → vytvoří Stripe Checkout session (subscripce)
// GET  /api/stripe?action=portal    → vytvoří Customer Portal session (správa/zrušení)
// POST /api/stripe?action=webhook   → Stripe webhook handler (podpis přes STRIPE_WEBHOOK_SECRET)
//
// Potřebné env vars (Vercel + .env.local):
//   STRIPE_SECRET_KEY       — tajný klíč z Stripe Dashboard
//   STRIPE_WEBHOOK_SECRET   — z `stripe listen` nebo Stripe Dashboard → Webhooks
//   STRIPE_PRICE_AKTIV      — Price ID pro plán Aktivní šikula 399 Kč (recurring monthly)
//   STRIPE_PRICE_PLUS       — Price ID pro plán Aktivní šikula Plus 499 Kč (recurring monthly)
//   STRIPE_PRICE_PROFI      — Price ID pro plán Profi (recurring monthly)
//   STRIPE_PRICE_TOP        — Price ID pro plán Přednostní zobrazení 99 Kč (recurring monthly)

import Stripe from 'stripe';
import { sql } from './_db.js';
import { requireUser } from './_auth.js';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY není nastaven.');
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' });
}

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

// Přečte raw tělo z Node.js streamu (potřeba pro Stripe webhook signature)
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  const action = req.query?.action;

  try {
    // ── Webhook (public, verifikuje Stripe podpis) ──────────────────────────
    if (action === 'webhook' && req.method === 'POST') {
      return handleWebhook(req, res);
    }

    // ── Všechny ostatní akce vyžadují přihlášeného šikulu ───────────────────
    const me = await requireUser(req, res);
    if (!me) return;
    if (me.role !== 'sikula') return res.status(403).json({ error: 'Pouze šikulové mohou upgradovat.' });

    if (action === 'checkout' && req.method === 'POST') return handleCheckout(req, res, me);
    if (action === 'portal'   && req.method === 'GET')  return handlePortal(req, res, me);

    res.setHeader('Allow', 'POST, GET');
    return res.status(404).json({ error: 'Neznámá akce.' });
  } catch (err) {
    console.error('[/api/stripe]', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

// ── POST /api/stripe?action=checkout ──────────────────────────────────────────
async function handleCheckout(req, res, me) {
  const { plan = 'aktiv' } = req.body ?? {};
  if (!PLAN_NAMES[plan]) {
    return res.status(400).json({ error: 'Neplatný plán.' });
  }
  const priceId = PRICE_IDS[plan]();
  if (!priceId) {
    return res.status(503).json({ error: `${ENV_NAMES[plan] || 'STRIPE_PRICE_?'} není nastaven v env.` });
  }

  const stripe = getStripe();
  const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://sikuladoma.vercel.app';

  const [user] = await sql`SELECT stripe_customer_id FROM users WHERE id = ${me.id}`;
  const existingCustomer = user?.stripe_customer_id || undefined;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    ...(existingCustomer
      ? { customer: existingCustomer }
      : { customer_email: me.email }),
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/?stripe=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${origin}/?stripe=cancel`,
    metadata: { user_id: String(me.id), plan },
    subscription_data: {
      metadata: { user_id: String(me.id), plan },
    },
    payment_method_types: ['card'],
    locale: 'cs',
  });

  return res.status(200).json({ url: session.url });
}

// ── GET /api/stripe?action=portal ─────────────────────────────────────────────
async function handlePortal(req, res, me) {
  const [user] = await sql`SELECT stripe_customer_id FROM users WHERE id = ${me.id}`;
  if (!user?.stripe_customer_id) {
    return res.status(400).json({ error: 'Nemáte aktivní Stripe předplatné.' });
  }

  const stripe = getStripe();
  const origin = req.headers.origin || 'https://sikuladoma.cz';

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${origin}/dashboard`,
  });

  return res.status(200).json({ url: session.url });
}

// ── POST /api/stripe?action=webhook ───────────────────────────────────────────
async function handleWebhook(req, res) {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    // Zkusíme číst raw body ze streamu; jinak fallback na JSON.stringify(req.body)
    let rawBody;
    try {
      rawBody = await getRawBody(req);
      if (!rawBody || rawBody.length === 0) throw new Error('empty stream');
    } catch {
      // Fallback: Vercel již spotřeboval stream — použijeme req.body
      rawBody = Buffer.from(JSON.stringify(req.body));
    }

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // Bez webhook secret (dev/testovací mód) — přijmeme bez verifikace
      event = typeof req.body === 'object' ? req.body : JSON.parse(rawBody.toString());
      console.warn('[stripe/webhook] ⚠️  Webhook secret není nastaven — podpis se neverifikuje!');
    }
  } catch (err) {
    console.error('[stripe/webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    await processEvent(event);
  } catch (err) {
    console.error('[stripe/webhook] processEvent error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  return res.status(200).json({ received: true });
}

// ── Zpracování Stripe eventů ───────────────────────────────────────────────────
async function processEvent(event) {
  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.mode !== 'subscription') break;
      const userId = Number(session.metadata?.user_id);
      const plan   = session.metadata?.plan || 'aktiv';
      if (!userId) break;

      const customerId     = session.customer;
      const subscriptionId = session.subscription;

      let expiresAt = null;
      if (subscriptionId) {
        try {
          const sub = await getStripe().subscriptions.retrieve(subscriptionId);
          if (sub.current_period_end) {
            expiresAt = new Date(sub.current_period_end * 1000).toISOString();
          }
        } catch {}
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
      console.log(`[stripe] ✅ User ${userId} aktivován: ${plan}`);
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

      const subStatus = sub.status === 'active' ? 'active'
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
      console.log(`[stripe] ✅ User ${userId} subscription updated: ${subStatus}`);
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
      console.log(`[stripe] ℹ️  User ${userId} zrušil předplatné → inactive`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      // Najdeme uživatele přes customer ID
      const [user] = await sql`SELECT id FROM users WHERE stripe_customer_id = ${invoice.customer}`;
      if (user) {
        await sql`UPDATE users SET subscription_status = 'payment_failed', updated_at = NOW() WHERE id = ${user.id}`;
      }
      console.warn(`[stripe] ⚠️  Payment failed pro customer ${invoice.customer}`);
      break;
    }

    default:
      // Ostatní eventy ignorujeme
      break;
  }
}

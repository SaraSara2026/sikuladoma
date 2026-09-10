#!/usr/bin/env node
// Testuje resolvePlanBilling (api/stripe.js) a isStatusActiveOrGrace (api/_plan.js)
// čistě v paměti — žádná DB, žádné volání Stripe API. Pokrývá scénáře ze zadání:
// aktivní měsíční, aktivní roční, zrušený s budoucím doběhem, zrušený bez doběhu
// (přesně stav účtu, který nahlásila Sara: subscription_status='cancelled',
// plan_expires_at=null), a odolnost vůči změně STRIPE_PRICE_* env proměnných
// (2026-09-09: billing se odvozuje z recurring.interval, ne z porovnání s
// aktuálními Price ID).
//
// Spuštění: node scripts/test-plan-billing.js

process.env.STRIPE_PRODUCT_AKTIV = 'prod_aktiv_test';
process.env.STRIPE_PRODUCT_PLUS  = 'prod_plus_test';

process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

const {
  resolvePlanBilling, wouldDuplicateSubscription, planFromSubscription,
  processEvent, cancelSubscriptionSafely, isAlreadyCanceledError,
  checkoutCompletionShouldApply, subscriptionEventShouldApply,
} = await import('../api/stripe.js');
const { isStatusActiveOrGrace } = await import('../api/_plan.js');

// Minimální fake Stripe subscription objekt — jen pole, která planFromSubscription čte.
function fakeSub({ metaPlan, productId } = {}) {
  return {
    metadata: metaPlan != null ? { plan: metaPlan } : {},
    items: { data: [{ price: { product: productId ?? null } }] },
  };
}

let passed = 0, failed = 0;
function test(label, fn) {
  try { fn(); passed++; console.log(`  ✅ ${label}`); }
  catch (e) { failed++; console.log(`  ❌ ${label}: ${e.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }

const future = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(); // +30 dní
const past   = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(); // -30 dní

console.log('\n🔍 plan_billing test suite\n');

// ── resolvePlanBilling (rozhoduje, co se zapíše do users.plan_billing) ───────
// Třetí parametr je teď skutečný Stripe `recurring.interval` ('month'/'year'),
// ne Price ID — funguje i pro dávno rotované ceny, které dnešní STRIPE_PRICE_*
// env proměnné už neznají.

test('aktivní měsíční tarif (interval=month) → monthly', () => {
  const r = resolvePlanBilling('active', null, 'month');
  assert(r === 'monthly', `expected 'monthly', got ${r}`);
});

test('aktivní roční tarif (interval=year) → yearly', () => {
  const r = resolvePlanBilling('active', future, 'year');
  assert(r === 'yearly', `expected 'yearly', got ${r}`);
});

test('zrušený tarif s budoucím doběhem (grace) → zachová období', () => {
  const r = resolvePlanBilling('cancelled', future, 'year');
  assert(r === 'yearly', `expected 'yearly' (v doběhu = pořád platí), got ${r}`);
});

test('zrušený tarif BEZ doběhu (plan_expires_at = null) → null', () => {
  // Přesně stav Sařina účtu: subscription_status='cancelled', plan_expires_at=null.
  const r = resolvePlanBilling('cancelled', null, 'month');
  assert(r === null, `expected null, got ${r}`);
});

test('zrušený tarif s doběhem v minulosti (už uplynul) → null', () => {
  const r = resolvePlanBilling('cancelled', past, 'month');
  assert(r === null, `expected null, got ${r}`);
});

test('platba selhala (payment_failed) → null i se známým intervalem', () => {
  const r = resolvePlanBilling('payment_failed', future, 'month');
  assert(r === null, `expected null, got ${r}`);
});

test('neznámý/chybějící interval u aktivního účtu → null (nic se nehádá)', () => {
  const r = resolvePlanBilling('active', null, undefined);
  assert(r === null, `expected null, got ${r}`);
});

test('stará/rotovaná cena (dnešní env proměnné ji už neznají) → i tak správně podle interval', () => {
  // Simuluje přesně situaci z 2026-09-08: STRIPE_PRICE_AKTIV se přepnulo na
  // nové Price ID, staré předplatné pořád běží na starém. Stripe ale u
  // KAŽDÉ ceny (staré i nové) vrací recurring.interval spolehlivě, takže
  // klasifikace funguje bez ohledu na to, jestli je Price ID "aktuální".
  const r = resolvePlanBilling('active', future, 'year');
  assert(r === 'yearly', `expected 'yearly' i pro starou cenu, got ${r}`);
});

// ── isStatusActiveOrGrace (sdílené s isSikulaPlanActive) ─────────────────────

test('isStatusActiveOrGrace: active vždy true', () => {
  assert(isStatusActiveOrGrace('active', null) === true, 'active bez expirace musí být true');
});

test('isStatusActiveOrGrace: cancelled + budoucí expirace → true (doběh)', () => {
  assert(isStatusActiveOrGrace('cancelled', future) === true);
});

test('isStatusActiveOrGrace: cancelled + null expirace → false (Sařin účet)', () => {
  assert(isStatusActiveOrGrace('cancelled', null) === false);
});

test('isStatusActiveOrGrace: cancelled + expirace v minulosti → false', () => {
  assert(isStatusActiveOrGrace('cancelled', past) === false);
});

test('isStatusActiveOrGrace: inactive → vždy false', () => {
  assert(isStatusActiveOrGrace('inactive', future) === false);
});

// ── wouldDuplicateSubscription (blokuje jen PŘESNĚ tu samou aktivní variantu) ──
// Signatura: (userPlan, userPlanBilling, requestedPlan, requestedBilling, subscriptionStatus, planExpiresAt)

test('přesně stejná varianta aktivní (aktiv+monthly), žádá znovu aktiv+monthly → zablokovat', () => {
  assert(wouldDuplicateSubscription('aktiv', 'monthly', 'aktiv', 'monthly', 'active', null) === true);
});

test('aktiv+monthly aktivní, žádá aktiv+yearly (stejný tarif, jiné období) → povolit', () => {
  // Klíčový požadavek: přepnutí měsíc→rok u stejného tarifu nesmí appka
  // blokovat jako "už aktivní" — musí jít rovnou koupit.
  assert(wouldDuplicateSubscription('aktiv', 'monthly', 'aktiv', 'yearly', 'active', null) === false);
});

test('Davidův přesný případ: aktiv aktivní, plan_billing null, žádá aktiv+monthly → povolit', () => {
  // Neznáme přesnou variantu, kterou už platí, takže se nedá tvrdit, že je
  // to přesně ta samá — nechá se to projít; souběžnost řeší backend při
  // dokončení checkoutu (zruší staré předplatné), ne blokování tady.
  assert(wouldDuplicateSubscription('aktiv', null, 'aktiv', 'monthly', 'active', future) === false);
});

test('aktiv+monthly aktivní, žádá upgrade na aktiv-plus+monthly → povolit (jiný tarif)', () => {
  assert(wouldDuplicateSubscription('aktiv', 'monthly', 'aktiv-plus', 'monthly', 'active', null) === false);
});

test('zrušeno bez doběhu, žádá znovu přesně stejnou variantu → povolit (reálně nic neplatí)', () => {
  assert(wouldDuplicateSubscription('aktiv', 'monthly', 'aktiv', 'monthly', 'cancelled', null) === false);
});

test('zrušeno s budoucím doběhem, žádá znovu přesně stejnou variantu → zablokovat (pořád platí)', () => {
  assert(wouldDuplicateSubscription('aktiv', 'monthly', 'aktiv', 'monthly', 'cancelled', future) === true);
});

test('zrušeno s budoucím doběhem, žádá jiné období stejného tarifu → povolit', () => {
  assert(wouldDuplicateSubscription('aktiv', 'monthly', 'aktiv', 'yearly', 'cancelled', future) === false);
});

test('žádný tarif (start), žádá aktiv+monthly → povolit', () => {
  assert(wouldDuplicateSubscription('start', null, 'aktiv', 'monthly', 'inactive', null) === false);
});

// ── planFromSubscription (tarif podle metadata.plan / stabilního Product ID) ──

test('metadata.plan je zdroj pravdy — nová subscripce z checkoutu', () => {
  const r = planFromSubscription(fakeSub({ metaPlan: 'aktiv-plus' }));
  assert(r === 'aktiv-plus', `expected 'aktiv-plus', got ${r}`);
});

test('metadata.plan neplatná hodnota → spadne na Product ID', () => {
  const r = planFromSubscription(fakeSub({ metaPlan: 'neco-neplatneho', productId: process.env.STRIPE_PRODUCT_PLUS }));
  assert(r === 'aktiv-plus', `expected fallback na product 'aktiv-plus', got ${r}`);
});

test('stará cena produktu Plus (bez metadata.plan) → zůstane aktiv-plus, ne aktiv', () => {
  // Přesně požadovaný test: staré Price ID zmizelo z env, ale Product ID
  // produktu Plus je pořád stejné, takže tarif se pozná správně.
  const r = planFromSubscription(fakeSub({ productId: process.env.STRIPE_PRODUCT_PLUS }));
  assert(r === 'aktiv-plus', `expected 'aktiv-plus', got ${r}`);
});

test('stará cena produktu Aktiv (bez metadata.plan) → zůstane aktiv', () => {
  const r = planFromSubscription(fakeSub({ productId: process.env.STRIPE_PRODUCT_AKTIV }));
  assert(r === 'aktiv', `expected 'aktiv', got ${r}`);
});

test('skutečně neznámý produkt (bez metadata, product nikam nesedí) → null, NE automatický aktiv', () => {
  // Přesně požadovaný test: dřív by fallback `|| 'aktiv'` tohle tiše
  // prohlásil za tarif Aktiv. Teď se nesmí hádat vůbec nic.
  const r = planFromSubscription(fakeSub({ productId: 'prod_uplne_neznamy' }));
  assert(r === null, `expected null (nehádat), got ${r}`);
});

test('žádná metadata, žádný product (prázdný/poškozený objekt) → null', () => {
  const r = planFromSubscription(fakeSub({}));
  assert(r === null, `expected null, got ${r}`);
});

// ── 2026-09-09: ochrana proti opožděným/duplicitním webhookům ────────────────
// processEvent bere sql i stripeRequestFn jako parametry (dependency
// injection) — tady se nahradí čistě v-paměti fake implementací, žádné
// skutečné volání DB ani Stripe API.

async function testAsync(label, fn) {
  try { await fn(); passed++; console.log(`  ✅ ${label}`); }
  catch (e) { failed++; console.log(`  ❌ ${label}: ${e.stack || e.message}`); }
}

// ── čisté predikáty (zrcadlí atomickou SQL WHERE podmínku) ───────────────────

test('checkoutCompletionShouldApply: DB se shoduje s previous → zapsat', () => {
  assert(checkoutCompletionShouldApply('sub_A', 'sub_A', 'sub_B') === true);
});
test('checkoutCompletionShouldApply: DB už je rovnou nové (duplicitní event) → zapsat', () => {
  assert(checkoutCompletionShouldApply('sub_B', 'sub_A', 'sub_B') === true);
});
test('checkoutCompletionShouldApply: první předplatné (null → null) → zapsat', () => {
  assert(checkoutCompletionShouldApply(null, null, 'sub_A') === true);
});
test('checkoutCompletionShouldApply: DB má mezitím úplně jiné (novější) předplatné → nezapisovat', () => {
  assert(checkoutCompletionShouldApply('sub_C', 'sub_A', 'sub_B') === false);
});

test('subscriptionEventShouldApply: událost o aktuálním předplatném → zapsat', () => {
  assert(subscriptionEventShouldApply('sub_B', 'sub_B') === true);
});
test('subscriptionEventShouldApply: událost o starém/nahrazeném předplatném → nezapisovat', () => {
  assert(subscriptionEventShouldApply('sub_B', 'sub_A') === false);
});

test('isAlreadyCanceledError: rozpozná "already canceled" jako úspěšný terminální stav', () => {
  assert(isAlreadyCanceledError('This subscription has already been canceled.') === true);
});
test('isAlreadyCanceledError: rozpozná "No such subscription" jako úspěšný terminální stav', () => {
  assert(isAlreadyCanceledError("No such subscription: 'sub_A'") === true);
});
test('isAlreadyCanceledError: jiná chyba (síť, oprávnění) → NE úspěch', () => {
  assert(isAlreadyCanceledError('Stripe API error: temporary failure') === false);
});

await testAsync('cancelSubscriptionSafely: úspěšné zrušení → ok', async () => {
  const fakeStripeRequest = async () => ({ id: 'sub_X', status: 'canceled' });
  const r = await cancelSubscriptionSafely('sub_X', fakeStripeRequest);
  assert(r.ok === true && !r.alreadyCanceled);
});
await testAsync('cancelSubscriptionSafely: už zrušené → ok (idempotentní)', async () => {
  const fakeStripeRequest = async () => { throw new Error('This subscription has already been canceled.'); };
  const r = await cancelSubscriptionSafely('sub_X', fakeStripeRequest);
  assert(r.ok === true && r.alreadyCanceled === true);
});
await testAsync('cancelSubscriptionSafely: skutečná chyba → not ok, jde bezpečně zopakovat', async () => {
  const fakeStripeRequest = async () => { throw new Error('Stripe API error: temporary failure'); };
  const r = await cancelSubscriptionSafely('sub_X', fakeStripeRequest);
  assert(r.ok === false && r.error === 'Stripe API error: temporary failure');
});

// ── fake DB (v paměti, jen tabulka users) ────────────────────────────────────

function makeFakeSql(usersById) {
  const byId = (id) => usersById[Number(id)];
  const byCustomer = (cid) => Object.values(usersById).find(u => u.stripe_customer_id === cid);

  async function sql(strings, ...values) {
    const text = strings.join(' ');

    if (text.includes('SELECT email, name FROM users WHERE id')) {
      const u = byId(values[0]);
      return u ? [{ email: u.email ?? 'test@example.com', name: u.name ?? 'Test' }] : [];
    }
    if (text.includes('SELECT subscription_status, plan_expires_at FROM users WHERE id')) {
      const u = byId(values[0]);
      return u ? [{ subscription_status: u.subscription_status ?? null, plan_expires_at: u.plan_expires_at ?? null }] : [];
    }
    if (text.includes('SELECT subscription_status FROM users WHERE id')) {
      const u = byId(values[0]);
      return u ? [{ subscription_status: u.subscription_status ?? null }] : [];
    }
    if (text.includes('SELECT id, stripe_subscription_id FROM users WHERE stripe_customer_id')) {
      const u = byCustomer(values[0]);
      return u ? [{ id: u.id, stripe_subscription_id: u.stripe_subscription_id ?? null }] : [];
    }
    if (text.includes('SELECT id FROM users WHERE stripe_customer_id')) {
      const u = byCustomer(values[0]);
      return u ? [{ id: u.id }] : [];
    }

    if (text.includes('webhook: checkout.session.completed')) {
      const [plan, planBilling, customerId, subscriptionId, expiresAt, userId, previousSubscriptionId, subscriptionIdAgain] = values;
      const u = byId(userId);
      if (!u) return [];
      const current = u.stripe_subscription_id ?? null;
      if (!checkoutCompletionShouldApply(current, previousSubscriptionId ?? null, subscriptionIdAgain)) return [];
      Object.assign(u, { plan, plan_billing: planBilling, stripe_customer_id: customerId, stripe_subscription_id: subscriptionId, plan_expires_at: expiresAt, subscription_status: 'active' });
      return [{ id: u.id }];
    }

    if (text.includes('webhook: customer.subscription.updated')) {
      const [plan, planBilling, expiresAt, subStatus, userId, subId] = values;
      const u = byId(userId);
      if (!u) return [];
      if (!subscriptionEventShouldApply(u.stripe_subscription_id ?? null, subId)) return [];
      Object.assign(u, { plan: plan ?? u.plan, plan_billing: planBilling, plan_expires_at: expiresAt, subscription_status: subStatus });
      return [{ id: u.id }];
    }

    if (text.includes('webhook: customer.subscription.deleted')) {
      const [planBilling, expiresAt, userId, subId] = values;
      const u = byId(userId);
      if (!u) return [];
      if (!subscriptionEventShouldApply(u.stripe_subscription_id ?? null, subId)) return [];
      Object.assign(u, { stripe_subscription_id: null, plan_billing: planBilling, plan_expires_at: expiresAt ?? u.plan_expires_at, subscription_status: 'cancelled' });
      return [{ id: u.id }];
    }

    if (text.includes('webhook: invoice.paid (subscription)')) {
      const [expiresAt, plan, planBilling, userId, invoiceSubId] = values;
      const u = byId(userId);
      if (!u) return [];
      if (!subscriptionEventShouldApply(u.stripe_subscription_id ?? null, invoiceSubId)) return [];
      Object.assign(u, { subscription_status: 'active', plan_expires_at: expiresAt ?? u.plan_expires_at, plan: plan ?? u.plan, plan_billing: planBilling ?? u.plan_billing });
      return [{ id: u.id }];
    }
    if (text.includes('webhook: invoice.paid (no subscription)')) {
      const [userId] = values;
      const u = byId(userId);
      if (!u) return [];
      u.subscription_status = 'active';
      return [{ id: u.id }];
    }

    if (text.includes('webhook: invoice.payment_failed (subscription)')) {
      const [userId, invoiceSubId] = values;
      const u = byId(userId);
      if (!u) return [];
      if (!subscriptionEventShouldApply(u.stripe_subscription_id ?? null, invoiceSubId)) return [];
      u.subscription_status = 'payment_failed';
      return [{ id: u.id }];
    }
    if (text.includes('webhook: invoice.payment_failed (no subscription)')) {
      const [userId] = values;
      const u = byId(userId);
      if (!u) return [];
      u.subscription_status = 'payment_failed';
      return [{ id: u.id }];
    }

    throw new Error(`fake sql: nerozpoznaný dotaz: ${text.slice(0, 120)}`);
  }
  return sql;
}

// ── fake Stripe (v paměti) ────────────────────────────────────────────────────

function makeFakeStripe(subsById, { failCancelIds = new Set(), invoicesById = {}, failRefundOnce = new Set(), dropRefundResponseOnceForKeys = new Set() } = {}) {
  const calls = [];
  const refundedPaymentIntents = new Set();
  // Simuluje skutečné chování Stripe Idempotency Key: druhé volání se stejným
  // klíčem vrátí PŘESNĚ stejnou odpověď jako napoprvé, aniž by se akce
  // provedla znovu (viz test "response se ztratila").
  const idempotencyResults = new Map();
  let refundCreationCount = 0;

  async function stripeRequestFn(method, path, data, idempotencyKey) {
    calls.push({ method, path, data, idempotencyKey });

    if (path === '/refunds' && method === 'POST') {
      if (idempotencyKey && idempotencyResults.has(idempotencyKey)) {
        return idempotencyResults.get(idempotencyKey);
      }
      const pi = data?.payment_intent;
      if (failRefundOnce.has(pi)) {
        failRefundOnce.delete(pi);
        throw new Error('Stripe API error: temporary failure');
      }
      if (refundedPaymentIntents.has(pi)) {
        throw new Error(`Charge for PaymentIntent ${pi} has already been refunded.`);
      }
      refundedPaymentIntents.add(pi);
      refundCreationCount += 1;
      const result = { id: `re_${pi}`, payment_intent: pi, status: 'succeeded' };
      if (idempotencyKey) idempotencyResults.set(idempotencyKey, result);

      if (idempotencyKey && dropRefundResponseOnceForKeys.has(idempotencyKey)) {
        // Refundace u Stripe SKUTEČNĚ proběhla (viz refundCreationCount výše
        // i uložený idempotencyResults záznam) — jen se ztratila odpověď na
        // TOMHLE konkrétním volání (timeout/výpadek sítě). Náš kód se o
        // úspěchu nedozví a musí to (bezpečně) zopakovat.
        dropRefundResponseOnceForKeys.delete(idempotencyKey);
        throw new Error('network error: response lost (ETIMEDOUT)');
      }
      return result;
    }

    const invoiceMatch = path.match(/^\/invoices\/([^/]+)$/);
    if (invoiceMatch) {
      if (method !== 'GET') throw new Error(`fake stripe: nepodporovaná metoda ${method} pro invoice`);
      const inv = invoicesById[invoiceMatch[1]];
      if (!inv) throw new Error(`No such invoice: '${invoiceMatch[1]}'`);
      return inv;
    }

    const m = path.match(/^\/subscriptions\/([^/]+)$/);
    if (!m) throw new Error(`fake stripe: nerozpoznaná cesta ${path}`);
    const id = m[1];
    const sub = subsById[id];

    if (method === 'GET') {
      if (!sub) throw new Error(`No such subscription: '${id}'`);
      return sub;
    }
    if (method === 'DELETE') {
      if (!sub) throw new Error(`No such subscription: '${id}'`);
      if (sub.__canceled) throw new Error('This subscription has already been canceled.');
      if (failCancelIds.has(id)) throw new Error('Stripe API error: temporary failure');
      sub.__canceled = true;
      sub.status = 'canceled';
      return sub;
    }
    if (method === 'POST') {
      if (!sub) throw new Error(`No such subscription: '${id}'`);
      if (data?.metadata) {
        for (const [k, v] of Object.entries(data.metadata)) {
          if (v === '') delete sub.metadata[k]; else sub.metadata[k] = v;
        }
      }
      return sub;
    }
    throw new Error(`fake stripe: nepodporovaná metoda ${method}`);
  }
  stripeRequestFn.calls = calls;
  stripeRequestFn.failCancelIds = failCancelIds;
  stripeRequestFn.refundedPaymentIntents = refundedPaymentIntents;
  stripeRequestFn.failRefundOnce = failRefundOnce;
  stripeRequestFn.dropRefundResponseOnceForKeys = dropRefundResponseOnceForKeys;
  stripeRequestFn.idempotencyResults = idempotencyResults;
  Object.defineProperty(stripeRequestFn, 'refundCreationCount', { get: () => refundCreationCount });
  return stripeRequestFn;
}

function fakeStripeSub(id, { userId, plan, interval = 'month', periodEndMs, previousSubscriptionId, latestInvoiceId, supersededBy } = {}) {
  return {
    id,
    metadata: {
      user_id: String(userId),
      ...(plan ? { plan } : {}),
      ...(previousSubscriptionId ? { previous_subscription_id: previousSubscriptionId } : {}),
      ...(supersededBy ? { superseded_by: supersededBy } : {}),
    },
    status: 'active',
    cancel_at_period_end: false,
    current_period_end: Math.floor((periodEndMs ?? Date.now() + 30 * 24 * 3600 * 1000) / 1000),
    items: { data: [{ price: { recurring: { interval } } }] },
    latest_invoice: latestInvoiceId ?? null,
  };
}

function fakeStripeInvoice(id, { paymentIntentId, amountPaid = 29900 } = {}) {
  return { id, payment_intent: paymentIntentId, amount_paid: amountPaid };
}

console.log('\n🔍 webhook race-condition test suite (2026-09-09)\n');

// Scénář 1: přechod A → B, pak opožděný `deleted` pro A nesmí přepsat B.
await testAsync('A→B přechod + opožděný deleted pro A → B zůstane aktivní', async () => {
  const users = { 1: { id: 1, plan: 'aktiv', plan_billing: 'monthly', stripe_customer_id: 'cus_1', stripe_subscription_id: 'sub_A', subscription_status: 'active', plan_expires_at: future } };
  const subs = { sub_B: fakeStripeSub('sub_B', { userId: 1, plan: 'aktiv-plus', previousSubscriptionId: 'sub_A' }) };
  const sql = makeFakeSql(users);
  const stripe = makeFakeStripe(subs);

  await processEvent({ type: 'checkout.session.completed', data: { object: {
    customer: 'cus_1', subscription: 'sub_B',
    metadata: { user_id: '1', plan: 'aktiv-plus', previous_subscription_id: 'sub_A' },
  } } }, sql, stripe);

  assert(users[1].stripe_subscription_id === 'sub_B', 'user má být na sub_B');
  assert(users[1].plan === 'aktiv-plus', 'plán se má aktualizovat na aktiv-plus');
  assert(stripe.calls.some(c => c.method === 'DELETE' && c.path === '/subscriptions/sub_A'), 'staré sub_A se má zrušit');

  // Opožděný deleted webhook pro STARÉ sub_A dorazí až teď, po přechodu na B.
  await processEvent({ type: 'customer.subscription.deleted', data: { object: {
    id: 'sub_A', metadata: { user_id: '1' }, current_period_end: Math.floor(Date.now() / 1000),
  } } }, sql, stripe);

  assert(users[1].stripe_subscription_id === 'sub_B', 'sub_B nesmí být opožděným deleted pro A přepsáno');
  assert(users[1].subscription_status === 'active', 'user musí zůstat active, ne cancelled');
  assert(users[1].plan === 'aktiv-plus', 'plán musí zůstat aktiv-plus');
});

// Scénář 2: opožděná faktura / payment_failed pro A nesmí přepsat B.
await testAsync('opožděné invoice.paid a payment_failed pro A → B zůstane nedotčené', async () => {
  const users = { 1: { id: 1, plan: 'aktiv-plus', plan_billing: 'monthly', stripe_customer_id: 'cus_1', stripe_subscription_id: 'sub_B', subscription_status: 'active', plan_expires_at: future } };
  const subs = { sub_A: fakeStripeSub('sub_A', { userId: 1, plan: 'aktiv' }) };
  const sql = makeFakeSql(users);
  const stripe = makeFakeStripe(subs);

  await processEvent({ type: 'invoice.payment_failed', data: { object: { customer: 'cus_1', subscription: 'sub_A' } } }, sql, stripe);
  assert(users[1].subscription_status === 'active', 'opožděné payment_failed pro staré A nesmí shodit aktuální B na payment_failed');

  await processEvent({ type: 'invoice.paid', data: { object: { customer: 'cus_1', subscription: 'sub_A' } } }, sql, stripe);
  assert(users[1].plan === 'aktiv-plus', 'opožděná faktura pro staré A nesmí přepsat plán zpátky na aktiv');
  assert(users[1].stripe_subscription_id === 'sub_B', 'stripe_subscription_id se nemá měnit');
});

// Scénář 3a: opakovaný/duplicitní starý checkout.session.completed po aktivaci
// B nesmí B přepsat. sub_A tu BYLO opravdu záměrně nahrazeno (má marker
// superseded_by z reálného přechodu, viz cancelSupersededSubscription) — jde
// jen o starou, dávno vyřešenou historii, ne o novou nevyužitou duplicitu,
// takže se NESMÍ vracet platba (2026-09-10: platba za skutečně VYUŽITÉ,
// záměrně nahrazené předplatné se nevrací, jen jeho nevyužitý zbytek).
await testAsync('3a: duplicitní checkout.session.completed pro ZÁMĚRNĚ nahrazené staré A → B nedotčeno, beze refundace', async () => {
  const users = { 1: { id: 1, plan: 'aktiv-plus', plan_billing: 'monthly', stripe_customer_id: 'cus_1', stripe_subscription_id: 'sub_B', subscription_status: 'active', plan_expires_at: future } };
  const subs = { sub_A: fakeStripeSub('sub_A', { userId: 1, plan: 'aktiv', supersededBy: 'sub_B', latestInvoiceId: 'in_A' }) };
  const sql = makeFakeSql(users);
  const stripe = makeFakeStripe(subs, { invoicesById: { in_A: fakeStripeInvoice('in_A', { paymentIntentId: 'pi_A' }) } });

  await processEvent({ type: 'checkout.session.completed', data: { object: {
    customer: 'cus_1', subscription: 'sub_A',
    metadata: { user_id: '1', plan: 'aktiv', previous_subscription_id: '' },
  } } }, sql, stripe);

  assert(users[1].stripe_subscription_id === 'sub_B', 'aktuální sub_B nesmí být duplicitním starým eventem přepsáno');
  assert(users[1].plan === 'aktiv-plus', 'plán musí zůstat aktiv-plus');
  assert(stripe.calls.some(c => c.method === 'DELETE' && c.path === '/subscriptions/sub_A'), 'osiřelé sub_A se má (idempotentně) zrušit');
  assert(!stripe.calls.some(c => c.method === 'POST' && c.path === '/refunds'), 'záměrně nahrazené a reálně využité sub_A se NESMÍ refundovat');
});

// Scénář 3b (2026-09-10, bod 2 zadání): uživatel otevře dva Checkouty a OBA
// skutečně zaplatí (sub_W vyhraje, zapíše se; sub_L je skutečná, nikdy
// nevyužitá duplicita — bez markeru superseded_by). Zrušení bez refundace by
// tu bylo neoprávněné zadržení peněz — platba za sub_L se musí vrátit
// automaticky. Test navíc ověřuje, že opakované doručení téhož eventu (Stripe
// retry) je bezpečné — druhý pokus o refundaci už jen rozpozná "already
// refunded" a nespadne ani nevrátí peníze dvakrát.
await testAsync('3b: dva zaplacené Checkouty současně → skutečná duplicita se zruší A vrátí, ne jen zruší', async () => {
  const users = { 4: { id: 4, plan: null, plan_billing: null, stripe_customer_id: 'cus_4', stripe_subscription_id: 'sub_W', subscription_status: 'active', plan_expires_at: future } };
  const subs = { sub_L: fakeStripeSub('sub_L', { userId: 4, plan: 'aktiv', latestInvoiceId: 'in_L' }) };
  const sql = makeFakeSql(users);
  const stripe = makeFakeStripe(subs, { invoicesById: { in_L: fakeStripeInvoice('in_L', { paymentIntentId: 'pi_L', amountPaid: 29900 }) } });

  const event = { type: 'checkout.session.completed', data: { object: {
    customer: 'cus_4', subscription: 'sub_L',
    metadata: { user_id: '4', plan: 'aktiv', previous_subscription_id: '' },
  } } };

  await processEvent(event, sql, stripe);

  assert(users[4].stripe_subscription_id === 'sub_W', 'vítězné sub_W nesmí být přepsáno prohranou duplicitou');
  assert(stripe.calls.some(c => c.method === 'DELETE' && c.path === '/subscriptions/sub_L'), 'skutečně duplicitní sub_L se má zrušit');
  const refundCall = stripe.calls.find(c => c.method === 'POST' && c.path === '/refunds');
  assert(refundCall && refundCall.data?.payment_intent === 'pi_L', 'zaplacená duplicita se musí automaticky vrátit, ne jen zrušit bez náhrady');
  assert(refundCall.idempotencyKey === 'duplicate-subscription-refund:sub_L', 'refundace musí nést stabilní Idempotency Key odvozený z ID předplatného, bez osobních údajů');

  // Stejný event dorazí podruhé (Stripe redelivery / duplicitní doručení) —
  // musí projít bez chyby a BEZ druhé refundace stejné platby.
  stripe.calls.length = 0;
  await processEvent(event, sql, stripe);
  assert(stripe.calls.some(c => c.method === 'POST' && c.path === '/refunds'), 'druhé doručení má refundaci znovu zkusit');
  assert(stripe.refundedPaymentIntents.size === 1, 'pi_L se nesmí vrátit dvakrát');
});

// Test idempotency key (2026-09-10): Stripe refundaci u sebe SKUTEČNĚ
// provede, ale odpověď na náš POST /refunds se ztratí (timeout/výpadek sítě)
// dřív, než ji stihneme přečíst — webhook se kvůli tomu (přes chybu →
// throw → 500, viz bod 1) zopakuje. Se STEJNÝM Idempotency Key nesmí u
// Stripe vzniknout druhá refundace — druhé volání musí dostat zpátky
// přesně tu samou (už existující) odpověď.
await testAsync('idempotency key: ztracená odpověď na POST /refunds → retry nevytvoří druhou refundaci', async () => {
  const users = { 6: { id: 6, plan: null, plan_billing: null, stripe_customer_id: 'cus_6', stripe_subscription_id: 'sub_W2', subscription_status: 'active', plan_expires_at: future } };
  const subs = { sub_L2: fakeStripeSub('sub_L2', { userId: 6, plan: 'aktiv', latestInvoiceId: 'in_L2' }) };
  const sql = makeFakeSql(users);
  const idempotencyKey = 'duplicate-subscription-refund:sub_L2';
  const stripe = makeFakeStripe(subs, {
    invoicesById: { in_L2: fakeStripeInvoice('in_L2', { paymentIntentId: 'pi_L2' }) },
    dropRefundResponseOnceForKeys: new Set([idempotencyKey]),
  });

  const event = { type: 'checkout.session.completed', data: { object: {
    customer: 'cus_6', subscription: 'sub_L2',
    metadata: { user_id: '6', plan: 'aktiv', previous_subscription_id: '' },
  } } };

  // 1. pokus: refundace u Stripe reálně proběhne, ale odpověď se "ztratí" →
  // náš kód to vidí jako chybu → processEvent musí selhat (throw, viz bod 1
  // — rychlý retry přes opakované doručení webhooku).
  let threw = false;
  try { await processEvent(event, sql, stripe); } catch { threw = true; }
  assert(threw, 'ztracená odpověď na refundaci se musí projevit jako selhání webhooku (pro rychlý retry)');
  assert(stripe.refundedPaymentIntents.has('pi_L2'), 'refundace u Stripe mezitím reálně proběhla');
  assert(stripe.refundCreationCount === 1, 'v tuhle chvíli existuje přesně jedna refundace');

  // 2. pokus (Stripe redelivery stejného eventu) — se STEJNÝM idempotency
  // key nesmí vzniknout druhá refundace, jen se vrátí ta první.
  stripe.calls.length = 0;
  await processEvent(event, sql, stripe);

  const secondRefundCall = stripe.calls.find(c => c.method === 'POST' && c.path === '/refunds');
  assert(secondRefundCall?.idempotencyKey === idempotencyKey, 'retry musí použít STEJNÝ idempotency key jako první pokus');
  assert(stripe.refundCreationCount === 1, 'druhý pokus nesmí založit druhou refundaci — Stripe vrátí tu první podle idempotency key');
});

// Scénář 4a (2026-09-10, bod 1 zadání): selhání zrušení A při
// checkout.session.completed nesmí čekat na náhodnou další (třeba až za
// měsíc splatnou) událost — webhook musí selhat (vyhodit chybu), aby Stripe
// TENTÝŽ checkout.session.completed brzy (řádově minuty) doručil znovu.
// Opakované zpracování stejné události musí být bezpečné (idempotentní guard).
await testAsync('4a: selhání zrušení A při checkoutu → webhook selže pro rychlé opakované doručení, retry je bezpečný', async () => {
  const users = { 5: { id: 5, plan: 'aktiv', plan_billing: 'monthly', stripe_customer_id: 'cus_5', stripe_subscription_id: 'sub_F', subscription_status: 'active', plan_expires_at: future } };
  const subF = fakeStripeSub('sub_F', { userId: 5, plan: 'aktiv' });
  const subG = fakeStripeSub('sub_G', { userId: 5, plan: 'aktiv', previousSubscriptionId: 'sub_F' });
  const subs = { sub_F: subF, sub_G: subG };
  const sql = makeFakeSql(users);
  const stripe = makeFakeStripe(subs, { failCancelIds: new Set(['sub_F']) });

  const event = { type: 'checkout.session.completed', data: { object: {
    customer: 'cus_5', subscription: 'sub_G',
    metadata: { user_id: '5', plan: 'aktiv', previous_subscription_id: 'sub_F' },
  } } };

  let threw = false;
  try {
    await processEvent(event, sql, stripe);
  } catch {
    threw = true;
  }
  assert(threw, 'processEvent musí vyhodit chybu, aby handleWebhook odpověděl 500 a Stripe doručil event znovu');
  assert(users[5].stripe_subscription_id === 'sub_G', 'zápis nového sub_G proběhl PŘED pokusem o zrušení starého — i tak zůstává platný');
  assert(subG.metadata.previous_subscription_id === 'sub_F', 'previous_subscription_id zůstává v metadatech sub_G — ID se neztratilo');

  // Rychlé opakované doručení TÉHOŽ eventu (simulace Stripe retry) — chyba je
  // pryč, zrušení teď uspěje. Guard (checkoutCompletionShouldApply) musí
  // dovolit zápis znovu, protože DB už je rovnou na sub_G.
  stripe.calls.length = 0;
  stripe.failCancelIds.delete('sub_F');
  await processEvent(event, sql, stripe);

  assert(subF.__canceled === true, 'druhý (rychlý) pokus má sub_F skutečně zrušit');
  assert(users[5].stripe_subscription_id === 'sub_G', 'opakované zpracování nesmí nic pokazit na už platném sub_G');
});

// Scénář 4b: pokud selže i rychlý retry (výše), self-heal proběhne i při
// další, jiné události pro nové předplatné (dlouhodobá pojistka navíc).
await testAsync('4b: selhání zrušení starého A se zopakuje i při další (jiné) události pro nové B a uspěje', async () => {
  const users = { 2: { id: 2, plan: 'aktiv', plan_billing: 'monthly', stripe_customer_id: 'cus_2', stripe_subscription_id: 'sub_C', subscription_status: 'active', plan_expires_at: future } };
  const subC = fakeStripeSub('sub_C', { userId: 2, plan: 'aktiv' });
  const subD = fakeStripeSub('sub_D', { userId: 2, plan: 'aktiv', previousSubscriptionId: 'sub_C' });
  const subs = { sub_C: subC, sub_D: subD };
  const sql = makeFakeSql(users);
  // Zrušení sub_C selže OPAKOVANĚ (i při rychlém retry) — testuje se jen
  // dlouhodobá pojistka přes jinou událost, ne rychlý retry ze scénáře 4a.
  const stripe = makeFakeStripe(subs, { failCancelIds: new Set(['sub_C']) });

  const event = { type: 'checkout.session.completed', data: { object: {
    customer: 'cus_2', subscription: 'sub_D',
    metadata: { user_id: '2', plan: 'aktiv', previous_subscription_id: 'sub_C' },
  } } };

  try { await processEvent(event, sql, stripe); } catch { /* očekávané selhání, viz 4a */ }

  assert(users[2].stripe_subscription_id === 'sub_D', 'nové sub_D se má aktivovat i když se staré nepodařilo zrušit');
  assert(subD.metadata.previous_subscription_id === 'sub_C', 'previous_subscription_id zůstává v metadatech sub_D — ID se neztratilo');

  // Zrušení sub_C dál selhává (rychlý retry by taky neuspěl) — self-heal
  // dorazí až s DALŠÍ, jinou událostí pro AKTUÁLNÍ (sub_D) předplatné.
  stripe.calls.length = 0;
  await processEvent({ type: 'customer.subscription.updated', data: { object: subD } }, sql, stripe);
  assert(stripe.calls.filter(c => c.method === 'DELETE' && c.path === '/subscriptions/sub_C').length === 1, 'i tahle jiná událost má znovu zkusit zrušit sub_C');

  // Teprve teď chyba zmizí a další (další) událost konečně uspěje.
  stripe.calls.length = 0;
  stripe.failCancelIds.delete('sub_C');
  await processEvent({ type: 'customer.subscription.updated', data: { object: subD } }, sql, stripe);

  assert(stripe.calls.some(c => c.method === 'DELETE' && c.path === '/subscriptions/sub_C'), 'retry mělo znovu zkusit zrušit sub_C');
  assert(subC.__canceled === true, 'sub_C má být po úspěšném retry skutečně zrušené');
  assert(!('previous_subscription_id' in subD.metadata), 'po úspěšném retry se má marker z metadat sub_D vyčistit');
});

// Scénář 5: běžné zrušení AKTUÁLNÍHO předplatného musí projít normálně.
await testAsync('běžné zrušení aktuálního předplatného funguje beze změny chování', async () => {
  const users = { 3: { id: 3, plan: 'aktiv', plan_billing: 'monthly', stripe_customer_id: 'cus_3', stripe_subscription_id: 'sub_E', subscription_status: 'active', plan_expires_at: future } };
  const sql = makeFakeSql(users);
  const stripe = makeFakeStripe({});

  await processEvent({ type: 'customer.subscription.deleted', data: { object: {
    id: 'sub_E', metadata: { user_id: '3' }, current_period_end: Math.floor(Date.now() / 1000),
  } } }, sql, stripe);

  assert(users[3].stripe_subscription_id === null, 'stripe_subscription_id se má vynulovat');
  assert(users[3].subscription_status === 'cancelled', 'subscription_status musí přejít na cancelled');
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);

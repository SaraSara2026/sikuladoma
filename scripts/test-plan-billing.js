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

const { resolvePlanBilling, wouldDuplicateSubscription, planFromSubscription } = await import('../api/stripe.js');
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

// ── wouldDuplicateSubscription (backendová pojistka proti druhému předplatnému) ──

test('aktivní na aktiv, žádá znovu aktiv (plan_billing neznámé/jedno) → zablokovat', () => {
  assert(wouldDuplicateSubscription('aktiv', 'aktiv', 'active', null) === true);
});

test('Davidův přesný případ: aktiv aktivní, plan_billing null, žádá znovu aktiv → zablokovat', () => {
  assert(wouldDuplicateSubscription('aktiv', 'aktiv', 'active', future) === true);
});

test('aktiv aktivní, žádá upgrade na aktiv-plus → povolit (jiný tarif)', () => {
  assert(wouldDuplicateSubscription('aktiv', 'aktiv-plus', 'active', null) === false);
});

test('zrušeno bez doběhu, žádá znovu stejný tarif → povolit (reálně nic neplatí)', () => {
  assert(wouldDuplicateSubscription('aktiv', 'aktiv', 'cancelled', null) === false);
});

test('zrušeno s budoucím doběhem, žádá znovu stejný tarif → zablokovat (pořád platí)', () => {
  assert(wouldDuplicateSubscription('aktiv', 'aktiv', 'cancelled', future) === true);
});

test('žádný tarif (start), žádá aktiv → povolit', () => {
  assert(wouldDuplicateSubscription('start', 'aktiv', 'inactive', null) === false);
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

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);

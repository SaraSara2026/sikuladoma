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

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);

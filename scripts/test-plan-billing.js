#!/usr/bin/env node
// Testuje resolvePlanBilling (api/stripe.js) a isStatusActiveOrGrace (api/_plan.js)
// čistě v paměti — žádná DB, žádné volání Stripe API. Pokrývá scénáře ze zadání:
// aktivní měsíční, aktivní roční, zrušený s budoucím doběhem, zrušený bez doběhu
// (přesně stav účtu, který nahlásila Sara: subscription_status='cancelled',
// plan_expires_at=null).
//
// Spuštění: node scripts/test-plan-billing.js

process.env.STRIPE_PRICE_AKTIV        = 'price_aktiv_monthly_test';
process.env.STRIPE_PRICE_AKTIV_YEARLY = 'price_aktiv_yearly_test';
process.env.STRIPE_PRICE_PLUS         = 'price_plus_monthly_test';
process.env.STRIPE_PRICE_PLUS_YEARLY  = 'price_plus_yearly_test';

const { resolvePlanBilling, wouldDuplicateSubscription } = await import('../api/stripe.js');
const { isStatusActiveOrGrace } = await import('../api/_plan.js');

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

test('aktivní měsíční tarif (Aktivní šikula) → monthly', () => {
  const r = resolvePlanBilling('active', null, process.env.STRIPE_PRICE_AKTIV);
  assert(r === 'monthly', `expected 'monthly', got ${r}`);
});

test('aktivní roční tarif (Aktivní šikula Plus) → yearly', () => {
  const r = resolvePlanBilling('active', future, process.env.STRIPE_PRICE_PLUS_YEARLY);
  assert(r === 'yearly', `expected 'yearly', got ${r}`);
});

test('zrušený tarif s budoucím doběhem (grace) → zachová období', () => {
  const r = resolvePlanBilling('cancelled', future, process.env.STRIPE_PRICE_AKTIV_YEARLY);
  assert(r === 'yearly', `expected 'yearly' (v doběhu = pořád platí), got ${r}`);
});

test('zrušený tarif BEZ doběhu (plan_expires_at = null) → null', () => {
  // Přesně stav Sařina účtu: subscription_status='cancelled', plan_expires_at=null.
  const r = resolvePlanBilling('cancelled', null, process.env.STRIPE_PRICE_PLUS);
  assert(r === null, `expected null, got ${r}`);
});

test('zrušený tarif s doběhem v minulosti (už uplynul) → null', () => {
  const r = resolvePlanBilling('cancelled', past, process.env.STRIPE_PRICE_AKTIV);
  assert(r === null, `expected null, got ${r}`);
});

test('platba selhala (payment_failed) → null i s platným price ID', () => {
  const r = resolvePlanBilling('payment_failed', future, process.env.STRIPE_PRICE_AKTIV);
  assert(r === null, `expected null, got ${r}`);
});

test('neznámé/chybějící price ID u aktivního účtu → null (nic se nehádá)', () => {
  const r = resolvePlanBilling('active', null, 'price_neexistujici');
  assert(r === null, `expected null, got ${r}`);
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

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);

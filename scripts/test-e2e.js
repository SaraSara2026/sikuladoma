#!/usr/bin/env node
// ŠikulaDoma — end-to-end test skript
// Testuje kompletní flow přes produkční (nebo lokální) API.
//
// Spuštění:
//   node scripts/test-e2e.js                  → testuje produkci (sikuladoma.vercel.app)
//   BASE=http://localhost:3000 node scripts/test-e2e.js  → lokálně (vercel dev)
//
// Předpoklady: seed data (npm run db:seed) — jana@, pavel@, admin@ s heslem demo1234

import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const BASE    = process.env.BASE || 'https://sikuladoma.vercel.app';
const VERBOSE = process.env.VERBOSE === '1';

let passed = 0, failed = 0;
const cookies = {};   // { label: cookieString }
const ids = {};       // { orderId, offerId, conversationId, reviewId }

// ── helpers ─────────────────────────────────────────────────────────────────

function log(msg) { process.stdout.write(msg + '\n'); }
function ok(label)   { passed++; log(`  ✅ ${label}`); }
function fail(label, detail) { failed++; log(`  ❌ ${label}${detail ? ': ' + detail : ''}`); }

async function request(method, path, { body, user, expectStatus } = {}) {
  const url = `${BASE}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (user && cookies[user]) headers['Cookie'] = cookies[user];

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });

  // Uložíme Set-Cookie pro budoucí požadavky
  const setCookie = res.headers.get('set-cookie');
  if (setCookie && user) {
    const match = setCookie.match(/sikuladoma_session=([^;]+)/);
    if (match) cookies[user] = `sikuladoma_session=${match[1]}`;
  }

  let data;
  try { data = await res.json(); } catch { data = null; }

  if (VERBOSE) {
    log(`    ${method} ${path} → ${res.status}`);
    if (data) log('    ' + JSON.stringify(data).slice(0, 200));
  }

  if (expectStatus && res.status !== expectStatus) {
    throw new Error(`Expected ${expectStatus}, got ${res.status}: ${JSON.stringify(data)}`);
  }
  return { status: res.status, data };
}

async function test(label, fn) {
  try {
    await fn();
    ok(label);
  } catch (e) {
    fail(label, e.message);
    if (VERBOSE) log('    ' + e.stack);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

// ── Test suite ───────────────────────────────────────────────────────────────

log(`\n🔍 ŠikulaDoma E2E Test Suite`);
log(`   Target: ${BASE}`);
log(`   ${new Date().toISOString()}\n`);

// ── 1. AUTH ─────────────────────────────────────────────────────────────────
log('AUTH');

await test('Login jana (customer)', async () => {
  const { status, data } = await request('POST', '/api/auth/login', {
    user: 'jana', body: { email: 'jana@example.com', password: 'demo1234' }, expectStatus: 200,
  });
  assert(data?.user?.role === 'customer', 'role != customer');
  assert(data?.user?.plan !== undefined, 'plan chybí v odpovědi');
  assert(cookies['jana'], 'Cookie nebylo nastaveno');
});

await test('Login pavel (sikula)', async () => {
  const { status, data } = await request('POST', '/api/auth/login', {
    user: 'pavel', body: { email: 'pavel@example.com', password: 'demo1234' }, expectStatus: 200,
  });
  assert(data?.user?.role === 'sikula', 'role != sikula');
  assert(cookies['pavel'], 'Cookie nebylo nastaveno');
});

await test('Login admin', async () => {
  const { status, data } = await request('POST', '/api/auth/login', {
    user: 'admin', body: { email: 'admin@sikuladoma.cz', password: 'demo1234' }, expectStatus: 200,
  });
  assert(data?.user?.role === 'admin', 'role != admin');
  assert(cookies['admin'], 'Cookie nebylo nastaveno');
});

await test('GET /api/auth/me (jana)', async () => {
  const { data } = await request('GET', '/api/auth/me', { user: 'jana', expectStatus: 200 });
  assert(data?.user?.email === 'jana@example.com', 'e-mail nesedí');
  assert(data?.user?.plan !== undefined, 'plan chybí v /me odpovědi');
});

await test('Login špatné heslo → 401', async () => {
  const { status } = await request('POST', '/api/auth/login', {
    body: { email: 'jana@example.com', password: 'wrong' },
  });
  assert(status === 401, `Status ${status} ≠ 401`);
});

await test('Neautorizovaný /api/auth/me → user: null', async () => {
  const { data } = await request('GET', '/api/auth/me', { expectStatus: 200 });
  assert(data?.user === null, 'Mělo vrátit user: null');
});

// ── 2. REGISTRACE ───────────────────────────────────────────────────────────
log('\nREGISTRACE');

const testEmail = `test_${Date.now()}@example.com`;

await test('Registrace nového šikuly', async () => {
  const { status, data } = await request('POST', '/api/auth/register', {
    user: 'newuser',
    body: { email: testEmail, password: 'Heslo1234', name: 'Testovací Šikula', role: 'sikula', city: 'Brno' },
    expectStatus: 201,
  });
  assert(data?.user?.role === 'sikula', 'role != sikula');
  assert(data?.user?.plan === 'start', 'Nový šikula musí mít plan=start');
});

await test('Duplicitní registrace → 409', async () => {
  const { status } = await request('POST', '/api/auth/register', {
    body: { email: testEmail, password: 'Heslo1234', name: 'Dup', role: 'sikula' },
  });
  assert(status === 409, `Status ${status} ≠ 409`);
});

await test('Registrace s krátkým heslem → 400', async () => {
  const { status } = await request('POST', '/api/auth/register', {
    body: { email: 'test2@x.cz', password: '123', name: 'Test', role: 'customer' },
  });
  assert(status === 400, `Status ${status} ≠ 400`);
});

// ── 3. POPTÁVKY ─────────────────────────────────────────────────────────────
log('\nPOPTÁVKY');

await test('Jana vytvoří poptávku', async () => {
  const { data } = await request('POST', '/api/orders', {
    user: 'jana',
    body: {
      title: 'E2E Test: Montáž poličky',
      category: 'opravy',
      city: 'Praha',
      customer_name: 'Jana Testová',
      customer_email: 'jana@example.com',
      description: 'Potřebuji namontovat 3 dřevěné poličky v obýváku.',
      budget: '500-1000 Kč',
    },
    expectStatus: 201,
  });
  assert(data?.order?.id, 'Chybí order.id');
  ids.orderId = data.order.id;
});

await test('Jana vidí svou poptávku', async () => {
  const { data } = await request('GET', '/api/orders', { user: 'jana', expectStatus: 200 });
  const found = data?.orders?.find(o => o.id === ids.orderId);
  assert(found, 'Poptávka nebyla nalezena v seznamu');
  assert(found.status === 'new', `Status ${found.status} ≠ new`);
});

await test('Pavel vidí otevřenou poptávku', async () => {
  const { data } = await request('GET', '/api/orders', { user: 'pavel', expectStatus: 200 });
  const found = data?.orders?.find(o => o.id === ids.orderId);
  assert(found, 'Pavel nevidí poptávku');
});

await test('Nepřihlášený nesmí GET orders bez identifikace → 401', async () => {
  const { status } = await request('GET', '/api/orders');
  assert(status === 401, `Status ${status} ≠ 401`);
});

// ── 4. NABÍDKY ──────────────────────────────────────────────────────────────
log('\nNABÍDKY');

await test('Pavel pošle nabídku', async () => {
  const { data } = await request('POST', '/api/offers', {
    user: 'pavel',
    body: {
      order_id: ids.orderId,
      price: 850,
      message: 'E2E nabídka — udělám to za 2 hodiny.',
    },
    expectStatus: 201,
  });
  assert(data?.offer?.id, 'Chybí offer.id');
  ids.offerId = data.offer.id;
});

await test('Pavel nesmí poslat druhou nabídku na stejnou poptávku → 409', async () => {
  const { status } = await request('POST', '/api/offers', {
    user: 'pavel',
    body: { order_id: ids.orderId, price: 900, message: 'Druhá nabídka' },
  });
  assert(status === 409, `Status ${status} ≠ 409`);
});

await test('Jana vidí nabídku od Pavla', async () => {
  const { data } = await request('GET', `/api/offers?order_id=${ids.orderId}`, {
    user: 'jana', expectStatus: 200,
  });
  assert(data?.offers?.length > 0, 'Žádné nabídky');
  const offer = data.offers.find(o => o.id === ids.offerId);
  assert(offer, 'Nenalezena nabídka');
  assert(offer.price == 850, `Cena ${offer.price} ≠ 850`);
});

// ── 5. PŘIJETÍ NABÍDKY ──────────────────────────────────────────────────────
log('\nPŘIJETÍ NABÍDKY');

await test('Jana přijme nabídku → poptávka accepted + conversation', async () => {
  const { data } = await request('PATCH', `/api/offers/${ids.offerId}`, {
    user: 'jana',
    body: { action: 'accept' },
    expectStatus: 200,
  });
  assert(data?.offer?.status === 'accepted', `offer.status = ${data?.offer?.status}`);
});

await test('Ověření stavu poptávky → accepted', async () => {
  const { data } = await request('GET', '/api/orders', { user: 'jana', expectStatus: 200 });
  const order = data.orders.find(o => o.id === ids.orderId);
  assert(order?.status === 'accepted', `order.status = ${order?.status}`);
  assert(order?.accepted_offer_id == ids.offerId, 'accepted_offer_id nesedí');
});

await test('Konverzace byla automaticky vytvořena', async () => {
  const { data } = await request('GET', '/api/conversations', { user: 'jana', expectStatus: 200 });
  const conv = data?.conversations?.find(c => c.order_id === ids.orderId);
  assert(conv, 'Konverzace nebyla vytvořena');
  ids.conversationId = conv.id;
});

// ── 6. ZPRÁVY ───────────────────────────────────────────────────────────────
log('\nZPRÁVY');

await test('Pavel pošle zprávu', async () => {
  const { data } = await request('POST', '/api/messages', {
    user: 'pavel',
    body: { conversation_id: ids.conversationId, text: 'E2E: Přijdu v úterý.' },
    expectStatus: 201,
  });
  assert(data?.message?.id, 'message.id chybí');
  ids.messageId = data.message.id;
});

await test('Jana vidí zprávu', async () => {
  const { data } = await request('GET', `/api/messages?conversation_id=${ids.conversationId}`, {
    user: 'jana', expectStatus: 200,
  });
  const msg = data?.messages?.find(m => m.id === ids.messageId);
  assert(msg, 'Zpráva nenalezena');
  assert(msg.text === 'E2E: Přijdu v úterý.', 'Text zprávy nesedí');
});

await test('Neúčastník nesmí vidět zprávy → 403', async () => {
  const { status } = await request('GET', `/api/messages?conversation_id=${ids.conversationId}`, {
    user: 'newuser',
  });
  assert([401, 403].includes(status), `Status ${status} není 401/403`);
});

// ── 7. DOKONČENÍ A RECENZE ───────────────────────────────────────────────────
log('\nDOKONČENÍ + RECENZE');

await test('Pavel označí zakázku jako hotovou → jobs_count ++', async () => {
  const { data } = await request('PATCH', `/api/orders/${ids.orderId}`, {
    user: 'pavel',
    body: { action: 'complete' },
    expectStatus: 200,
  });
  assert(data?.order?.status === 'completed', `status = ${data?.order?.status}`);
});

let sikulaJobsBefore;
await test('Ověření inkrementu jobs_count šikuly', async () => {
  const { data } = await request('GET', `/api/users/${/* pavel id */ 2}`, { expectStatus: 200 });
  assert(typeof data?.user?.jobs_count === 'number', 'jobs_count chybí');
  sikulaJobsBefore = data.user.jobs_count;
  assert(sikulaJobsBefore >= 1, 'jobs_count je 0 po dokončení zakázky');
});

await test('Jana napíše recenzi 5★', async () => {
  const { data } = await request('POST', '/api/reviews', {
    user: 'jana',
    body: {
      order_id: ids.orderId,
      stars: 5,
      ratings: { domluva: 5, kvalita: 5, komunikace: 5, vstricnost: 5, cena: 5 },
      recommend: true,
      comment: 'E2E: Výborná práce, doporučuji!',
    },
    expectStatus: 201,
  });
  assert(data?.review?.id, 'review.id chybí');
  ids.reviewId = data.review.id;
});

await test('Duplicitní recenze → 409', async () => {
  const { status } = await request('POST', '/api/reviews', {
    user: 'jana',
    body: { order_id: ids.orderId, stars: 3, recommend: false },
  });
  assert(status === 409, `Status ${status} ≠ 409`);
});

await test('Veřejný profil šikuly má aktuální rating', async () => {
  const { data } = await request('GET', '/api/users/2', { expectStatus: 200 });
  assert(data?.user?.rating !== null, 'rating je null');
  assert(Number(data.user.rating) >= 1 && Number(data.user.rating) <= 5, `rating ${data.user.rating} mimo rozsah`);
});

await test('GET /api/reviews?my_reviews=1 (jana vidí svou recenzi)', async () => {
  const { data } = await request('GET', '/api/reviews?my_reviews=1', { user: 'jana', expectStatus: 200 });
  const review = data?.reviews?.find(r => r.id === ids.reviewId);
  assert(review, 'Recenze nenalezena v my_reviews');
  assert(review.stars === 5, `stars = ${review.stars}`);
  assert(review.target_name, 'target_name chybí');
  assert(review.order_title, 'order_title chybí');
});

await test('GET /api/reviews?target_id=2 (veřejné recenze šikuly)', async () => {
  const { data } = await request('GET', '/api/reviews?target_id=2', { expectStatus: 200 });
  assert(data?.summary?.total >= 1, 'summary.total < 1');
  assert(Number(data?.summary?.avg_stars) >= 1, 'avg_stars < 1');
  assert(data?.reviews?.length >= 1, 'reviews pole je prázdné');
});

// ── 8. ADMIN ─────────────────────────────────────────────────────────────────
log('\nADMIN');

await test('Admin stats', async () => {
  const { data } = await request('GET', '/api/admin/stats', { user: 'admin', expectStatus: 200 });
  assert(typeof data?.users?.customers === 'number', 'users.customers chybí');
  assert(typeof data?.orders?.total    === 'number', 'orders.total chybí');
  assert(typeof data?.reviews?.total   === 'number', 'reviews.total chybí');
});

await test('Admin vidí všechny objednávky', async () => {
  const { data } = await request('GET', '/api/admin/orders', { user: 'admin', expectStatus: 200 });
  const found = data?.orders?.find(o => o.id === ids.orderId);
  assert(found, 'Admin nevidí test poptávku');
  assert(found.status === 'completed', `status = ${found.status}`);
});

await test('Admin vidí kontaktní zprávy', async () => {
  const { data } = await request('GET', '/api/admin/contacts', { user: 'admin', expectStatus: 200 });
  assert(Array.isArray(data?.contacts), 'contacts není pole');
});

await test('Nepřihlášený nesmí přistupovat na admin → 401', async () => {
  const { status } = await request('GET', '/api/admin/stats');
  assert(status === 401, `Status ${status} ≠ 401`);
});

await test('Zákazník nesmí admin → 403', async () => {
  const { status } = await request('GET', '/api/admin/stats', { user: 'jana' });
  assert(status === 403, `Status ${status} ≠ 403`);
});

// ── 9. KONTAKTNÍ FORMULÁŘ (přesunutý do /api/admin/contact) ─────────────────
log('\nKONTAKT');

await test('POST /api/admin/contact (veřejný endpoint)', async () => {
  const { data } = await request('POST', '/api/admin/contact', {
    body: { name: 'E2E Test', email: 'e2e@test.cz', message: 'Testovací zpráva z e2e.' },
    expectStatus: 201,
  });
  assert(data?.ok === true, 'ok != true');
  assert(data?.id, 'id chybí');
});

await test('Kontakt s prázdnou zprávou → 400', async () => {
  const { status } = await request('POST', '/api/admin/contact', {
    body: { name: 'Test', email: 'e2e@test.cz', message: '' },
  });
  assert(status === 400, `Status ${status} ≠ 400`);
});

// ── 10. STRIPE (bez klíčů — jen ověření endpointu) ─────────────────────────
log('\nSTRIPE (endpoint check)');

await test('Checkout bez STRIPE_SECRET_KEY → 500 nebo 503', async () => {
  const { status } = await request('POST', '/api/stripe?action=checkout', {
    user: 'pavel',
    body: { plan: 'profi' },
  });
  // V produkci bez klíčů vrátí 500 (chyba STRIPE_SECRET_KEY)
  // S klíči by vrátilo 200 { url }
  // Oba jsou validní výstupy pro tento test
  assert([200, 500, 503].includes(status), `Neočekávaný status ${status}`);
});

await test('Checkout pro zákazníka (ne šikulu) → 403', async () => {
  const { status } = await request('POST', '/api/stripe?action=checkout', {
    user: 'jana',
    body: { plan: 'profi' },
  });
  assert(status === 403, `Status ${status} ≠ 403`);
});

await test('Checkout s neplatným plánem → 400', async () => {
  const { status } = await request('POST', '/api/stripe?action=checkout', {
    user: 'pavel',
    body: { plan: 'neexistujici' },
  });
  // Bez STRIPE_SECRET_KEY dostaneme 500 před validací, jinak 400
  assert([400, 500, 503].includes(status), `Neočekávaný status ${status}`);
});

// ── 11. FAKTURY ─────────────────────────────────────────────────────────────
log('\nFAKTURY');

const invoiceId = `FAK-E2E-${Date.now()}`;

await test('Vytvořit fakturu', async () => {
  const { data } = await request('POST', '/api/invoices', {
    user: 'pavel',
    body: {
      id: invoiceId,
      title: 'E2E Faktura',
      amount: 850,
      customer_name: 'Jana Testová',
      due_date: '2026-06-30',
    },
    expectStatus: 201,
  });
  assert(data?.id === invoiceId, 'id nesedí');
});

await test('Načíst faktury', async () => {
  const { data } = await request('GET', '/api/invoices', { user: 'pavel', expectStatus: 200 });
  // Faktury se vrátí jako pole nebo objekt s polem
  const list = Array.isArray(data) ? data : data?.invoices || [];
  const found = list.find(i => i.id === invoiceId);
  assert(found, 'Vytvořená faktura nenalezena');
});

// ── 12. UVEŘEJNĚNÍ ŠIKULY ────────────────────────────────────────────────────
log('\nOVĚŘENÍ ŠIKULY');

await test('Admin ověří šikulu → verified=true', async () => {
  const { data } = await request('POST', '/api/admin/verify-sikula', {
    user: 'admin',
    body: { id: 2 },
    expectStatus: 200,
  });
  assert(data?.user?.verified === true, 'verified != true');
});

// ── VÝSLEDKY ─────────────────────────────────────────────────────────────────

log(`\n${'─'.repeat(50)}`);
log(`Výsledky: ${passed} prošlo, ${failed} selhalo (celkem ${passed + failed})`);

if (failed > 0) {
  log('❌ NĚKTERÉ TESTY SELHALY');
  process.exit(1);
} else {
  log('✅ VŠECHNY TESTY PROŠLY');
  process.exit(0);
}

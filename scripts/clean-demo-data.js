// Smaže VŠECHNA data z produkční DB. Schema zůstává.
// Spustit: node --env-file=.env.local scripts/clean-demo-data.js
// POZOR: destruktivní, smaže všechny uživatele a všechen jejich obsah.

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL není nastaven.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

console.log('🔍 Stav před smazáním:');
const before = await sql`
  SELECT
    (SELECT COUNT(*)::int FROM users)             AS users,
    (SELECT COUNT(*)::int FROM orders)            AS orders,
    (SELECT COUNT(*)::int FROM offers)            AS offers,
    (SELECT COUNT(*)::int FROM invoices)          AS invoices,
    (SELECT COUNT(*)::int FROM reviews)           AS reviews,
    (SELECT COUNT(*)::int FROM messages)          AS messages,
    (SELECT COUNT(*)::int FROM conversations)     AS conversations,
    (SELECT COUNT(*)::int FROM contact_messages)  AS contact_messages,
    (SELECT COUNT(*)::int FROM email_verifications) AS email_verifications,
    (SELECT COUNT(*)::int FROM password_resets)   AS password_resets,
    (SELECT COUNT(*)::int FROM magic_links)       AS magic_links
`;
console.table(before[0]);

console.log('\n🧹 Mažu data (TRUNCATE CASCADE, reset SERIAL counters)...');

// TRUNCATE CASCADE smaže vše ve správném pořadí (FK dependencies).
// RESTART IDENTITY resetuje SERIAL na 1.
await sql`
  TRUNCATE TABLE
    email_verifications,
    password_resets,
    magic_links,
    contact_messages,
    messages,
    conversations,
    reviews,
    offers,
    orders,
    invoices,
    users
  RESTART IDENTITY CASCADE
`;

console.log('\n✅ Hotovo. Stav po smazání:');
const after = await sql`
  SELECT
    (SELECT COUNT(*)::int FROM users)             AS users,
    (SELECT COUNT(*)::int FROM orders)            AS orders,
    (SELECT COUNT(*)::int FROM offers)            AS offers,
    (SELECT COUNT(*)::int FROM invoices)          AS invoices,
    (SELECT COUNT(*)::int FROM reviews)           AS reviews,
    (SELECT COUNT(*)::int FROM messages)          AS messages,
    (SELECT COUNT(*)::int FROM conversations)     AS conversations,
    (SELECT COUNT(*)::int FROM contact_messages)  AS contact_messages,
    (SELECT COUNT(*)::int FROM email_verifications) AS email_verifications,
    (SELECT COUNT(*)::int FROM password_resets)   AS password_resets,
    (SELECT COUNT(*)::int FROM magic_links)       AS magic_links
`;
console.table(after[0]);

console.log('\n🎉 DB je prázdná. Můžeš se zaregistrovat jako nový uživatel.');

// Jednorázový backfill: označit všechny existující uživatele jako ověřené.
// Spustit jednou: node scripts/backfill-verified.js
// Idempotentní — pokud už mají email_verified_at vyplněn, neudělá nic.

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL není nastaven.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const before = await sql`SELECT COUNT(*)::int AS n FROM users WHERE email_verified_at IS NULL`;
console.log(`📊 Neověřených uživatelů před: ${before[0].n}`);

const rows = await sql`
  UPDATE users
  SET email_verified_at = COALESCE(created_at, NOW()),
      updated_at = NOW()
  WHERE email_verified_at IS NULL
  RETURNING id, email
`;

console.log(`✅ Označeno jako ověřených: ${rows.length}`);
rows.forEach(r => console.log(`   - ${r.email} (id=${r.id})`));

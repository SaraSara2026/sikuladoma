import { config } from 'dotenv';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });
const schemaPath = resolve(__dirname, '../db/schema.sql');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set. Create .env.local with your Neon connection string.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const rawSchema = readFileSync(schemaPath, 'utf8');

// Strip line-comments first, then split on `;`
const schemaSql = rawSchema
  .split('\n')
  .map(line => line.replace(/--.*$/, ''))
  .join('\n');

const statements = schemaSql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log(`📜 Running ${statements.length} statements from db/schema.sql...`);

for (const [i, stmt] of statements.entries()) {
  const preview = stmt.split('\n')[0].slice(0, 70);
  try {
    await sql.query(stmt);
    console.log(`  ✓ [${i + 1}/${statements.length}] ${preview}`);
  } catch (err) {
    console.error(`  ✗ [${i + 1}/${statements.length}] ${preview}`);
    console.error(`    ${err.message}`);
    process.exit(1);
  }
}

console.log('✅ Migration complete.');

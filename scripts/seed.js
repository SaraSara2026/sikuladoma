import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const DEMO_INVOICES = [
  { id: 'FAK-2025-001', title: 'Montáž nábytku',  amount: 2500, customer_name: 'Jana Nováková',  created_date: '2025-05-01', due_date: '2025-05-15', status: 'paid'  },
  { id: 'FAK-2025-002', title: 'Malování pokoje', amount: 4800, customer_name: 'Petr Svoboda',   created_date: '2025-05-05', due_date: '2025-05-19', status: 'sent'  },
  { id: 'FAK-2025-003', title: 'Oprava kohoutu',  amount: 900,  customer_name: 'Marie Horáková', created_date: '2025-05-08', due_date: '2025-05-22', status: 'draft' },
];

console.log(`🌱 Seeding ${DEMO_INVOICES.length} demo invoices...`);

for (const inv of DEMO_INVOICES) {
  try {
    await sql`
      INSERT INTO invoices (id, title, amount, customer_name, created_date, due_date, status)
      VALUES (${inv.id}, ${inv.title}, ${inv.amount}, ${inv.customer_name},
              ${inv.created_date}, ${inv.due_date}, ${inv.status})
      ON CONFLICT (id) DO NOTHING
    `;
    console.log(`  ✓ ${inv.id} — ${inv.title}`);
  } catch (err) {
    console.error(`  ✗ ${inv.id}: ${err.message}`);
  }
}

console.log('✅ Seed complete.');

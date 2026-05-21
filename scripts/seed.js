import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// ─── DEMO USERS ─────────────────────────────────────────────────────────────
const DEMO_PASSWORD = 'demo1234';

const DEMO_USERS = [
  {
    email: 'jana@example.com',
    name: 'Jana Nováková',
    role: 'customer',
    phone: '+420 777 111 222',
    city: 'Praha 6',
    avatar: 'JN',
  },
  {
    email: 'pavel@example.com',
    name: 'Pavel Šikovný',
    role: 'sikula',
    phone: '+420 777 333 444',
    city: 'Praha 4',
    avatar: 'PŠ',
    ico: '12345678',
    services: ['nabytek', 'opravy', 'hodinovy'],
    plan: 'profi',
    verified: true,
    rating: 4.9,
    jobs_count: 87,
    bio: 'Zkušený šikula s 10+ lety praxe. Rychlý, precizní, spolehlivý.',
  },
  {
    email: 'admin@sikuladoma.cz',
    name: 'Administrátor',
    role: 'admin',
    avatar: 'AD',
    city: 'Praha',
  },
];

console.log(`🌱 Seeding ${DEMO_USERS.length} demo users (heslo: ${DEMO_PASSWORD})...`);

for (const u of DEMO_USERS) {
  try {
    const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
    await sql`
      INSERT INTO users (email, password_hash, role, name, phone, city, avatar,
                         ico, services, plan, verified, rating, jobs_count, bio)
      VALUES (${u.email}, ${hash}, ${u.role}, ${u.name}, ${u.phone || null},
              ${u.city || null}, ${u.avatar || null}, ${u.ico || null},
              ${u.services || []}, ${u.plan || 'start'}, ${u.verified || false},
              ${u.rating || null}, ${u.jobs_count || 0}, ${u.bio || null})
      ON CONFLICT (email) DO NOTHING
    `;
    console.log(`  ✓ ${u.email} (${u.role})`);
  } catch (err) {
    console.error(`  ✗ ${u.email}: ${err.message}`);
  }
}

// ─── DEMO INVOICES ──────────────────────────────────────────────────────────
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

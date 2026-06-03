// /api/orders — GET (list) + POST (create)
// PATCH/:id je v api/orders/[id].js (Vercel optional catch-all nematchuje base path).

import { randomBytes } from 'node:crypto';
import { sql } from './_db.js';
import { getCurrentUser, hashPassword } from './_auth.js';
import { sendPasswordResetEmail } from './_email.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUS_NEW = 'new';
const VALID_GENDER = new Set(['jedno', 'zena', 'muz']);
const RESET_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;  // 7 dní pro nově vytvořené účty

function genToken() {
  return randomBytes(32).toString('base64url');
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') return await createOrder(req, res);
    if (req.method === 'GET')  return await listOrders(req, res);
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[/api/orders]', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function createOrder(req, res) {
  const b = req.body ?? {};
  const title       = String(b.title || '').trim();
  const category    = String(b.category || '').trim();
  const description = b.description != null ? String(b.description) : (b.desc != null ? String(b.desc) : null);
  const city        = String(b.city || '').trim();
  const budget      = b.budget ? String(b.budget) : null;
  const floor       = b.floor ? String(b.floor) : null;
  const parking     = b.parking ? String(b.parking) : null;
  const note        = b.note ? String(b.note) : null;
  const subcategory = b.subcategory ? String(b.subcategory) : null;
  const urgent      = !!b.urgent;
  const preferred_date = b.preferred_date || b.date || null;
  const preferred_time = b.preferred_time || b.time || null;
  const gender         = VALID_GENDER.has(b.gender_preference || b.gender) ? (b.gender_preference || b.gender) : 'jedno';

  const me = await getCurrentUser(req);

  // Pozn.: Zadání poptávky NEVYŽADUJE ověřený e-mail (low friction vstup).
  // Verify check je až u akcí které spotřebovávají čas šikulovi:
  // odeslání nabídky (api/offers) a chat zprávy (api/messages).

  const customer_name  = String((b.customer_name || b.name || me?.name || '')).trim();
  const customer_email = String((b.customer_email || b.email || me?.email || '')).trim().toLowerCase();
  const customer_phone = b.customer_phone || b.phone || me?.phone || null;

  if (title.length < 3)                              return res.status(400).json({ error: 'Zadejte název poptávky (min. 3 znaky).' });
  if (!category)                                     return res.status(400).json({ error: 'Vyberte kategorii.' });
  if (city.length < 2)                               return res.status(400).json({ error: 'Zadejte město.' });
  if (!customer_name)                                return res.status(400).json({ error: 'Zadejte své jméno.' });
  if (!/^\S+\s+\S+/.test(customer_name))             return res.status(400).json({ error: 'Zadejte jméno i příjmení.' });
  if (!EMAIL_RE.test(customer_email))                return res.status(400).json({ error: 'Zadejte platný e-mail.' });

  // Anonymní poptávka: vytvoř customer účet + pošli email s nastavením hesla.
  // Pokud už účet s tímto e-mailem existuje, použij ho.
  let customerId = me?.id || null;
  let createdNewAccount = false;
  if (!customerId) {
    const [existing] = await sql`SELECT id FROM users WHERE email = ${customer_email}`;
    if (existing) {
      customerId = existing.id;
    } else {
      const randomPassword = randomBytes(32).toString('base64url');
      const password_hash = await hashPassword(randomPassword);
      const [newUser] = await sql`
        INSERT INTO users (email, password_hash, role, name, phone, city)
        VALUES (${customer_email}, ${password_hash}, 'customer', ${customer_name}, ${customer_phone}, ${city})
        RETURNING id
      `;
      customerId = newUser.id;
      createdNewAccount = true;
    }
  }

  const [row] = await sql`
    INSERT INTO orders (
      customer_id, customer_name, customer_email, customer_phone,
      title, category, subcategory, description, city, floor, parking, budget,
      preferred_date, preferred_time, gender_preference, urgent, note, status
    ) VALUES (
      ${customerId}, ${customer_name}, ${customer_email}, ${customer_phone},
      ${title}, ${category}, ${subcategory}, ${description}, ${city}, ${floor}, ${parking}, ${budget},
      ${preferred_date}, ${preferred_time}, ${gender}, ${urgent}, ${note}, ${STATUS_NEW}
    )
    RETURNING *
  `;

  // Pokud byl vytvořen nový účet, pošli mu reset-password token aby si nastavil heslo.
  // Selhání emailu nesmí zrušit poptávku — uživatel ji už má v DB.
  if (createdNewAccount) {
    try {
      const token = genToken();
      const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await sql`
        INSERT INTO password_resets (token, user_id, expires_at)
        VALUES (${token}, ${customerId}, ${expires.toISOString()})
      `;
      await sendPasswordResetEmail({ to: customer_email, name: customer_name, token });
    } catch (err) {
      console.error('[orders] welcome email failed:', err);
    }
  }

  return res.status(201).json({ order: row, accountCreated: createdNewAccount });
}

async function listOrders(req, res) {
  const me = await getCurrentUser(req);
  if (!me) return res.status(401).json({ error: 'Unauthorized' });

  const { category, city, status } = req.query || {};

  let rows;
  if (me.role === 'admin') {
    rows = await sql`
      SELECT * FROM orders
      WHERE (${status ?? null}::text IS NULL OR status = ${status ?? null})
        AND (${category ?? null}::text IS NULL OR category = ${category ?? null})
        AND (${city ?? null}::text IS NULL OR city ILIKE ${city ? `%${city}%` : null})
      ORDER BY created_at DESC LIMIT 200
    `;
  } else if (me.role === 'sikula') {
    rows = await sql`
      SELECT id, title, category, subcategory, description, city, budget, urgent,
             preferred_date, preferred_time, gender_preference, status, created_at
      FROM orders
      WHERE status IN ('new','in_progress')
        AND (${category ?? null}::text IS NULL OR category = ${category ?? null})
        AND (${city ?? null}::text IS NULL OR city ILIKE ${city ? `%${city}%` : null})
      ORDER BY created_at DESC LIMIT 200
    `;
  } else {
    rows = await sql`
      SELECT * FROM orders WHERE customer_id = ${me.id}
      ORDER BY created_at DESC LIMIT 200
    `;
  }
  return res.status(200).json({ orders: rows });
}

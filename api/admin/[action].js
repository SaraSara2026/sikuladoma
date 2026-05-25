// Admin endpointy — pouze role='admin'.
// Sloučeno do jednoho dynamic route (šetří funkce ve Vercel Hobby limitu).
// Výjimka: action=contact je veřejná (kontaktní formulář).

import { sql } from '../_db.js';
import { requireUser } from '../_auth.js';
import { rateLimit } from '../_rate-limit.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  try {
    const action = req.query?.action;

    // ── Veřejná akce: kontaktní formulář ─────────────────────────────────────
    if (action === 'contact') {
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
      }
      if (rateLimit(req, res, { key: 'contact', limit: 5, windowMs: 10 * 60 * 1000 })) return;
      const { name, email, subject, message } = req.body ?? {};
      const n = String(name    || '').trim();
      const e = String(email   || '').trim().toLowerCase();
      const s = subject ? String(subject).trim().slice(0, 200) : null;
      const m = String(message || '').trim();
      if (n.length < 1)       return res.status(400).json({ error: 'Zadejte své jméno.' });
      if (!EMAIL_RE.test(e))  return res.status(400).json({ error: 'Zadejte platný e-mail.' });
      if (m.length < 1)       return res.status(400).json({ error: 'Zpráva nemůže být prázdná.' });
      if (m.length > 5000)    return res.status(400).json({ error: 'Zpráva je příliš dlouhá.' });
      const [row] = await sql`
        INSERT INTO contact_messages (name, email, subject, message)
        VALUES (${n}, ${e}, ${s}, ${m})
        RETURNING id, created_at
      `;
      return res.status(201).json({ ok: true, id: row.id });
    }

    // ── Všechny ostatní akce vyžadují admin ──────────────────────────────────
    const me = await requireUser(req, res);
    if (!me) return;
    if (me.role !== 'admin') return res.status(403).json({ error: 'Pouze admin.' });

    if (action === 'stats')     return await stats(req, res);
    if (action === 'users')     return await listUsers(req, res);
    if (action === 'orders')    return await listOrders(req, res);
    if (action === 'contacts')  return await listContacts(req, res);
    if (action === 'verify-sikula') return await verifySikula(req, res);
    return res.status(404).json({ error: 'Unknown admin action.' });
  } catch (err) {
    console.error('[/api/admin]', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/admin/stats → KPI dashboard čísla
async function stats(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const [users] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE role = 'customer')::int AS customers,
      COUNT(*) FILTER (WHERE role = 'sikula')::int   AS sikulas,
      COUNT(*) FILTER (WHERE role = 'sikula' AND verified)::int AS verified_sikulas
    FROM users
  `;
  const [orders] = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'new')::int AS new_orders,
      COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
      COUNT(*) FILTER (WHERE status = 'accepted')::int AS accepted,
      COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
      COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled
    FROM orders
  `;
  const [reviews] = await sql`
    SELECT COUNT(*)::int AS total, AVG(stars)::numeric(2,1) AS avg_stars
    FROM reviews
  `;
  const [contacts] = await sql`
    SELECT COUNT(*) FILTER (WHERE handled = FALSE)::int AS unhandled
    FROM contact_messages
  `;
  return res.status(200).json({ users, orders, reviews, contacts });
}

// GET /api/admin/users → seznam uživatelů
async function listUsers(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const role = req.query?.role || null;
  const rows = await sql`
    SELECT id, email, name, role, city, plan, verified, rating, jobs_count, created_at
    FROM users
    WHERE (${role}::text IS NULL OR role = ${role})
    ORDER BY created_at DESC LIMIT 200
  `;
  return res.status(200).json({ users: rows });
}

// GET /api/admin/orders → všechny poptávky (admin vidí vše)
async function listOrders(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const rows = await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 200`;
  return res.status(200).json({ orders: rows });
}

// GET /api/admin/contacts → kontaktní zprávy (s ?unhandled=1 jen neřešené)
async function listContacts(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const onlyUnhandled = req.query?.unhandled === '1';
  const rows = onlyUnhandled
    ? await sql`SELECT * FROM contact_messages WHERE handled = FALSE ORDER BY created_at DESC LIMIT 200`
    : await sql`SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 200`;
  return res.status(200).json({ contacts: rows });
}

// POST /api/admin/verify-sikula { id } → nastaví verified = TRUE
async function verifySikula(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.body ?? {};
  if (!id) return res.status(400).json({ error: 'Chybí id.' });
  const [row] = await sql`
    UPDATE users SET verified = TRUE, updated_at = NOW()
    WHERE id = ${Number(id)} AND role = 'sikula'
    RETURNING id, email, name, verified
  `;
  if (!row) return res.status(404).json({ error: 'Šikula nenalezen.' });
  return res.status(200).json({ user: row });
}

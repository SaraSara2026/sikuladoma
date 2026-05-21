import { sql } from './_db.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { name, email, subject, message } = req.body ?? {};

    const n = String(name || '').trim();
    const e = String(email || '').trim().toLowerCase();
    const s = subject ? String(subject).trim().slice(0, 200) : null;
    const m = String(message || '').trim();

    if (n.length < 1)         return res.status(400).json({ error: 'Zadejte své jméno.' });
    if (!EMAIL_RE.test(e))    return res.status(400).json({ error: 'Zadejte platný e-mail.' });
    if (m.length < 1)         return res.status(400).json({ error: 'Zpráva nemůže být prázdná.' });
    if (m.length > 5000)      return res.status(400).json({ error: 'Zpráva je příliš dlouhá.' });

    const [row] = await sql`
      INSERT INTO contact_messages (name, email, subject, message)
      VALUES (${n}, ${e}, ${s}, ${m})
      RETURNING id, created_at
    `;
    return res.status(201).json({ ok: true, id: row.id });
  } catch (err) {
    console.error('[/api/contact]', err);
    return res.status(500).json({ error: 'Odeslání zprávy selhalo.' });
  }
}

import { sql } from '../_db.js';
import { hashPassword, signToken, setSessionCookie } from '../_auth.js';

const ALLOWED_ROLES = new Set(['customer', 'sikula']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { email, password, name, role = 'customer', phone, city } = req.body ?? {};

    if (!email || !EMAIL_RE.test(email))   return res.status(400).json({ error: 'Neplatný e-mail.' });
    if (!password || password.length < 8)  return res.status(400).json({ error: 'Heslo musí mít alespoň 8 znaků.' });
    if (!name || name.trim().length < 2)   return res.status(400).json({ error: 'Zadejte jméno.' });
    if (!ALLOWED_ROLES.has(role))          return res.status(400).json({ error: 'Neplatná role.' });

    const [existing] = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing) return res.status(409).json({ error: 'E-mail je již zaregistrován.' });

    const password_hash = await hashPassword(password);
    const [user] = await sql`
      INSERT INTO users (email, password_hash, role, name, phone, city)
      VALUES (${email.toLowerCase()}, ${password_hash}, ${role}, ${name.trim()}, ${phone || null}, ${city || null})
      RETURNING id, email, role, name, phone, city, avatar
    `;

    const token = await signToken({ sub: String(user.id), role: user.role });
    setSessionCookie(res, token);
    return res.status(201).json({ user });
  } catch (err) {
    console.error('[/api/auth/register]', err);
    return res.status(500).json({ error: 'Registrace selhala.' });
  }
}

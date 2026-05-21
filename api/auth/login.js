import { sql } from '../_db.js';
import { verifyPassword, signToken, setSessionCookie } from '../_auth.js';
import { rateLimit } from '../_rate-limit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Anti-brute-force: max 5 pokusů za 5 minut per IP.
  if (rateLimit(req, res, { key: 'login', limit: 5, windowMs: 5 * 60 * 1000 })) return;
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ error: 'Vyplňte e-mail a heslo.' });

    const [user] = await sql`
      SELECT id, email, password_hash, role, name, phone, city, avatar
      FROM users WHERE email = ${String(email).toLowerCase()}
    `;
    // Neprozrazujeme, jestli e-mail existuje (anti-enumeration).
    if (!user) return res.status(401).json({ error: 'Nesprávný e-mail nebo heslo.' });

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Nesprávný e-mail nebo heslo.' });

    const token = await signToken({ sub: String(user.id), role: user.role });
    setSessionCookie(res, token);

    const { password_hash, ...safe } = user;
    return res.status(200).json({ user: safe });
  } catch (err) {
    console.error('[/api/auth/login]', err);
    return res.status(500).json({ error: 'Přihlášení selhalo.' });
  }
}

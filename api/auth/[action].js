// Sloučený auth endpoint pro Vercel Hobby limit 12 funkcí.
// URL routing zůstává stejný — Vercel mapuje /api/auth/<X> na tento soubor
// s req.query.action = X.

import { sql } from '../_db.js';
import {
  hashPassword, verifyPassword, signToken,
  setSessionCookie, clearSessionCookie, getCurrentUser,
} from '../_auth.js';
import { rateLimit } from '../_rate-limit.js';

const ALLOWED_ROLES = new Set(['customer', 'sikula']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  const action = req.query?.action;
  try {
    if (action === 'login')    return await doLogin(req, res);
    if (action === 'register') return await doRegister(req, res);
    if (action === 'logout')   return await doLogout(req, res);
    if (action === 'me')       return await doMe(req, res);
    return res.status(404).json({ error: 'Unknown auth action.' });
  } catch (err) {
    console.error(`[/api/auth/${action}]`, err);
    return res.status(500).json({ error: 'Server error.' });
  }
}

// ─── login ──────────────────────────────────────────────────────────────────
async function doLogin(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (rateLimit(req, res, { key: 'login', limit: 5, windowMs: 5 * 60 * 1000 })) return;

  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'Vyplňte e-mail a heslo.' });

  const [user] = await sql`
    SELECT id, email, password_hash, role, name, phone, city, avatar,
           ico, services, plan, stripe_customer_id, plan_expires_at,
           verified, rating, jobs_count, bio
    FROM users WHERE email = ${String(email).toLowerCase()}
  `;
  if (!user) return res.status(401).json({ error: 'Nesprávný e-mail nebo heslo.' });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Nesprávný e-mail nebo heslo.' });

  const token = await signToken({ sub: String(user.id), role: user.role });
  setSessionCookie(res, token);

  const { password_hash, ...safe } = user;
  return res.status(200).json({ user: safe });
}

// ─── register ───────────────────────────────────────────────────────────────
async function doRegister(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (rateLimit(req, res, { key: 'register', limit: 3, windowMs: 10 * 60 * 1000 })) return;

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
}

// ─── logout ─────────────────────────────────────────────────────────────────
async function doLogout(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
}

// ─── me ─────────────────────────────────────────────────────────────────────
async function doMe(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const user = await getCurrentUser(req);
  return res.status(200).json({ user: user || null });
}

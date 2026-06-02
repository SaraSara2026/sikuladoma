// Sloučený auth endpoint pro Vercel Hobby limit 12 funkcí.
// URL routing zůstává stejný — Vercel mapuje /api/auth/<X> na tento soubor
// s req.query.action = X.

import { randomBytes } from 'node:crypto';
import { sql } from '../_db.js';
import {
  hashPassword, verifyPassword, signToken,
  setSessionCookie, clearSessionCookie, getCurrentUser,
} from '../_auth.js';
import { rateLimit } from '../_rate-limit.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../_email.js';

const ALLOWED_ROLES = new Set(['customer', 'sikula']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;    // 24 hodin
const RESET_TOKEN_TTL_MS  =      60 * 60 * 1000;    // 1 hodina

function genToken() {
  return randomBytes(32).toString('base64url');
}

function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (xf) return String(xf).split(',')[0].trim();
  return req.socket?.remoteAddress || null;
}

export default async function handler(req, res) {
  const action = req.query?.action;
  try {
    if (action === 'login')               return await doLogin(req, res);
    if (action === 'register')            return await doRegister(req, res);
    if (action === 'logout')              return await doLogout(req, res);
    if (action === 'me')                  return await doMe(req, res);
    if (action === 'verify-email')        return await doVerifyEmail(req, res);
    if (action === 'resend-verification') return await doResendVerification(req, res);
    if (action === 'forgot-password')     return await doForgotPassword(req, res);
    if (action === 'reset-password')      return await doResetPassword(req, res);
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
           verified, email_verified_at, rating, jobs_count, bio
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

  if (!email || !EMAIL_RE.test(email))         return res.status(400).json({ error: 'Neplatný e-mail.' });
  if (!password || password.length < 8)        return res.status(400).json({ error: 'Heslo musí mít alespoň 8 znaků.' });
  if (!name || name.trim().length < 2)         return res.status(400).json({ error: 'Zadejte jméno.' });
  if (!/^\S+\s+\S+/.test((name || '').trim())) return res.status(400).json({ error: 'Zadejte jméno i příjmení.' });
  if (!ALLOWED_ROLES.has(role))                return res.status(400).json({ error: 'Neplatná role.' });

  const [existing] = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
  if (existing) return res.status(409).json({ error: 'E-mail je již zaregistrován.' });

  const password_hash = await hashPassword(password);
  const [user] = await sql`
    INSERT INTO users (email, password_hash, role, name, phone, city)
    VALUES (${email.toLowerCase()}, ${password_hash}, ${role}, ${name.trim()}, ${phone || null}, ${city || null})
    RETURNING id, email, role, name, phone, city, avatar, plan, verified, email_verified_at, jobs_count
  `;

  // Vytvoř verifikační token + pošli email. Pokud Resend selže (např. chybí klíč
  // v dev prostředí), registrace nesmí spadnout — uživatel se přihlásí a vidí banner.
  try {
    const token = genToken();
    const expires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);
    await sql`
      INSERT INTO email_verifications (token, user_id, expires_at)
      VALUES (${token}, ${user.id}, ${expires.toISOString()})
    `;
    await sendVerificationEmail({ to: user.email, name: user.name, token });
  } catch (err) {
    console.error('[register] verification email failed:', err);
  }

  const sessionToken = await signToken({ sub: String(user.id), role: user.role });
  setSessionCookie(res, sessionToken);
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

// ─── verify-email ───────────────────────────────────────────────────────────
async function doVerifyEmail(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { token } = req.body ?? {};
  if (!token) return res.status(400).json({ error: 'Chybí ověřovací token.' });

  const [row] = await sql`
    SELECT v.user_id, v.expires_at, v.used_at, u.email_verified_at
    FROM email_verifications v
    JOIN users u ON u.id = v.user_id
    WHERE v.token = ${token}
  `;
  if (!row) return res.status(404).json({ error: 'Neplatný ověřovací odkaz.' });
  if (row.used_at) return res.status(410).json({ error: 'Odkaz byl již použit.' });
  if (new Date(row.expires_at) < new Date()) return res.status(410).json({ error: 'Odkaz vypršel. Nech si poslat nový.' });

  await sql`UPDATE email_verifications SET used_at = NOW() WHERE token = ${token}`;
  if (!row.email_verified_at) {
    await sql`UPDATE users SET email_verified_at = NOW(), updated_at = NOW() WHERE id = ${row.user_id}`;
  }
  return res.status(200).json({ ok: true });
}

// ─── resend-verification ────────────────────────────────────────────────────
async function doResendVerification(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (rateLimit(req, res, { key: 'resend-verification', limit: 3, windowMs: 10 * 60 * 1000 })) return;

  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Musíš být přihlášený.' });
  if (user.email_verified_at) return res.status(400).json({ error: 'E-mail je již ověřený.' });

  // Smaž stará nepoužitá tokeny pro tohoto uživatele
  await sql`DELETE FROM email_verifications WHERE user_id = ${user.id} AND used_at IS NULL`;

  const token = genToken();
  const expires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);
  await sql`
    INSERT INTO email_verifications (token, user_id, expires_at)
    VALUES (${token}, ${user.id}, ${expires.toISOString()})
  `;
  try {
    await sendVerificationEmail({ to: user.email, name: user.name, token });
  } catch (err) {
    console.error('[resend-verification] email failed:', err);
    return res.status(500).json({ error: 'Nepodařilo se odeslat e-mail.' });
  }
  return res.status(200).json({ ok: true });
}

// ─── forgot-password ────────────────────────────────────────────────────────
async function doForgotPassword(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (rateLimit(req, res, { key: 'forgot-password', limit: 5, windowMs: 15 * 60 * 1000 })) return;

  const { email } = req.body ?? {};
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Zadej platný e-mail.' });

  const [user] = await sql`
    SELECT id, email, name FROM users WHERE email = ${String(email).toLowerCase()}
  `;

  // Vždy vrať 200 (anti-enumeration), ale email pošli jen pokud user existuje.
  if (user) {
    try {
      await sql`DELETE FROM password_resets WHERE user_id = ${user.id} AND used_at IS NULL`;
      const token = genToken();
      const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await sql`
        INSERT INTO password_resets (token, user_id, expires_at, ip)
        VALUES (${token}, ${user.id}, ${expires.toISOString()}, ${getClientIp(req)})
      `;
      await sendPasswordResetEmail({ to: user.email, name: user.name, token });
    } catch (err) {
      console.error('[forgot-password] failed:', err);
    }
  }
  return res.status(200).json({ ok: true });
}

// ─── reset-password ─────────────────────────────────────────────────────────
async function doResetPassword(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (rateLimit(req, res, { key: 'reset-password', limit: 10, windowMs: 15 * 60 * 1000 })) return;

  const { token, password } = req.body ?? {};
  if (!token) return res.status(400).json({ error: 'Chybí reset token.' });
  if (!password || password.length < 8) return res.status(400).json({ error: 'Heslo musí mít alespoň 8 znaků.' });

  const [row] = await sql`
    SELECT user_id, expires_at, used_at FROM password_resets WHERE token = ${token}
  `;
  if (!row) return res.status(404).json({ error: 'Neplatný odkaz pro reset hesla.' });
  if (row.used_at) return res.status(410).json({ error: 'Odkaz byl již použit.' });
  if (new Date(row.expires_at) < new Date()) return res.status(410).json({ error: 'Odkaz vypršel. Vyžádej si nový.' });

  const password_hash = await hashPassword(password);
  await sql`UPDATE users SET password_hash = ${password_hash}, updated_at = NOW() WHERE id = ${row.user_id}`;
  await sql`UPDATE password_resets SET used_at = NOW() WHERE token = ${token}`;

  return res.status(200).json({ ok: true });
}

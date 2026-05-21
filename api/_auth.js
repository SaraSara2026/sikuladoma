// Sdílené auth utility pro API endpointy.
// - hash/verify hesel: bcryptjs (12 rounds = pomalý dost pro brute-force ochranu)
// - JWT: jose (edge-compatible, moderní)
// - cookie: httpOnly + Secure + SameSite=Strict
//
// JWT_SECRET musí být nastaven ve Vercel env vars (a v .env.local lokálně).
// Doporučená délka: alespoň 32 náhodných znaků (lze generovat: openssl rand -base64 32).

import { hash as bcryptHash, compare as bcryptCompare } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { sql } from './_db.js';

const COOKIE_NAME = 'sikuladoma_session';
const TOKEN_TTL = '7d';
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error('JWT_SECRET is not set or too short (need ≥32 chars). Set it in .env.local and Vercel env vars.');
  }
  return new TextEncoder().encode(s);
}

export async function hashPassword(plain) {
  return bcryptHash(plain, 12);
}

export async function verifyPassword(plain, hash) {
  return bcryptCompare(plain, hash);
}

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecret());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

// Cookie helpers ────────────────────────────────────────────────────────────
export function setSessionCookie(res, token) {
  const isProd = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.floor(TOKEN_TTL_MS / 1000)}`,
  ];
  if (isProd) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
}

export function readSessionCookie(req) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, v] = part.trim().split('=');
    if (k === COOKIE_NAME) return v;
  }
  return null;
}

// Vrátí uživatele z DB podle aktuální session, nebo null.
export async function getCurrentUser(req) {
  const token = readSessionCookie(req);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.sub) return null;
  const [user] = await sql`
    SELECT id, email, role, name, phone, city, avatar, ico, services, plan,
           verified, rating, jobs_count, bio
    FROM users WHERE id = ${Number(payload.sub)}
  `;
  return user || null;
}

// Vrátí uživatele a vyžaduje, aby existoval. Jinak pošle 401.
export async function requireUser(req, res) {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return user;
}

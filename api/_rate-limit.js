// In-memory rate limiter pro Vercel serverless funkce.
// Per IP klíč, sliding window. Funguje per-instance (každá funkce má
// vlastní paměť) — neideální při scale-out, ale efektivní proti brute force
// z jedné IP. Pro tvrdší ochranu nasadit Upstash Redis nebo Vercel KV.

const buckets = new Map();
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function clientIp(req) {
  // Vercel proxy hlavičky
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

function cleanup(now) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  for (const [k, v] of buckets) {
    if (v.resetAt < now) buckets.delete(k);
  }
  lastCleanup = now;
}

/**
 * Spotřebuje jeden token pro daný klíč. Vrátí { allowed, retryAfter } v sekundách.
 * @param {string} key            — typicky `${endpoint}:${ip}`
 * @param {number} limit          — max requests
 * @param {number} windowMs       — window v ms
 */
export function consume(key, limit, windowMs) {
  const now = Date.now();
  cleanup(now);

  let b = buckets.get(key);
  if (!b || b.resetAt < now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  b.count++;
  const allowed = b.count <= limit;
  const retryAfter = Math.max(0, Math.ceil((b.resetAt - now) / 1000));
  return { allowed, retryAfter, remaining: Math.max(0, limit - b.count) };
}

/**
 * Express-style middleware wrapper. Použij uvnitř handleru:
 *   const limited = await rateLimit(req, res, { key: 'login', limit: 5, windowMs: 5*60*1000 });
 *   if (limited) return;  // odpověď už byla poslána
 */
export function rateLimit(req, res, { key, limit, windowMs }) {
  const fullKey = `${key}:${clientIp(req)}`;
  const { allowed, retryAfter, remaining } = consume(fullKey, limit, windowMs);

  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.floor((Date.now() + retryAfter * 1000) / 1000)));

  if (!allowed) {
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ error: `Příliš mnoho pokusů. Zkuste to znovu za ${retryAfter} s.` });
    return true; // limited
  }
  return false;
}

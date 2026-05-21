// DOČASNÝ endpoint pro diagnostiku, jestli Vercel doopravdy předává env vars.
// Po vyřešení smazat. Nezobrazuje hodnoty, jen délky / přítomnost.

export default async function handler(req, res) {
  const e = process.env || {};
  return res.status(200).json({
    has_DATABASE_URL: !!e.DATABASE_URL,
    DATABASE_URL_len: e.DATABASE_URL ? e.DATABASE_URL.length : 0,
    has_JWT_SECRET:   !!e.JWT_SECRET,
    JWT_SECRET_len:   e.JWT_SECRET ? e.JWT_SECRET.length : 0,
    NODE_ENV:         e.NODE_ENV || null,
    VERCEL_ENV:       e.VERCEL_ENV || null,
    VERCEL_REGION:    e.VERCEL_REGION || null,
    runtime_node:     process.version || null,
    all_keys_starting_J: Object.keys(e).filter(k => k.startsWith('J')),
  });
}

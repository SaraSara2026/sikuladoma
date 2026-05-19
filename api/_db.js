import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Add it to .env.local (local) or Vercel project env vars (production).');
}

export const sql = neon(process.env.DATABASE_URL);

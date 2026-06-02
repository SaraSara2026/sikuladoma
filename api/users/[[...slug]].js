// Konsolidovaný users endpoint (Vercel Hobby 12-function limit):
//
//   GET /api/users              → veřejný katalog šikulů s filtry
//   GET /api/users/:id          → veřejný profil + recenze + souhrn
//
// Šikulové se řadí: plán priorita (top > profi > plus > start) + rating DESC + jobs DESC.
// Vrací jen safe pole — bez emailu, telefonu, IČO atd.

import { sql } from '../_db.js';

const PLAN_RANK = { top: 4, profi: 3, plus: 2, start: 1 };

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const slug = req.query?.slug;
    const id = Array.isArray(slug) && slug[0] ? Number(slug[0]) : null;

    if (id) return await getSingle(id, res);
    return await getList(req, res);
  } catch (err) {
    console.error('[/api/users]', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// ─── List šikulů s filtry ───────────────────────────────────────────────────
async function getList(req, res) {
  const { category, city, search } = req.query || {};

  const rows = await sql`
    SELECT id, name, avatar, city, plan, verified, rating, jobs_count, bio, services,
           email_verified_at IS NOT NULL AS email_verified
    FROM users
    WHERE role = 'sikula'
      AND (${category ?? null}::text IS NULL OR ${category ?? null} = ANY(services))
      AND (${city ?? null}::text IS NULL OR city ILIKE ${city ? `%${city}%` : null})
      AND (${search ?? null}::text IS NULL
           OR name ILIKE ${search ? `%${search}%` : null}
           OR bio  ILIKE ${search ? `%${search}%` : null})
    ORDER BY
      CASE plan
        WHEN 'top'   THEN 4
        WHEN 'profi' THEN 3
        WHEN 'plus'  THEN 2
        ELSE              1
      END DESC,
      COALESCE(rating, 0) DESC,
      jobs_count DESC,
      created_at DESC
    LIMIT 100
  `;

  return res.status(200).json({ sikulove: rows });
}

// ─── Single šikula + recenze + summary ──────────────────────────────────────
async function getSingle(id, res) {
  const [user] = await sql`
    SELECT id, name, role, avatar, city, plan, verified, rating, jobs_count, bio, services
    FROM users WHERE id = ${id} AND role = 'sikula'
  `;
  if (!user) return res.status(404).json({ error: 'Šikula nenalezen.' });

  const reviews = await sql`
    SELECT r.id, r.stars, r.recommend, r.comment, r.created_at,
           u.name AS reviewer_name, u.avatar AS reviewer_avatar
    FROM reviews r
    JOIN users u ON u.id = r.reviewer_id
    WHERE r.target_id = ${id}
    ORDER BY r.created_at DESC LIMIT 10
  `;
  const [summary] = await sql`
    SELECT COUNT(*)::int AS total,
           AVG(stars)::numeric(2,1) AS avg_stars,
           SUM(CASE WHEN recommend = TRUE THEN 1 ELSE 0 END)::int AS recommended
    FROM reviews WHERE target_id = ${id}
  `;

  return res.status(200).json({ user, reviews, summary });
}

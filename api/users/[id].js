// GET /api/users/:id — veřejný profil šikuly.
// Vrátí jen šikuly (ne customer/admin), bez citlivých polí (email, phone, ico, ...).
// Zobrazené pole: jméno, město, avatar, plan, verified, rating, jobs_count, bio, services.

import { sql } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const id = Number(req.query?.id);
    if (!id) return res.status(400).json({ error: 'Neplatné ID.' });

    const [user] = await sql`
      SELECT id, name, role, avatar, city, plan, verified, rating, jobs_count, bio, services
      FROM users WHERE id = ${id} AND role = 'sikula'
    `;
    if (!user) return res.status(404).json({ error: 'Šikula nenalezen.' });

    // Posledních 10 recenzí + souhrn
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
  } catch (err) {
    console.error('[/api/users/:id]', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

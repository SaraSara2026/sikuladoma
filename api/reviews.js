import { sql } from './_db.js';
import { requireUser, getCurrentUser } from './_auth.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') return createReview(req, res);
    if (req.method === 'GET')  return listReviews(req, res);
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[/api/reviews]', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/reviews
// body: { order_id, stars, ratings?, recommend, comment? }
// Pouze customer dokončené zakázky může hodnotit svého šikulu.
async function createReview(req, res) {
  const me = await requireUser(req, res);
  if (!me) return;

  const { order_id, stars, ratings, recommend, comment } = req.body ?? {};
  if (!order_id) return res.status(400).json({ error: 'Chybí order_id.' });
  const s = Number(stars);
  if (!Number.isInteger(s) || s < 1 || s > 5) return res.status(400).json({ error: 'Hvězdy 1–5.' });

  const [order] = await sql`
    SELECT o.id, o.status, o.customer_id, off.sikula_id AS accepted_sikula_id
    FROM orders o LEFT JOIN offers off ON off.id = o.accepted_offer_id
    WHERE o.id = ${Number(order_id)}
  `;
  if (!order) return res.status(404).json({ error: 'Poptávka neexistuje.' });
  if (order.status !== 'completed') return res.status(409).json({ error: 'Hodnotit lze jen dokončenou zakázku.' });
  if (order.customer_id !== me.id)  return res.status(403).json({ error: 'Hodnotit může jen zákazník zakázky.' });
  if (!order.accepted_sikula_id)    return res.status(409).json({ error: 'Zakázka nemá akceptovaného šikulu.' });

  try {
    const [row] = await sql`
      INSERT INTO reviews (order_id, reviewer_id, target_id, stars, ratings, recommend, comment)
      VALUES (${order.id}, ${me.id}, ${order.accepted_sikula_id}, ${s},
              ${ratings ? JSON.stringify(ratings) : null}, ${recommend ?? null}, ${comment || null})
      RETURNING *
    `;
    // Přepočítat průměrné hodnocení šikuly v users.rating
    const [agg] = await sql`
      SELECT AVG(stars)::numeric(2,1) AS avg_stars
      FROM reviews WHERE target_id = ${order.accepted_sikula_id}
    `;
    await sql`UPDATE users SET rating = ${agg.avg_stars}, updated_at = NOW() WHERE id = ${order.accepted_sikula_id}`;
    return res.status(201).json({ review: row });
  } catch (err) {
    if (String(err.message).includes('duplicate')) {
      return res.status(409).json({ error: 'Tuto zakázku už jste ohodnotili.' });
    }
    throw err;
  }
}

// GET /api/reviews?target_id= → veřejný profil šikuly
// GET /api/reviews?order_id=  → vlastní zakázka (přihlášený)
async function listReviews(req, res) {
  const targetId = req.query?.target_id ? Number(req.query.target_id) : null;
  const orderId  = req.query?.order_id  ? Number(req.query.order_id)  : null;

  if (targetId) {
    const rows = await sql`
      SELECT r.id, r.stars, r.recommend, r.comment, r.created_at,
             u.name AS reviewer_name, u.avatar AS reviewer_avatar
      FROM reviews r
      JOIN users u ON u.id = r.reviewer_id
      WHERE r.target_id = ${targetId}
      ORDER BY r.created_at DESC LIMIT 50
    `;
    const [agg] = await sql`
      SELECT COUNT(*)::int AS total, AVG(stars)::numeric(2,1) AS avg_stars,
             SUM(CASE WHEN recommend = TRUE THEN 1 ELSE 0 END)::int AS recommended
      FROM reviews WHERE target_id = ${targetId}
    `;
    return res.status(200).json({ reviews: rows, summary: agg });
  }

  if (orderId) {
    const me = await getCurrentUser(req);
    if (!me) return res.status(401).json({ error: 'Unauthorized' });
    const rows = await sql`
      SELECT * FROM reviews
      WHERE order_id = ${orderId} AND (reviewer_id = ${me.id} OR target_id = ${me.id})
    `;
    return res.status(200).json({ reviews: rows });
  }

  return res.status(400).json({ error: 'Zadejte target_id nebo order_id.' });
}

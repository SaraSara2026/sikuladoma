import { sql } from '../_db.js';
import { requireUser } from '../_auth.js';

// PATCH /api/offers/:id
// body: { action: 'accept' | 'reject' | 'withdraw' }
// - accept:   pouze customer poptávky → nastaví status 'accepted', označí poptávku 'accepted'
// - reject:   pouze customer poptávky → status 'rejected'
// - withdraw: pouze sikula vlastník   → status 'withdrawn'
export default async function handler(req, res) {
  try {
    if (req.method !== 'PATCH') {
      res.setHeader('Allow', 'PATCH');
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const me = await requireUser(req, res);
    if (!me) return;

    const offerId = Number(req.query?.id);
    if (!offerId) return res.status(400).json({ error: 'Neplatné ID nabídky.' });

    const action = req.body?.action;
    if (!['accept', 'reject', 'withdraw'].includes(action)) {
      return res.status(400).json({ error: 'Neplatná akce.' });
    }

    const [offer] = await sql`
      SELECT o.*, ord.customer_id AS order_customer_id, ord.status AS order_status
      FROM offers o JOIN orders ord ON ord.id = o.order_id
      WHERE o.id = ${offerId}
    `;
    if (!offer) return res.status(404).json({ error: 'Nabídka neexistuje.' });

    if (action === 'withdraw') {
      if (me.id !== offer.sikula_id) return res.status(403).json({ error: 'Nabídku může stáhnout jen její autor.' });
      const [row] = await sql`UPDATE offers SET status = 'withdrawn' WHERE id = ${offerId} RETURNING *`;
      return res.status(200).json({ offer: row });
    }

    // accept / reject — jen customer dané poptávky
    if (me.id !== offer.order_customer_id) return res.status(403).json({ error: 'Forbidden' });
    if (offer.order_status === 'accepted' || offer.order_status === 'completed' || offer.order_status === 'cancelled') {
      return res.status(409).json({ error: 'Poptávka už je uzavřená.' });
    }

    if (action === 'reject') {
      const [row] = await sql`UPDATE offers SET status = 'rejected' WHERE id = ${offerId} RETURNING *`;
      return res.status(200).json({ offer: row });
    }

    // accept — všechny ostatní nabídky téhož order = rejected, poptávka = accepted
    await sql`UPDATE offers SET status = 'accepted' WHERE id = ${offerId}`;
    await sql`UPDATE offers SET status = 'rejected' WHERE order_id = ${offer.order_id} AND id != ${offerId} AND status = 'pending'`;
    await sql`
      UPDATE orders
      SET status = 'accepted', accepted_offer_id = ${offerId}, updated_at = NOW()
      WHERE id = ${offer.order_id}
    `;
    const [row] = await sql`SELECT * FROM offers WHERE id = ${offerId}`;
    return res.status(200).json({ offer: row });
  } catch (err) {
    console.error('[/api/offers/[id]]', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

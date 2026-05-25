// PATCH /api/orders/:id — action: 'complete' | 'cancel'

import { sql } from '../_db.js';
import { requireUser } from '../_auth.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'PATCH') {
      res.setHeader('Allow', 'PATCH');
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const me = await requireUser(req, res);
    if (!me) return;

    const orderId = Number(req.query?.id);
    if (!orderId) return res.status(400).json({ error: 'Neplatné ID poptávky.' });

    const action = req.body?.action;
    if (!['complete', 'cancel'].includes(action)) {
      return res.status(400).json({ error: 'Neplatná akce (povolené: complete, cancel).' });
    }

    const [order] = await sql`
      SELECT o.*, off.sikula_id AS accepted_sikula_id
      FROM orders o
      LEFT JOIN offers off ON off.id = o.accepted_offer_id
      WHERE o.id = ${orderId}
    `;
    if (!order) return res.status(404).json({ error: 'Poptávka neexistuje.' });
    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(409).json({ error: 'Poptávka už je uzavřená.' });
    }

    if (action === 'complete') {
      const canComplete =
        me.role === 'admin' ||
        me.id === order.customer_id ||
        (me.role === 'sikula' && me.id === order.accepted_sikula_id);
      if (!canComplete) return res.status(403).json({ error: 'Nemáte oprávnění uzavřít tuto poptávku.' });
      if (order.status !== 'accepted') {
        return res.status(409).json({ error: 'Dokončit lze jen poptávku ve stavu „accepted".' });
      }
      const [row] = await sql`
        UPDATE orders SET status = 'completed', updated_at = NOW()
        WHERE id = ${orderId}
        RETURNING *
      `;
      if (order.accepted_sikula_id) {
        await sql`
          UPDATE users SET jobs_count = COALESCE(jobs_count, 0) + 1, updated_at = NOW()
          WHERE id = ${order.accepted_sikula_id}
        `;
      }
      return res.status(200).json({ order: row });
    }

    if (action === 'cancel') {
      const canCancel = me.role === 'admin' || me.id === order.customer_id;
      if (!canCancel) return res.status(403).json({ error: 'Nemáte oprávnění zrušit tuto poptávku.' });
      if (order.status === 'accepted') {
        return res.status(409).json({ error: 'Akceptovanou poptávku nelze jen tak zrušit — kontaktujte podporu.' });
      }
      const [row] = await sql`
        UPDATE orders SET status = 'cancelled', updated_at = NOW()
        WHERE id = ${orderId}
        RETURNING *
      `;
      return res.status(200).json({ order: row });
    }
  } catch (err) {
    console.error('[/api/orders/[id]]', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

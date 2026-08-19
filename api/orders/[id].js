// GET /api/orders/:id — plný detail zakázky (maskovaný podle role/vztahu)
// PATCH /api/orders/:id — action: 'complete' | 'cancel'

import { sql } from '../_db.js';
import { requireUser } from '../_auth.js';
import { sendReviewRequestEmail } from '../_email.js';
import { isSikulaPlanActive } from '../_plan.js';
import { generalOrderArea } from '../_location.js';

function getAppUrl() {
  return process.env.APP_URL || 'https://sikuladoma.vercel.app';
}

async function getOrder(req, res) {
  const me = await requireUser(req, res);
  if (!me) return;

  const orderId = Number(req.query?.id);
  if (!orderId) return res.status(400).json({ error: 'Neplatné ID poptávky.' });

  const [order] = await sql`SELECT * FROM orders WHERE id = ${orderId}`;
  if (!order) return res.status(404).json({ error: 'Poptávka neexistuje.' });

  // Admin a vlastník poptávky (zákazník) vidí vždy vše — je to jejich zakázka.
  if (me.role === 'admin' || me.id === order.customer_id) {
    return res.status(200).json({ order });
  }

  if (me.role !== 'sikula') return res.status(403).json({ error: 'Forbidden' });
  if (!me.email_verified_at) {
    return res.status(403).json({ error: 'Nejdřív si ověř e-mail.', code: 'verify_required' });
  }
  if (!isSikulaPlanActive(me)) {
    return res.status(402).json({
      error: 'Pro zobrazení detailu poptávky si aktivujte tarif.',
      code: 'activate_required',
    });
  }

  // Přesná adresa a kontakt na zákazníka se šikulovi odemykají až u zakázky,
  // kde má přijatou nabídku — samotný aktivní tarif na to nestačí.
  const [accepted] = await sql`
    SELECT id FROM offers WHERE order_id = ${orderId} AND sikula_id = ${me.id} AND status = 'accepted'
  `;
  const fullAccess = !!accepted;

  const safeOrder = {
    ...order,
    city: fullAccess ? order.city : generalOrderArea(order),
    zip:  fullAccess ? order.zip  : null,
    customer_name:  fullAccess ? order.customer_name  : null,
    customer_email: fullAccess ? order.customer_email : null,
    customer_phone: fullAccess ? order.customer_phone : null,
  };
  return res.status(200).json({ order: safeOrder });
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return await getOrder(req, res);
    if (req.method !== 'PATCH') {
      res.setHeader('Allow', 'GET, PATCH');
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

      // Výzva zákazníkovi k ohodnocení šikuly — informační, selhání e-mailu
      // nesmí zrušit dokončení zakázky, jen se zaloguje.
      if (order.customer_email) {
        try {
          await sendReviewRequestEmail({
            to: order.customer_email,
            name: order.customer_name,
            orderTitle: order.title,
            url: `${getAppUrl()}/?page=dashboard&review=${orderId}`,
          });
        } catch (err) {
          console.error('[orders] review request email failed:', err);
        }
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

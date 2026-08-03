// /api/offers — GET (list) + POST (create)
// PATCH/:id je v api/offers/[id].js.

import { sql } from './_db.js';
import { requireUser, requireVerifiedUser } from './_auth.js';
import { sendNewOfferNotificationEmail } from './_email.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') return await createOffer(req, res);
    if (req.method === 'GET')  return await listOffers(req, res);
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[/api/offers]', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function createOffer(req, res) {
  const me = await requireVerifiedUser(req, res);
  if (!me) return;
  if (me.role !== 'sikula') return res.status(403).json({ error: 'Nabídku může poslat jen šikula.' });

  // Reakce na poptávku vyžaduje aktivní placený tarif — žádné reakce zdarma, žádné kredity.
  const hasActivePlan = me.subscription_status === 'active' && (me.plan === 'aktiv' || me.plan === 'aktiv-plus');
  if (!hasActivePlan) {
    return res.status(402).json({
      error: 'Pro reakci na poptávku a kontaktování zákazníka si aktivujte tarif Aktivní šikula od 199 Kč / měsíc. Neplatíte žádné kredity ani provizi ze zakázky.',
      code: 'activate_required',
    });
  }
  // Bez telefonu se zákazník se šikulou nemůže domluvit na detailech zakázky.
  if (!me.phone) {
    return res.status(403).json({
      error: 'Doplňte si telefon v profilu, než budete posílat nabídky.',
      code: 'phone_required',
    });
  }

  const { order_id, price, message, available_date, available_time } = req.body ?? {};
  if (!order_id)                              return res.status(400).json({ error: 'Chybí order_id.' });
  if (price == null || Number(price) <= 0)    return res.status(400).json({ error: 'Zadejte platnou cenu.' });

  const [order] = await sql`SELECT id, status, title, customer_email, customer_name FROM orders WHERE id = ${Number(order_id)}`;
  if (!order)                       return res.status(404).json({ error: 'Poptávka neexistuje.' });
  if (order.status === 'cancelled' || order.status === 'completed' || order.status === 'accepted') {
    return res.status(409).json({ error: 'Poptávka už není otevřená.' });
  }

  let row;
  try {
    [row] = await sql`
      INSERT INTO offers (order_id, sikula_id, price, message, available_date, available_time)
      VALUES (${Number(order_id)}, ${me.id}, ${Number(price)}, ${message || null},
              ${available_date || null}, ${available_time || null})
      RETURNING *
    `;
    await sql`UPDATE orders SET status = 'in_progress', updated_at = NOW() WHERE id = ${Number(order_id)} AND status = 'new'`;
  } catch (err) {
    if (String(err.message).includes('duplicate')) {
      return res.status(409).json({ error: 'Na tuto poptávku jste už nabídku poslal/a.' });
    }
    throw err;
  }

  // Informační e-mail zákazníkovi o nové nabídce — selhání e-mailu nesmí
  // zrušit uloženou nabídku, jen se zaloguje.
  if (order.customer_email) {
    try {
      await sendNewOfferNotificationEmail({
        to: order.customer_email,
        orderTitle: order.title,
        price: row.price,
        duration: row.available_time,
        date: row.available_date,
        message: row.message,
      });
    } catch (err) {
      console.error('[offers] new offer notification email failed:', err);
    }
  }

  return res.status(201).json({ offer: row });
}

async function listOffers(req, res) {
  const me = await requireUser(req, res);
  if (!me) return;

  const orderId = req.query?.order_id ? Number(req.query.order_id) : null;

  if (!orderId) {
    if (me.role !== 'sikula') return res.status(400).json({ error: 'Zadejte order_id.' });

    // ?accepted=1 → přijaté nabídky s daty zákazníka pro předvyplnění faktury
    if (req.query?.accepted === '1') {
      const rows = await sql`
        SELECT o.id, o.order_id, o.price, o.created_at,
               ord.title AS order_title, ord.city AS order_city,
               ord.customer_name, ord.customer_email, ord.customer_phone,
               ord.address AS order_address, ord.description AS order_description
        FROM offers o
        JOIN orders ord ON ord.id = o.order_id
        WHERE o.sikula_id = ${me.id} AND o.status = 'accepted'
        ORDER BY o.created_at DESC LIMIT 50
      `;
      return res.status(200).json({ offers: rows });
    }

    // customer_phone i přesná adresa (order_city) se pošlou jen u přijaté/
    // dokončené zakázky — před přijetím nabídky vidí šikula jen obecnou
    // lokalitu a žádný kontakt na zákazníka.
    const rows = await sql`
      SELECT o.*, ord.title AS order_title,
             CASE WHEN ord.status IN ('accepted', 'completed')
               THEN ord.city
               ELSE trim(reverse(split_part(reverse(ord.city), ',', 1)))
             END AS order_city,
             ord.customer_id AS customer_id, ord.customer_name AS customer_name,
             ord.status AS order_status,
             CASE WHEN ord.status IN ('accepted', 'completed') THEN ord.customer_phone ELSE NULL END AS customer_phone
      FROM offers o JOIN orders ord ON ord.id = o.order_id
      WHERE o.sikula_id = ${me.id}
      ORDER BY o.created_at DESC LIMIT 100
    `;
    return res.status(200).json({ offers: rows });
  }

  const [order] = await sql`SELECT id, customer_id FROM orders WHERE id = ${orderId}`;
  if (!order) return res.status(404).json({ error: 'Poptávka neexistuje.' });

  const canSee =
    me.role === 'admin' ||
    me.id === order.customer_id ||
    me.role === 'sikula';
  if (!canSee) return res.status(403).json({ error: 'Forbidden' });

  const rows = me.role === 'sikula'
    ? await sql`
        SELECT o.*, u.name AS sikula_name, u.avatar AS sikula_avatar
        FROM offers o JOIN users u ON u.id = o.sikula_id
        WHERE o.order_id = ${orderId} AND o.sikula_id = ${me.id}
      `
    : await sql`
        SELECT o.*, u.name AS sikula_name, u.avatar AS sikula_avatar,
               u.verified AS sikula_verified, u.rating AS sikula_rating,
               u.jobs_count AS sikula_jobs, u.plan AS sikula_plan
        FROM offers o JOIN users u ON u.id = o.sikula_id
        WHERE o.order_id = ${orderId}
        ORDER BY o.created_at ASC
      `;
  return res.status(200).json({ offers: rows });
}

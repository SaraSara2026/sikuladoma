// /api/offers — GET (list) + POST (create)
// PATCH/:id je v api/offers/[id].js.

import { sql } from './_db.js';
import { requireUser, requireVerifiedUser } from './_auth.js';
import { sendNewOfferNotificationEmail } from './_email.js';
import { isSikulaPlanActive } from './_plan.js';
import { rateLimit } from './_rate-limit.js';

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
  // Bez limitu by šlo hromadně zaplavit poptávky nabídkami — 30/10 min
  // pokryje i aktivního šikulu, co reaguje na víc poptávek najednou.
  if (rateLimit(req, res, { key: 'create-offer', limit: 30, windowMs: 10 * 60 * 1000 })) return;

  // Reakce na poptávku vyžaduje aktivní placený tarif — žádné reakce zdarma, žádné kredity.
  // Zrušený tarif zůstává funkční až do konce zaplaceného období (viz _plan.js).
  const hasActivePlan = isSikulaPlanActive(me);
  if (!hasActivePlan) {
    return res.status(402).json({
      error: 'Tarif Aktivní šikula za 199 Kč / měsíc odemyká odesílání nabídek. Neplatíte žádné kredity ani provizi ze zakázky.',
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
        orderId: order.id,
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
    // (fakturovač, "Vyplnit ze zakázky"). ord.address neexistuje — orders
    // nemá samostatný sloupec ulice, jen `city` (plný text vč. ulice, pokud
    // ji zákazník zadal) a strukturované zip/city_area — viz api/_location.js.
    if (req.query?.accepted === '1') {
      const rows = await sql`
        SELECT o.id, o.order_id, o.price, o.created_at,
               ord.title AS order_title,
               ord.city AS order_address, ord.city_area AS order_city, ord.zip AS order_psc,
               ord.customer_name, ord.customer_email, ord.customer_phone,
               ord.description AS order_description
        FROM offers o
        JOIN orders ord ON ord.id = o.order_id
        WHERE o.sikula_id = ${me.id} AND o.status = 'accepted'
        ORDER BY o.created_at DESC LIMIT 50
      `;
      return res.status(200).json({ offers: rows });
    }

    // Jméno, telefon zákazníka i přesná adresa (order_city) se pošlou jen
    // u přijaté/dokončené zakázky — před přijetím nabídky vidí šikula jen
    // obecnou lokalitu a žádný kontakt na zákazníka.
    const rows = await sql`
      SELECT o.*, ord.title AS order_title,
             CASE WHEN ord.status IN ('accepted', 'completed')
               THEN ord.city
               ELSE COALESCE(NULLIF(ord.city_area, ''), trim(reverse(split_part(reverse(ord.city), ',', 1))))
             END AS order_city,
             ord.customer_id AS customer_id,
             CASE WHEN ord.status IN ('accepted', 'completed') THEN ord.customer_name ELSE NULL END AS customer_name,
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
    // Telefon šikuly vidí zákazník až u přijaté nabídky — před přijetím
    // žádný přímý kontakt na šikulu. Tarif šikuly (u.plan) je interní údaj
    // platformy a zákazníkovi se nikdy neposílá.
    : await sql`
        SELECT o.*, u.name AS sikula_name, u.avatar AS sikula_avatar,
               u.verified AS sikula_verified, u.rating AS sikula_rating,
               u.jobs_count AS sikula_jobs,
               CASE WHEN o.status = 'accepted' THEN u.phone ELSE NULL END AS sikula_phone
        FROM offers o JOIN users u ON u.id = o.sikula_id
        WHERE o.order_id = ${orderId}
        ORDER BY o.created_at ASC
      `;
  return res.status(200).json({ offers: rows });
}

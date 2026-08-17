// Konsolidovaný users endpoint (Vercel Hobby 12-function limit):
//
//   GET   /api/users              → veřejný katalog šikulů s filtry
//   GET   /api/users/:id          → veřejný profil + recenze + souhrn
//   PATCH /api/users/me           → update vlastního profilu (vyžaduje auth)
//
// Šikulové se řadí: aktivní tarif před neaktivním, aktiv-plus před aktiv, pak rating DESC + jobs DESC.
// Vrací jen safe pole — bez emailu, telefonu, IČO atd.

import { sql } from '../_db.js';
import { requireUser } from '../_auth.js';

export default async function handler(req, res) {
  try {
    const slug = req.query?.slug;
    const seg = Array.isArray(slug) && slug[0] ? slug[0]
              : typeof slug === 'string' && slug ? slug
              : null;

    // Fallback: extract segment directly from URL path (Vercel sometimes omits slug for numeric IDs)
    const urlSeg = req.url?.split('?')[0].replace(/^\/api\/users\/?/, '').split('/')[0] || null;
    const effectiveSeg = seg || urlSeg || null;

    // PATCH /api/users/me
    if (req.method === 'PATCH' && effectiveSeg === 'me') return await updateMe(req, res);

    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET, PATCH');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const id = effectiveSeg && /^\d+$/.test(effectiveSeg) ? Number(effectiveSeg) : null;
    if (id) return await getSingle(id, res);
    return await getList(req, res);
  } catch (err) {
    console.error('[/api/users]', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// ─── PATCH /api/users/me ────────────────────────────────────────────────────
async function updateMe(req, res) {
  const me = await requireUser(req, res);
  if (!me) return;

  const b = req.body ?? {};
  const name = b.name != null ? String(b.name).trim() : null;
  const bio  = b.bio  != null ? String(b.bio).slice(0, 1000) : null;
  const ico  = b.ico  != null ? String(b.ico).trim() : null;
  const phone = b.phone != null ? String(b.phone).trim() : null;
  const city = b.city != null ? String(b.city).trim() : null;
  const hourly_rate = b.hourly_rate != null && b.hourly_rate !== ''
    ? Math.max(0, Math.min(99999, Number(b.hourly_rate) || 0)) : null;
  const services = Array.isArray(b.services) ? b.services.filter(s => typeof s === 'string').slice(0, 30) : null;
  const avatar = b.avatar != null ? String(b.avatar).slice(0, 500000) : null;  // base64 do ~500KB
  const platce_dph = b.platce_dph != null ? Boolean(b.platce_dph) : null;
  const worker_type = b.worker_type != null ? String(b.worker_type).trim() : null;
  const street       = b.street    != null ? String(b.street).trim()    : null;
  const zip          = b.zip       != null ? String(b.zip).trim()       : null;
  const city_area    = b.city_area != null ? String(b.city_area).trim() : null;

  // Validace jména pokud je posláno
  if (name !== null && name.length > 0 && !/^\S+\s+\S+/.test(name)) {
    return res.status(400).json({ error: 'Zadej jméno i příjmení.' });
  }

  const WORKER_TYPES = new Set(['zivnostnik_firma', 'prilezitostna_vypomoc']);
  if (worker_type !== null && !WORKER_TYPES.has(worker_type)) {
    return res.status(400).json({ error: 'Neplatný typ šikuly.' });
  }
  // Pokud je (nebo se tímto požadavkem stává) typ „Živnostník / firma", IČO
  // musí být vyplněné — buď právě teď, nebo už dřív na profilu.
  const effectiveWorkerType = worker_type ?? me.worker_type;
  if (effectiveWorkerType === 'zivnostnik_firma') {
    const effectiveIco = ico !== null ? ico : me.ico;
    if (!effectiveIco) {
      return res.status(400).json({ error: 'Zadejte IČO — je povinné pro typ Živnostník / firma.' });
    }
  }

  // Legacy `city` sloupec se veřejně už nepoužívá, ale drží ho dál pro
  // interní vyhledávání poptávek v okolí a admin přehled — při uložení
  // nové city_area ho jen udržujeme synchronizovaný, ne prázdný.
  const finalCity = city_area ?? city;

  const [row] = await sql`
    UPDATE users SET
      name         = COALESCE(${name},   name),
      bio          = COALESCE(${bio},    bio),
      ico          = COALESCE(${ico},    ico),
      phone        = COALESCE(${phone},  phone),
      city         = COALESCE(${finalCity}, city),
      hourly_rate  = COALESCE(${hourly_rate}, hourly_rate),
      services     = COALESCE(${services}, services),
      avatar       = COALESCE(${avatar}, avatar),
      platce_dph   = COALESCE(${platce_dph}, platce_dph),
      worker_type  = COALESCE(${worker_type}, worker_type),
      street       = COALESCE(${street}, street),
      zip          = COALESCE(${zip}, zip),
      city_area    = COALESCE(${city_area}, city_area),
      updated_at   = NOW()
    WHERE id = ${me.id}
    RETURNING id, email, role, name, phone, city, avatar, ico, services, plan,
              stripe_customer_id, stripe_subscription_id, plan_expires_at,
              verified, email_verified_at, rating, jobs_count, bio,
              hourly_rate, platce_dph, subscription_status, trial_ends_at,
              worker_type, street, zip, city_area
  `;
  return res.status(200).json({ user: row });
}

// ─── List šikulů s filtry ───────────────────────────────────────────────────
async function getList(req, res) {
  const { category, city, search, minRating } = req.query || {};
  const minR = minRating ? Math.max(0, Math.min(5, Number(minRating) || 0)) : null;

  // Řazení: aktivní tarif před neaktivním, aktiv-plus před aktiv (stejná
  // definice "aktivní" jako isSikulaPlanActive — active, nebo cancelled dokud
  // neuplyne zaplacené období), pak hodnocení a počet zakázek. Tarif samotný
  // se do odpovědi neposílá — zákazníkovi se veřejně nezobrazuje.
  // Ověření e-mailu je interní bezpečnostní pravidlo, ne veřejný údaj — proto
  // se ani nefiltruje, ani neprojektuje (viz "verified" = interní ruční
  // ověření šikuly, to jediné se veřejně zobrazuje jako "Ověřený šikula").
  const rows = await sql`
    SELECT id, name, avatar, city_area, verified, rating, jobs_count, bio, services, worker_type
    FROM users
    WHERE role = 'sikula'
      AND (${category ?? null}::text IS NULL OR ${category ?? null} = ANY(services))
      AND (${city ?? null}::text IS NULL OR city_area ILIKE ${city ? `%${city}%` : null})
      AND (${search ?? null}::text IS NULL
           OR name ILIKE ${search ? `%${search}%` : null}
           OR bio  ILIKE ${search ? `%${search}%` : null})
      AND (${minR}::numeric IS NULL OR COALESCE(rating, 0) >= ${minR})
    ORDER BY
      CASE
        WHEN plan = 'aktiv-plus' AND (subscription_status = 'active' OR (subscription_status = 'cancelled' AND plan_expires_at > NOW())) THEN 2
        WHEN plan = 'aktiv'      AND (subscription_status = 'active' OR (subscription_status = 'cancelled' AND plan_expires_at > NOW())) THEN 1
        ELSE 0
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
    SELECT id, name, role, avatar, city_area, verified, rating, jobs_count, bio, services, worker_type
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

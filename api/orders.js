// /api/orders — GET (list) + POST (create)
// PATCH/:id je v api/orders/[id].js (Vercel optional catch-all nematchuje base path).

import { sql } from './_db.js';
import { getCurrentUser, hashPassword, verifyPassword, signToken, setSessionCookie } from './_auth.js';
import { sendOrderConfirmationEmail, sendNewOrderNotificationEmail } from './_email.js';
import { expandCategories, CATEGORY_LABELS } from './_relatedCategories.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUS_NEW = 'new';
const VALID_GENDER = new Set(['jedno', 'zena', 'muz']);

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') return await createOrder(req, res);
    if (req.method === 'GET')  return await listOrders(req, res);
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[/api/orders]', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function createOrder(req, res) {
  const b = req.body ?? {};
  const title       = String(b.title || '').trim();
  const category    = String(b.category || '').trim();
  const description = b.description != null ? String(b.description) : (b.desc != null ? String(b.desc) : null);
  const city        = String(b.city || '').trim();
  const budget      = b.budget ? String(b.budget) : null;
  const floor       = b.floor ? String(b.floor) : null;
  const parking     = b.parking ? String(b.parking) : null;
  const note        = b.note ? String(b.note) : null;
  const subcategory = b.subcategory ? String(b.subcategory) : null;
  const urgent      = !!b.urgent;
  const preferred_date = b.preferred_date || b.date || null;
  const preferred_time = b.preferred_time || b.time || null;
  const gender         = VALID_GENDER.has(b.gender_preference || b.gender) ? (b.gender_preference || b.gender) : 'jedno';

  const me = await getCurrentUser(req);

  // Pozn.: Zadání poptávky NEVYŽADUJE ověřený e-mail (low friction vstup).
  // Verify check je až u akcí které spotřebovávají čas šikulovi:
  // odeslání nabídky (api/offers) a chat zprávy (api/messages).

  const customer_email_typed = String(b.customer_email || b.email || '').trim().toLowerCase();

  // Session se použije JEN pokud e-mail ve formuláři odpovídá přihlášenému účtu
  // (nebo formulář e-mail vůbec neposlal, a bereme tedy identitu ze session).
  // Jinak by se poptávka — a nově zadané heslo — mohly omylem přiřadit k cizí
  // nebo zapomenuté staré session. Při shodě e-mailu je to v pořádku i pro
  // šikulu, co si zadává vlastní poptávku pod stejným účtem.
  const useExistingSession = !!me && (!customer_email_typed || (me.email && me.email.toLowerCase() === customer_email_typed));

  const customer_name  = String((b.customer_name || b.name || (useExistingSession ? me?.name : '') || '')).trim();
  const customer_email = customer_email_typed || (useExistingSession ? String(me?.email || '').toLowerCase() : '');
  const customer_phone = b.customer_phone || b.phone || (useExistingSession ? me?.phone : null) || null;
  // Heslo se řeší jen když session nepoužíváme — přihlášený uživatel se stejným
  // e-mailem má účet a heslo už dávno hotové.
  const password = useExistingSession ? null : String(b.password || '');

  if (title.length < 3)                              return res.status(400).json({ error: 'Zadejte název poptávky (min. 3 znaky).' });
  if (!category)                                     return res.status(400).json({ error: 'Vyberte kategorii.' });
  if (city.length < 2)                               return res.status(400).json({ error: 'Zadejte město.' });
  if (!customer_name)                                return res.status(400).json({ error: 'Zadejte své jméno.' });
  if (!/^\S+\s+\S+/.test(customer_name))             return res.status(400).json({ error: 'Zadejte jméno i příjmení.' });
  if (!EMAIL_RE.test(customer_email))                return res.status(400).json({ error: 'Zadejte platný e-mail.' });
  if (!useExistingSession && (!password || password.length < 8)) return res.status(400).json({ error: 'Zadejte heslo (min. 8 znaků).' });

  // Anonymní / cizí poptávka: klient si zadal vlastní heslo rovnou ve formuláři —
  // žádný reset-link, žádné čekání na e-mail.
  // Pokud e-mail už v DB existuje, heslo jen OVĚŘÍME (nikdy nepřepisujeme cizí
  // password_hash) — sedí-li, přihlásíme; nesedí-li, poptávku přesto uložíme,
  // ale bez přihlášení (ochrana před převzetím cizího účtu).
  let customerId = useExistingSession ? me.id : null;
  const isAnonymous = !useExistingSession;
  let loggedIn = useExistingSession;
  let accountConflict = false;

  if (!customerId) {
    const [existing] = await sql`SELECT id, password_hash FROM users WHERE email = ${customer_email}`;
    if (existing) {
      customerId = existing.id;
      const matches = await verifyPassword(password, existing.password_hash);
      if (matches) {
        loggedIn = true;
      } else {
        accountConflict = true;
      }
    } else {
      const password_hash = await hashPassword(password);
      const [newUser] = await sql`
        INSERT INTO users (email, password_hash, role, name, phone, city)
        VALUES (${customer_email}, ${password_hash}, 'customer', ${customer_name}, ${customer_phone}, ${city})
        RETURNING id
      `;
      customerId = newUser.id;
      loggedIn = true;
    }
  }

  // Kdokoliv projde touto cestou (nový účet, ověřený existující účet, i šikula
  // zadávající poptávku pod vlastním e-mailem) dostane customer_profiles řádek —
  // aby nezaostávaly za nově vznikajícími účty. Nemění to routing ani chování,
  // jen udržuje profilové tabulky v aktuálním stavu.
  await sql`
    INSERT INTO customer_profiles (user_id) VALUES (${customerId})
    ON CONFLICT (user_id) DO NOTHING
  `;

  const [row] = await sql`
    INSERT INTO orders (
      customer_id, customer_name, customer_email, customer_phone,
      title, category, subcategory, description, city, floor, parking, budget,
      preferred_date, preferred_time, gender_preference, urgent, note, status
    ) VALUES (
      ${customerId}, ${customer_name}, ${customer_email}, ${customer_phone},
      ${title}, ${category}, ${subcategory}, ${description}, ${city}, ${floor}, ${parking}, ${budget},
      ${preferred_date}, ${preferred_time}, ${gender}, ${urgent}, ${note}, ${STATUS_NEW}
    )
    RETURNING *
  `;

  // Nově vytvořený nebo úspěšně ověřený anonymní zákazník → rovnou přihlásit
  // (session cookie i vrácený `user` objekt, ať si ho frontend uloží do stavu).
  let user = null;
  if (isAnonymous && loggedIn) {
    const token = await signToken({ sub: String(customerId), role: 'customer' });
    setSessionCookie(res, token);
    [user] = await sql`
      SELECT id, email, role, name, phone, city, avatar, ico, services, plan,
             stripe_customer_id, stripe_subscription_id, plan_expires_at,
             verified, email_verified_at, rating, jobs_count, bio,
             hourly_rate, platce_dph, subscription_status, trial_ends_at
      FROM users WHERE id = ${customerId}
    `;
  }

  const timingParts = [];
  if (urgent) timingParts.push('Urgentní');
  if (preferred_date) timingParts.push(preferred_date);
  if (preferred_time) timingParts.push(preferred_time);
  const timing = timingParts.length ? timingParts.join(', ') : 'Dle domluvy';

  // Informační potvrzení poptávky — čistě na vědomí, žádný token ani ověřovací
  // odkaz. Selhání e-mailu nesmí zrušit poptávku ani odhlásit zákazníka, jen
  // se zaloguje.
  try {
    await sendOrderConfirmationEmail({ to: customer_email, name: customer_name, orderTitle: title, city, timing });
  } catch (err) {
    console.error('[orders] order confirmation email failed:', err);
  }

  // Upozornění šikulům v oboru (a schválených příbuzných oborech) o nové
  // poptávce. Nikdy se neposílá zadavateli samotnému, každý šikula dostane
  // nejvýš jeden e-mail na tuto poptávku a selhání jednotlivého e-mailu
  // nezablokuje odeslání ostatním ani vznik poptávky.
  try {
    const relevant = expandCategories(category);
    const sikulaCandidates = await sql`
      SELECT id, email, services FROM users
      WHERE role = 'sikula' AND email IS NOT NULL
    `;
    const recipients = new Map();
    for (const u of sikulaCandidates) {
      if (u.id === customerId) continue;
      if (recipients.has(u.id)) continue;
      const services = Array.isArray(u.services) ? u.services : [];
      if (services.some(s => relevant.has(s))) recipients.set(u.id, u);
    }
    const categoryLabel = CATEGORY_LABELS[category] || category;
    await Promise.allSettled(
      Array.from(recipients.values()).map(u =>
        sendNewOrderNotificationEmail({ to: u.email, orderTitle: title, category: categoryLabel, city, timing })
          .catch(err => console.error('[orders] new-order notification failed for', u.email, err))
      )
    );
  } catch (err) {
    console.error('[orders] new-order notification batch failed:', err);
  }

  return res.status(201).json({ order: row, loggedIn, accountConflict, user });
}

async function listOrders(req, res) {
  const me = await getCurrentUser(req);
  if (!me) return res.status(401).json({ error: 'Unauthorized' });

  const { category, city, status, categories } = req.query || {};
  // 'categories' = obory šikuly (users.services). Rozšíříme o schválené příbuzné
  // kategorie (viz _relatedCategories.js), ať šikula nevidí jen přesně svůj obor,
  // ale i sousední generalistické/renovační/stěhovací kategorie.
  const categoriesArr = categories
    ? Array.from(expandCategories(String(categories).split(',').map(s => s.trim()).filter(Boolean)))
    : null;

  let rows;
  if (me.role === 'admin') {
    rows = await sql`
      SELECT * FROM orders
      WHERE (${status ?? null}::text IS NULL OR status = ${status ?? null})
        AND (${category ?? null}::text IS NULL OR category = ${category ?? null})
        AND (${city ?? null}::text IS NULL OR city ILIKE ${city ? `%${city}%` : null})
      ORDER BY created_at DESC LIMIT 200
    `;
  } else if (me.role === 'sikula') {
    rows = await sql`
      SELECT id, title, category, subcategory, description, city, budget, urgent,
             preferred_date, preferred_time, gender_preference, status, created_at
      FROM orders
      WHERE status IN ('new','in_progress')
        AND (${category ?? null}::text IS NULL OR category = ${category ?? null})
        AND (${city ?? null}::text IS NULL OR city ILIKE ${city ? `%${city}%` : null})
        AND (${categoriesArr}::text[] IS NULL OR category = ANY(${categoriesArr}))
      ORDER BY created_at DESC LIMIT 200
    `;
  } else {
    rows = await sql`
      SELECT * FROM orders WHERE customer_id = ${me.id}
      ORDER BY created_at DESC LIMIT 200
    `;
  }
  return res.status(200).json({ orders: rows });
}

# ŠikulaDoma — kontext pro Claude

Platforma propojující zákazníky se šikuly (ČR). React 19 + Vite + Vercel + Neon Postgres.
Provozovatel: Stavira s.r.o. · IČ: 29228379 · info@sikuladoma.cz

## Stack

- **Frontend:** React 19 + Vite 8, jazyk: čeština (texty v UI), asistent odpovídá česky
- **Stylování:** Inline + globální CSS v `src/index.css`. Tailwind je v `index.css` (`@tailwind base/components/utilities`) a používá se v `components/Pricing.jsx`. Tailwind v3 (NE v4 syntax).
- **Backend:** Vercel Functions (`/api/*.js`) — ESM, default export `handler(req, res)`
- **Databáze:** Neon Postgres (HTTP driver `@neondatabase/serverless`)
- **PDF:** html2canvas + jsPDF
- **Deploy:** Vercel → `https://sikuladoma.vercel.app`
- **Repo:** `https://github.com/SaraSara2026/sikuladoma`

## Databáze

- Schéma: `db/schema.sql` — tabulky: `users`, `orders`, `offers`, `conversations`, `messages`, `invoices`, `contact_messages`
- Migrace: `npm run db:migrate` (spouští `scripts/migrate.js`)
- Seed: `npm run db:seed` (vloží 3 demo faktury)
- Connection string: `.env.local` → `DATABASE_URL=...` (gitignored). Vercel má stejnou env proměnnou v Settings → Environment Variables.

## Lokální vývoj

- `npm run dev` — jen Vite, `/api/*` lokálně **nefunguje** (vrátí index.html)
- Pro lokální `/api`: `npm i -g vercel && vercel link && vercel dev`
- Build: `npm run build` (vyžaduje, aby `tailwindcss`, `autoprefixer`, `postcss` byly v devDependencies)

## API endpointy (aktuální)

**Auth (od 2026-05-21):**
- `POST /api/auth/register` — vytvoří uživatele, nastaví session cookie
- `POST /api/auth/login` — ověří heslo, nastaví session cookie
- `POST /api/auth/logout` — smaže cookie
- `GET  /api/auth/me` — vrátí přihlášeného uživatele (nebo `{user: null}`)

**Objednávky (od 2026-05-21):**
- `POST /api/orders` — vytvoří poptávku (anonymní i přihlášený)
- `GET  /api/orders` — list (filtrováno podle role: customer = vlastní, sikula = otevřené, admin = vše); query params `?category=`, `?city=`, `?status=`
- `POST /api/offers` — šikula posílá nabídku na poptávku
- `GET  /api/offers?order_id=` — nabídky na konkrétní poptávku (filtrované rolí)
- `GET  /api/offers` — šikula vidí všechny své nabídky
- `PATCH /api/offers/:id` — akce `accept` / `reject` (customer) / `withdraw` (sikula). Accept automaticky odmítne ostatní pending nabídky, uzavře poptávku a založí konverzaci customer ↔ sikula.

**Chat (od 2026-05-21):**
- `GET  /api/conversations` — mé konverzace + last message + unread count
- `POST /api/conversations` — založí (nebo vrátí existující) konverzaci mezi customer ↔ sikula
- `GET  /api/messages?conversation_id=` — zprávy + auto-mark-as-read
- `POST /api/messages` — odeslat zprávu (jen účastník, max 4000 znaků)

**Kontakt (od 2026-05-21):**
- `POST /api/contact` — uloží zprávu z kontaktního formuláře do `contact_messages`

**Faktury:**
- `GET /api/invoices` → seznam faktur (volá `InvoicePage.jsx`)
- `POST /api/invoices` → vytvoření faktury (zatím bez autentizace!)

## Auth architektura

- **Pouze e-mail + heslo.** Žádný magic-link, žádný OAuth, žádné e-maily ze strany platformy (rozhodnutí uživatelky 2026-05-21).
- `api/_auth.js` — sdílené utility (hash, JWT sign/verify, cookie helpers)
- `bcryptjs` (12 rounds) pro hesla — **named importy** (`{ hash, compare }`), default na Vercel serverless padá
- `jose` pro JWT (HS256, 7 dní TTL)
- Session cookie: `sikuladoma_session`, httpOnly, SameSite=Strict, Secure v produkci
- Klient: `src/contexts/AuthContext.jsx` (Provider + `useAuth` hook), `src/lib/auth.js` (fetch wrappery)
- `JWT_SECRET` env var je povinný (≥32 znaků) — vygenerovat `openssl rand -base64 48`
- Demo uživatelé v seed scriptu, heslo `demo1234` pro všechny
- Tabulka `magic_links` v DB existuje (idempotentní CREATE), ale není používaná — pro budoucí použití

## Známé pre-existing bugy

- ~~Rozbité importy z `src/data.js`~~ — **opraveno 2026-05-20**: doplněny exporty `CATEGORIES`, `REVIEWS`, `USERS`, `DEMO_MESSAGES`, `DEMO_OFFERS`, `ORDER_STATUS_MAP`, `DEMO_ORDERS`. Pozn.: `CATEGORIES` v `App.jsx` (s SVG `Icon` komponentou + `label`) je jiný tvar než v `data.js` (emoji + `name`) — zatím záměrně dva tvary pro různé use-cases.

## TODO před spuštěním projektu

- [ ] **Otočit Neon credentials** — connection string byl sdílen v chatu (heslo `npg_Lr9iAoxjJ3EO`). Postup: Neon Console → Roles → reset password pro `neondb_owner` → aktualizovat `.env.local` i Vercel env var
- [x] ~~Autentizace~~ — **hotovo 2026-05-21**: vlastní auth na `users` tabulce, viz výše
- [ ] Validace vstupů v `/api/*` (zatím jen základní required-check; auth endpointy validují)
- [ ] Rate limiting na veřejných endpointech (zvláště `/api/auth/login` proti brute-force)
- [x] ~~API endpointy pro orders + offers~~ — **hotovo 2026-05-21**
- [x] ~~API endpointy pro messages, contact~~ — **hotovo 2026-05-21**
- [x] ~~Napojit SikulaDashboard, CustomerDashboard, OrderDetailPage, ChatPage, KontaktPage na reálné API~~ — **hotovo 2026-05-21**
- [ ] Email verifikace + reset hesla

## Uživatelská preference

- Komunikace **česky** (uživatelka explicitně potvrdila 2026-05-20)
- Stručně, bez zbytečného vysvětlování, žargon vysvětlit jednou větou
- Bod po bodu — nikdy víc témat najednou
- Před destruktivními akcemi (push, deploy, drop) se ptát
- Strategická vize a master plán: `docs/VISION.md`

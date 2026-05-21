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

**Faktury:**
- `GET /api/invoices` → seznam faktur (volá `InvoicePage.jsx`)
- `POST /api/invoices` → vytvoření faktury (zatím bez autentizace!)

## Auth architektura

- `api/_auth.js` — sdílené utility (hash, JWT sign/verify, cookie helpers)
- `bcryptjs` (12 rounds) pro hesla, `jose` pro JWT (HS256, 7 dní TTL)
- Session cookie: `sikuladoma_session`, httpOnly, SameSite=Strict, Secure v produkci
- Klient: `src/contexts/AuthContext.jsx` (Provider + `useAuth` hook), `src/lib/auth.js` (fetch wrappery)
- `JWT_SECRET` env var je povinný (≥32 znaků) — vygenerovat `openssl rand -base64 48`
- Demo uživatelé v seed scriptu, heslo `demo1234` pro všechny

## Známé pre-existing bugy

- ~~Rozbité importy z `src/data.js`~~ — **opraveno 2026-05-20**: doplněny exporty `CATEGORIES`, `REVIEWS`, `USERS`, `DEMO_MESSAGES`, `DEMO_OFFERS`, `ORDER_STATUS_MAP`, `DEMO_ORDERS`. Pozn.: `CATEGORIES` v `App.jsx` (s SVG `Icon` komponentou + `label`) je jiný tvar než v `data.js` (emoji + `name`) — zatím záměrně dva tvary pro různé use-cases.

## TODO před spuštěním projektu

- [ ] **Otočit Neon credentials** — connection string byl sdílen v chatu (heslo `npg_Lr9iAoxjJ3EO`). Postup: Neon Console → Roles → reset password pro `neondb_owner` → aktualizovat `.env.local` i Vercel env var
- [x] ~~Autentizace~~ — **hotovo 2026-05-21**: vlastní auth na `users` tabulce, viz výše
- [ ] Validace vstupů v `/api/*` (zatím jen základní required-check; auth endpointy validují)
- [ ] Rate limiting na veřejných endpointech (zvláště `/api/auth/login` proti brute-force)
- [ ] Doplnit API endpointy pro orders, offers, messages, contact (vzor: `api/invoices.js`)
- [ ] Email verifikace + reset hesla

## Uživatelská preference

- Komunikace **česky** (uživatelka explicitně potvrdila 2026-05-20)
- Stručně, bez zbytečného vysvětlování, žargon vysvětlit jednou větou
- Bod po bodu — nikdy víc témat najednou
- Před destruktivními akcemi (push, deploy, drop) se ptát
- Strategická vize a master plán: `docs/VISION.md`

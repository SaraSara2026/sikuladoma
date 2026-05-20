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

- `GET /api/invoices` → seznam faktur (volá `InvoicePage.jsx`)
- `POST /api/invoices` → vytvoření faktury (zatím bez autentizace!)

## Známé pre-existing bugy

- ~~Rozbité importy z `src/data.js`~~ — **opraveno 2026-05-20**: doplněny exporty `CATEGORIES`, `REVIEWS`, `USERS`, `DEMO_MESSAGES`, `DEMO_OFFERS`, `ORDER_STATUS_MAP`, `DEMO_ORDERS`. Pozn.: `CATEGORIES` v `App.jsx` (s SVG `Icon` komponentou + `label`) je jiný tvar než v `data.js` (emoji + `name`) — zatím záměrně dva tvary pro různé use-cases.

## TODO před spuštěním projektu

- [ ] **Otočit Neon credentials** — connection string byl sdílen v chatu (heslo `npg_Lr9iAoxjJ3EO`). Postup: Neon Console → Roles → reset password pro `neondb_owner` → aktualizovat `.env.local` i Vercel env var
- [ ] Autentizace (žádná teď, všechny API endpointy jsou veřejné)
- [ ] Validace vstupů v `/api/*` (zatím jen základní required-check)
- [ ] Rate limiting na veřejných endpointech
- [ ] Doplnit API endpointy pro orders, offers, users, messages, contact (vzor: `api/invoices.js`)

## Uživatelská preference

- Komunikace **česky** (uživatelka explicitně potvrdila 2026-05-20)
- Stručně, bez zbytečného vysvětlování, žargon vysvětlit jednou větou
- Bod po bodu — nikdy víc témat najednou
- Před destruktivními akcemi (push, deploy, drop) se ptát
- Strategická vize a master plán: `docs/VISION.md`

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

## Struktura zdrojáků

```
src/
├── App.jsx                          # routing + homepage (~370 řádků)
├── main.jsx                         # entrypoint (AuthProvider wrapper)
├── data.js                          # demo data + INVOICE_STATUS_MAP, ORDER_STATUS_MAP
├── ui/                              # design system
│   ├── theme.js                     # T (tokeny), S (modal styly), inp/lbl/hint
│   ├── Button.jsx                   # BtnPrimary/Secondary/Ghost/Blue, IconBtn
│   └── icons/
│       ├── ServiceIcons.jsx         # 22 SVG ikon kategorií
│       └── UIIcons.jsx              # 15 inline UI glyfů
├── lib/                             # data konstanty + utility
│   ├── categories.js                # CATEGORIES (s Icon), SUBCATEGORIES, CAT_COLORS, SERVICES
│   ├── plans.js                     # PLANS (tarify)
│   ├── auth.js                      # apiLogin, apiRegister, apiLogout, apiMe
│   └── api.js                       # ordersApi, offersApi, conversationsApi, messagesApi, contactApi
├── contexts/AuthContext.jsx         # <AuthProvider> + useAuth()
├── modals/
│   ├── OrderForm.jsx                # 6krokový formulář poptávky
│   ├── RegForm.jsx                  # registrace šikuly
│   ├── LoginModal.jsx               # přihlášení
│   └── HodnoceniForm.jsx            # hodnocení šikuly
├── pages/                           # samostatné stránky (mountuje App.jsx přes page state)
│   ├── HomePage.jsx                 # alternativní homepage (nevyužitá v aktuálním routingu)
│   ├── NewOrderPage.jsx             # rozšířený formulář (napojený na /api/orders)
│   ├── OrderDetailPage.jsx
│   ├── SendOfferPage.jsx
│   ├── ChatPage.jsx
│   ├── InvoicePage.jsx
│   ├── KontaktPage.jsx
│   ├── ProSikulyPage.jsx
│   ├── Login/RegisterPage.jsx
│   ├── *Page.jsx (právní stránky)
│   └── dashboards/
│       ├── CustomerDashboard.jsx           # API-wired, použito v alternativním routingu
│       ├── SikulaDashboard.jsx             # API-wired (zatím nemountováno v App.jsx)
│       ├── SikulaDashboardLegacy.jsx       # ★ tento App.jsx renderuje pro page="dashboard"
│       └── AdminDashboard.jsx
└── components/                       # menší sdílené komponenty (Header, Footer, Layout…)
```

**Pozor:** existují dvě verze sikula dashboardu — Legacy (renderuje se teď) a nová API-wired. Při přechodu na novou se musí změnit import v `App.jsx`.

## Databáze

- Schéma: `db/schema.sql` — tabulky: `users`, `orders`, `offers`, `conversations`, `messages`, `invoices`, `contact_messages`, `reviews`, `magic_links`
- Migrace: `npm run db:migrate` (spouští `scripts/migrate.js`) — všechny `CREATE TABLE IF NOT EXISTS`, je bezpečné spouštět opakovaně
- Seed: `npm run db:seed` — 3 demo uživatelé (`jana@`, `pavel@`, `admin@` všichni s heslem `demo1234`) + 3 demo faktury
- Connection string: `.env.local` → `DATABASE_URL=...` (gitignored). Vercel má stejnou env proměnnou v Settings → Environment Variables.

**Klíčové constraints / chování:**
- `orders.status` enum: `new` → `in_progress` (přijde první nabídka) → `accepted` (customer přijal) → `completed` (sikula nebo customer dokončil)
- `offers` UNIQUE (order_id, sikula_id) — jeden šikula = jedna nabídka per poptávka
- `conversations` UNIQUE (customer_id, sikula_id, order_id) — auto-založí se při accept nabídky
- `reviews` UNIQUE (order_id, reviewer_id) — jen jedna recenze per zakázka
- Po accept: ostatní pending nabídky automaticky `rejected`, poptávka `accepted`, vytvoří se conversation
- Po complete: inkrement `users.jobs_count` u šikuly
- Po recenzi: přepočet `users.rating` jako AVG všech recenzí na šikulu

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

**Objednávky:**
- `POST /api/orders` — vytvoří poptávku (anonymní i přihlášený)
- `GET  /api/orders` — list (filtrováno podle role: customer = vlastní, sikula = otevřené, admin = vše); query params `?category=`, `?city=`, `?status=`
- `PATCH /api/orders/:id` — akce `complete` (sikula s akceptovanou nabídkou / customer / admin; inkrementuje `users.jobs_count`) nebo `cancel` (customer / admin)
- `POST /api/offers` — šikula posílá nabídku na poptávku
- `GET  /api/offers?order_id=` — nabídky na konkrétní poptávku (filtrované rolí)
- `GET  /api/offers` — šikula vidí všechny své nabídky
- `PATCH /api/offers/:id` — akce `accept` / `reject` (customer) / `withdraw` (sikula). Accept automaticky odmítne ostatní pending nabídky, uzavře poptávku a založí konverzaci customer ↔ sikula.

**Chat:**
- `GET  /api/conversations` — mé konverzace + last message + unread count
- `POST /api/conversations` — založí (nebo vrátí existující) konverzaci mezi customer ↔ sikula
- `GET  /api/messages?conversation_id=` — zprávy + auto-mark-as-read
- `POST /api/messages` — odeslat zprávu (jen účastník, max 4000 znaků)

**Reviews:**
- `POST /api/reviews` — pouze customer dokončené zakázky může hodnotit svého šikulu; auto-přepočte `users.rating` jako AVG všech jeho reviews; UNIQUE (order_id, reviewer_id) = jedna recenze per zakázka
- `GET  /api/reviews?target_id=` — veřejný seznam recenzí + summary (total, avg_stars, recommended count)
- `GET  /api/reviews?order_id=` — vlastní recenze (auth required)

**Kontakt:**
- `POST /api/contact` — uloží zprávu z kontaktního formuláře do `contact_messages`

**Faktury:**
- `GET /api/invoices` → seznam faktur (volá `InvoicePage.jsx`)
- `POST /api/invoices` → vytvoření faktury (zatím bez autentizace!)

## SEO

- `index.html` — title, description, keywords, canonical, OG (FB/LinkedIn), Twitter Cards, Schema.org JSON-LD (LocalBusiness + WebSite + SearchAction)
- `public/robots.txt` — povolí indexaci, blokuje `/api/`, odkazuje na sitemap
- `public/sitemap.xml` — 7 veřejných stránek
- TODO: vyrobit `public/og-image.png` (1200×630) a `public/logo.png`
- **Limit:** projekt je SPA — Google bot to dnes umí, ale meta tagy per-route by chtěly `react-helmet` nebo SSR (zatím out of scope)

## Rate limiting

`api/_rate-limit.js` — in-memory sliding window per IP, posílá X-RateLimit-* a Retry-After hlavičky. Per-instance (Vercel scale-out neideální, pro tvrdší ochranu → Upstash Redis).

Aplikováno:
- `POST /api/auth/login` — 5 pokusů / 5 min (anti-brute-force)
- `POST /api/auth/register` — 3 registrace / 10 min (anti-spam)
- `POST /api/contact` — 5 zpráv / 10 min (anti-spam)

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

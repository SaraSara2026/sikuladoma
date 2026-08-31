# ŠikulaDoma — kontext pro Claude

Platforma propojující zákazníky se šikuly (ČR). React 19 + Vite + Vercel + Neon Postgres.
Provozovatel: Stavira s.r.o. · IČ: 29228379 · info@sikuladoma.cz

**Tento soubor odpovídá stavu na `main` k 31. 8. 2026 (poslední commit `74c2dfd`, 27. 8. 2026).**

## Stack

- **Frontend:** React 19 + Vite 8, jazyk: čeština (texty v UI), asistent odpovídá česky
- **Stylování:** Inline + globální CSS v `src/index.css`. Tailwind v3 (NE v4 syntax) přes `@tailwind base/components/utilities`.
- **Backend:** Vercel Functions (`/api/*.js`) — ESM, default export `handler(req, res)`
- **Databáze:** Neon Postgres (HTTP driver `@neondatabase/serverless`)
- **E-maily:** Resend (npm balíček `resend`) — viz sekce [E-maily](#e-maily)
- **Platby:** Stripe — **žádný npm balíček `stripe`** (i když je v `package.json`, nepoužívá se), vlastní `fetch` na Stripe REST API v `api/stripe.js` (důvod: npm balíček dřív padal na Vercelu s `FUNCTION_INVOCATION_FAILED`)
- **PDF:** `api/_invoice-pdf.js` (server-side, faktury), `html2canvas` + `jspdf` (klient)
- **Deploy:** Vercel → `https://sikuladoma.vercel.app`, Node.js 24.x (`engines` v `package.json`, musí sedět s Vercel Project Settings)
- **Repo:** `https://github.com/SaraSara2026/sikuladoma`
- **Lokální cesta:** `/Users/mac/Desktop/Šikula web/sikuladoma` (pozor, ve `Šikula web/` existuje víc necommitnutých kopií/zipů — tohle je jediné skutečné git repo)

## Struktura zdrojáků

```
src/
├── App.jsx                          # routing + homepage, role-based dashboard switch
├── main.jsx                         # entrypoint (AuthProvider wrapper)
├── data.js                          # demo data + INVOICE_STATUS_MAP, ORDER_STATUS_MAP
├── ui/                              # design system (theme, Button, ikony)
├── lib/
│   ├── categories.js                # CATEGORIES, SUBCATEGORIES, CAT_COLORS, SERVICES
│   ├── plan.js                      # isSikulaPlanActive() — zrcadlí api/_plan.js
│   ├── format.js, phone.js          # formátovací utility (CZ telefon apod.)
│   ├── auth.js                      # apiLogin, apiRegister, apiLogout, apiMe
│   └── api.js                       # ordersApi, offersApi, conversationsApi, messagesApi, contactApi, stripeApi, reviewsApi
├── contexts/AuthContext.jsx         # <AuthProvider> + useAuth()
├── modals/                          # OrderForm (6 kroků), RegForm, LoginModal, HodnoceniForm
├── components/                      # Header, Footer, Layout, PageMeta (per-route SEO),
│                                     # VerificationBanner, LinkAccountMismatch, PasswordField, AvatarUpload, Toast, CookieBanner
└── pages/
    ├── dashboards/                  # SikulaDashboard, CustomerDashboard, AdminDashboard (žádný "Legacy" už neexistuje)
    ├── NewOrderPage, OrderDetailPage, OrderConfirmPage, SendOfferPage, ChatPage
    ├── InvoicePage, KontaktPage
    ├── ProSikulyPage, PodporaProSikulyPage, PodminkyProSikulyPage
    ├── RegisterPage, ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage
    ├── SikuloveListPage, SikulaProfilePage                 # veřejný seznam/profil šikuly
    ├── FAQPage, *Page.jsx (právní stránky), NotFoundPage
```

Dashboard se vybírá výhradně podle role (`admin` → AdminDashboard, `customer` → CustomerDashboard, `sikula` → SikulaDashboard) — žádný fallback.

## Databáze

- Schéma: `db/schema.sql` — `CREATE TABLE IF NOT EXISTS` + řada `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (idempotentní, bezpečné spouštět opakovaně)
- Tabulky: `users`, `orders`, `offers`, `conversations`, `messages`, `invoices`, `contact_messages`, `reviews`, `magic_links` (nevyužitá), `email_verifications`, `password_resets`
- Migrace: `npm run db:migrate` (`scripts/migrate.js`)
- Seed: `npm run db:seed` — demo uživatelé (`jana@`, `pavel@`, `admin@`, heslo `demo1234`)
- Connection string: `.env.local` → `DATABASE_URL=...` (gitignored), stejná proměnná ve Vercel env vars

**⚠️ Známá nesrovnalost v `db/schema.sql`:** řádek 19 (`CHECK (plan IN ('start','plus','profi','top'))`) je zastaralý — kód (`api/stripe.js`, `api/_plan.js`) dávno pracuje s hodnotami `'aktiv'` / `'aktiv-plus'` a sloupcem `subscription_status` (`'active'|'cancelled'|'payment_failed'|'inactive'`, přidán ALTERem na řádku 225). V produkci to zjevně funguje (platby 199/299 Kč reálně aktivují účty), takže omezení buď bylo na živé Neon DB ručně odstraněno/změněno mimo git, nebo Postgres CHECK constraint z nějakého důvodu neplatí. **Nekontrolováno přímo v DB — než se do `plan`/`subscription_status` logiky znovu sahá, ověřit skutečný stav constraintu na Neonu.**

**Klíčové chování:**
- `orders.status`: `new` → `in_progress` (první nabídka) → `accepted` (customer přijal) → `completed`
- `offers` UNIQUE (order_id, sikula_id); po accept ostatní pending nabídky → `rejected`, založí se `conversations` řádek
- `reviews` UNIQUE (order_id, reviewer_id); po recenzi přepočet `users.rating` jako AVG
- Po complete: inkrement `users.jobs_count`
- Tarif šikuly (`isSikulaPlanActive`, `src/lib/plan.js` + `api/_plan.js`): aktivní pokud `plan` je `aktiv`/`aktiv-plus` **a** (`subscription_status='active'` NEBO `subscription_status='cancelled'` a `plan_expires_at` je v budoucnu — zrušeno, ale doplaceno období běží dál)

## Lokální vývoj

- `npm run dev` — jen Vite, `/api/*` lokálně nefunguje
- Pro lokální `/api`: `vercel link && vercel dev`
- Build: `npm run build`
- Testy: `npm test` (`scripts/test-e2e.js` proti produkci), `npm run test:local` proti localhost

## API endpointy (12/12 — Vercel Hobby limit, konsolidováno přes `[action]`/`[[...slug]]`)

**Auth** (`api/auth/[action].js`, login/register mají rate-limit):
- `POST /api/auth/register`, `login`, `logout`, `GET me`
- `POST check-email` — kontrola duplicity e-mailu v kroku 1 registrace
- `POST verify-email`, `resend-verification` — e-mailová verifikace (Resend)
- `POST forgot-password`, `reset-password` — reset hesla přes e-mail

**Objednávky / nabídky:**
- `POST/GET /api/orders`, `GET/PATCH /api/orders/:id` (`complete`/`cancel`)
- `POST/GET /api/offers`, `PATCH /api/offers/:id` (`accept`/`reject`/`withdraw`) — **odeslání nabídky vyžaduje ověřený e-mail** (`requireVerifiedUser`) a aktivní tarif

**Chat:** `GET/POST /api/conversations`, `GET/POST /api/messages`

**Reviews:** `POST/GET /api/reviews`

**Faktury** (`api/invoices.js`, `requireVerifiedUser`, **auth je teď vyžadovaná** — starý TODO "bez autentizace" je vyřešený):
- `GET/POST/PATCH/DELETE /api/invoices`, `POST ?action=send` — PDF příloha generovaná server-side (`_invoice-pdf.js`), odeslání e-mailem zákazníkovi

**Platby** (`api/stripe.js`, čisté `fetch`, ne npm balíček):
- `POST ?action=checkout` — Stripe Checkout (subscription, měsíční/roční)
- `GET ?action=portal` — Customer Portal (správa/zrušení)
- `POST ?action=webhook` — HMAC-SHA256 verifikace přes `node:crypto`

**Admin** (`api/admin/[action].js`): `stats`, `users`, `orders`, `contacts`, `verify-sikula`; veřejná akce `contact` (kontaktní formulář, rate-limit)

**Veřejné** (`api/users/[[...slug]].js`): seznam/profil šikulů (`?category=`, `?city=`, `?search=`, `?minRating=`) pro `SikuloveListPage`/`SikulaProfilePage`

## Ceny / tarify (aktuální model, nahradil starý start/plus/profi/top 999 Kč)

- **Registrace zdarma** — šikula i zákazník. Šikula vidí poptávky ve svém okolí hned po registraci.
- **Aktivní šikula — 199 Kč/měsíc** (2 240 Kč/rok) — odemyká odesílání nabídek/reakce na poptávky, bez omezení počtu
- **Aktivní šikula Plus — 299 Kč/měsíc** (3 300 Kč/rok) — navíc fakturovač (PDF faktury)
- Plán `'top'` (99 Kč zvýraznění profilu) a `'profi'` jsou od 2026-08 v kódu **vypnuté** (viz komentář v `api/stripe.js`)
- Zdroj pravdy pro ceny/plan mapping: `api/stripe.js` (`PLAN_PRICES`, `PLAN_ENV_VARS`)

## E-maily

Resend (`api/_email.js`), posílá: verifikaci e-mailu, reset hesla, potvrzení poptávky, notifikaci o nové poptávce/nabídce/zprávě, výzvu k hodnocení, fakturu, zrušení tarifu.

**🔴 BLOKUJE PRODUKCI:** Resend účet nemá ověřenou doménu → posílá se ze sandbox `onboarding@resend.dev`, který **nedoručí nic nikomu kromě `sara.ulahel@gmail.com`** (potvrzeno diagnostickým testem 2026-08-20, `403 validation_error`). Musí se ověřit doména v Resend dashboardu (DNS) a nastavit `RESEND_FROM` ve Vercel env vars — čistě operační krok mimo repo, kód (fallback na `onboarding@resend.dev`) na to už čeká.

**Pozor na rozpor se starším rozhodnutím:** V minulosti bylo rozhodnuto "žádné e-maily ze strany platformy, jen heslo" (2026-05-21). To se mezitím **změnilo** — appka teď e-maily aktivně používá pro verifikaci/notifikace/reset hesla. Auth zůstává password-based (žádný magic-link/OAuth), ale platforma odesílá transakční e-maily.

## SEO

- Per-route title/description/OG/Twitter řeší **klientsky** `src/components/PageMeta.jsx` (updatuje `document.head` přes `useEffect`) — starý limit "SPA bez per-route meta, chce SSR" **už neplatí**
- `index.html` — defaultní meta + Schema.org JSON-LD (LocalBusiness + WebSite + SearchAction)
- `public/robots.txt`, `public/sitemap.xml`, `public/og-image.png`, `public/logo.png` — hotové

## Rate limiting

`api/_rate-limit.js` — in-memory sliding window per IP (per-instance, pro tvrdší ochranu by chtělo Upstash Redis).

Aplikováno na: `POST /api/auth/login` (5/5min), `POST /api/auth/register` (3/10min), `POST /api/admin?action=contact` (5/10min).

## Auth architektura

- **E-mail + heslo**, žádný magic-link, žádné OAuth (toto rozhodnutí platí dál)
- Nově: **e-mailová verifikace** (Resend) — šikula musí mít ověřený e-mail, aby mohl posílat nabídky nebo vidět faktury (`requireVerifiedUser`); zákazník verifikaci **nemusí** mít (odstraněno, nahrazeno informativním potvrzovacím e-mailem)
- `api/_auth.js` — hash/verify (bcryptjs, 12 rounds, named importy), JWT (jose, HS256, 7 dní), cookie helpery, `requireUser`/`requireVerifiedUser`
- Session cookie: `sikuladoma_session`, httpOnly, SameSite=Strict, Secure v produkci
- `JWT_SECRET` env var povinný (≥32 znaků)
- E-mailové odkazy (verifikace, reset hesla) vždy vyžadují čerstvé přihlášení a nesmí otevřít dashboard/chat jiného přihlášeného účtu (bezpečnostní fix, commity `8a7d0fd`, `30bd1b9`)
- Tabulka `magic_links` v DB existuje, nepoužitá

## Blokátory před spuštěním (live stav)

1. **🔴 Resend doména neověřená** — viz [E-maily](#e-maily). Nejkritičtější, protože appka teď na e-mailech reálně závisí.
2. **Neon DB heslo** — sdílené dřív v chatu, rotace vědomě odložena na těsně před launch.
3. **Stripe klíče jsou testovací** (`sk_test_...`) — před launchem přepnout na live klíče a live price ID.
4. **`db/schema.sql` řádek 19** — CHECK constraint na `plan` neodpovídá kódu, ověřit skutečný stav na Neonu (viz sekce Databáze).
5. Mobilní responzivita — stav nekontrolován v této revizi, dřív označeno jako needs work.

## Uživatelská preference

- Komunikace **česky**, stručně, bod po bodu, žargon vysvětlit jednou větou
- Před destruktivními akcemi (push, deploy, drop) se ptát
- Strategická vize a master plán: `docs/VISION.md`

# ŠikulaDoma — Strategická vize & Master plán

> Strategický dokument: kam projekt směřuje, jaké jsou možnosti a kompletní obraz.
> Operační info pro Claude (stack, příkazy, bugy) najdeš v `/CLAUDE.md`.
> Pracujeme **bod po bodu** — uživatelka si nepřeje řešit všechno najednou.

---

## 1) Interpretace značky — 3 možné směry byznysu

- **A) Marketplace „handyman / domácí služby"** — zákazník zadá problém, platforma najde řemeslníka.
- **B) DIY / kutilský obsahový portál** — návody, tipy, eshop s nářadím, komunita.
- **C) Hybrid** *(doporučeno)* — obsah + služby + eshop. SEO traffic z obsahu → konverze na placené služby.

**👉 Rozhodnutí:** *(zatím neurčeno)*

---

## 2) Byznys vrstva

### Revenue streams (kombinovat min. 3)
| Stream | Mechanika | Marže |
|---|---|---|
| Provize z objednávek | 10–20 % z ceny zakázky | Vysoká, škáluje |
| Lead fee | Řemeslník platí 30–100 Kč za kontakt | Stabilní cashflow |
| Premium pro řemeslníky | 299–999 Kč/měs (priorita, badge, statistiky) | Predikovatelný MRR |
| Affiliate (Hornbach, Mall, Alza) | 3–8 % z prodeje nářadí přes návody | Pasivní |
| Reklama na obsahových stránkách | AdSense / direct | Při >20k MAU |

### KPI od dne 1
CAC, LTV, take rate, repeat-rate, NPS, čas od poptávky do přiřazení řemeslníka, % dokončených zakázek, průměrná recenze.

### Go-to-market
1. Lokálně — jedno město (Praha / Brno) → density řemeslníků.
2. SEO obsah na bottom-funnel dotazy („kolik stojí malíř pokoje 30 m²").
3. Acquisition řemeslníků offline + FB skupiny.

### Právo & účetnictví
GDPR, podmínky služby, reklamační řád, e-fakturace od 2026, ochrana spotřebitele, smluvní vztah customer ↔ provider (platforma jen zprostředkovává — důležité pro ručení). Provozovatel: **Stavira s.r.o.**, IČ 29228379.

---

## 3) UX / UI

### Persony
1. **Zákazník (Eva, 38)** — rychle, mobilně, večer z gauče.
2. **Řemeslník (Pavel, 45)** — Android, push notifikace, jednoduchost.
3. **Admin (majitelka)** — komplet přehled.

### Customer flow
Homepage → kategorie / vyhledávání → detail služby → zadání problému (s fotkou) → cena/termín → potvrzení → po dokončení recenze.

### Provider flow
Push notif → akceptace 1 klikem → kalendář → navigace → dokončení → fakturace.

### Design principy
- Mobile-first (70 %+ traffic).
- WCAG 2.2 AA accessibility.
- Design system: shadcn-style komponenty + Tailwind v3.
- Vykání (důvěra > familiérnost).
- Empty / loading / error state pro **každou** obrazovku.
- Dark mode (nice-to-have).

---

## 4) Technická architektura

### Reálný stack (aktuální v repu)
- **Frontend:** React 19 + Vite 8, Tailwind v3.
- **Backend:** Vercel Functions (`/api/*.js`, ESM, default export `handler(req, res)`).
- **Data:** Neon Postgres (HTTP driver `@neondatabase/serverless`).
- **PDF:** html2canvas + jsPDF (faktury).
- **Deploy:** Vercel → https://sikuladoma.vercel.app.

### Doplnit / postupně přidat
| Vrstva | Služba |
|---|---|
| Auth | Clerk *(rychlejší MVP)* nebo Auth.js + Resend magic link |
| Platby | Stripe (Connect — split platformy a řemeslníka) |
| E-maily | Resend + React Email |
| SMS | Twilio nebo SMSbrana.cz |
| Soubory | Vercel Blob nebo UploadThing |
| Mapy | Mapy.cz API *(lokální výhoda)* nebo Mapbox |
| Vyhledávání | Postgres FTS → Meilisearch |
| Real-time chat | Pusher / Ably |
| Push | Web Push API + service worker (PWA) |
| Monitoring | Sentry + Vercel Analytics + Axiom (logy) |
| Analytics/SEO | GA4 + Plausible + Search Console |
| AI (později) | Claude API (auto-popis problému z fotky) |

---

## 5) Datový model

### Existující v `db/schema.sql`
`users`, `orders`, `offers`, `conversations`, `messages`, `invoices`, `contact_messages`

### Cílový (po dotažení)
```
User (role flag: customer / sikula / admin)
 ├─ Profile
 ├─ SikulaProfile (IČO, kategorie, radius, hodinovka, kalendář)
 └─ Reviews (oboustranné)

Category (strom)
Service (price_from, price_to, category_id)

Order
 ├─ customer_id, sikula_id (nullable do přidělení)
 ├─ status: NEW | ASSIGNED | IN_PROGRESS | DONE | CANCELLED | DISPUTED
 ├─ location (PostGIS Point)
 ├─ photos[], description
 ├─ price_estimate, price_final
 ├─ scheduled_at, completed_at
 └─ payment_intent_id (Stripe)

Offer (nabídka šikuly na konkrétní order)
Conversation, Message (chat customer ↔ sikula, threaded na Order)
Invoice, Payment, Payout, Notification, AuditLog
BlogPost / Guide / FAQ — SEO obsah
Product (eshop affiliate items)
```

---

## 6) Dashboardy

- **Customer:** moje zakázky, faktury, oblíbení šikuli, recenze k vyplnění.
- **Sikula:** kalendář, fronta poptávek, výdělek (graf), recenze, KPI, dostupnost, fakturace.
- **Admin:** uživatelé, moderace, KPI byznysu, dispute resolution, CMS pro blog, feature flags, audit log, finanční reporty, exporty pro účetní.

---

## 7) SEO 100 % Google-friendly

- SSR/SSG kde dává smysl (u Vite + Vercel je třeba zvážit přechod na **Next.js** nebo **Astro/Remix** pro fully server-rendered stránky; SPA s React + Vite SEO zvládá omezeně).
- Dynamický `sitemap.xml`, `robots.txt`, canonical, hreflang (cs/sk).
- Core Web Vitals: LCP < 2.5 s, INP < 200 ms, CLS < 0.1.
- JSON-LD: `LocalBusiness`, `Service`, `Review`, `AggregateRating`, `FAQPage`, `BreadcrumbList`, `Article`.
- Obsah: „kolik stojí X", „jak vybrat Y", lokální landing pages („instalatér Praha 4").
- Edge caching, lazy load obrázků, žádné render-blocking JS.
- Search Console + IndexNow + interní prolinkování.
- **Lighthouse cíl:** Perf ≥ 95, SEO 100, A11y ≥ 95, Best Practices 100.

> **Pozn.:** Současný stack Vite/React = SPA = SEO výzva. Při bodu 7 zvážíme, jestli zůstat u Vite + prerender (React Snap, vite-plugin-ssr) nebo migrovat na Next.js.

---

## 8) DevOps / kvalita kódu

- Strict TypeScript (postupná migrace z JS).
- ESLint, Prettier, `tsc --noEmit` v CI.
- Husky + lint-staged + commitlint (conventional commits).
- Vitest (unit) + Playwright (e2e).
- GitHub Actions: lint → typecheck → test → build → Vercel preview → Lighthouse CI.
- Neon branching: každý PR má vlastní DB větev.
- Sentry + error boundaries + structured logging.
- Feature flags (Vercel Edge Config).
- `.env` schema validovaný Zodem při startu.
- Dokumentace: README, CONTRIBUTING, ARCHITECTURE.md, ADR.

---

## 9) Roadmapa (8 fází)

| # | Fáze | Délka | Obsah |
|---|---|---|---|
| 0 | **Audit** | 1 týden | co je v repu, stack, kvalita, security |
| 1 | **Fundament** | 2 týdny | Auth, doplnění DB, design system, layout, i18n |
| 2 | **Core MVP** | 4 týdny | dokončit objednávku, matching, chat, recenze |
| 3 | **Platby** | 2 týdny | Stripe Connect, faktury, payouty |
| 4 | **Dashboardy** | 3 týdny | customer / sikula / admin |
| 5 | **Obsah & SEO** | 2 týdny (+průběžně) | blog, kategorie, lokální LP, schema.org |
| 6 | **PWA & mobil** | 1 týden | instalovatelná, push, offline |
| 7 | **Beta launch** | — | 1 město, 20 šikulů, 100 zákazníků |
| 8 | **Škálování** | — | další města, AI, mobile native (Expo) |

---

## 10) Pořadí walkthroughu (default — můžeme měnit)

1. Audit aktuálního stavu repa.
2. Vyjasnit business směr A/B/C.
3. Persony + user flow.
4. Datový model & DB.
5. Auth + Stripe + ostatní externí služby.
6. Dashboardy.
7. SEO (vč. rozhodnutí Vite vs. Next.js).
8. DevOps & launch.

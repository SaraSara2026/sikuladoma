# ŠikulaDoma

Platforma propojující zákazníky s šikuly – montáž, opravy, úklid a další domácí služby po celé ČR.

## Tech Stack

- **React 19** + **Vite 8**
- Čistý SPA (Single Page Application)
- Inline styling – žádný CSS framework
- PDF export: `html2canvas` + `jsPDF`
- Deploy: Vercel
- Plánovaný backend: NeonDB + Vercel Functions

## Lokální vývoj

```bash
npm install
npm run dev
```

Aplikace běží na http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Struktura

```
src/
├── App.jsx              # Hlavní komponenta, routing, data
├── index.css            # Globální styly
├── data.js              # Demo data (faktury)
├── components/
│   ├── Header.jsx
│   ├── Footer.jsx
│   ├── Layout.jsx
│   └── CookieBanner.jsx
└── pages/
    ├── KontaktPage.jsx
    ├── ProSikulyPage.jsx
    ├── PodminkyProSikulyPage.jsx
    ├── PodporaProSikulyPage.jsx
    ├── OchranaSoukromiPage.jsx
    ├── PodminkyPouzitiPage.jsx
    ├── GDPRPage.jsx
    ├── CookiesPage.jsx
    └── InvoicePage.jsx
```

## Deploy na Vercel

1. Push na GitHub
2. Import repo na vercel.com
3. Framework: **Vite** (auto-detekce)
4. Build command: `npm run build`
5. Output directory: `dist`

## Provozovatel

Stavira s.r.o. · IČ: 29228379 · info@sikuladoma.cz

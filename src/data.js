// ŠikulaDoma — demo data + status maps
// Tento soubor poskytuje statická demo data pro UI prototyp.
// Až bude DB napojená přes /api, většina těchto konstant zmizí ve prospěch fetchů.

// ─── INVOICES ───────────────────────────────────────────────────────────────
export const INVOICE_STATUS_MAP = {
  draft: { label: 'Koncept',       color: 'badge-gray'  },
  sent:  { label: 'Odesláno',      color: 'badge-blue'  },
  paid:  { label: 'Zaplaceno',     color: 'badge-green' },
  late:  { label: 'Po splatnosti', color: 'badge-red'   },
}

export const DEMO_INVOICES = [
  { id: 'FAK-2025-001', title: 'Montáž nábytku', amount: 2500, customer: 'Jana Nováková',  created: '1. 5. 2025', due: '15. 5. 2025', status: 'paid'  },
  { id: 'FAK-2025-002', title: 'Malování pokoje', amount: 4800, customer: 'Petr Svoboda',   created: '5. 5. 2025', due: '19. 5. 2025', status: 'sent'  },
  { id: 'FAK-2025-003', title: 'Oprava kohoutu',  amount:  900, customer: 'Marie Horáková', created: '8. 5. 2025', due: '22. 5. 2025', status: 'draft' },
]

// ─── ORDERS ─────────────────────────────────────────────────────────────────
export const ORDER_STATUS_MAP = {
  new:         { label: 'Nová',          color: 'badge-blue'   },
  offers:      { label: 'Nabídky',       color: 'badge-orange' },
  in_progress: { label: 'V řešení',      color: 'badge-orange' },
  accepted:    { label: 'Přijato',       color: 'badge-green'  },
  completed:   { label: 'Dokončeno',     color: 'badge-green'  },
  cancelled:   { label: 'Zrušeno',       color: 'badge-gray'   },
}

// ─── CATEGORIES ─────────────────────────────────────────────────────────────
// Tvar pro HomePage (emoji ikona) a NewOrderPage. SVG ikony pro register form
// jsou v App.jsx (CATEGORIES tam má .Icon komponentu).
export const CATEGORIES = [
  { id: 'domacnost',   icon: '🧹', name: 'Domácnost' },
  { id: 'opravy',      icon: '🪛', name: 'Drobné opravy a montáže' },
  { id: 'instalater',  icon: '🚿', name: 'Instalatérské práce' },
  { id: 'elektro',     icon: '⚡', name: 'Elektro práce' },
  { id: 'malovani',    icon: '🎨', name: 'Malířské a stavební' },
  { id: 'obklady',     icon: '🧱', name: 'Obklady, dlažby, koupelny' },
  { id: 'podlahy',     icon: '🪵', name: 'Podlahy' },
  { id: 'nabytek',     icon: '🪑', name: 'Nábytek a truhlářské' },
  { id: 'zahrada',     icon: '🌿', name: 'Zahrada' },
  { id: 'stehovani',   icon: '📦', name: 'Stěhování a odvoz' },
  { id: 'spotrebice',  icon: '🔌', name: 'Spotřebiče a technika' },
  { id: 'doprava',     icon: '🚗', name: 'Auto / doprava / pomoc' },
  { id: 'seniori',     icon: '❤️', name: 'Péče o seniory' },
  { id: 'zvirata',     icon: '🐾', name: 'Zvířata' },
  { id: 'hlidani',     icon: '👶', name: 'Hlídání dětí' },
  { id: 'hodinovy',    icon: '🔨', name: 'Hodinový manžel' },
  { id: 'kotle',       icon: '🔥', name: 'Kotle a topení' },
  { id: 'it',          icon: '💻', name: 'IT pomoc' },
]

// ─── REVIEWS ────────────────────────────────────────────────────────────────
export const REVIEWS = [
  { initials: 'JN', name: 'Jana N.',     service: 'Montáž skříně',    stars: 5, text: 'Šikula přijel přesně, vše smontoval bez chyby. Doporučuji!' },
  { initials: 'PS', name: 'Petr S.',     service: 'Malování pokoje',  stars: 5, text: 'Rychlé, čisté a za rozumnou cenu. Příště opět.' },
  { initials: 'MH', name: 'Marie H.',    service: 'Oprava kohoutku',  stars: 5, text: 'Bleskově reagoval na urgentní poptávku. Super.' },
  { initials: 'PŠ', name: 'Pavel Š.',    service: 'Šikula',           stars: 5, text: 'Skvělá platforma pro řemeslníky. Mám zakázky rovnoměrně.' },
  { initials: 'LK', name: 'Lucie K.',    service: 'Úklid bytu',       stars: 5, text: 'Spolehlivá paní, vše čisté. Budu volat znovu.' },
  { initials: 'RT', name: 'Radek T.',    service: 'Šikula',           stars: 4, text: 'Příjemní zákazníci, hodnotné nabídky. Vyšší tarify pomáhají.' },
]

// ─── USERS (demo přihlašování) ──────────────────────────────────────────────
// USERS[role] vrací výchozí profil pro daný typ uživatele. RegisterPage
// kopíruje a přepisuje name/city/avatar.
export const USERS = {
  customer: {
    role: 'customer',
    name: 'Jana Nováková',
    email: 'jana@example.com',
    avatar: 'JN',
    city: 'Praha 6',
  },
  sikula: {
    role: 'sikula',
    name: 'Pavel Šikovný',
    email: 'pavel@example.com',
    avatar: 'PŠ',
    city: 'Praha 4',
    plan: 'Profi',
    jobs: 87,
    rating: 4.9,
    verified: true,
    price: '350 Kč/hod',
    services: ['Montáž nábytku', 'Drobné opravy', 'Pověšení obrazů'],
  },
  admin: {
    role: 'admin',
    name: 'Administrátor',
    email: 'admin@sikuladoma.cz',
    avatar: 'AD',
    city: 'Praha',
  },
}

// ─── DEMO MESSAGES (chat) ───────────────────────────────────────────────────
// Klíčované na ID konverzace (viz src/pages/ChatPage.jsx).
export const DEMO_MESSAGES = {
  1: [
    { from: 'them', text: 'Dobrý den, ráda bych vás požádala o pověšení obrazů.', time: '10:12' },
    { from: 'me',   text: 'Dobrý den, klidně. Kolik kusů a jaký povrch?',         time: '10:14' },
    { from: 'them', text: '4 obrazy, sádrokarton.',                                time: '10:18' },
    { from: 'me',   text: 'Můžu zítra v 10:00 — odhad 600 Kč.',                   time: '10:22' },
    { from: 'them', text: 'Tak se uvidíme v 10:00 👍',                             time: '10:51' },
  ],
  2: [
    { from: 'them', text: 'Mohu přijít v pátek?',                                  time: 'včera' },
  ],
  3: [
    { from: 'them', text: 'Děkuji za rychlou práci!',                              time: '2 dny' },
    { from: 'me',   text: 'Rádo se stalo, hodně štěstí.',                          time: '2 dny' },
  ],
}

// ─── DEMO OFFERS (nabídky šikulů na poptávku) ───────────────────────────────
export const DEMO_OFFERS = [
  {
    id: 1, orderId: 1,
    sikula: 'Pavel Šikovný', avatar: 'PŠ', verified: true, plan: 'Profi',
    rating: 4.9, jobs: 87, price: 1800,
    message: 'Dobrý den, rád to udělám zítra dopoledne. Cena včetně materiálu.',
    date: 'zítra', time: '10:00–12:00',
  },
  {
    id: 2, orderId: 1,
    sikula: 'Radek Tesař', avatar: 'RT', verified: true, plan: 'Plus',
    rating: 4.7, jobs: 42, price: 1600,
    message: 'Mám volno už dnes odpoledne, zvládnu rychle.',
    date: 'dnes', time: '15:00–17:00',
  },
  {
    id: 3, orderId: 2,
    sikula: 'Martin Kovář', avatar: 'MK', verified: false, plan: 'Start',
    rating: 4.5, jobs: 12, price: 1400,
    message: 'Mohu nabídnout nižší cenu, jsem začínající šikula.',
    date: 'pátek', time: 'celý den',
  },
]

// ─── DEMO ORDERS (přehled poptávek pro Šikula dashboard) ────────────────────
export const DEMO_ORDERS = [
  { id: 1, title: 'Pověšení 4 obrazů na sádrokarton', icon: '🖼️', city: 'Praha 6',  budget: 'do 1 000 Kč',     created: 'před 12 min', status: 'new',    urgent: false },
  { id: 2, title: 'Smontování skříně IKEA PAX',       icon: '🪑', city: 'Praha 10', budget: '1 000–2 000 Kč',  created: 'před 38 min', status: 'offers', urgent: false },
  { id: 3, title: 'Výměna baterie v koupelně',        icon: '🚿', city: 'Brno',     budget: '500–1 000 Kč',    created: 'před 1 h',    status: 'new',    urgent: true  },
  { id: 4, title: 'Malování ložnice 14 m²',           icon: '🎨', city: 'Praha 4',  budget: '2 000–5 000 Kč',  created: 'před 2 h',    status: 'new',    urgent: false },
  { id: 5, title: 'Sekání trávy 200 m²',              icon: '🌿', city: 'Říčany',   budget: '500–1 000 Kč',    created: 'před 3 h',    status: 'offers', urgent: false },
]

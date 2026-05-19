import { useState } from "react";
import InvoicePage from "./pages/InvoicePage";
import KontaktPage from "./pages/KontaktPage";
import ProSikulyPage from "./pages/ProSikulyPage.jsx";
import PodminkyProSikulyPage from "./pages/PodminkyProSikulyPage";
import PodporaProSikulyPage from "./pages/PodporaProSikulyPage";
import OchranaSoukromiPage from "./pages/OchranaSoukromiPage";
import PodminkyPouzitiPage from "./pages/PodminkyPouzitiPage";
import GDPRPage from "./pages/GDPRPage";
import CookiesPage from "./pages/CookiesPage";
import Layout from "./components/Layout";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "domacnost",   label: "Domácnost",                    Icon: IcClean },
  { id: "opravy",      label: "Drobné opravy a montáže",      Icon: IcWrench },
  { id: "instalater",  label: "Instalatérské práce",          Icon: IcPlumbing },
  { id: "elektro",     label: "Elektro práce",                Icon: IcElectric },
  { id: "malovani",    label: "Malířské a stavební práce",    Icon: IcPaint },
  { id: "obklady",     label: "Obklady, dlažby, koupelny",   Icon: IcTile },
  { id: "podlahy",     label: "Podlahy",                      Icon: IcFloor },
  { id: "nabytek",     label: "Nábytek a truhlářské práce",  Icon: IcFurniture },
  { id: "zahrada",     label: "Zahrada",                      Icon: IcGarden },
  { id: "stehovani",   label: "Stěhování a odvoz",            Icon: IcMove },
  { id: "spotrebice",  label: "Spotřebiče a technika",        Icon: IcTech },
  { id: "doprava",     label: "Auto / doprava / pomoc",       Icon: IcCar },
  { id: "seniori",     label: "Péče o seniory",               Icon: IcHeart },
  { id: "zvirata",     label: "Zvířata",                      Icon: IcPaw },
  { id: "hlidani",     label: "Hlídání dětí",                 Icon: IcChild },
  { id: "hodinovy",    label: "Hodinový manžel",              Icon: IcHammer },
  { id: "kotle",       label: "Kotle a topení",               Icon: IcFlameSvc },
  { id: "it",          label: "IT pomoc",                     Icon: IcMonitor },
];

const OTHER = "Jiné / nevím";
const SUBCATEGORIES = {
  domacnost:  ["Běžný úklid bytu / domu", "Jednorázový velký úklid", "Úklid po rekonstrukci", "Mytí oken", "Žehlení", "Praní / péče o prádlo", "Úklid společných prostor", "Úklid kanceláře", OTHER],
  opravy:     ["Montáž polic", "Montáž nábytku", "Vrtání", "Drobné opravy v bytě", "Výměna kliky, zámku, pantů", "Zavěšení obrazů, garnýží, zrcadel", "Seřízení dveří / skříněk", OTHER],
  instalater: ["Oprava kapající baterie", "Výměna baterie", "Čištění odpadu", "Oprava WC", "Výměna sifonu", "Montáž umyvadla", "Montáž sprchového koutu", "Připojení pračky / myčky", OTHER],
  elektro:    ["Výměna zásuvky / vypínače", "Montáž světla", "Výměna jističe", "Oprava drobné elektroinstalace", "Zapojení varné desky", "Montáž ventilátoru", "Kontrola elektroinstalace", OTHER],
  malovani:   ["Malování pokojů", "Oprava prasklin", "Štukování", "Sádrokarton", "Drobné zednické práce", "Oprava omítky", "Silikonování koupelny", OTHER],
  obklady:    ["Oprava spár", "Výměna prasklé dlaždice", "Silikonování vany / sprchy", "Drobné obkladačské práce", "Rekonstrukce koupelny", "Montáž koupelnového vybavení", OTHER],
  podlahy:    ["Pokládka vinylu", "Pokládka plovoucí podlahy", "Oprava podlahy", "Lištování", "Broušení parket", "Čištění koberců", OTHER],
  nabytek:    ["Montáž kuchyně", "Oprava nábytku", "Úprava polic / skříní", "Výroba nábytku na míru", "Oprava dveří", "Seřízení kuchyňských dvířek", OTHER],
  zahrada:    ["Sekání trávy", "Stříhání živého plotu", "Údržba zahrady", "Odvoz zeleného odpadu", "Sázení", "Hrabání listí", "Úklid sněhu", "Čištění terasy", OTHER],
  stehovani:  ["Stěhování bytu", "Stěhování kanceláře", "Odnos nábytku", "Vyklízení sklepa / garáže", "Odvoz odpadu", "Odvoz starého nábytku", OTHER],
  spotrebice: ["Připojení pračky", "Připojení myčky", "Montáž TV na zeď", "Nastavení Wi-Fi", "Zapojení tiskárny", "Základní pomoc s počítačem", "Instalace aplikací", OTHER],
  doprava:    ["Odvoz věcí", "Dovoz nákupu", "Vyzvednutí zásilky", "Drobná asistence seniorům", "Doprovod k lékaři", OTHER],
  seniori:    ["Nákup", "Úklid", "Doprovod", "Pomoc s běžnou domácností", "Donáška léků", "Kontrolní návštěva", OTHER],
  zvirata:    ["Venčení psů", "Hlídání psa / kočky", "Krmení zvířat", "Péče o zvíře během dovolené", OTHER],
  hlidani:    ["Jednorázové hlídání", "Večerní hlídání", "Vyzvednutí ze školy", "Hlídání o víkendu", OTHER],
  hodinovy:   ["Montáž nábytku", "Zavěšení TV", "Vrtání a upevnění", "Drobné opravy", "Výměna baterie", "Montáž polic", OTHER],
  kotle:      ["Oprava kotle", "Servis kotle", "Revize kotle", "Radiátory", "Podlahové topení", "Tepelná čerpadla", OTHER],
  it:         ["Nastavení Wi-Fi", "Pomoc s počítačem", "Instalace tiskárny", "Chytrá TV", "Mobilní telefon", "Chytrá domácnost", OTHER],
};

// Legacy alias so registration form still works
const SERVICES = CATEGORIES;

const PLANS = [
  { id: "start", name: "Start", price: "Zdarma", period: "", perks: ["3 reakce měsíčně", "Základní profil", "Recenze zákazníků"], featured: false },
  { id: "plus",  name: "Plus",  price: "299 Kč", period: "/měs", perks: ["20 reakcí měsíčně", "Lepší pozice ve výsledcích", "Statistiky profilu", "Fakturační modul"], featured: false },
  { id: "profi", name: "Profi", price: "599 Kč", originalPrice: "799 Kč", period: "/měs", perks: ["80 reakcí měsíčně", "Přednostní zobrazení", "Ověřený odznak", "Plný fakturační modul", "Urgentní notifikace"], featured: true },
  { id: "top",   name: "Top Šikula", price: "1 299 Kč", period: "/měs", perks: ["Neomezené reakce", "Top pozice vždy", "Dedikovaný support", "Vše z Profi tarifu", "Brandovaný profil"], featured: false },
];

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
// Service icons – clean line style
function IcFurniture({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="1"/><path d="M8 6V4h8v2"/><line x1="3" y1="11" x2="21" y2="11"/></svg>;
}
function IcDrill({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 10l-2 2-6.5 6.5a1 1 0 000 1.4l.6.6a1 1 0 001.4 0L14 14"/><path d="M14 10l2-2 4-1-1 4-2 2"/><circle cx="19" cy="5" r="1"/></svg>;
}
function IcWrench({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>;
}
function IcClean({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22l7-7"/><path d="M7.5 13.5L14 5l5 5-8.5 6.5"/><path d="M5 17l2 2"/></svg>;
}
function IcIron({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a1 1 0 01-1-1v-2a9 9 0 019-9h10l1 5H5v7z"/><circle cx="7" cy="17" r="1" fill="currentColor"/></svg>;
}
function IcSofa({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 9V6a2 2 0 00-2-2H6a2 2 0 00-2 2v3"/><path d="M2 11a2 2 0 012 2v2h16v-2a2 2 0 012-2 2 2 0 01-2-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 01-2 2z"/><line x1="6" y1="19" x2="6" y2="15"/><line x1="18" y1="19" x2="18" y2="15"/></svg>;
}
function IcElectric({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}
function IcPlumbing({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8H6a3 3 0 000 6h1v3a1 1 0 001 1h8a1 1 0 001-1v-3h1a3 3 0 000-6z"/></svg>;
}
function IcPaint({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M19 3H5a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"/><path d="M12 12v9"/><path d="M10 21h4"/></svg>;
}
function IcGarden({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V11"/><path d="M12 11C12 8 9 5 6 5s-3 3-1 5c1.5 1.5 4 2 7 1z"/><path d="M12 11c0-3 3-6 6-6s3 3 1 5c-1.5 1.5-4 2-7 1z"/></svg>;
}
function IcTile({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>;
}
function IcFloor({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M3 7l9-4 9 4"/><path d="M3 7v14"/><path d="M21 7v14"/><path d="M12 3v18"/></svg>;
}
function IcMove({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v5"/><path d="M14 21a3 3 0 110-6 3 3 0 010 6z"/><path d="M21 21a3 3 0 110-6 3 3 0 010 6z"/></svg>;
}
function IcTech({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>;
}
function IcCar({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/><path d="M5 12h14"/></svg>;
}
function IcHeart({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
}
function IcPaw({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><circle cx="6.5" cy="15.5" r="2"/><path d="M16.5 15.5c1 2 1.5 3-1.5 4.5s-4.5 1-6 0-2.5-2.5-1.5-4.5l1-2a3 3 0 015 0l1 2z"/></svg>;
}
function IcWallet({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5"/><path d="M16 12a2 2 0 000 4h5v-4h-5z"/></svg>;
}
function IcHandshake({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.42 4.58a5.4 5.4 0 00-7.65 0l-.77.78-.77-.78a5.4 5.4 0 00-7.65 7.65l1.06 1.06L12 21.23l7.36-7.94 1.06-1.06a5.4 5.4 0 000-7.65z"/></svg>;
}
function IcChild({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="6" r="3"/><path d="M12 9v5"/><path d="M9 14l-2 4"/><path d="M15 14l2 4"/><path d="M9 12h6"/></svg>;
}
function IcHammer({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 12l-8.5 8.5a2.12 2.12 0 01-3-3L12 9"/><path d="M17.64 15L22 10.64"/><path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 00-3.94-1.64H9l.92.82A6.18 6.18 0 0112 8.4v1.56l2 2h2.47l2.26 1.91"/></svg>;
}
function IcFlameSvc({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z"/></svg>;
}
function IcMonitor({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
}

// UI icons
const IcX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IcSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcCheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IcMapPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IcTag = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const IcClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcFlame = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z"/>
  </svg>
);
const IcZap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IcCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IcShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IcStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IcGlobe = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
  </svg>
);
const IcMessageSquare = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────

const T = {
  blue:      "#0066CC",
  blueDark:  "#004E9A",
  blueLight: "#E8F1FB",
  blueMid:   "#B3D0F5",
  orange:    "#F07800",
  orangeDk:  "#C05F00",
  orangeLt:  "#FFF4E8",
  ink:       "#1A1F2E",
  ink2:      "#3D4554",
  ink3:      "#6B7280",
  ink4:      "#9CA3AF",
  bg:        "#F9FAFB",
  surface:   "#FFFFFF",
  border:    "#E5E7EB",
  border2:   "#D1D5DB",
  green:     "#059669",
  greenLt:   "#ECFDF5",
  red:       "#DC2626",
};

// ─── BUTTON COMPONENTS ────────────────────────────────────────────────────────

function BtnPrimary({ children, onClick, size = "md", style: sx = {} }) {
  const h = size === "lg" ? 48 : size === "sm" ? 38 : 44;
  const px = size === "lg" ? 28 : size === "sm" ? 16 : 22;
  const fs = size === "lg" ? 15 : size === "sm" ? 13 : 14;
  return (
    <button
      onClick={onClick}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
        height: h, padding: `0 ${px}px`, borderRadius: 12, border: "none",
        background: T.orange, color: "#fff", fontWeight: 600, fontSize: fs,
        cursor: "pointer", fontFamily: "inherit", transition: "background .15s, box-shadow .15s",
        whiteSpace: "nowrap", letterSpacing: "-.01em", ...sx }}
      onMouseEnter={e => { e.currentTarget.style.background = T.orangeDk; e.currentTarget.style.boxShadow = "0 4px 14px rgba(240,120,0,.28)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = T.orange; e.currentTarget.style.boxShadow = "none"; }}
    >
      {children}
    </button>
  );
}

function BtnSecondary({ children, onClick, size = "md", style: sx = {} }) {
  const h = size === "lg" ? 48 : size === "sm" ? 38 : 44;
  const px = size === "lg" ? 28 : size === "sm" ? 16 : 22;
  const fs = size === "lg" ? 15 : size === "sm" ? 13 : 14;
  return (
    <button
      onClick={onClick}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
        height: h, padding: `0 ${px}px`, borderRadius: 12, border: `1.5px solid ${T.border2}`,
        background: "transparent", color: T.ink2, fontWeight: 600, fontSize: fs,
        cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
        whiteSpace: "nowrap", letterSpacing: "-.01em", ...sx }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.blue; e.currentTarget.style.color = T.blue; e.currentTarget.style.background = T.blueLight; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.ink2; e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

function BtnGhost({ children, onClick, size = "md", style: sx = {} }) {
  const h = size === "lg" ? 48 : size === "sm" ? 38 : 44;
  const px = size === "lg" ? 24 : size === "sm" ? 14 : 18;
  const fs = size === "lg" ? 15 : size === "sm" ? 13 : 14;
  return (
    <button
      onClick={onClick}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
        height: h, padding: `0 ${px}px`, borderRadius: 12, border: `1.5px solid ${T.border}`,
        background: "transparent", color: T.ink3, fontWeight: 500, fontSize: fs,
        cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
        whiteSpace: "nowrap", ...sx }}
      onMouseEnter={e => { e.currentTarget.style.background = T.bg; e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.ink; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.ink3; }}
    >
      {children}
    </button>
  );
}

function BtnBlue({ children, onClick, size = "md", style: sx = {} }) {
  const h = size === "lg" ? 48 : size === "sm" ? 38 : 44;
  const px = size === "lg" ? 28 : size === "sm" ? 16 : 22;
  const fs = size === "lg" ? 15 : size === "sm" ? 13 : 14;
  return (
    <button
      onClick={onClick}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
        height: h, padding: `0 ${px}px`, borderRadius: 12, border: "none",
        background: T.blue, color: "#fff", fontWeight: 600, fontSize: fs,
        cursor: "pointer", fontFamily: "inherit", transition: "background .15s, box-shadow .15s",
        whiteSpace: "nowrap", letterSpacing: "-.01em", ...sx }}
      onMouseEnter={e => { e.currentTarget.style.background = T.blueDark; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,102,204,.22)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = T.blue; e.currentTarget.style.boxShadow = "none"; }}
    >
      {children}
    </button>
  );
}

const IconBtn = ({ onClick, children }) => (
  <button onClick={onClick} style={{ width: 34, height: 34, borderRadius: 9, border: "none", background: T.bg, color: T.ink3, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "background .12s" }}
    onMouseEnter={e => e.currentTarget.style.background = T.border}
    onMouseLeave={e => e.currentTarget.style.background = T.bg}
  >
    {children}
  </button>
);

// ─── FORM STYLES ──────────────────────────────────────────────────────────────

const inp = { width: "100%", padding: "11px 14px", border: `1.5px solid ${T.border}`, borderRadius: 12, fontSize: 14, outline: "none", fontFamily: "inherit", color: T.ink, background: "#fff", transition: "border-color .14s, box-shadow .14s", boxSizing: "border-box" };
const lbl = { display: "block", fontSize: 11, fontWeight: 600, color: T.ink3, marginBottom: 5, letterSpacing: ".04em", textTransform: "uppercase" };
const hint = { fontSize: 14, color: T.ink3, marginBottom: 14, lineHeight: 1.55 };

// ─── ORDER FORM – 6 kroků ────────────────────────────────────────────────────

const STEP_LABELS = ["Kategorie", "Služba", "Upřesnění", "Místo", "Čas", "Kontakt"];
const TOTAL = 6;

const CAT_COLORS = {
  domacnost:  { bg:"#FFF7ED", ic:"#F97316" },
  opravy:     { bg:"#EFF6FF", ic:"#3B82F6" },
  instalater: { bg:"#F0FDF4", ic:"#22C55E" },
  elektro:    { bg:"#FFFBEB", ic:"#F59E0B" },
  malovani:   { bg:"#FAF5FF", ic:"#A855F7" },
  obklady:    { bg:"#FDF4FF", ic:"#C026D3" },
  podlahy:    { bg:"#F0F9FF", ic:"#0EA5E9" },
  nabytek:    { bg:"#FFF1F2", ic:"#F43F5E" },
  zahrada:    { bg:"#F7FEE7", ic:"#65A30D" },
  stehovani:  { bg:"#F0FDFA", ic:"#14B8A6" },
  spotrebice: { bg:"#EDE9FE", ic:"#7C3AED" },
  doprava:    { bg:"#FEF3C7", ic:"#D97706" },
  seniori:    { bg:"#FEF2F2", ic:"#EF4444" },
  zvirata:    { bg:"#ECFDF5", ic:"#10B981" },
};

function OrderForm({ initialService, onClose }) {
  // Pokud přichází s předvybranou kategorií, skočíme rovnou na krok 1
  const initCat = initialService
    ? CATEGORIES.find(c => c.id === initialService.id) || null
    : null;
  const [step, setStep]     = useState(initCat ? 1 : 0);
  const [category, setCat]  = useState(initCat);
  const [subSvc, setSubSvc] = useState(null);   // konkrétní služba (krok 1)
  const [desc, setDesc]     = useState("");
  const [city, setCity]     = useState("");
  const [floor, setFloor]   = useState("");
  const [priority, setPrio] = useState(null);
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [phone, setPhone]   = useState("");
  const [done, setDone]     = useState(false);

  const colCat = category ? (CAT_COLORS[category.id] || { bg:"#F8FAFC", ic:"#64748B" }) : null;

  const canNext = () => {
    if (step === 0) return !!category;
    if (step === 1) return !!subSvc;
    if (step === 2) return true;           // popis volitelný
    if (step === 3) return city.trim().length >= 2;
    if (step === 4) return !!priority;
    if (step === 5) return name.trim() && email.includes("@");
    return false;
  };

  const next = () => { if (canNext()) setStep(s => s + 1); };
  const back = () => setStep(s => Math.max(0, s - 1));

  // ── DONE SCREEN ────────────────────────────────────────────────────────────
  if (done) return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "48px 36px", textAlign: "center" }}>
          <div style={{ width: 58, height: 58, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#16A34A" }}>
            <IcCheckCircle />
          </div>
          <h2 style={{ fontSize: 21, fontWeight: 700, color: T.ink, marginBottom: 8, letterSpacing: "-.02em" }}>
            Hotovo. Šikulové už o vás vědí.
          </h2>
          <p style={{ color: T.ink3, fontSize: 14, lineHeight: 1.65, marginBottom: 22 }}>
            Do pár minut začnete dostávat nabídky od šikulů z okolí.
          </p>
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "12px 16px", marginBottom: 20, textAlign: "left" }}>
            {["Průměrná první reakce do 2 hodin", "Nabídky zdarma", "Platíte až po dokončení práce"].map(t => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7, fontSize: 13, color: T.ink2 }}>
                <span style={{ color: "#16A34A", flexShrink: 0 }}><IcCheck /></span>{t}
              </div>
            ))}
          </div>
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px 15px", marginBottom: 22, textAlign: "left" }}>
            {[
              [<IcTag />, "Kategorie", category?.label],
              [<IcTag />, "Služba",    subSvc],
              [<IcMapPin />, "Místo",  city],
              [<IcClock />, "Čas",     { urgent:"Do 48 hodin", soon:"Do 7 dní", flexible:"Flexibilně" }[priority]],
            ].filter(([,, v]) => v).map(([ic, k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, fontSize: 13 }}>
                <span style={{ color: T.ink4, flexShrink: 0 }}>{ic}</span>
                <span style={{ color: T.ink3 }}>{k}:</span>
                <strong style={{ color: T.ink }}>{v}</strong>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <BtnPrimary onClick={onClose}>Zpět na úvod</BtnPrimary>
            <BtnGhost onClick={() => {
              setCat(null); setSubSvc(null); setDesc(""); setCity(""); setFloor("");
              setPrio(null); setName(""); setEmail(""); setPhone(""); setDone(false); setStep(0);
            }}>
              Zadat další poptávku
            </BtnGhost>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 540 }} onClick={e => e.stopPropagation()}>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Breadcrumb kategorií */}
            {category && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 8, background: colCat.bg, fontSize: 12, fontWeight: 600, color: colCat.ic }}>
                <category.Icon size={13} /> {category.label}
              </div>
            )}
            {subSvc && step > 1 && (
              <div style={{ fontSize: 12, color: T.ink4, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                · {subSvc}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 12, color: T.ink4, fontWeight: 600 }}>{step + 1} / {TOTAL}</div>
            <IconBtn onClick={onClose}><IcX /></IconBtn>
          </div>
        </div>

        {/* PROGRESS */}
        <div style={{ display: "flex", gap: 3, padding: "10px 20px 0" }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step ? T.blue : i === step ? T.orange : T.border, transition: "background .3s" }} />
          ))}
        </div>

        {/* STEP LABEL */}
        <div style={{ padding: "12px 20px 0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.orange }}>{STEP_LABELS[step]}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.ink, marginTop: 2 }}>
            {step === 0 && "Co potřebujete vyřešit?"}
            {step === 1 && "Vyberte konkrétní službu"}
            {step === 2 && "Upřesněte poptávku"}
            {step === 3 && "Kde se práce provede?"}
            {step === 4 && "Jak rychle to potřebujete?"}
            {step === 5 && "Kam vám pošleme nabídky?"}
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: "16px 20px 4px", maxHeight: "55vh", overflowY: "auto" }}>

          {/* KROK 0 – Kategorie */}
          {step === 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {CATEGORIES.map(cat => {
                const c = CAT_COLORS[cat.id] || { bg:"#F8FAFC", ic:"#64748B" };
                return (
                  <button key={cat.id}
                    onClick={() => { setCat(cat); setSubSvc(null); setStep(1); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500, color: T.ink, transition: "all .14s", fontFamily: "inherit", textAlign: "left", boxShadow: "0 1px 2px rgba(0,0,0,.04)" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = c.ic; e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,.08)`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04)"; }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: c.ic }}>
                      <cat.Icon size={16} />
                    </div>
                    {cat.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* KROK 1 – Konkrétní služba (bez textu) */}
          {step === 1 && category && (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {SUBCATEGORIES[category.id]?.filter(s => s !== OTHER).map(sub => {
                const sel = subSvc === sub;
                return (
                  <button key={sub}
                    onClick={() => { setSubSvc(sub); }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${sel ? colCat.ic : T.border}`, background: sel ? colCat.bg : "#fff", cursor: "pointer", fontSize: 14, fontWeight: sel ? 600 : 400, color: sel ? colCat.ic : T.ink, transition: "all .12s", fontFamily: "inherit", textAlign: "left" }}
                    onMouseEnter={e => { if (!sel) { e.currentTarget.style.borderColor = colCat.ic; e.currentTarget.style.background = colCat.bg; } }}
                    onMouseLeave={e => { if (!sel) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "#fff"; } }}
                  >
                    {sub}
                    {sel && <span style={{ color: colCat.ic, flexShrink: 0 }}><IcCheck /></span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* KROK 2 – Upřesnění */}
          {step === 2 && (
            <div>
              <textarea
                autoFocus
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Popište situaci, rozměry, co je potřeba přinést… Čím víc napíšete, tím přesnější nabídky dostanete."
                style={{ ...inp, minHeight: 110, resize: "vertical" }}
              />
            </div>
          )}

          {/* KROK 3 – Místo */}
          {step === 3 && (
            <div>
              <input autoFocus value={city} onChange={e => setCity(e.target.value)}
                placeholder="Praha 6 – Dejvice" style={inp} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                <div>
                  <label style={lbl}>Patro</label>
                  <input value={floor} onChange={e => setFloor(e.target.value)}
                    style={inp} placeholder="přízemí / 3. patro" />
                </div>
                <div>
                  <label style={lbl}>Parkování</label>
                  <select style={{ ...inp, cursor: "pointer", appearance: "none" }}>
                    <option>Zdarma před domem</option>
                    <option>Placené v okolí</option>
                    <option>Bez parkování</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* KROK 4 – Čas / urgence */}
          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { id: "urgent",   Icon: IcFlame,    label: "Do 48 hodin",  sub: "Urgentní – potřebuji co nejdříve", selBg: "#FEF2F2", selBorder: T.red,    selColor: T.red },
                { id: "soon",     Icon: IcZap,      label: "Do 7 dní",     sub: "Spěchá, ale není to požár",         selBg: "#FFF7ED", selBorder: "#F97316", selColor: "#C2410C" },
                { id: "flexible", Icon: IcCalendar, label: "Flexibilně",   sub: "Počkám si, domluva na termínu",    selBg: "#F8FAFC", selBorder: T.ink3,   selColor: T.ink3 },
              ].map(opt => {
                const sel = priority === opt.id;
                return (
                  <button key={opt.id} onClick={() => setPrio(opt.id)}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${sel ? opt.selBorder : T.border}`, background: sel ? opt.selBg : "#fff", cursor: "pointer", textAlign: "left", transition: "all .14s", fontFamily: "inherit" }}
                    onMouseEnter={e => { if (!sel) { e.currentTarget.style.borderColor = opt.selBorder; e.currentTarget.style.background = opt.selBg; } }}
                    onMouseLeave={e => { if (!sel) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "#fff"; } }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: sel ? opt.selBg : T.bg, display: "flex", alignItems: "center", justifyContent: "center", color: sel ? opt.selColor : T.ink4, flexShrink: 0 }}>
                      <opt.Icon size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: sel ? opt.selColor : T.ink, letterSpacing: "-.01em" }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: T.ink4, marginTop: 2 }}>{opt.sub}</div>
                    </div>
                    {sel && <span style={{ color: opt.selColor, flexShrink: 0 }}><IcCheck /></span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* KROK 5 – Kontakt */}
          {step === 5 && (
            <div>
              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 9, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: T.blueDark, display: "flex", alignItems: "center", gap: 8 }}>
                <IcShield /><span>Registraci nevyžadujeme. Účet vytvoříme automaticky.</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                <div><label style={lbl}>Jméno *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Jana Nováková" style={inp} autoFocus /></div>
                <div><label style={lbl}>E-mail *</label><input value={email} onChange={e => setEmail(e.target.value)} placeholder="vas@email.cz" type="email" style={inp} /></div>
                <div><label style={lbl}>Telefon</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+420 777 000 000" type="tel" style={inp} /></div>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${T.border}`, marginTop: 12 }}>
          {step > 0
            ? <BtnGhost size="sm" onClick={back}>← Zpět</BtnGhost>
            : <span />}
          {/* Na kroku 0 tlačítko Pokračovat schovej – výběr kategorie rovnou přejde */}
          {step === 0 ? <span /> : (
            <button
              onClick={step < TOTAL - 1 ? next : () => setDone(true)}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, height: 42, padding: "0 22px", borderRadius: 10, border: "none", background: canNext() ? T.orange : T.border, color: canNext() ? "#fff" : T.ink4, fontWeight: 600, fontSize: 14, cursor: canNext() ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all .15s" }}
            >
              {step < TOTAL - 1 ? <>Pokračovat <IcArrow /></> : "Odeslat poptávku"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── REG FORM ─────────────────────────────────────────────────────────────────

function RegForm({ plan, onClose, onRegistered }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", ico: "", email: "", street: "", city: "", psc: "", services: [], plan: plan?.id || "start" });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleSvc = id => setForm(p => ({ ...p, services: p.services.includes(id) ? p.services.filter(x => x !== id) : [...p.services, id] }));

  if (step === 2) return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "48px 32px", textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", color: "#16A34A" }}>
            <IcCheckCircle />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Profil vytvořen</h2>
          <p style={{ color: T.ink3, fontSize: 14, lineHeight: 1.65, marginBottom: 24 }}>
            Vítejte v ŠikulaDoma, <strong>{form.name}</strong>.<br />
            Tarif <strong>{PLANS.find(p => p.id === form.plan)?.name}</strong> je aktivní.
          </p>
          <button onClick={() => { onRegistered(form); onClose(); }}
            style={{ height: 46, padding: "0 28px", borderRadius: 10, border: "none", background: T.orange, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8 }}>
            Přejít do profilu šikuly <IcArrow />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.blue, marginBottom: 2 }}>
              Registrace šikuly — krok {step + 1}/2
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.ink }}>{step === 0 ? "Základní údaje" : "Služby a tarif"}</div>
          </div>
          <IconBtn onClick={onClose}><IcX /></IconBtn>
        </div>
        <div style={{ padding: "20px" }}>
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <div><label style={lbl}>Jméno / název *</label><input value={form.name} onChange={e => upd("name", e.target.value)} placeholder="Pavel Šikovný" style={inp} autoFocus /></div>
              <div><label style={lbl}>IČO (volitelné)</label><input value={form.ico} onChange={e => upd("ico", e.target.value)} placeholder="12345678" style={inp} /></div>
              <div><label style={lbl}>E-mail *</label><input value={form.email} onChange={e => upd("email", e.target.value)} placeholder="vas@email.cz" type="email" style={inp} /></div>
              <div><label style={lbl}>Ulice a číslo popisné</label><input value={form.street || ""} onChange={e => upd("street", e.target.value)} placeholder="Hlavní 42" style={inp} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
                <div><label style={lbl}>Město / oblast *</label><input value={form.city} onChange={e => upd("city", e.target.value)} placeholder="Praha a okolí" style={inp} /></div>
                <div><label style={lbl}>PSČ</label><input value={form.psc || ""} onChange={e => upd("psc", e.target.value)} placeholder="110 00" style={inp} /></div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div>
              <p style={hint}>Jaké služby nabízíte?</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 20 }}>
                {SERVICES.map(s => {
                  const sel = form.services.includes(s.id);
                  return (
                    <button key={s.id} onClick={() => toggleSvc(s.id)} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "9px 12px",
                      borderRadius: 8, border: `1.5px solid ${sel ? T.blue : T.border}`,
                      background: sel ? T.blueLight : "#fff", cursor: "pointer",
                      fontSize: 13, fontWeight: 600, color: sel ? T.blue : T.ink,
                      transition: "all .14s", fontFamily: "inherit",
                    }}>
                      <span style={{ color: sel ? T.blue : T.ink4 }}><s.Icon size={16} /></span>{s.label}
                    </button>
                  );
                })}
              </div>
              <p style={hint}>Tarif</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {PLANS.map(p => {
                  const sel = form.plan === p.id;
                  return (
                    <button key={p.id} onClick={() => upd("plan", p.id)} style={{
                      padding: "11px 13px", borderRadius: 9, textAlign: "left",
                      border: `1.5px solid ${sel ? T.orange : T.border}`,
                      background: sel ? T.orangeLt : "#fff", cursor: "pointer",
                      transition: "all .14s", fontFamily: "inherit",
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: sel ? T.orangeDk : T.ink }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: T.ink4, marginTop: 2 }}>{p.price}{p.period}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between" }}>
          {step > 0 ? <BtnGhost size="sm" onClick={() => setStep(0)}>Zpět</BtnGhost> : <span />}
          <BtnBlue size="sm" onClick={() => { if (step === 0 && form.name && form.email) setStep(1); else if (step === 1) setStep(2); }}>
            {step === 0 ? <>Pokračovat <IcArrow /></> : "Vytvořit profil"}
          </BtnBlue>
        </div>
      </div>
    </div>
  );
}

// ─── SHARED MODAL STYLES ──────────────────────────────────────────────────────

const S = {
  overlay: { position: "fixed", inset: 0, background: "rgba(10,15,30,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(8px)" },
  modal: { background: "#fff", borderRadius: 18, width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.15)", animation: "modalUp .2s ease" },
};




// ─── LOGIN MODAL – magic link ─────────────────────────────────────────────────

function LoginModal({ onClose, onReg, onOrder, onFaktury, onDemoLogin, onGetDemo }) {
  const [view, setView] = useState("pick"); // "pick" | "magic"
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [emailError, setEmailError] = useState(false);

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.ink }}>
            {view === "pick" ? "Přihlášení" : "Přihlášení šikuly"}
          </div>
          <IconBtn onClick={onClose}><IcX /></IconBtn>
        </div>

        {view === "pick" && (
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

              {/* Šikula – magic link */}
              <button onClick={() => setView("magic")}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 12, border: `1.5px solid ${T.border}`, background: "#fff", cursor: "pointer", fontFamily: "inherit", transition: "all .14s", textAlign: "left" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.orange; e.currentTarget.style.background = T.orangeLt; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "#fff"; }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: T.orangeLt, display: "flex", alignItems: "center", justifyContent: "center", color: T.orange, flexShrink: 0 }}>
                  <IcWrench />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: T.ink, marginBottom: 2 }}>Přihlásit se jako šikula</div>
                  <div style={{ fontSize: 12, color: T.ink4 }}>Zadáte e-mail, pošleme přihlašovací odkaz</div>
                </div>
              </button>


            </div>

            {/* Demo přístup */}
            <div style={{ marginTop: 10, padding: "12px 14px", background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 8 }}>Testovací přístup</div>
              <button onClick={() => { onDemoLogin(onGetDemo()); onClose(); }}
                style={{ width: "100%", height: 38, borderRadius: 9, border: "1px solid #CBD5E1", background: "#fff", color: "#1A1F2E", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .14s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#F97316"; e.currentTarget.style.background = "#FFF7ED"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.background = "#fff"; }}>
                🔑 Přihlásit jako demo šikula
              </button>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6, textAlign: "center" }}>
                demo@sikuladoma.cz · Tarif Profi
              </div>
            </div>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.border}`, fontSize: 12, color: T.ink4, textAlign: "center", lineHeight: 1.7 }}>
              Zákazník?{" "}
              <span style={{ color: T.orange, fontWeight: 600, cursor: "pointer" }} onClick={() => { onClose(); onOrder(); }}>
                Zadejte poptávku zdarma
              </span>
              {" "}– registrace není nutná.<br />
              Nový šikula?{" "}
              <span style={{ color: T.blue, fontWeight: 600, cursor: "pointer" }} onClick={() => { onClose(); onReg(); }}>
                Zaregistrujte se
              </span>.
            </div>
          </div>
        )}

        {view === "magic" && (
          <div style={{ padding: "24px 20px" }}>
            {!sent ? (
              <>
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "12px 14px", marginBottom: 18, fontSize: 13, color: "#1D4ED8", lineHeight: 1.55 }}>
                  Bez hesla. Zadejte e-mail – v ostré verzi pošleme přihlašovací odkaz.
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>Váš e-mail</label>
                  <input autoFocus value={email} onChange={e => { setEmail(e.target.value); setNotFound(false); setEmailError(false); }}
                    type="email" placeholder="vas@email.cz" style={inp} />
                  {emailError && (
                    <div style={{ marginTop: 8, padding: "8px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 12, color: "#DC2626" }}>
                      Zadejte platnou e-mailovou adresu.
                    </div>
                  )}
                  {notFound && (
                    <div style={{ marginTop: 8, padding: "8px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 12, color: "#DC2626" }}>
                      Účet s tímto e-mailem zatím neexistuje. Nejdříve se prosím zaregistrujte.
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setEmailError(false); setSent(true); } else { setEmailError(true); } }}
                  style={{ width: "100%", height: 44, borderRadius: 10, border: "none", background: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? T.blue : T.border, color: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? "#fff" : T.ink4, fontWeight: 600, fontSize: 14, cursor: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all .15s" }}>
                  Pokračovat
                </button>
                <button onClick={() => setView("pick")} style={{ marginTop: 10, width: "100%", background: "none", border: "none", fontSize: 13, color: T.ink3, cursor: "pointer", fontFamily: "inherit" }}>
                  ← Zpět
                </button>
              </>
            ) : (
              <div style={{ padding: "8px 0" }}>
                <div style={{ background: "#FFFBEB", border: "1px solid #FEF08A", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "#92400E", lineHeight: 1.6 }}>
                  V ostré verzi vám pošleme přihlašovací odkaz na e-mail.<br />
                  <strong>V této testovací verzi pokračujte kliknutím níže.</strong>
                </div>
                <button
                  onClick={() => {
                    try {
                      const profiles = JSON.parse(localStorage.getItem("sd_profiles") || "{}");
                      const existing = profiles[email];
                      if (existing) {
                        onDemoLogin(existing); onClose();
                      } else {
                        setNotFound(true);
                      }
                    } catch {
                      onDemoLogin({ name: email.split("@")[0], email, services: [], plan: "start" }); onClose();
                    }
                  }}
                  style={{ width: "100%", height: 46, borderRadius: 10, border: "none", background: T.orange, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  Pokračovat jako šikula <IcArrow />
                </button>
                <button onClick={() => setView("pick")} style={{ marginTop: 10, width: "100%", background: "none", border: "none", fontSize: 13, color: T.ink3, cursor: "pointer", fontFamily: "inherit" }}>
                  ← Zpět
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HODNOCENÍ ŠIKULY ─────────────────────────────────────────────────────────

const HODNOCENI_KATEGORIE = [
  { id: "domluva",      label: "Dodržení domluvy" },
  { id: "kvalita",      label: "Kvalita služby" },
  { id: "komunikace",   label: "Komunikace" },
  { id: "vstricnost",   label: "Vstřícnost a chování" },
  { id: "cena",         label: "Cena odpovídala domluvě" },
];

function HodnoceniForm({ onClose }) {
  const [hodnoceni, setHodnoceni] = useState({});
  const [doporuceni, setDoporuceni] = useState(null);
  const [komentar, setKomentar] = useState("");
  const [done, setDone] = useState(false);

  const setH = (id, val) => setHodnoceni(p => ({ ...p, [id]: val }));
  const vsechnyVyplneny = HODNOCENI_KATEGORIE.every(k => hodnoceni[k.id]) && doporuceni !== null;

  if (done) return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "48px 28px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#16A34A" }}>
            <IcCheckCircle />
          </div>
          <h3 style={{ fontSize: 19, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Děkujeme za hodnocení</h3>
          <p style={{ fontSize: 14, color: T.ink3, lineHeight: 1.65, marginBottom: 22 }}>
            Vaše hodnocení pomáhá ostatním zákazníkům při výběru šikuly.
          </p>
          <button onClick={onClose} style={{ height: 42, padding: "0 24px", borderRadius: 10, border: "none", background: T.orange, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Zavřít</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.orange, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 2 }}>Hodnocení šikuly</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>Jak proběhla zakázka?</div>
          </div>
          <IconBtn onClick={onClose}><IcX /></IconBtn>
        </div>

        <div style={{ padding: "20px", maxHeight: "65vh", overflowY: "auto" }}>
          {/* Hvězdičkové kategorie */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
            {HODNOCENI_KATEGORIE.map(k => (
              <div key={k.id}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 7 }}>{k.label}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1,2,3,4,5].map(star => (
                    <button key={star} onClick={() => setH(k.id, star)}
                      style={{ width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${hodnoceni[k.id] >= star ? "#F97316" : T.border}`, background: hodnoceni[k.id] >= star ? "#FFF7ED" : "#fff", cursor: "pointer", fontSize: 16, transition: "all .12s" }}>
                      {hodnoceni[k.id] >= star ? "★" : "☆"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Doporučení */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 10 }}>Doporučili byste tohoto šikulu?</div>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { id: "ano", label: "✅ Doporučuji",     bg: "#F0FDF4", border: "#22C55E", color: "#16A34A" },
                { id: "ne",  label: "❌ Nedoporučuji",   bg: "#FEF2F2", border: "#EF4444", color: "#DC2626" },
              ].map(opt => (
                <button key={opt.id} onClick={() => setDoporuceni(opt.id)}
                  style={{ flex: 1, height: 44, borderRadius: 10, border: `1.5px solid ${doporuceni === opt.id ? opt.border : T.border}`, background: doporuceni === opt.id ? opt.bg : "#fff", color: doporuceni === opt.id ? opt.color : T.ink, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all .14s" }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Komentář */}
          <div>
            <label style={{ ...lbl, marginBottom: 6 }}>Chcete něco doplnit? <span style={{ color: T.ink4, fontWeight: 400 }}>(volitelné)</span></label>
            <textarea value={komentar} onChange={e => { if (e.target.value.length <= 300) setKomentar(e.target.value); }}
              placeholder="Krátký komentář…"
              style={{ ...inp, minHeight: 80, resize: "none" }} />
            <div style={{ fontSize: 11, color: T.ink4, textAlign: "right", marginTop: 4 }}>{komentar.length}/300</div>
          </div>

          {/* Info – jednorázový odkaz */}
          <div style={{ marginTop: 14, background: "#F8FAFC", border: `1px solid ${T.border}`, borderRadius: 9, padding: "10px 13px", fontSize: 12, color: T.ink3, lineHeight: 1.55 }}>
            Hodnocení je propojeno s konkrétní zakázkou. Každou zakázku lze ohodnotit pouze jednou.
          </div>
        </div>

        <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => { if (vsechnyVyplneny) setDone(true); }}
            style={{ height: 44, padding: "0 24px", borderRadius: 10, border: "none", background: vsechnyVyplneny ? T.orange : T.border, color: vsechnyVyplneny ? "#fff" : T.ink4, fontWeight: 600, fontSize: 14, cursor: vsechnyVyplneny ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all .15s" }}>
            Odeslat hodnocení
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── ŠIKULA DASHBOARD ─────────────────────────────────────────────────────────

function SikulaDashboard({ user, onLogout, initTab }) {
  const [tab, setTab] = useState(initTab || "prehled");
  const [profile, setProfile] = useState({
    name:    user?.name    || "",
    email:   user?.email   || "",
    phone:   user?.phone   || "",
    city:    user?.city    || "",
    street:  user?.street  || "",
    psc:     user?.psc     || "",
    ico:     user?.ico     || "",
    bio:     user?.bio     || "",
    services: user?.services || [],
  });
  const [saved, setSaved] = useState(false);

  const plan = PLANS.find(p => p.id === user?.plan) || PLANS[0];
  const upd = (k, v) => setProfile(p => ({ ...p, [k]: v }));
  const toggleSvc = id => setProfile(p => ({ ...p, services: p.services.includes(id) ? p.services.filter(x => x !== id) : [...p.services, id] }));

  const saveProfile = () => {
    try {
      const stored = localStorage.getItem("sd_user");
      if (stored) {
        const u = JSON.parse(stored);
        localStorage.setItem("sd_user", JSON.stringify({ ...u, ...profile }));
      }
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const TABS = [
    { id: "prehled",  label: "Přehled" },
    { id: "profil",   label: "Profil" },
    { id: "poptavky", label: "Poptávky" },
    { id: "hodnoceni",label: "Hodnocení" },
  ];

  const STATS = [
    { label: "Stav účtu",           value: plan.name,  color: "#F97316", bg: "#FFF7ED" },
    { label: "Dokončené zakázky",    value: "0",        color: "#3B82F6", bg: "#EFF6FF" },
    { label: "Průměrné hodnocení",   value: "—",        color: "#22C55E", bg: "#F0FDF4" },
    { label: "Nové poptávky",        value: "0",        color: "#A855F7", bg: "#FAF5FF" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB" }}>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Header šikuly */}
        <div style={{ background: "#fff", borderRadius: 18, padding: "22px 26px", border: "1px solid #F3F4F6", boxShadow: "0 1px 4px rgba(0,0,0,.05)", marginBottom: 22, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#F97316,#EA580C)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
            {(profile.name || "Š")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1A1F2E", letterSpacing: "-.02em" }}>{profile.name || "Šikula"}</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>{profile.email} {profile.city ? `· ${profile.city}` : ""}</div>
          </div>
          <button onClick={onLogout}
            style={{ padding: "6px 14px", borderRadius: 9, border: "1px solid #E5E7EB", background: "none", fontSize: 13, color: "#6B7280", cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.borderColor = "#FECACA"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#6B7280"; e.currentTarget.style.borderColor = "#E5E7EB"; }}>
            Odhlásit
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 3, background: "#F3F4F6", borderRadius: 12, padding: 4, marginBottom: 24, width: "fit-content" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: "8px 18px", borderRadius: 9, border: "none", background: tab === t.id ? "#fff" : "transparent", color: tab === t.id ? "#1A1F2E" : "#6B7280", fontWeight: tab === t.id ? 600 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all .14s", boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,.08)" : "none" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* PŘEHLED */}
        {tab === "prehled" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
              {STATS.map(s => (
                <div key={s.label} style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 14, padding: "18px 16px", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: "-.02em", marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Rychlé akce */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 14, padding: "20px 22px", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1A1F2E", marginBottom: 4 }}>Moje poptávky</div>
                <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.55, marginBottom: 14 }}>Zatím žádné nové poptávky. Jakmile zákazník ve vašem okolí zadá poptávku, zobrazí se zde.</div>
                <button onClick={() => setTab("poptavky")} style={{ fontSize: 13, fontWeight: 600, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>Zobrazit poptávky →</button>
              </div>
              <div style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 14, padding: "20px 22px", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1A1F2E", marginBottom: 4 }}>Hodnocení</div>
                <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.55, marginBottom: 14 }}>Zatím žádná hodnocení. Po dokončení zakázky dostane zákazník odkaz na hodnocení.</div>
                <button onClick={() => setTab("hodnoceni")} style={{ fontSize: 13, fontWeight: 600, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>Zobrazit hodnocení →</button>
              </div>
            </div>
          </div>
        )}

        {/* PROFIL – editace */}
        {tab === "profil" && (
          <div style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 16, padding: "28px 28px", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1F2E", marginBottom: 20, letterSpacing: "-.01em" }}>Základní informace</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div><label style={lbl}>Jméno / název *</label><input value={profile.name} onChange={e => upd("name", e.target.value)} style={inp} placeholder="Pavel Šikovný" /></div>
              <div><label style={lbl}>Telefon</label><input value={profile.phone} onChange={e => upd("phone", e.target.value)} style={inp} placeholder="+420 777 000 000" /></div>
              <div><label style={lbl}>E-mail</label><input value={profile.email} onChange={e => upd("email", e.target.value)} style={inp} type="email" /></div>
              <div><label style={lbl}>IČO (volitelné)</label><input value={profile.ico} onChange={e => upd("ico", e.target.value)} style={inp} placeholder="12345678" /></div>
              <div><label style={lbl}>Ulice a číslo</label><input value={profile.street} onChange={e => upd("street", e.target.value)} style={inp} placeholder="Hlavní 42" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
                <div><label style={lbl}>Město</label><input value={profile.city} onChange={e => upd("city", e.target.value)} style={inp} placeholder="Praha" /></div>
                <div><label style={lbl}>PSČ</label><input value={profile.psc} onChange={e => upd("psc", e.target.value)} style={inp} placeholder="110 00" /></div>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Krátký popis (volitelný)</label>
              <textarea value={profile.bio} onChange={e => upd("bio", e.target.value)} style={{ ...inp, minHeight: 80, resize: "vertical" }} placeholder="Čím se zabýváte, kde působíte, co umíte nejlépe…" />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={lbl}>Nabízené služby</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 6 }}>
                {SERVICES.map(s => {
                  const sel = profile.services.includes(s.id);
                  return (
                    <button key={s.id} onClick={() => toggleSvc(s.id)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 9, border: `1.5px solid ${sel ? T.blue : T.border}`, background: sel ? T.blueLight : "#fff", cursor: "pointer", fontSize: 13, fontWeight: sel ? 600 : 400, color: sel ? T.blue : T.ink, fontFamily: "inherit", transition: "all .12s" }}>
                      <span style={{ color: sel ? T.blue : T.ink4 }}><s.Icon size={15} /></span>{s.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={saveProfile}
                style={{ height: 44, padding: "0 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#F97316,#EA580C)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 3px 12px rgba(249,115,22,.3)", transition: "all .14s" }}>
                Uložit změny
              </button>
              {saved && <span style={{ fontSize: 13, color: "#22C55E", fontWeight: 600 }}>✓ Uloženo</span>}
            </div>
          </div>
        )}

        {/* POPTÁVKY */}
        {tab === "poptavky" && (
          <div style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 16, padding: "48px 32px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 24 }}>📬</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1F2E", marginBottom: 6 }}>Zatím žádné poptávky</div>
            <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.65, maxWidth: 360, margin: "0 auto" }}>Jakmile zákazník ve vašem okolí zadá poptávku odpovídající vašim službám, zobrazí se zde.</div>
          </div>
        )}

        {/* HODNOCENÍ */}
        {tab === "hodnoceni" && (
          <div style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 16, padding: "48px 32px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 24 }}>⭐</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1F2E", marginBottom: 6 }}>Zatím žádná hodnocení</div>
            <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.65, maxWidth: 360, margin: "0 auto" }}>Hodnocení přibydou po dokončení zakázek. Zákazník dostane jednorázový odkaz na hodnocení e-mailem.</div>
          </div>
        )}

      </div>
    </div>
  );
}



// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [page,        setPage]        = useState("home"); // "home" | "pro-sikuly" | "faktury" | "kontakt" | "sikuly" | "podminky-sikuly" | "podpora-sikuly" | "dashboard"
  const [orderForm,   setOrderForm]   = useState(null);
  const [regForm,     setRegForm]     = useState(null);
  const [loginModal,  setLoginModal]  = useState(false);
  const [priority,    setPriority]    = useState(null);
  const [dashboardTab, setDashboardTab] = useState('prehled');
  const [sikulaUser,  setSikulaUser]  = useState(() => {
    try { const s = localStorage.getItem("sd_user"); return s ? JSON.parse(s) : null; } catch { return null; }
  }); // přihlášený šikula (demo + localStorage)

  // Helper – uložit/smazat session
  const loginSikula = (user) => {
    try {
      // Uložit aktuální session
      localStorage.setItem("sd_user", JSON.stringify(user));
      // Uložit profil podle e-mailu (pro pozdější přihlášení)
      if (user.email) {
        const profiles = JSON.parse(localStorage.getItem("sd_profiles") || "{}");
        profiles[user.email] = user;
        localStorage.setItem("sd_profiles", JSON.stringify(profiles));
      }
    } catch {}
    setSikulaUser(user);
    setPage("dashboard");
    window.scrollTo(0, 0);
  };
  const logoutSikula = () => {
    try { localStorage.removeItem("sd_user"); } catch {}
    setSikulaUser(null);
    setPage("home");
    window.scrollTo(0, 0);
  };

  // Demo šikula – vždy dostupný pro testování
  const DEMO_SIKULA = {
    name: "Pavel Šikovný",
    email: "demo@sikuladoma.cz",
    phone: "+420 777 123 456",
    ico: "12345678",
    street: "Hlavní 42",
    city: "Praha 6",
    psc: "160 00",
    bio: "Zkušený řemeslník se zaměřením na montáže, drobné opravy a domácí práce. Působím v Praze a okolí.",
    services: ["domacnost", "opravy", "nabytek"],
    plan: "profi",
  };

  const openOrder = (svc = null) => setOrderForm({ service: svc });
  const openReg   = (plan = null) => setRegForm({ plan });
  const scrollTo  = id => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
        *{font-family:'Inter',system-ui,sans-serif;}
        body{background:${T.bg};color:${T.ink};}
        button,input,textarea,select{font-family:'Inter',system-ui,sans-serif;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-thumb{background:${T.border2};border-radius:3px;}
        @keyframes modalUp{from{opacity:0;transform:translateY(12px) scale(.98);}to{opacity:1;transform:none;}}
        .nav-link{padding:6px 12px;border-radius:8px;font-size:14px;font-weight:500;color:${T.ink3};border:none;background:none;cursor:pointer;transition:all .12s;letter-spacing:-.01em;}
        .nav-link:hover{color:${T.ink};background:${T.bg};}
        .svc-tile{display:flex;flex-direction:column;align-items:center;gap:9px;padding:18px 12px;background:#fff;border:1px solid ${T.border};border-radius:14px;cursor:pointer;font-size:12px;font-weight:600;color:${T.ink};transition:all .18s;box-shadow:0 1px 3px rgba(0,0,0,.04);letter-spacing:-.01em;font-family:'Inter',system-ui,sans-serif;}
        .svc-tile:hover{border-color:${T.orange};color:${T.orangeDk};transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.08);}
        .svc-tile:hover .svc-tile-icon{color:${T.orange};}
        .how-card{background:#fff;border:1px solid ${T.border};border-radius:14px;padding:24px;transition:all .18s;box-shadow:0 1px 3px rgba(0,0,0,.05);font-family:'Inter',system-ui,sans-serif;}
        .how-card:hover{box-shadow:0 6px 24px rgba(0,0,0,.08);transform:translateY(-2px);}
        .pri-chip{display:inline-flex;align-items:center;gap:6px;padding:0 14px;height:36px;border-radius:10px;border:1.5px solid;font-size:13px;font-weight:500;cursor:pointer;transition:all .14s;font-family:inherit;letter-spacing:-.01em;}
      `}</style>

      <Layout
        T={T}
        BtnPrimary={BtnPrimary}
        onHome={() => { setPage("home"); window.scrollTo(0,0); }}
        onScrollTo={scrollTo}
        onOrder={() => openOrder()}
        onLogin={() => setLoginModal(true)}
        onReg={() => openReg()}
        onKontakt={() => { setPage("kontakt"); window.scrollTo(0,0); }}
        onSikuly={() => { setPage("sikuly"); window.scrollTo(0,0); }}
        onPodminkySikuly={() => { setPage("podminky-sikuly"); window.scrollTo(0,0); }}
        onPodporaSikuly={() => { setPage("podpora-sikuly"); window.scrollTo(0,0); }}
        sikulaUser={sikulaUser}
        onDashboard={() => { setDashboardTab("prehled"); setPage("dashboard"); window.scrollTo(0,0); }}
        onProfil={() => { setDashboardTab("profil"); setPage("dashboard"); window.scrollTo(0,0); }}
        onLogout={logoutSikula}
        onOchrana={() => { setPage("ochrana-soukromi"); window.scrollTo(0,0); }}
        onPodminkyPouziti={() => { setPage("podminky-pouziti"); window.scrollTo(0,0); }}
        onGDPR={() => { setPage("gdpr"); window.scrollTo(0,0); }}
        onCookies={() => { setPage("cookies"); window.scrollTo(0,0); }}
        onCookiesPage={() => { setPage("cookies"); window.scrollTo(0,0); }}
        onHow={() => { setPage("home"); window.scrollTo(0,0); setTimeout(() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" }), 100); }}
      >

      {page === "dashboard" ? (
        <SikulaDashboard user={sikulaUser} onLogout={logoutSikula} initTab={dashboardTab} />
      ) : page === "cookies" ? (
        <CookiesPage onBack={() => { setPage("home"); window.scrollTo(0,0); }} />
      ) : page === "gdpr" ? (
        <GDPRPage onBack={() => { setPage("home"); window.scrollTo(0,0); }} />
      ) : page === "podminky-pouziti" ? (
        <PodminkyPouzitiPage onBack={() => { setPage("home"); window.scrollTo(0,0); }} />
      ) : page === "ochrana-soukromi" ? (
        <OchranaSoukromiPage onBack={() => { setPage("home"); window.scrollTo(0,0); }} />
      ) : page === "podpora-sikuly" ? (
        <PodporaProSikulyPage onBack={() => { setPage("home"); window.scrollTo(0,0); }} />
      ) : page === "podminky-sikuly" ? (
        <PodminkyProSikulyPage onBack={() => { setPage("home"); window.scrollTo(0,0); }} />
      ) : page === "sikuly" ? (
        <ProSikulyPage onBack={() => { setPage("home"); window.scrollTo(0,0); }} onReg={openReg} />
      ) : page === "kontakt" ? (
        <KontaktPage onBack={() => { setPage("home"); window.scrollTo(0,0); }} />
      ) : page === "faktury" ? (
        <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
          {/* Breadcrumb */}
          <div style={{ background: "#fff", borderBottom: `1px solid ${T.border}`, padding: "10px 24px" }}>
            <div style={{ maxWidth: 1060, margin: "0 auto" }}>
              <button onClick={() => { setPage("home"); window.scrollTo(0,0); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: T.ink3, fontFamily: "inherit", padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = T.ink}
                onMouseLeave={e => e.currentTarget.style.color = T.ink3}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                Zpět na úvod
              </button>
            </div>
          </div>
          <div style={{ maxWidth: 1060, margin: "0 auto", padding: "32px 24px" }}>
            <InvoicePage />
          </div>
        </div>
      ) : page === "pro-sikuly" ? (
        <ProSikulyPage onBack={() => { setPage("home"); window.scrollTo(0,0); }} onReg={openReg} />
      ) : (<>

      {/* HERO */}
      <section id="hero" style={{ background: "#fff", padding: "88px 24px 72px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Background blobs */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -120, left: -80, width: 480, height: 480, borderRadius: "50%", background: "rgba(219,234,254,.45)", filter: "blur(80px)" }} />
          <div style={{ position: "absolute", bottom: -80, right: -60, width: 380, height: 380, borderRadius: "50%", background: "rgba(255,237,213,.5)", filter: "blur(70px)" }} />
        </div>

        <div style={{ position: "relative", maxWidth: 660, margin: "0 auto" }}>

          {/* Eyebrow pill */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8", borderRadius: 999, padding: "5px 16px 5px 10px", fontSize: 13, fontWeight: 500, marginBottom: 32, letterSpacing: "-.01em" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block", boxShadow: "0 0 0 3px rgba(34,197,94,.2)" }} />
            Šikulové dostupní v celé ČR
          </div>

          {/* H1 */}
          <h1 style={{ fontSize: 36, fontWeight: 800, color: T.ink, lineHeight: 1.2, letterSpacing: "-.03em", marginBottom: 16, fontFamily: "'Inter', system-ui, sans-serif" }}>
            Doma se vždycky něco najde.<br />
            My najdeme <span style={{ color: T.orange }}>šikulu.</span>
          </h1>

          {/* Subtitle */}
          <p style={{ fontSize: 17, color: T.ink3, lineHeight: 1.7, maxWidth: 460, margin: "0 auto 36px", letterSpacing: "-.01em" }}>
            Vyberte službu, napište pár detailů a šikulové z okolí vám pošlou nabídky.
          </p>

          {/* Search bar */}
          <div style={{ display: "flex", maxWidth: 520, margin: "0 auto 16px", background: "#fff", borderRadius: 14, border: `1.5px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.06)", overflow: "hidden" }}>
            <span style={{ display: "flex", alignItems: "center", paddingLeft: 16, paddingRight: 10, color: T.ink4, flexShrink: 0 }}><IcSearch /></span>
            <input
              style={{ flex: 1, padding: "15px 4px", border: "none", outline: "none", fontSize: 15, color: T.ink, background: "transparent", fontFamily: "inherit", letterSpacing: "-.01em" }}
              placeholder="Co potřebujete doma vyřešit?"
              onKeyDown={e => e.key === "Enter" && openOrder()}
            />
            <div style={{ padding: "6px" }}>
              <BtnPrimary size="sm" onClick={() => openOrder()}>Najít šikulu</BtnPrimary>
            </div>
          </div>

          {/* Time chips */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
            {[
              { id: "urgent",   label: "Do 48 hodin",  selBg: "#EF4444", selBorder: "#EF4444", idleBg: "#FEF2F2", idleBorder: "#FCA5A5", idleColor: "#B91C1C" },
              { id: "soon",     label: "Do 7 dní",     selBg: "#F97316", selBorder: "#F97316", idleBg: "#FFF7ED", idleBorder: "#FED7AA", idleColor: "#C2410C" },
              { id: "flexible", label: "Flexibilně",   selBg: "#0F172A", selBorder: "#0F172A", idleBg: "#F8FAFC", idleBorder: "#CBD5E1", idleColor: "#475569" },
            ].map(p => {
              const sel = priority === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => { setPriority(p.id); openOrder(); }}
                  style={{
                    display: "inline-flex", alignItems: "center", height: 36,
                    padding: "0 16px", borderRadius: 10,
                    border: `1.5px solid ${sel ? p.selBorder : p.idleBorder}`,
                    background: sel ? p.selBg : p.idleBg,
                    color: sel ? "#fff" : p.idleColor,
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    fontFamily: "inherit", letterSpacing: "-.01em",
                    transition: "all .14s",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Main CTAs */}
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 32 }}>
            <BtnPrimary size="lg" onClick={() => openOrder()}>
              Zadat poptávku zdarma <IcArrow />
            </BtnPrimary>
            <BtnSecondary size="lg" onClick={() => { setPage("sikuly"); window.scrollTo(0, 0); }}>
              Chci vydělávat jako šikula
            </BtnSecondary>
          </div>

          {/* Trust badges */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
            {[
              { Icon: IcShield, text: "Ověření šikulové", iconColor: "#059669" },
              { Icon: IcStar,   text: "Nabídky zdarma",   iconColor: T.orange },
              { Icon: IcCheck,  text: "Zákazník nic neplatí", iconColor: "#059669" },
              { Icon: IcGlobe,  text: "Platíte přímo šikulovi", iconColor: T.blue },
            ].map(({ Icon, text, iconColor }) => (
              <div key={text} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 13px", background: "#F8FAFC", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12, fontWeight: 500, color: T.ink2, letterSpacing: "-.01em" }}>
                <span style={{ color: iconColor, display: "flex", flexShrink: 0 }}><Icon /></span>
                {text}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* STATS STRIP */}
      <div style={{ background: "#0F172A", padding: "40px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0 }}>
          {[
            { value: "1 200+", label: "šikulů v ČR",          color: "#F97316" },
            { value: "8 400+", label: "dokončených prací",     color: "#38BDF8" },
            { value: "do 2 h", label: "průměrná první reakce", color: "#34D399" },
            { value: "4.9 ★",  label: "průměrné hodnocení",    color: "#A78BFA" },
          ].map(({ value, label, color }, i, arr) => (
            <div key={label} style={{ textAlign: "center", padding: "8px 16px", borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,.08)" : "none" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: "-.03em", lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: "80px 24px", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.blue, marginBottom: 10 }}>JAK TO FUNGUJE</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: T.ink, letterSpacing: "-.03em", marginBottom: 10 }}>Jak to funguje</h2>
            <p style={{ fontSize: 15, color: T.ink3, maxWidth: 500, margin: "0 auto", lineHeight: 1.65 }}>
              Poptávku zadáte za pár minut. Vyberete službu, místo, čas a odešlete.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
            {[
              { n: 1, title: "Vyberete kategorii",       desc: "Například Domácnost, Zahrada, Elektro práce nebo Drobné opravy a montáže.", bg: "#FFF7ED", color: "#F97316" },
              { n: 2, title: "Vyberete konkrétní službu", desc: "Například u kategorie Domácnost zvolíte žehlení, úklid, mytí oken nebo jinou službu.", bg: "#EFF6FF", color: "#3B82F6" },
              { n: 3, title: "Upřesníte požadavek",      desc: "Můžete dopsat vlastní poznámku. Například kolik prádla chcete vyžehlit. Není to ale povinné.", bg: "#F0FDF4", color: "#22C55E" },
              { n: 4, title: "Zadáte místo a čas",       desc: "Vyplníte adresu nebo oblast, kde se má služba provést, a zvolíte, jak rychle ji potřebujete.", bg: "#FAF5FF", color: "#A855F7" },
              { n: 5, title: "Odešlete poptávku",        desc: "Šikulové z okolí se vám ozvou s nabídkou. Vyberete podle ceny, termínu a recenzí.", bg: "#F0F9FF", color: "#0EA5E9" },
            ].map(step => (
              <div key={step.n} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: "24px 22px", boxShadow: "0 1px 3px rgba(0,0,0,.04)", transition: "all .18s", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.09)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.04)"; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 14, background: step.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: step.color, letterSpacing: "-.02em" }}>{step.n}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 7, letterSpacing: "-.02em" }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.blue, marginBottom: 10 }}>SLUŽBY</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: T.ink, letterSpacing: "-.03em", marginBottom: 8 }}>Co potřebujete vyřešit?</h2>
            <p style={{ fontSize: 15, color: T.ink3 }}>Vyberte kategorii a rovnou zadejte poptávku – bez registrace.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
            {[
              { s: SERVICES[0],  bg: "#FFF7ED", ic: "#F97316" },
              { s: SERVICES[1],  bg: "#EFF6FF", ic: "#3B82F6" },
              { s: SERVICES[2],  bg: "#F0FDF4", ic: "#22C55E" },
              { s: SERVICES[3],  bg: "#FAF5FF", ic: "#A855F7" },
              { s: SERVICES[4],  bg: "#FEF2F2", ic: "#EF4444" },
              { s: SERVICES[5],  bg: "#ECFDF5", ic: "#10B981" },
              { s: SERVICES[6],  bg: "#FFFBEB", ic: "#F59E0B" },
              { s: SERVICES[7],  bg: "#F0F9FF", ic: "#0EA5E9" },
              { s: SERVICES[8],  bg: "#FDF4FF", ic: "#C026D3" },
              { s: SERVICES[9],  bg: "#F7FEE7", ic: "#65A30D" },
              { s: SERVICES[10], bg: "#FFF1F2", ic: "#F43F5E" },
              { s: SERVICES[11], bg: "#F0FDFA", ic: "#14B8A6" },
              { s: SERVICES[12], bg: "#FEF3C7", ic: "#D97706" },
              { s: SERVICES[13], bg: "#EDE9FE", ic: "#7C3AED" },
              { s: SERVICES[14], bg: "#FDF2F8", ic: "#EC4899" },
              { s: SERVICES[15], bg: "#FFF7ED", ic: "#EA580C" },
              { s: SERVICES[16], bg: "#FEF9C3", ic: "#CA8A04" },
              { s: SERVICES[17], bg: "#F0F9FF", ic: "#0284C7" },
            ].map(({ s, bg, ic }) => (
              <button
                key={s.id}
                onClick={() => openOrder(s)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, cursor: "pointer", textAlign: "left", transition: "all .16s", boxShadow: "0 1px 2px rgba(0,0,0,.04)", fontFamily: "inherit" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,.09)"; e.currentTarget.style.borderColor = ic; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04)"; e.currentTarget.style.borderColor = "#E5E7EB"; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: ic }}>
                  <s.Icon size={18} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.ink, letterSpacing: "-.01em", lineHeight: 1.3 }}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST – světlý proužek */}
      <div style={{ background: "#F8FAFC", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB", padding: "32px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 24 }}>
          {[
            { emoji: "🔍", title: "Ověření šikulové",     desc: "Profily i recenze jsou reálné.", color: "#3B82F6", bg: "#EFF6FF" },
            { emoji: "💬", title: "Nabídky zdarma",        desc: "Zákazník za poptávku neplatí nic.", color: "#22C55E", bg: "#F0FDF4" },
            { emoji: "⚡", title: "Reakce do 48 hodin",    desc: "Urgentní zakázky vyřídíme rychle.", color: "#F97316", bg: "#FFF7ED" },
            { emoji: "🤝", title: "Platíte přímo šikulovi", desc: "Žádná provize, žádný prostředník.", color: "#A855F7", bg: "#FAF5FF" },
          ].map(({ emoji, title, desc, color, bg }) => (
            <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {emoji}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 2, letterSpacing: "-.01em" }}>{title}</div>
                <div style={{ fontSize: 12, color: T.ink3, lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      </>)}
      </Layout>

      {orderForm !== null && <OrderForm initialService={orderForm.service} onClose={() => setOrderForm(null)} />}
      {regForm   !== null && <RegForm   plan={regForm.plan} onClose={() => setRegForm(null)} onRegistered={loginSikula} />}
      {loginModal && <LoginModal onClose={() => setLoginModal(false)} onReg={openReg} onOrder={openOrder} onFaktury={() => { setLoginModal(false); setPage("faktury"); window.scrollTo(0,0); }} onDemoLogin={loginSikula} onGetDemo={() => DEMO_SIKULA} />}

    </>
  );
}

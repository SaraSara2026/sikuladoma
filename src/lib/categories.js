// Kategorie a podkategorie služeb.
// Tento soubor používá SVG Icon komponenty (na rozdíl od src/data.js,
// který má emoji ikony pro homepage / mobilní UI).
//
// Tvar CATEGORIES item: { id, label, Icon: ReactComponent }

import {
  IcClean, IcWrench, IcPlumbing, IcElectric, IcPaint, IcTile, IcFloor,
  IcFurniture, IcGarden, IcMove, IcTech, IcCar, IcHeart, IcPaw,
  IcChild, IcHammer, IcFlameSvc, IcMonitor,
} from "../ui/icons/ServiceIcons.jsx";

export const CATEGORIES = [
  { id: "domacnost",   label: "Domácnost a úklid",            Icon: IcClean },
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
  { id: "doprava",     label: "Auto, doprava, pomoc",         Icon: IcCar },
  { id: "seniori",     label: "Péče o seniory",               Icon: IcHeart },
  { id: "zvirata",     label: "Zvířata",                      Icon: IcPaw },
  { id: "hlidani",     label: "Hlídání dětí",                 Icon: IcChild },
  { id: "hodinovy",    label: "Hodinový manžel",              Icon: IcHammer },
  { id: "kotle",       label: "Kotle, topení, komíny",        Icon: IcFlameSvc },
  { id: "it",          label: "IT pomoc",                     Icon: IcMonitor },
];

export const OTHER = "Jiné / nevím";

export const SUBCATEGORIES = {
  domacnost:  ["Běžný úklid bytu / domu", "Jednorázový velký úklid", "Úklid po rekonstrukci", "Mytí oken", "Žehlení", "Praní / péče o prádlo", "Úklid společných prostor", "Úklid kanceláře", OTHER],
  opravy:     ["Montáž polic", "Montáž nábytku", "Vrtání", "Drobné opravy v bytě", "Výměna kliky, zámku, pantů", "Zavěšení obrazů, garnýží, zrcadel", "Seřízení dveří / skříněk", "Zámečník", OTHER],
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
  kotle:      ["Oprava kotle", "Servis kotle", "Revize kotle", "Radiátory", "Podlahové topení", "Tepelná čerpadla", "Kominík", "Čištění komínu", "Revize komínu", "Kontrola spalinové cesty", "Kominické práce", OTHER],
  it:         ["Nastavení Wi-Fi", "Pomoc s počítačem", "Instalace tiskárny", "Chytrá TV", "Mobilní telefon", "Chytrá domácnost", OTHER],
};

// Alias pro zpětnou kompatibilitu (RegForm.jsx používá SERVICES jako CATEGORIES).
export const SERVICES = CATEGORIES;

// Barvy pro kartičky kategorií (OrderForm krok 0).
export const CAT_COLORS = {
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

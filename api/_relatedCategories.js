// Mapování příbuzných kategorií — šikula uvidí (a dostane e-mail) i o poptávkách
// z blízkých oborů, ne jen z přesně zvolené kategorie.
//
// Schváleno 2026-07-28, tři konzervativní shluky (2026-08: doplněna
// stineni_klima do shluku A — běžná montážní/technická práce, ne citlivá):
//   A - generalista / drobné práce a technika: hodinovy, opravy, nabytek, spotrebice, it, stineni_klima
//   B - stavební a renovační práce: malovani, obklady, podlahy
//   C - stěhování a doprava: stehovani, doprava
// Odborné/bezpečnostní kategorie (elektro, instalater, kotle) a citlivé služby
// (seniori, hlidani) se záměrně NEROZŠIŘUJÍ. domacnost, zahrada a zvirata
// zůstávají samostatné.

const CLUSTERS = [
  ['hodinovy', 'opravy', 'nabytek', 'spotrebice', 'it', 'stineni_klima'],
  ['malovani', 'obklady', 'podlahy'],
  ['stehovani', 'doprava'],
];

const RELATED_CATEGORIES = {};
for (const cluster of CLUSTERS) {
  for (const id of cluster) {
    RELATED_CATEGORIES[id] = cluster.filter(x => x !== id);
  }
}

// Rozšíří jednu kategorii nebo pole kategorií o schválené příbuzné kategorie.
// Vrací Set, který vždy obsahuje i vstupní kategorii/kategorie samotné.
export function expandCategories(categoryOrList) {
  const input = Array.isArray(categoryOrList) ? categoryOrList : [categoryOrList];
  const out = new Set();
  for (const id of input) {
    if (!id) continue;
    out.add(id);
    for (const rel of RELATED_CATEGORIES[id] || []) out.add(rel);
  }
  return out;
}

export const CATEGORY_LABELS = {
  domacnost:  'Domácnost a úklid',
  opravy:     'Drobné opravy a montáže',
  instalater: 'Instalatérské práce',
  elektro:    'Elektro práce',
  malovani:   'Malířské a stavební práce',
  obklady:    'Obklady, dlažby, koupelny',
  podlahy:    'Podlahy',
  nabytek:    'Nábytek a truhlářské práce',
  zahrada:    'Zahrada',
  stehovani:  'Stěhování a odvoz',
  spotrebice: 'Spotřebiče a technika',
  doprava:    'Auto, doprava, pomoc',
  // seniori: už se veřejně nenabízí (viz src/lib/categories.js), label zachován
  // jen kvůli starým objednávkám/e-mailům, ať se nezobrazí "undefined".
  seniori:    'Péče o seniory',
  stineni_klima: 'Stínění, žaluzie a klimatizace',
  zvirata:    'Zvířata',
  hlidani:    'Hlídání dětí',
  hodinovy:   'Hodinový manžel',
  kotle:      'Kotle, topení, komíny',
  it:         'IT pomoc',
};

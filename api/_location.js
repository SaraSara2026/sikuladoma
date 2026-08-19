// Parovani poptavky se sikulou podle lokality - jednoduche ceske MVP bez map,
// bez geolokacniho API a bez pocitani vzdalenosti v km. Pouziva:
//   1. PSC (presna shoda, pokud ho maji vyplnene obe strany),
//   2. normalizovany textovy prunik obce/oblasti (diakritika, velikost
//      pismen, interpunkce a obecna slova typu "a okoli" se ignoruji).
//
// Starsi poptavky (pred zavedenim zip/city_area) maji tato pole NULL -
// pro ne se obecna lokalita dopocita ze starsiho volneho pole `city`
// (posledni cast za carkou), stejne jako se to delalo driv.

const STOPWORDS = new Set(['a', 'okoli', 'oblast', 'obec']);

// Odstrani diakritiku, velikost pismen, interpunkci a obecna slova typu
// "a okoli" - at se "Praha a okoli" a "PRAHA" chovaji jako totez.
export function normalizeLocation(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w && !STOPWORDS.has(w))
    .join(' ')
    .trim();
}

// Obecna lokalita poptavky (bez presne adresy) - pouzije strukturovane
// city_area, pokud existuje (nove poptavky), jinak spadne na starsi
// heuristiku (posledni cast volneho pole `city` za carkou) pro poptavky
// zalozene pred zavedenim zip/city_area.
export function generalOrderArea(order) {
  if (order?.city_area) return order.city_area;
  const parts = String(order?.city || '').split(',');
  return parts[parts.length - 1].trim();
}

// True, pokud lokalita poptavky odpovida oblasti, kde sikula pracuje.
// Sikula bez vyplnene city_area vidi poptavky ze vsech lokalit (stejne
// chovani jako driv, kdy se bez city parametru nefiltrovalo vubec).
export function locationMatches(sikula, order) {
  const sikulaZip = String(sikula?.zip || '').replace(/\s+/g, '');
  const orderZip  = String(order?.zip  || '').replace(/\s+/g, '');
  if (sikulaZip && orderZip && sikulaZip === orderZip) return true;

  const sikulaArea = normalizeLocation(sikula?.city_area);
  if (!sikulaArea) return true;

  const orderArea = normalizeLocation(generalOrderArea(order));
  if (!orderArea) return false;

  return orderArea.includes(sikulaArea) || sikulaArea.includes(orderArea);
}

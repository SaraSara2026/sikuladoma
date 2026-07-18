// Telefon — výchozí formát je český: +420 XXX XXX XXX.
// Cizí předvolby (jiné než +420) se nechávají v původním tvaru,
// jen se sjednotí mezery — agresivně se nerozebírají.

function collapseSpaces(s) {
  return String(s || '').trim().replace(/\s+/g, ' ');
}

function toCompactDigitsPlus(raw) {
  let s = String(raw || '').trim().replace(/[^\d+]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  return s;
}

function isForeignPrefix(compact) {
  return compact.startsWith('+') && !compact.startsWith('+420');
}

// Naformátuje telefon na "+420 XXX XXX XXX", pokud jde o české číslo
// (bez předvolby, s +420, nebo s 00420). Zahraniční předvolby nechá být,
// jen sjednotí mezery.
export function formatPhoneCZ(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';

  const compact = toCompactDigitsPlus(trimmed);

  if (isForeignPrefix(compact)) {
    return collapseSpaces(trimmed.replace(/^00/, '+'));
  }

  const digits = compact.startsWith('+420') ? compact.slice(4) : compact;
  if (digits.length !== 9) {
    return digits ? `+420 ${digits}` : '';
  }
  return `+420 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
}

// true = prázdné pole, nebo platné české číslo (9 číslic po předvolbě),
// nebo zahraniční číslo (jiná předvolba — nevalidujeme přísně).
export function isValidPhoneCZ(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return true;

  const compact = toCompactDigitsPlus(trimmed);
  if (isForeignPrefix(compact)) return true;

  const digits = compact.startsWith('+420') ? compact.slice(4) : compact;
  return digits.length === 9;
}

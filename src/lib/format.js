// Sdílené formátovací helpery pro cenu a datum nabídek/poptávek.

// "58000.00" / 58000 -> "58 000 Kč" (celé Kč, bez desetinných míst).
export function formatCurrencyCz(price) {
  const n = Math.round(Number(price));
  if (!Number.isFinite(n)) return `${price} Kč`;
  return `${n.toLocaleString('cs-CZ')} Kč`;
}

// "2026-07-31T00:00:00.000Z" -> "31. 7. 2026" (UTC getters, ať datum
// neujede o den kvůli časové zóně prohlížeče/serveru — DATE sloupec
// nemá čas dne).
export function formatDateCz(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${d.getUTCDate()}. ${d.getUTCMonth() + 1}. ${d.getUTCFullYear()}`;
}

// Termín poptávky (Do 48 hodin / Do 7 dní / Flexibilně) — orders.preferred_time
// nese přesný štítek. Starší poptávky (před zavedením tříúrovňového termínu)
// preferred_time nemají, jen orders.urgent — u nich termín dopočítáme z něj.
const TIMING_BY_LABEL = { 'Do 48 hodin': 'urgent', 'Do 7 dní': 'soon', 'Flexibilně': 'flexible' };

export function getOrderTiming(order) {
  if (!order) return null;
  const tone = TIMING_BY_LABEL[order.preferred_time];
  if (tone) return { label: order.preferred_time, tone };
  return order.urgent ? { label: 'Do 48 hodin', tone: 'urgent' } : { label: 'Flexibilně', tone: 'flexible' };
}

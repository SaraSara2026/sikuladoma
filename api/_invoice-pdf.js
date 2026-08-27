// Server-side generátor jednoduchého PDF faktury pro e-mailovou přílohu.
// Používá se jen pro "Odeslat" (viz api/invoices.js sendInvoice) — vzniká z
// dat faktury (žádný html2canvas screenshot), takže je vždy malý a spolehlivě
// projde limitem velikosti requestu na Vercelu. "Náhled" a "Stáhnout PDF" v
// dashboardu tenhle modul nepoužívají, dál běží přes html2canvas beze změny.
//
// Font: Noto Sans Regular (api/_assets/noto-sans-regular.js) — vložený kvůli
// české diakritice, kterou výchozí PDF fonty (Helvetica/Arial) neumí.

import { jsPDF } from 'jspdf';
import { NOTO_SANS_REGULAR_BASE64 } from './_assets/noto-sans-regular.js';

const BLUE = [0, 102, 204];
const ORANGE = [240, 120, 0];
const DARK = [26, 31, 46];
const GRAY = [107, 114, 128];
const LIGHT_GRAY = [156, 163, 175];
const BORDER = [229, 231, 235];
const BOX_BG = [239, 246, 255];
const BOX_BORDER = [191, 219, 254];
const ACCENT = [29, 78, 216];

function formatPriceKc(n) {
  const num = Math.round(Number(n));
  if (!Number.isFinite(num)) return '0 Kč';
  return num.toLocaleString('cs-CZ') + ' Kč';
}

// title,       dodavatel a odběratel: text bloky (zákazník / dodavatel data)
// amount:      základ (bez DPH), sazbaDph: 0/12/21 (0 = neplátce DPH)
export function buildInvoicePdf({
  invoiceId,
  title,
  amount,
  sazbaDph,
  customerName,
  customerEmail,
  createdDate,
  dueDate,
  dodavatel, // { jmeno, ico, dic, ulice, mesto, psc, platceDph }
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.addFileToVFS('NotoSans.ttf', NOTO_SANS_REGULAR_BASE64);
  doc.addFont('NotoSans.ttf', 'NotoSans', 'normal');
  doc.setFont('NotoSans');

  const marginX = 20;
  const rightX = 190;
  let y = 24;

  // ─── Hlavička: ŠikulaDoma + FAKTURA/číslo ──────────────────────────────
  doc.setFontSize(18);
  doc.setTextColor(...BLUE);
  doc.text('Šikula', marginX, y);
  const sikulaW = doc.getTextWidth('Šikula');
  doc.setTextColor(...ORANGE);
  doc.text('Doma', marginX + sikulaW, y);

  doc.setFontSize(14);
  doc.setTextColor(...DARK);
  doc.text('FAKTURA', rightX, y - 3, { align: 'right' });
  doc.setFontSize(11);
  doc.setTextColor(...ORANGE);
  doc.text(invoiceId || '', rightX, y + 3, { align: 'right' });

  y += 8;
  doc.setDrawColor(...BORDER);
  doc.line(marginX, y, rightX, y);
  y += 10;

  // ─── Dodavatel / Odběratel ──────────────────────────────────────────────
  const colW = (rightX - marginX - 8) / 2;
  const col2X = marginX + colW + 8;
  const blockTop = y;

  doc.setFontSize(9);
  doc.setTextColor(...LIGHT_GRAY);
  doc.text('DODAVATEL', marginX, y);
  doc.text('ODBĚRATEL', col2X, y);
  y += 6;

  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(dodavatel?.jmeno || '—', marginX, y);
  doc.text(customerName || '—', col2X, y);
  y += 5.5;

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  const dodavatelLines = [
    dodavatel?.ulice,
    [dodavatel?.psc, dodavatel?.mesto].filter(Boolean).join(' '),
    dodavatel?.ico && `IČO: ${dodavatel.ico}`,
    dodavatel?.platceDph && dodavatel?.dic && `DIČ: ${dodavatel.dic}`,
    dodavatel?.platceDph ? 'Plátce DPH' : 'Neplátce DPH',
  ].filter(Boolean);
  const odberatelLines = [customerEmail].filter(Boolean);

  let yD = y;
  for (const line of dodavatelLines) { doc.text(line, marginX, yD); yD += 4.5; }
  let yO = y;
  for (const line of odberatelLines) { doc.text(line, col2X, yO); yO += 4.5; }

  y = Math.max(yD, yO, blockTop + 5.5) + 8;

  // ─── Datumy ──────────────────────────────────────────────────────────────
  const dateColW = (rightX - marginX) / 3;
  const dates = [
    ['Datum vystavení', createdDate],
    ['Datum plnění', createdDate],
    ['Splatnost', dueDate],
  ];
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  dates.forEach(([label], i) => doc.text(label, marginX + i * dateColW, y));
  y += 5;
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  dates.forEach(([, val], i) => doc.text(val || '—', marginX + i * dateColW, y));
  y += 10;

  // ─── Položka ─────────────────────────────────────────────────────────────
  doc.setDrawColor(...BOX_BORDER);
  doc.setFillColor(...BOX_BG);
  doc.rect(marginX, y, rightX - marginX, 8, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...ACCENT);
  doc.text('POPIS', marginX + 3, y + 5.5);
  doc.text('CENA', rightX - 3, y + 5.5, { align: 'right' });
  y += 12;

  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  const titleLines = doc.splitTextToSize(title || '—', rightX - marginX - 40);
  doc.text(titleLines, marginX, y);
  doc.text(formatPriceKc(amount), rightX, y, { align: 'right' });
  y += titleLines.length * 4.8 + 8;

  // ─── DPH / K úhradě ──────────────────────────────────────────────────────
  const sazba = Number(sazbaDph) || 0;
  const celkem = sazba > 0 ? amount * (1 + sazba / 100) : amount;

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(sazba > 0 ? `DPH ${sazba} %` : 'DPH', marginX, y);
  doc.text(sazba > 0 ? formatPriceKc(amount * sazba / 100) : 'Neplátce DPH', rightX, y, { align: 'right' });
  y += 8;

  doc.setDrawColor(...BOX_BORDER);
  doc.setFillColor(...BOX_BG);
  doc.rect(marginX, y, rightX - marginX, 11, 'F');
  doc.setFontSize(11);
  doc.setTextColor(...ACCENT);
  doc.text('K úhradě', marginX + 4, y + 7.3);
  doc.setFontSize(13);
  doc.text(formatPriceKc(celkem), rightX - 4, y + 7.3, { align: 'right' });
  y += 20;

  // ─── Patička ─────────────────────────────────────────────────────────────
  doc.setDrawColor(...BORDER);
  doc.line(marginX, y, rightX, y);
  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(...LIGHT_GRAY);
  doc.text('Vystaveno přes ŠikulaDoma', 105, y, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}

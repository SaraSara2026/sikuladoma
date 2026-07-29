// Email utility — Resend integrace + HTML šablony.
// RESEND_API_KEY musí být ve Vercel env vars i v .env.local.
// APP_URL = base URL pro generování linků (default: https://sikuladoma.vercel.app)
//
// Šablony: jednoduché HTML inline-styled, brand barva #0EA5A4 (mint/teal).

import { Resend } from 'resend';

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY není nastaven. Přidej ho do .env.local a Vercel env vars.');
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function getAppUrl() {
  return process.env.APP_URL || 'https://sikuladoma.vercel.app';
}

// Bez ověřené domény musíme používat onboarding@resend.dev.
// Po ověření domény přepneme na noreply@sikuladoma.cz.
function getFromAddress() {
  return process.env.RESEND_FROM || 'ŠikulaDoma <onboarding@resend.dev>';
}

// ─── Verifikace emailu ──────────────────────────────────────────────────────
export async function sendVerificationEmail({ to, token }) {
  const url = `${getAppUrl()}/?page=verify-email&token=${encodeURIComponent(token)}`;
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: 'Ověřte svůj e-mail na ŠikulaDoma',
    html: verificationTemplate({ url }),
    text: verificationTextVersion({ url }),
  });
  if (error) {
    console.error('[email] verification send failed:', error);
    throw new Error('Nepodařilo se odeslat ověřovací e-mail.');
  }
  return data;
}

// ─── Reset hesla ────────────────────────────────────────────────────────────
export async function sendPasswordResetEmail({ to, name, token }) {
  const url = `${getAppUrl()}/?page=reset-password&token=${encodeURIComponent(token)}`;
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: 'Reset hesla na ŠikulaDoma',
    html: passwordResetTemplate({ name, url }),
  });
  if (error) {
    console.error('[email] reset send failed:', error);
    throw new Error('Nepodařilo se odeslat e-mail s resetem hesla.');
  }
  return data;
}

// ─── Potvrzení přijaté poptávky (zákazník) ─────────────────────────────────
// Čistě informační e-mail — žádný token, žádný ověřovací odkaz, nic neblokuje.
export async function sendOrderConfirmationEmail({ to, name, orderTitle, city, timing }) {
  const url = `${getAppUrl()}/?page=dashboard`;
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: 'Vaše poptávka na ŠikulaDoma byla odeslána',
    html: orderConfirmationTemplate({ name, orderTitle, city, timing, url }),
    text: orderConfirmationTextVersion({ name, orderTitle, city, timing, url }),
  });
  if (error) {
    console.error('[email] order confirmation send failed:', error);
    throw new Error('Nepodařilo se odeslat potvrzovací e-mail o poptávce.');
  }
  return data;
}

// ─── Nová poptávka v oboru (šikula) ─────────────────────────────────────────
// Informuje šikulu, že vznikla poptávka odpovídající jeho oboru (nebo schválené
// příbuzné kategorii). Posílá se i šikulovi bez aktivního tarifu — poptávku
// může vidět, reagovat může až po aktivaci tarifu.
export async function sendNewOrderNotificationEmail({ to, orderTitle, category, city, timing }) {
  const url = `${getAppUrl()}/?page=dashboard`;
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: 'Nová poptávka ve vašem okolí na ŠikulaDoma',
    html: newOrderNotificationTemplate({ orderTitle, category, city, timing, url }),
    text: newOrderNotificationTextVersion({ orderTitle, category, city, timing, url }),
  });
  if (error) {
    console.error('[email] new order notification send failed:', error);
    throw new Error('Nepodařilo se odeslat e-mail o nové poptávce.');
  }
  return data;
}

// ─── Nová nabídka na poptávku (zákazník) ────────────────────────────────────
// Informuje zákazníka, že mu šikula poslal nabídku na jeho poptávku.
export async function sendNewOfferNotificationEmail({ to, orderTitle, price, duration, date, message }) {
  const url = `${getAppUrl()}/?page=dashboard`;
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: 'Máte novou nabídku na ŠikulaDoma',
    html: newOfferNotificationTemplate({ orderTitle, price, duration, date, message, url }),
    text: newOfferNotificationTextVersion({ orderTitle, price, duration, date, message, url }),
  });
  if (error) {
    console.error('[email] new offer notification send failed:', error);
    throw new Error('Nepodařilo se odeslat e-mail o nové nabídce.');
  }
  return data;
}

// ─── Nová zpráva v chatu (zákazník i šikula) ─────────────────────────────────
// Stejná šablona pro obě strany. Pokud známe conversationId, odkaz vede rovnou
// na konkrétní konverzaci; jinak aspoň na dashboard.
export async function sendNewMessageNotificationEmail({ to, senderName, orderTitle, messagePreview, conversationId }) {
  const url = conversationId
    ? `${getAppUrl()}/?page=chat&conversation=${conversationId}`
    : `${getAppUrl()}/?page=dashboard`;
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: 'Máte novou zprávu na ŠikulaDoma',
    html: newMessageNotificationTemplate({ senderName, orderTitle, messagePreview, url }),
    text: newMessageNotificationTextVersion({ senderName, orderTitle, messagePreview, url }),
  });
  if (error) {
    console.error('[email] new message notification send failed:', error);
    throw new Error('Nepodařilo se odeslat e-mail o nové zprávě.');
  }
  return data;
}

// ─── HTML šablony ───────────────────────────────────────────────────────────
// box = předrenderované řádky (viz fieldRows) — oddělený zvýrazněný blok
// s hlavní informací, ať e-mail není jen dlouhý odstavec textu.
function baseLayout({ title, intro, box, ctaText, ctaUrl, footer }) {
  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F5F7F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1F2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F5F7F9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:32px 32px 16px 32px;text-align:center;border-bottom:1px solid #E5E7EB;">
              <div style="font-size:24px;font-weight:700;color:#0EA5A4;">ŠikulaDoma</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#111827;">${title}</h1>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.5;color:#374151;">${intro}</p>
              ${box ? `
              <div style="background:#F0FDFA;border:1px solid #99F6E4;border-left:4px solid #0EA5A4;border-radius:8px;padding:16px 18px;margin:0 0 24px 0;font-size:14px;line-height:1.8;color:#134E4A;">
                ${box}
              </div>
              ` : ''}
              ${ctaUrl ? `
              <div style="text-align:center;margin:28px 0;">
                <a href="${ctaUrl}" style="display:inline-block;padding:13px 30px;background:#0EA5A4;color:#FFFFFF;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;">${ctaText}</a>
              </div>
              <p style="margin:20px 0 6px 0;font-size:12px;color:#9CA3AF;">Nebo zkopírujte tento odkaz do prohlížeče:</p>
              <p style="margin:0 0 8px 0;font-size:12px;color:#0EA5A4;word-break:break-all;">${ctaUrl}</p>
              ` : ''}
              ${footer ? `
              <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0 0 0;">
              <p style="margin:16px 0 0 0;font-size:13px;color:#6B7280;line-height:1.5;">${footer}</p>
              ` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:#F9FAFB;text-align:center;font-size:12px;color:#9CA3AF;border-top:1px solid #E5E7EB;">
              ŠikulaDoma · Stavira s.r.o. · IČ: 29228379<br>
              <a href="https://sikuladoma.vercel.app" style="color:#9CA3AF;">sikuladoma.vercel.app</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Řádky pro zvýrazněný box e-mailu: [['Label', hodnota], ...] -> escapované HTML.
function fieldRows(pairs) {
  return pairs
    .filter(([, v]) => v)
    .map(([k, v]) => `<div style="margin-bottom:4px;"><strong>${escapeHtml(k)}:</strong> ${escapeHtml(String(v))}</div>`)
    .join('');
}

function verificationTemplate({ url }) {
  return baseLayout({
    title: 'Ověřte svůj e-mail',
    intro: 'Dobrý den,<br><br>děkujeme za registraci na ŠikulaDoma.<br><br>Pro dokončení ověření e-mailu klikněte na tlačítko níže. Po ověření budete moct bezpečně posílat nabídky zákazníkům.',
    ctaText: 'Ověřit e-mail',
    ctaUrl: url,
    footer: 'Odkaz je platný 24 hodin. Pokud jste se neregistroval(a), tento e-mail ignorujte.',
  });
}

function verificationTextVersion({ url }) {
  const lines = [
    'Dobrý den,',
    '',
    'děkujeme za registraci na ŠikulaDoma.',
    '',
    'Pro dokončení ověření e-mailu klikněte na odkaz níže:',
    '',
    `Ověřit e-mail: ${url}`,
    '',
    'Po ověření budete moct bezpečně posílat nabídky zákazníkům.',
    '',
    'ŠikulaDoma',
  ];
  return lines.join('\n');
}

// Vezme jen křestní jméno (první slovo před mezerou) z celého jména v DB.
// Bez skloňování — bezpečná neutrální varianta, ať sedí na jakékoliv jméno.
function firstName(fullName) {
  const trimmed = String(fullName || '').trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
}

function passwordResetTemplate({ name, url }) {
  const first = firstName(name);
  const greeting = first ? `Dobrý den, ${escapeHtml(first)},` : 'Dobrý den,';
  return baseLayout({
    title: 'Reset hesla',
    intro: `${greeting} požádal(a) jsi o reset hesla na ŠikulaDoma. Klikni na tlačítko níže a nastav si nové heslo.`,
    ctaText: 'Resetovat heslo',
    ctaUrl: url,
    footer: 'Odkaz je platný 1 hodinu. Pokud jsi reset nepožadoval(a), tento e-mail ignoruj — tvé heslo zůstává beze změny.',
  });
}

function orderConfirmationTemplate({ name, orderTitle, city, timing, url }) {
  const first = firstName(name);
  return baseLayout({
    title: 'Poptávka byla odeslána',
    intro: `${first ? `Dobrý den, ${escapeHtml(first)},` : 'Dobrý den,'} vaši poptávku jsme přijali a zobrazíme ji šikulům ve vašem okolí.`,
    box: fieldRows([
      ['Poptávka', orderTitle],
      ['Místo', city],
      ['Čas', timing],
    ]),
    ctaText: 'Zobrazit poptávku',
    ctaUrl: url,
    footer: 'Do svého účtu se můžete přihlásit e-mailem a heslem, které jste zadali při odeslání poptávky.',
  });
}

function orderConfirmationTextVersion({ name, orderTitle, city, timing, url }) {
  const first = firstName(name);
  const greeting = first ? `Dobrý den, ${first},` : 'Dobrý den,';
  const lines = [
    greeting,
    '',
    'vaši poptávku jsme přijali a zobrazíme ji šikulům ve vašem okolí.',
    '',
    orderTitle ? `Poptávka: ${orderTitle}` : null,
    city ? `Místo: ${city}` : null,
    timing ? `Čas: ${timing}` : null,
    '',
    `Zobrazit poptávku: ${url}`,
    '',
    'Do svého účtu se můžete přihlásit e-mailem a heslem, které jste zadali při odeslání poptávky.',
    '',
    'ŠikulaDoma',
  ].filter(line => line !== null);
  return lines.join('\n');
}

function newOrderNotificationTemplate({ orderTitle, category, city, timing, url }) {
  return baseLayout({
    title: 'Nová poptávka ve vašem okolí',
    intro: 've vašem okolí přibyla nová poptávka, která odpovídá vašemu oboru.',
    box: fieldRows([
      ['Poptávka', orderTitle],
      ['Kategorie', category],
      ['Místo', city],
      ['Termín', timing],
    ]),
    ctaText: 'Zobrazit poptávku',
    ctaUrl: url,
    footer: 'Pokud máte zájem, přihlaste se do svého profilu a pošlete zákazníkovi nabídku.',
  });
}

function newOrderNotificationTextVersion({ orderTitle, category, city, timing, url }) {
  const lines = [
    'Dobrý den,',
    '',
    've vašem okolí přibyla nová poptávka, která odpovídá vašemu oboru.',
    '',
    'Poptávka:',
    orderTitle || '—',
    '',
    'Kategorie:',
    category || '—',
    '',
    'Místo:',
    city || '—',
    '',
    'Termín:',
    timing || '—',
    '',
    `Zobrazit poptávku: ${url}`,
    '',
    'Pokud máte zájem, přihlaste se do svého profilu a pošlete zákazníkovi nabídku.',
    '',
    'ŠikulaDoma',
  ];
  return lines.join('\n');
}

function formatDateCz(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${d.getUTCDate()}. ${d.getUTCMonth() + 1}. ${d.getUTCFullYear()}`;
}

function formatPriceKc(price) {
  const n = Math.round(Number(price));
  if (!Number.isFinite(n)) return null;
  return n.toLocaleString('cs-CZ');
}

function newOfferNotificationTemplate({ orderTitle, price, duration, date, message, url }) {
  const priceStr = formatPriceKc(price);
  const dateStr = formatDateCz(date);
  return baseLayout({
    title: 'Máte novou nabídku',
    intro: 'Na vaši poptávku přišla nová nabídka od šikuly.',
    box: fieldRows([
      ['Poptávka', orderTitle],
      ['Cena', priceStr ? `${priceStr} Kč` : null],
      ['Odhad délky práce', duration],
      ['Navrhovaný termín', dateStr],
      ['Zpráva šikuly', message],
    ]),
    ctaText: 'Zobrazit nabídku',
    ctaUrl: url,
    footer: 'Přihlaste se do svého zákaznického přehledu a nabídku si zobrazte.',
  });
}

function newOfferNotificationTextVersion({ orderTitle, price, duration, date, message, url }) {
  const priceStr = formatPriceKc(price);
  const dateStr = formatDateCz(date);
  const lines = [
    'Dobrý den,',
    '',
    'na vaši poptávku přišla nová nabídka od šikuly.',
    '',
    'Poptávka:',
    orderTitle || '—',
    '',
    'Cena:',
    priceStr ? `${priceStr} Kč` : '—',
    '',
    'Odhad délky práce:',
    duration || '—',
    '',
    'Navrhovaný termín:',
    dateStr || '—',
    '',
    'Zpráva šikuly:',
    message || '—',
    '',
    `Zobrazit nabídku: ${url}`,
    '',
    'Přihlaste se do svého zákaznického přehledu a nabídku si zobrazte.',
    '',
    'ŠikulaDoma',
  ];
  return lines.join('\n');
}

function newMessageNotificationTemplate({ senderName, orderTitle, messagePreview, url }) {
  return baseLayout({
    title: 'Máte novou zprávu',
    intro: 'Na ŠikulaDoma vám přišla nová zpráva.',
    box: fieldRows([
      ['Od', senderName],
      ['Zakázka', orderTitle],
      ['Zpráva', messagePreview],
    ]),
    ctaText: 'Otevřít zprávy',
    ctaUrl: url,
    footer: 'Po přihlášení můžete rovnou odpovědět.',
  });
}

function newMessageNotificationTextVersion({ senderName, orderTitle, messagePreview, url }) {
  const lines = [
    'Dobrý den,',
    '',
    'na ŠikulaDoma vám přišla nová zpráva.',
    '',
    'Od:',
    senderName || '—',
    '',
    'Zakázka:',
    orderTitle || '—',
    '',
    'Zpráva:',
    messagePreview || '—',
    '',
    `Otevřít zprávy: ${url}`,
    '',
    'Po přihlášení můžete rovnou odpovědět.',
    '',
    'ŠikulaDoma',
  ];
  return lines.join('\n');
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

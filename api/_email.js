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
export async function sendVerificationEmail({ to, name, token }) {
  const url = `${getAppUrl()}/?page=verify-email&token=${encodeURIComponent(token)}`;
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: 'Ověř svůj e-mail na ŠikulaDoma',
    html: verificationTemplate({ name, url }),
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

// ─── HTML šablony ───────────────────────────────────────────────────────────
function baseLayout({ title, intro, ctaText, ctaUrl, footer }) {
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
              <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:600;color:#111827;">${title}</h1>
              <p style="margin:0 0 24px 0;font-size:16px;line-height:1.5;color:#374151;">${intro}</p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${ctaUrl}" style="display:inline-block;padding:12px 28px;background:#0EA5A4;color:#FFFFFF;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">${ctaText}</a>
              </div>
              <p style="margin:24px 0 8px 0;font-size:13px;color:#6B7280;">Nebo zkopíruj tento odkaz do prohlížeče:</p>
              <p style="margin:0 0 24px 0;font-size:13px;color:#0EA5A4;word-break:break-all;">${ctaUrl}</p>
              <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
              <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.5;">${footer}</p>
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

function verificationTemplate({ name, url }) {
  return baseLayout({
    title: 'Ověř svůj e-mail',
    intro: `Ahoj ${escapeHtml(name)}, díky za registraci na ŠikulaDoma. Pro dokončení registrace klikni na tlačítko níže a ověř svůj e-mail.`,
    ctaText: 'Ověřit e-mail',
    ctaUrl: url,
    footer: 'Odkaz je platný 24 hodin. Pokud jsi se neregistroval(a), tento e-mail ignoruj.',
  });
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

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

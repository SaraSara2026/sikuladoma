// /api/invoices — GET, POST, PATCH, DELETE
// Šikula vidí + edituje jen své faktury. Admin vidí všechno.
// Edit/delete povolen jen pro status='draft' (rozpracované).

import { sql } from './_db.js';
import { requireUser, requireVerifiedUser } from './_auth.js';
import { sendInvoiceEmail } from './_email.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET')    return await listInvoices(req, res);
    // ?action=send sdílí tenhle jeden soubor místo nového api/invoices/send.js
    // — Vercel Hobby limituje počet serverless funkcí na 12 a ten je už plně
    // vyčerpaný (viz stejný vzorec v api/auth/[action].js).
    if (req.method === 'POST' && req.query?.action === 'send') return await sendInvoice(req, res);
    if (req.method === 'POST')   return await createInvoice(req, res);
    if (req.method === 'PATCH')  return await updateInvoice(req, res);
    if (req.method === 'DELETE') return await deleteInvoice(req, res);

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[/api/invoices]', err);
    return res.status(500).json({ error: err.message });
  }
}

async function listInvoices(req, res) {
  const me = await requireUser(req, res);
  if (!me) return;

  // Admin vidí všechno, ostatní jen své jako sikula nebo zákazník
  // paid_at se vrací jako čistý ISO timestamp (ne TO_CHAR text jako created/due)
  // — Výdělky v dashboardu z něj počítají "tento měsíc" a potřebují si ho
  // spolehlivě naparsovat na Date, ne re-parsovat český formát.
  const rows = me.role === 'admin'
    ? await sql`
        SELECT id, title, amount, customer_name AS customer, customer_email,
               TO_CHAR(created_date, 'FMDD. FMMM. YYYY') AS created,
               TO_CHAR(due_date,     'FMDD. FMMM. YYYY') AS due,
               status, paid_at, sikula_id, customer_id
        FROM invoices ORDER BY created_at DESC LIMIT 500
      `
    : await sql`
        SELECT id, title, amount, customer_name AS customer, customer_email,
               TO_CHAR(created_date, 'FMDD. FMMM. YYYY') AS created,
               TO_CHAR(due_date,     'FMDD. FMMM. YYYY') AS due,
               status, paid_at
        FROM invoices
        WHERE sikula_id = ${me.id} OR customer_id = ${me.id}
        ORDER BY created_at DESC LIMIT 200
      `;
  return res.status(200).json(rows);
}

async function createInvoice(req, res) {
  const me = await requireUser(req, res);
  if (!me) return;
  if (me.role !== 'sikula' && me.role !== 'admin') {
    return res.status(403).json({ error: 'Faktury může vystavovat jen šikula.' });
  }

  const { id, title, amount, customer_name, customer_email, due_date, status = 'draft' } = req.body ?? {};
  if (!id || !title || amount == null || !customer_name || !due_date) {
    return res.status(400).json({ error: 'Vyplň všechna povinná pole: ID, název, částka, zákazník, splatnost.' });
  }
  if (Number(amount) <= 0) return res.status(400).json({ error: 'Částka musí být kladná.' });

  try {
    const [row] = await sql`
      INSERT INTO invoices (id, sikula_id, title, amount, customer_name, customer_email, due_date, status)
      VALUES (${id}, ${me.id}, ${title}, ${amount}, ${customer_name}, ${customer_email || null}, ${due_date}, ${status})
      RETURNING *
    `;
    return res.status(201).json(row);
  } catch (err) {
    if (String(err.message).includes('duplicate')) {
      return res.status(409).json({ error: 'Faktura s tímto číslem už existuje.' });
    }
    throw err;
  }
}

async function updateInvoice(req, res) {
  const me = await requireUser(req, res);
  if (!me) return;

  const id = req.query?.id || req.body?.id;
  if (!id) return res.status(400).json({ error: 'Chybí id faktury.' });

  const [existing] = await sql`SELECT id, sikula_id, status FROM invoices WHERE id = ${id}`;
  if (!existing) return res.status(404).json({ error: 'Faktura nenalezena.' });
  if (me.role !== 'admin' && existing.sikula_id !== me.id) {
    return res.status(403).json({ error: 'Nemáš oprávnění upravit tuto fakturu.' });
  }
  // Stornovaná faktura zůstává v evidenci navždy (na rozdíl od smazání
  // konceptu), ale je to konečný, uzamčený stav — žádné další úpravy obsahu
  // ani stavu, ani pro vlastníka, ani pro admina.
  if (existing.status === 'cancelled') {
    return res.status(409).json({ error: 'Stornovaná faktura je uzamčená a nelze ji dál upravovat.' });
  }

  const b = req.body ?? {};
  const title          = b.title          != null ? String(b.title) : null;
  const amount         = b.amount         != null ? Number(b.amount) : null;
  const customer_name  = b.customer_name  != null ? String(b.customer_name) : null;
  const customer_email = b.customer_email != null ? String(b.customer_email) : null;
  const due_date       = b.due_date       != null ? b.due_date : null;
  const status         = b.status         != null ? String(b.status) : null;

  // Obsah faktury (název, částka, zákazník, splatnost) lze opravit i u
  // odeslané/zaplacené faktury — šikula musí umět opravit chybu i po
  // vystavení, ne jen u konceptu. Uzamčený je jen storno (viz výše).
  if (status !== null && !['draft', 'sent', 'paid', 'late', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Neplatný stav faktury.' });
  }

  if (amount !== null && amount <= 0) return res.status(400).json({ error: 'Částka musí být kladná.' });

  // paid_at se nastaví na NOW() jen v okamžiku přechodu DO stavu 'paid' (ne při
  // každém uložení zaplacené faktury) a vynuluje se, když faktura opustí
  // 'paid' — ať už "↩ Zrušit úhradu" (zpět na 'sent'), nebo storno. status
  // v CASE odkazuje na řádek PŘED update (Postgres v jednom UPDATE ... SET
  // vyhodnocuje výrazy proti původním hodnotám), takže se nepřepisuje sama
  // sebou. Výdělky počítají jen status='paid', takže stornovaná i vrácená
  // faktura z nich automaticky vypadnou bez zvláštní logiky navíc.
  const [row] = await sql`
    UPDATE invoices SET
      title          = COALESCE(${title},          title),
      amount         = COALESCE(${amount},         amount),
      customer_name  = COALESCE(${customer_name},  customer_name),
      customer_email = COALESCE(${customer_email}, customer_email),
      due_date       = COALESCE(${due_date},       due_date),
      status         = COALESCE(${status}::text,         status),
      paid_at       = CASE
                         WHEN ${status}::text = 'paid' AND status IS DISTINCT FROM 'paid' THEN NOW()
                         WHEN ${status}::text IS NOT NULL AND ${status}::text != 'paid' THEN NULL
                         ELSE paid_at
                       END,
      updated_at    = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return res.status(200).json(row);
}

async function deleteInvoice(req, res) {
  const me = await requireUser(req, res);
  if (!me) return;

  const id = req.query?.id;
  if (!id) return res.status(400).json({ error: 'Chybí id faktury.' });

  const [existing] = await sql`SELECT id, sikula_id, status FROM invoices WHERE id = ${id}`;
  if (!existing) return res.status(404).json({ error: 'Faktura nenalezena.' });
  if (me.role !== 'admin' && existing.sikula_id !== me.id) {
    return res.status(403).json({ error: 'Nemáš oprávnění smazat tuto fakturu.' });
  }
  if (existing.status !== 'draft' && me.role !== 'admin') {
    return res.status(409).json({ error: 'Smazat lze jen koncepty.' });
  }

  await sql`DELETE FROM invoices WHERE id = ${id}`;
  return res.status(200).json({ ok: true });
}

// POST /api/invoices?action=send&id=... — pošle fakturu e-mailem zákazníkovi.
// MVP: čistý text/HTML e-mail se souhrnem faktury, bez PDF přílohy a bez
// odkazu do appky (odkaz na fakturu by musel mít vlastní bezpečnostní vrstvu,
// aby neotevřel data jinému přihlášenému účtu — pro MVP se tomu radši úplně
// vyhýbáme). Šikula může fakturu doplňkově poslat jako PDF sama (Stáhnout PDF).
async function sendInvoice(req, res) {
  const me = await requireUser(req, res);
  if (!me) return;

  const id = req.query?.id || req.body?.id;
  if (!id) return res.status(400).json({ error: 'Chybí id faktury.' });

  const [existing] = await sql`
    SELECT id, sikula_id, title, amount, customer_name, customer_email,
           TO_CHAR(due_date, 'FMDD. FMMM. YYYY') AS due, status
    FROM invoices WHERE id = ${id}
  `;
  if (!existing) return res.status(404).json({ error: 'Faktura nenalezena.' });
  // Stejná vlastnická kontrola jako u update/delete — šikula smí odeslat jen
  // svou vlastní fakturu, nikdy fakturu jiného šikuly.
  if (me.role !== 'admin' && existing.sikula_id !== me.id) {
    return res.status(403).json({ error: 'Nemáš oprávnění odeslat tuto fakturu.' });
  }
  if (existing.status === 'cancelled') {
    return res.status(409).json({ error: 'Stornovanou fakturu nelze odeslat zákazníkovi.' });
  }
  if (!existing.customer_email) {
    return res.status(400).json({ error: 'U faktury chybí e-mail zákazníka. Doplňte ho prosím ručně.' });
  }

  try {
    await sendInvoiceEmail({
      to: existing.customer_email,
      sikulaName: me.name,
      sikulaPhone: me.phone,
      sikulaEmail: me.email,
      invoiceId: existing.id,
      title: existing.title,
      amount: existing.amount,
      due: existing.due,
    });
  } catch (err) {
    console.error('[invoices] send email failed:', err);
    return res.status(500).json({ error: 'Fakturu se nepodařilo odeslat. Zkuste to prosím znovu.' });
  }

  // Jen draft -> sent po prvním úspěšném odeslání. sent i paid zůstávají,
  // jak byly — opětovné odeslání (např. po opravě) nesmí měnit platební
  // stav, částku ani obsah faktury.
  if (existing.status === 'draft') {
    await sql`UPDATE invoices SET status = 'sent', updated_at = NOW() WHERE id = ${id}`;
  }

  return res.status(200).json({ ok: true });
}

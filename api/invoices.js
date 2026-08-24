// /api/invoices — GET, POST, PATCH, DELETE
// Šikula vidí + edituje jen své faktury. Admin vidí všechno.
// Edit/delete povolen jen pro status='draft' (rozpracované).

import { sql } from './_db.js';
import { requireUser, requireVerifiedUser } from './_auth.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET')    return listInvoices(req, res);
    if (req.method === 'POST')   return createInvoice(req, res);
    if (req.method === 'PATCH')  return updateInvoice(req, res);
    if (req.method === 'DELETE') return deleteInvoice(req, res);

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
        SELECT id, title, amount, customer_name AS customer,
               TO_CHAR(created_date, 'FMDD. FMMM. YYYY') AS created,
               TO_CHAR(due_date,     'FMDD. FMMM. YYYY') AS due,
               status, paid_at, sikula_id, customer_id
        FROM invoices ORDER BY created_at DESC LIMIT 500
      `
    : await sql`
        SELECT id, title, amount, customer_name AS customer,
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

  const { id, title, amount, customer_name, due_date, status = 'draft' } = req.body ?? {};
  if (!id || !title || amount == null || !customer_name || !due_date) {
    return res.status(400).json({ error: 'Vyplň všechna povinná pole: ID, název, částka, zákazník, splatnost.' });
  }
  if (Number(amount) <= 0) return res.status(400).json({ error: 'Částka musí být kladná.' });

  try {
    const [row] = await sql`
      INSERT INTO invoices (id, sikula_id, title, amount, customer_name, due_date, status)
      VALUES (${id}, ${me.id}, ${title}, ${amount}, ${customer_name}, ${due_date}, ${status})
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
  const title         = b.title         != null ? String(b.title) : null;
  const amount        = b.amount        != null ? Number(b.amount) : null;
  const customer_name = b.customer_name != null ? String(b.customer_name) : null;
  const due_date      = b.due_date      != null ? b.due_date : null;
  const status        = b.status        != null ? String(b.status) : null;

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
      title         = COALESCE(${title},         title),
      amount        = COALESCE(${amount},        amount),
      customer_name = COALESCE(${customer_name}, customer_name),
      due_date      = COALESCE(${due_date},      due_date),
      status        = COALESCE(${status},        status),
      paid_at       = CASE
                         WHEN ${status} = 'paid' AND status IS DISTINCT FROM 'paid' THEN NOW()
                         WHEN ${status} IS NOT NULL AND ${status} != 'paid' THEN NULL
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

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
  const rows = me.role === 'admin'
    ? await sql`
        SELECT id, title, amount, customer_name AS customer,
               TO_CHAR(created_date, 'FMDD. FMMM. YYYY') AS created,
               TO_CHAR(due_date,     'FMDD. FMMM. YYYY') AS due,
               status, sikula_id, customer_id
        FROM invoices ORDER BY created_at DESC LIMIT 500
      `
    : await sql`
        SELECT id, title, amount, customer_name AS customer,
               TO_CHAR(created_date, 'FMDD. FMMM. YYYY') AS created,
               TO_CHAR(due_date,     'FMDD. FMMM. YYYY') AS due,
               status
        FROM invoices
        WHERE sikula_id = ${me.id} OR customer_id = ${me.id}
        ORDER BY created_at DESC LIMIT 200
      `;
  return res.status(200).json(rows);
}

async function createInvoice(req, res) {
  const me = await requireVerifiedUser(req, res);
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
  if (existing.status !== 'draft' && me.role !== 'admin') {
    return res.status(409).json({ error: 'Lze upravovat jen koncepty. Odeslaná faktura je uzamčená.' });
  }

  const b = req.body ?? {};
  const title         = b.title         != null ? String(b.title) : null;
  const amount        = b.amount        != null ? Number(b.amount) : null;
  const customer_name = b.customer_name != null ? String(b.customer_name) : null;
  const due_date      = b.due_date      != null ? b.due_date : null;
  const status        = b.status        != null ? String(b.status) : null;

  if (amount !== null && amount <= 0) return res.status(400).json({ error: 'Částka musí být kladná.' });

  const [row] = await sql`
    UPDATE invoices SET
      title         = COALESCE(${title},         title),
      amount        = COALESCE(${amount},        amount),
      customer_name = COALESCE(${customer_name}, customer_name),
      due_date      = COALESCE(${due_date},      due_date),
      status        = COALESCE(${status},        status),
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

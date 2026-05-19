import { sql } from './_db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT id, title, amount, customer_name AS customer,
               TO_CHAR(created_date, 'FMDD. FMMM. YYYY') AS created,
               TO_CHAR(due_date,     'FMDD. FMMM. YYYY') AS due,
               status
        FROM invoices
        ORDER BY created_at DESC
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { id, title, amount, customer_name, due_date, status = 'draft' } = req.body ?? {};
      if (!id || !title || amount == null || !customer_name || !due_date) {
        return res.status(400).json({ error: 'Missing required fields: id, title, amount, customer_name, due_date' });
      }
      const [row] = await sql`
        INSERT INTO invoices (id, title, amount, customer_name, due_date, status)
        VALUES (${id}, ${title}, ${amount}, ${customer_name}, ${due_date}, ${status})
        RETURNING *
      `;
      return res.status(201).json(row);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[/api/invoices] error:', err);
    return res.status(500).json({ error: err.message });
  }
}

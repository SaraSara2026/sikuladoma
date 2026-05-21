import { sql } from './_db.js';
import { requireUser } from './_auth.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET')  return listMessages(req, res);
    if (req.method === 'POST') return sendMessage(req, res);
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[/api/messages]', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// Ověří, že jsem účastníkem konverzace. Vrátí konverzaci nebo null.
async function assertParticipant(conversationId, userId) {
  const [conv] = await sql`
    SELECT id, customer_id, sikula_id, order_id
    FROM conversations WHERE id = ${conversationId}
  `;
  if (!conv) return null;
  if (conv.customer_id !== userId && conv.sikula_id !== userId) return null;
  return conv;
}

// GET /api/messages?conversation_id=
async function listMessages(req, res) {
  const me = await requireUser(req, res);
  if (!me) return;

  const convId = Number(req.query?.conversation_id);
  if (!convId) return res.status(400).json({ error: 'Chybí conversation_id.' });

  const conv = await assertParticipant(convId, me.id);
  if (!conv) return res.status(403).json({ error: 'Forbidden' });

  // Načti zprávy + označ ty od protistrany jako přečtené.
  const rows = await sql`
    SELECT id, conversation_id, sender_id, text, read_at, created_at
    FROM messages WHERE conversation_id = ${convId}
    ORDER BY created_at ASC
  `;
  await sql`
    UPDATE messages SET read_at = NOW()
    WHERE conversation_id = ${convId}
      AND sender_id != ${me.id}
      AND read_at IS NULL
  `;
  return res.status(200).json({ messages: rows });
}

// POST /api/messages { conversation_id, text }
async function sendMessage(req, res) {
  const me = await requireUser(req, res);
  if (!me) return;

  const { conversation_id, text } = req.body ?? {};
  const convId = Number(conversation_id);
  const body   = String(text || '').trim();

  if (!convId)            return res.status(400).json({ error: 'Chybí conversation_id.' });
  if (body.length === 0)  return res.status(400).json({ error: 'Zpráva nemůže být prázdná.' });
  if (body.length > 4000) return res.status(400).json({ error: 'Zpráva je příliš dlouhá (max 4000 znaků).' });

  const conv = await assertParticipant(convId, me.id);
  if (!conv) return res.status(403).json({ error: 'Forbidden' });

  const [row] = await sql`
    INSERT INTO messages (conversation_id, sender_id, text)
    VALUES (${convId}, ${me.id}, ${body})
    RETURNING *
  `;
  return res.status(201).json({ message: row });
}

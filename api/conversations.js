import { sql } from './_db.js';
import { requireUser } from './_auth.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET')  return listConversations(req, res);
    if (req.method === 'POST') return createConversation(req, res);
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[/api/conversations]', err);
    return res.status(500).json({ error: 'Server error', _debug: String(err?.message || err), _stack: String(err?.stack || '').split('\n').slice(0, 4) });
  }
}

// GET /api/conversations
// Vrátí všechny konverzace, kde figuruji jako customer nebo sikula.
// Doplní jméno protistrany + poslední zprávu.
async function listConversations(req, res) {
  const me = await requireUser(req, res);
  if (!me) return;

  const rows = await sql`
    SELECT
      c.id,
      c.customer_id,
      c.sikula_id,
      c.order_id,
      c.created_at,
      ord.title AS order_title,
      CASE WHEN c.customer_id = ${me.id}
           THEN s.name ELSE cu.name END AS other_name,
      CASE WHEN c.customer_id = ${me.id}
           THEN s.avatar ELSE cu.avatar END AS other_avatar,
      (SELECT text FROM messages m WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC LIMIT 1) AS last_message,
      (SELECT created_at FROM messages m WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
      (SELECT COUNT(*) FROM messages m
        WHERE m.conversation_id = c.id
          AND m.sender_id != ${me.id}
          AND m.read_at IS NULL) AS unread_count
    FROM conversations c
    LEFT JOIN users cu ON cu.id = c.customer_id
    LEFT JOIN users s  ON s.id  = c.sikula_id
    LEFT JOIN orders ord ON ord.id = c.order_id
    WHERE c.customer_id = ${me.id} OR c.sikula_id = ${me.id}
    ORDER BY COALESCE(last_message_at, c.created_at) DESC
  `;
  return res.status(200).json({ conversations: rows });
}

// POST /api/conversations { other_user_id, order_id? }
// Založí nebo vrátí existující konverzaci.
async function createConversation(req, res) {
  const me = await requireUser(req, res);
  if (!me) return;

  const { other_user_id, order_id } = req.body ?? {};
  if (!other_user_id) return res.status(400).json({ error: 'Chybí other_user_id.' });
  if (Number(other_user_id) === me.id) return res.status(400).json({ error: 'Nelze založit konverzaci sám se sebou.' });

  const [other] = await sql`SELECT id, role FROM users WHERE id = ${Number(other_user_id)}`;
  if (!other) return res.status(404).json({ error: 'Druhý uživatel neexistuje.' });

  // Určíme, kdo je customer a kdo sikula (podle role).
  let customer_id, sikula_id;
  if (me.role === 'customer' && other.role === 'sikula') {
    customer_id = me.id; sikula_id = other.id;
  } else if (me.role === 'sikula' && other.role === 'customer') {
    customer_id = other.id; sikula_id = me.id;
  } else {
    return res.status(400).json({ error: 'Konverzace musí být mezi zákazníkem a šikulou.' });
  }

  const orderRef = order_id ? Number(order_id) : null;

  const [row] = await sql`
    INSERT INTO conversations (customer_id, sikula_id, order_id)
    VALUES (${customer_id}, ${sikula_id}, ${orderRef})
    ON CONFLICT (customer_id, sikula_id, order_id) DO UPDATE SET created_at = conversations.created_at
    RETURNING *
  `;
  return res.status(201).json({ conversation: row });
}

// Tenké fetch wrappery pro REST endpointy.
// Session cookie posíláme automaticky díky credentials: 'include'.

const opts = (extra = {}) => ({ credentials: 'include', ...extra });
const json = { 'Content-Type': 'application/json' };

async function unwrap(res) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const d = await res.json(); msg = d.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// ─── Orders ─────────────────────────────────────────────────────────────────
export const ordersApi = {
  create: (data) => fetch('/api/orders', opts({ method: 'POST', headers: json, body: JSON.stringify(data) })).then(unwrap),
  list:   (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== ''));
    return fetch(`/api/orders${q.toString() ? `?${q}` : ''}`, opts()).then(unwrap);
  },
  patch:  (id, action) => fetch(`/api/orders/${id}`, opts({ method: 'PATCH', headers: json, body: JSON.stringify({ action }) })).then(unwrap),
};

// ─── Offers ─────────────────────────────────────────────────────────────────
export const offersApi = {
  create:    (data) => fetch('/api/offers', opts({ method: 'POST', headers: json, body: JSON.stringify(data) })).then(unwrap),
  listByOrder: (orderId) => fetch(`/api/offers?order_id=${orderId}`, opts()).then(unwrap),
  myOffers:  () => fetch('/api/offers', opts()).then(unwrap),
  patch:     (id, action) => fetch(`/api/offers/${id}`, opts({ method: 'PATCH', headers: json, body: JSON.stringify({ action }) })).then(unwrap),
};

// ─── Conversations ──────────────────────────────────────────────────────────
export const conversationsApi = {
  list:   () => fetch('/api/conversations', opts()).then(unwrap),
  create: ({ other_user_id, order_id }) => fetch('/api/conversations', opts({
    method: 'POST', headers: json, body: JSON.stringify({ other_user_id, order_id }),
  })).then(unwrap),
};

// ─── Messages ───────────────────────────────────────────────────────────────
export const messagesApi = {
  list: (conversationId) => fetch(`/api/messages?conversation_id=${conversationId}`, opts()).then(unwrap),
  send: ({ conversation_id, text }) => fetch('/api/messages', opts({
    method: 'POST', headers: json, body: JSON.stringify({ conversation_id, text }),
  })).then(unwrap),
};

// ─── Invoices (existing /api/invoices) ──────────────────────────────────────
export const invoicesApi = {
  list:   () => fetch('/api/invoices', opts()).then(unwrap),
  create: (data) => fetch('/api/invoices', opts({ method: 'POST', headers: json, body: JSON.stringify(data) })).then(unwrap),
};

// ─── Contact ────────────────────────────────────────────────────────────────
export const contactApi = {
  send: (data) => fetch('/api/admin/contact', opts({ method: 'POST', headers: json, body: JSON.stringify(data) })).then(unwrap),
};

// ─── Stripe ─────────────────────────────────────────────────────────────────
export const stripeApi = {
  checkout: (plan) => fetch('/api/stripe?action=checkout', opts({
    method: 'POST', headers: json, body: JSON.stringify({ plan }),
  })).then(unwrap),
  portal: () => fetch('/api/stripe?action=portal', opts()).then(unwrap),
};

// ─── Reviews ────────────────────────────────────────────────────────────────
export const reviewsApi = {
  create: (data) => fetch('/api/reviews', opts({ method: 'POST', headers: json, body: JSON.stringify(data) })).then(unwrap),
  byTarget: (targetId) => fetch(`/api/reviews?target_id=${targetId}`, opts()).then(unwrap),
  byOrder:  (orderId)  => fetch(`/api/reviews?order_id=${orderId}`,   opts()).then(unwrap),
};

// ─── Users (veřejné) ────────────────────────────────────────────────────────
export const usersApi = {
  publicProfile: (id) => fetch(`/api/users/${id}`, opts()).then(unwrap),
};

// ─── Admin ──────────────────────────────────────────────────────────────────
export const adminApi = {
  stats:    ()         => fetch('/api/admin/stats',    opts()).then(unwrap),
  users:    (role)     => fetch(`/api/admin/users${role ? `?role=${role}` : ''}`, opts()).then(unwrap),
  orders:   ()         => fetch('/api/admin/orders',   opts()).then(unwrap),
  contacts: (onlyUnhandled = false) => fetch(`/api/admin/contacts${onlyUnhandled ? '?unhandled=1' : ''}`, opts()).then(unwrap),
  verifySikula: (id)   => fetch('/api/admin/verify-sikula', opts({ method: 'POST', headers: json, body: JSON.stringify({ id }) })).then(unwrap),
};

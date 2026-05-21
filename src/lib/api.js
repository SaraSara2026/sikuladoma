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
};

// ─── Offers ─────────────────────────────────────────────────────────────────
export const offersApi = {
  create:    (data) => fetch('/api/offers', opts({ method: 'POST', headers: json, body: JSON.stringify(data) })).then(unwrap),
  listByOrder: (orderId) => fetch(`/api/offers?order_id=${orderId}`, opts()).then(unwrap),
  myOffers:  () => fetch('/api/offers', opts()).then(unwrap),
  patch:     (id, action) => fetch(`/api/offers/${id}`, opts({ method: 'PATCH', headers: json, body: JSON.stringify({ action }) })).then(unwrap),
};

// ─── Invoices (existing /api/invoices) ──────────────────────────────────────
export const invoicesApi = {
  list:   () => fetch('/api/invoices', opts()).then(unwrap),
  create: (data) => fetch('/api/invoices', opts({ method: 'POST', headers: json, body: JSON.stringify(data) })).then(unwrap),
};

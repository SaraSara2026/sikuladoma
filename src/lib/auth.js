// Klientské helpery pro volání /api/auth/*.
// Session cookie nastavuje server (httpOnly), takže fetch automaticky posílá
// cookies díky `credentials: 'include'`.

const j = { 'Content-Type': 'application/json' };
const opts = (extra = {}) => ({ credentials: 'include', ...extra });

async function parseError(res) {
  try {
    const data = await res.json();
    return data.error || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function apiRegister({ email, password, name, role, phone, city }) {
  const res = await fetch('/api/auth/register', opts({
    method: 'POST',
    headers: j,
    body: JSON.stringify({ email, password, name, role, phone, city }),
  }));
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiLogin({ email, password }) {
  const res = await fetch('/api/auth/login', opts({
    method: 'POST',
    headers: j,
    body: JSON.stringify({ email, password }),
  }));
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiLogout() {
  await fetch('/api/auth/logout', opts({ method: 'POST' }));
}

export async function apiMe() {
  const res = await fetch('/api/auth/me', opts());
  if (!res.ok) return { user: null };
  return res.json();
}

export async function apiVerifyEmail(token) {
  const res = await fetch('/api/auth/verify-email', opts({
    method: 'POST',
    headers: j,
    body: JSON.stringify({ token }),
  }));
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiResendVerification() {
  const res = await fetch('/api/auth/resend-verification', opts({
    method: 'POST',
    headers: j,
  }));
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiForgotPassword(email) {
  const res = await fetch('/api/auth/forgot-password', opts({
    method: 'POST',
    headers: j,
    body: JSON.stringify({ email }),
  }));
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiResetPassword({ token, password }) {
  const res = await fetch('/api/auth/reset-password', opts({
    method: 'POST',
    headers: j,
    body: JSON.stringify({ token, password }),
  }));
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

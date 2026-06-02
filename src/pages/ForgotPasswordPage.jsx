// Stránka "Zapomenuté heslo" — formulář pro email.
// Po odeslání: vždy stejná success zpráva (anti-enumeration).

import { useState } from 'react';
import { T, inp, lbl } from '../ui/theme';
import { apiForgotPassword } from '../lib/auth.js';

export default function ForgotPasswordPage({ onBack }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e?.preventDefault();
    setErr(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setErr('Zadej platnou e-mailovou adresu.');
      return;
    }
    setBusy(true);
    try {
      await apiForgotPassword(email);
      setDone(true);
    } catch (e) {
      setErr(e.message || 'Něco se pokazilo. Zkus to znovu.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 440, width: '100%', background: '#fff', borderRadius: 16, padding: '32px 28px', boxShadow: '0 4px 20px rgba(0,0,0,.06)', border: `1px solid ${T.border}` }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Zapomenuté heslo</h1>

        {done ? (
          <>
            <p style={{ fontSize: 14, color: T.ink3, marginBottom: 24, lineHeight: 1.6 }}>
              Pokud je e-mail registrovaný, poslali jsme ti odkaz pro reset hesla. Zkontroluj si schránku (i spam).
            </p>
            <button onClick={onBack} style={primaryBtn}>Zpět na úvod</button>
          </>
        ) : (
          <form onSubmit={submit}>
            <p style={{ fontSize: 14, color: T.ink3, marginBottom: 20, lineHeight: 1.6 }}>
              Zadej e-mail, který jsi použil(a) při registraci. Pošleme ti odkaz na reset hesla.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>E-mail</label>
              <input
                type="email"
                autoFocus
                value={email}
                onChange={e => { setEmail(e.target.value); setErr(null); }}
                placeholder="vas@email.cz"
                autoComplete="email"
                style={inp}
              />
            </div>

            {err && (
              <div style={{ marginBottom: 16, padding: '9px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 12, color: '#B91C1C' }}>
                {err}
              </div>
            )}

            <button type="submit" disabled={busy} style={{ ...primaryBtn, background: busy ? T.border : T.orange, cursor: busy ? 'wait' : 'pointer' }}>
              {busy ? 'Posílám…' : 'Poslat reset link'}
            </button>

            <button type="button" onClick={onBack} style={{ marginTop: 12, width: '100%', height: 40, background: 'transparent', border: 'none', color: T.ink3, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Zpět na přihlášení
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const primaryBtn = {
  width: '100%', height: 44, borderRadius: 10, border: 'none',
  background: T.orange, color: '#fff', fontWeight: 700, fontSize: 14,
  cursor: 'pointer', fontFamily: 'inherit',
};

// Stránka "Nové heslo" — token z URL, formulář s heslem + potvrzením.
// URL: /?page=reset-password&token=XXX

import { useEffect, useState } from 'react';
import { T, inp, lbl } from '../ui/theme';
import { apiResetPassword } from '../lib/auth.js';
import PasswordField from '../components/PasswordField';

export default function ResetPasswordPage({ onBack, onLogin }) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const t = new URL(window.location.href).searchParams.get('token');
    if (t) setToken(t);
    else setErr('Chybí reset token v odkazu.');
  }, []);

  const submit = async (e) => {
    e?.preventDefault();
    setErr(null);
    if (password.length < 8) {
      setErr('Heslo musí mít alespoň 8 znaků.');
      return;
    }
    if (password !== confirm) {
      setErr('Hesla se neshodují.');
      return;
    }
    setBusy(true);
    try {
      await apiResetPassword({ token, password });
      setDone(true);
    } catch (e) {
      setErr(e.message || 'Reset selhal.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 440, width: '100%', background: '#fff', borderRadius: 16, padding: '32px 28px', boxShadow: '0 4px 20px rgba(0,0,0,.06)', border: `1px solid ${T.border}` }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Nastavit nové heslo</h1>

        {done ? (
          <>
            <div style={{ marginBottom: 16, padding: '14px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, fontSize: 14, color: '#15803D', lineHeight: 1.5 }}>
              ✓ Heslo bylo úspěšně změněno. Můžeš se přihlásit.
            </div>
            <button onClick={onLogin} style={primaryBtn}>Přihlásit se</button>
          </>
        ) : (
          <form onSubmit={submit}>
            <p style={{ fontSize: 14, color: T.ink3, marginBottom: 20, lineHeight: 1.6 }}>
              Zvol si nové heslo. Min. 8 znaků.
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Nové heslo</label>
              <PasswordField
                autoFocus
                value={password}
                onChange={e => { setPassword(e.target.value); setErr(null); }}
                autoComplete="new-password"
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Potvrzení hesla</label>
              <PasswordField
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setErr(null); }}
                autoComplete="new-password"
              />
            </div>

            {err && (
              <div style={{ marginBottom: 16, padding: '9px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 12, color: '#B91C1C' }}>
                {err}
              </div>
            )}

            <button type="submit" disabled={busy || !token} style={{ ...primaryBtn, background: (busy || !token) ? T.border : T.orange, cursor: (busy || !token) ? 'wait' : 'pointer' }}>
              {busy ? 'Ukládám…' : 'Nastavit nové heslo'}
            </button>

            <button type="button" onClick={onBack} style={{ marginTop: 12, width: '100%', height: 40, background: 'transparent', border: 'none', color: T.ink3, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Zpět na úvod
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

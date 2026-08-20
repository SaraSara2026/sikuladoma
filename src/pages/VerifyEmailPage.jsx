// Stránka, kterou otevře link z verifikačního emailu.
// URL: /?page=verify-email&token=XXX
// Token přečteme z URL, pošleme na /api/auth/verify-email, zobrazíme výsledek.

import { useEffect, useState } from 'react';
import { T } from '../ui/theme';
import { apiVerifyEmail, apiMe } from '../lib/auth.js';

export default function VerifyEmailPage({ onBack, onLogin, onVerified, onSessionMismatch, onNeedsLogin }) {
  const [state, setState] = useState('verifying'); // verifying | success | error
  const [errMsg, setErrMsg] = useState('');
  // sameSession = prohlížeč je právě přihlášený jako ten samý účet, kterému
  // patří ověřovací odkaz. Pokud ne (jiný účet nebo nikdo), "Pokračovat"
  // nesmí vést do dashboardu — viz onNeedsLogin níže.
  const [sameSession, setSameSession] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');

  useEffect(() => {
    const token = new URL(window.location.href).searchParams.get('token');
    if (!token) {
      setState('error');
      setErrMsg('Chybí ověřovací token v odkazu.');
      return;
    }
    let alive = true;
    apiVerifyEmail(token)
      .then(async ({ email, sameSession: same }) => {
        if (!alive) return;
        setVerifiedEmail(email || '');
        setSameSession(!!same);
        if (same) {
          // Prohlížeč je přihlášený jako právě ověřený účet — obnovíme jeho
          // stav (email_verified_at), ať po kliknutí na Pokračovat jde rovnou
          // do svého dashboardu.
          try {
            const { user } = await apiMe();
            if (user) onVerified?.(user);
          } catch {}
        } else {
          // V prohlížeči byl přihlášený jiný účet (nebo žádný). Server session
          // cookie v tomto případě už smazal (viz api/auth/[action].js) —
          // frontendový stav vyčistíme i tady, ať "Pokračovat" v žádném
          // případě neotevře cizí dashboard.
          onSessionMismatch?.();
        }
        setState('success');
      })
      .catch(err => {
        if (!alive) return;
        setState('error');
        setErrMsg(err.message || 'Ověření se nezdařilo.');
      });
    return () => { alive = false; };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%', background: '#fff', borderRadius: 16, padding: '40px 32px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,.06)', border: `1px solid ${T.border}` }}>
        {state === 'verifying' && (
          <>
            <div style={{ width: 56, height: 56, margin: '0 auto 20px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 28, height: 28, border: '3px solid #BFDBFE', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Ověřuji e-mail…</h1>
            <p style={{ fontSize: 14, color: T.ink3 }}>Chvilku strpení.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div style={{ width: 56, height: 56, margin: '0 auto 20px', borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              ✓
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 8 }}>E-mail ověřen!</h1>
            <p style={{ fontSize: 14, color: T.ink3, marginBottom: 24, lineHeight: 1.6 }}>
              Váš e-mail byl úspěšně ověřen. Teď můžete pokračovat do svého účtu.
            </p>
            <button
              onClick={() => sameSession ? onLogin?.() : onNeedsLogin?.(verifiedEmail)}
              style={primaryBtn}
            >
              Pokračovat
            </button>
          </>
        )}

        {state === 'error' && (
          <>
            <div style={{ width: 56, height: 56, margin: '0 auto 20px', borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#B91C1C' }}>
              ✕
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Ověření selhalo</h1>
            <p style={{ fontSize: 14, color: T.ink3, marginBottom: 24, lineHeight: 1.6 }}>
              {errMsg}
            </p>
            <button onClick={onBack} style={primaryBtn}>Zpět na úvod</button>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const primaryBtn = {
  width: '100%', height: 44, borderRadius: 10, border: 'none',
  background: T.orange, color: '#fff', fontWeight: 700, fontSize: 14,
  cursor: 'pointer', fontFamily: 'inherit',
};

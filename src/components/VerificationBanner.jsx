// Žlutý banner pro neověřený e-mail. Zobrazí se pokud user.email_verified_at je null.
// "Poslat znovu" volá /api/auth/resend-verification (rate-limited 3/10min).

import { useState } from 'react';
import { apiResendVerification } from '../lib/auth.js';

export default function VerificationBanner({ user }) {
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [msg, setMsg] = useState('');

  if (!user || user.email_verified_at) return null;

  const resend = async () => {
    setState('sending');
    setMsg('');
    try {
      await apiResendVerification();
      setState('sent');
      setMsg('Ověřovací e-mail jsme poslali znovu. Zkontroluj si schránku.');
    } catch (err) {
      setState('error');
      setMsg(err.message || 'Něco se pokazilo.');
    }
  };

  return (
    <div style={{
      background: '#FEF3C7',
      border: '1px solid #FCD34D',
      borderRadius: 12,
      padding: '14px 18px',
      margin: '0 0 16px 0',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
    }}>
      <div style={{ flexShrink: 0, fontSize: 22 }}>✉️</div>
      <div style={{ flex: 1, minWidth: 240 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E', marginBottom: 2 }}>
          Ověř svůj e-mail
        </div>
        <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.5 }}>
          Poslali jsme ti ověřovací odkaz na <strong>{user.email}</strong>. Bez ověření nemůžeš posílat poptávky, nabídky ani zprávy.
        </div>
        {msg && (
          <div style={{ marginTop: 8, fontSize: 12, color: state === 'error' ? '#B91C1C' : '#166534' }}>
            {msg}
          </div>
        )}
      </div>
      <button
        onClick={resend}
        disabled={state === 'sending' || state === 'sent'}
        style={{
          padding: '8px 14px',
          background: state === 'sent' ? '#D1FAE5' : '#F59E0B',
          color: state === 'sent' ? '#065F46' : '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: (state === 'sending' || state === 'sent') ? 'default' : 'pointer',
          fontFamily: 'inherit',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
        {state === 'sending' ? 'Posílám…' : state === 'sent' ? '✓ Odesláno' : 'Poslat znovu'}
      </button>
    </div>
  );
}

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const DEMO_ACCOUNTS = [
  { label: '👤 Zákazník – Jana Nováková', email: 'jana@example.com' },
  { label: '🛠️ Šikula – Pavel Šikovný',    email: 'pavel@example.com' },
  { label: '⚙️ Administrátor',             email: 'admin@sikuladoma.cz' },
]
const DEMO_PASSWORD = 'demo1234'

export default function LoginPage({ onLogin, onNav }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)

  const handleLogin = async () => {
    setErr(null)
    setBusy(true)
    try {
      const user = await login({ email, password: pass })
      onLogin?.(user)
    } catch (e) {
      setErr(e.message || 'Přihlášení selhalo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-enter" style={{ minHeight: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div className="card card-pad">
          <h2 style={{ fontSize: 26, marginBottom: 6 }}>Přihlásit se</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 28, fontSize: 15 }}>Vítejte zpět!</p>

          <div style={{ marginBottom: 16, background: 'var(--bg)', borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text2)' }}>🎭 DEMO ÚČTY – klikněte pro vyplnění:</p>
            {DEMO_ACCOUNTS.map(d => (
              <button key={d.email} type="button" onClick={() => { setEmail(d.email); setPass(DEMO_PASSWORD); setErr(null) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'white', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 6, fontSize: 13, cursor: 'pointer' }}>
                {d.label}
              </button>
            ))}
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>Heslo pro demo: <code>{DEMO_PASSWORD}</code></p>
          </div>

          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="vas@email.cz" type="email" autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="form-label">Heslo</label>
            <input className="form-input" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" type="password" autoComplete="current-password"
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>

          {err && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '10px 12px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>
              {err}
            </div>
          )}

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginBottom: 12 }}
            onClick={handleLogin} disabled={busy}>
            {busy ? 'Přihlašuji…' : 'Přihlásit se'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text2)' }}>
            Nemáte účet?{' '}
            <span style={{ color: 'var(--brand)', cursor: 'pointer', fontWeight: 600 }} onClick={() => onNav('register')}>Zaregistrovat se</span>
          </p>
        </div>
      </div>
    </div>
  )
}

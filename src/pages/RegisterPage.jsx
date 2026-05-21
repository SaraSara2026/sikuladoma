import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Icon from '../components/Icon'

export default function RegisterPage({ onLogin, onNav, isSikula }) {
  const { register } = useAuth()
  const [role, setRole] = useState(isSikula ? 'sikula' : 'customer')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)

  const handleRegister = async () => {
    setErr(null)
    if (name.trim().length < 2) return setErr('Zadejte jméno.')
    if (!email.includes('@')) return setErr('Neplatný e-mail.')
    if (password.length < 8) return setErr('Heslo musí mít alespoň 8 znaků.')

    setBusy(true)
    try {
      const user = await register({ email, password, name, role, city })
      onLogin?.(user)
    } catch (e) {
      setErr(e.message || 'Registrace selhala.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-enter" style={{ minHeight: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div className="card card-pad">
          <h2 style={{ fontSize: 26, marginBottom: 6 }}>Zaregistrovat se</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 24, fontSize: 15 }}>Bezplatná registrace. Žádná kreditní karta.</p>

          <div className="role-selector" style={{ marginBottom: 28 }}>
            <button type="button" className={`role-btn ${role === 'customer' ? 'active' : ''}`} onClick={() => setRole('customer')}>👤 Zákazník</button>
            <button type="button" className={`role-btn ${role === 'sikula' ? 'active' : ''}`} onClick={() => setRole('sikula')}>🛠️ Šikula</button>
          </div>

          <div className="form-group">
            <label className="form-label">Celé jméno</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Jana Nováková" autoComplete="name" />
          </div>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="vas@email.cz" type="email" autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="form-label">Město / PSČ</label>
            <input className="form-input" value={city} onChange={e => setCity(e.target.value)} placeholder="Praha 6" autoComplete="address-level2" />
          </div>
          <div className="form-group">
            <label className="form-label">Heslo</label>
            <input className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Alespoň 8 znaků" type="password" autoComplete="new-password"
              onKeyDown={e => e.key === 'Enter' && handleRegister()} />
          </div>

          {err && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '10px 12px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>
              {err}
            </div>
          )}

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14 }}
            onClick={handleRegister} disabled={busy}>
            {busy ? 'Registruji…' : <>Zaregistrovat se zdarma <Icon name="arrow" size={16} /></>}
          </button>
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text2)', marginTop: 12 }}>
            Máte účet?{' '}
            <span style={{ color: 'var(--brand)', cursor: 'pointer', fontWeight: 600 }} onClick={() => onNav('login')}>Přihlásit se</span>
          </p>
        </div>
      </div>
    </div>
  )
}

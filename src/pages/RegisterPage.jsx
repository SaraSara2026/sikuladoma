import { useState } from 'react'
import { USERS } from '../data'
import Icon from '../components/Icon'

export default function RegisterPage({ onLogin, onNav, isSikula }) {
  const [role, setRole] = useState(isSikula ? 'sikula' : 'customer')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')

  const handleRegister = () => {
    const base = USERS[role === 'sikula' ? 'sikula' : 'customer']
    const avatar = name
      ? name.split(' ').map(w => w[0]).join('').toUpperCase()
      : base.avatar
    onLogin({ ...base, name: name || base.name, avatar, city: city || base.city })
  }

  return (
    <div className="page-enter" style={{ minHeight: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div className="card card-pad">
          <h2 style={{ fontSize: 26, marginBottom: 6 }}>Zaregistrovat se</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 24, fontSize: 15 }}>Bezplatná registrace. Žádná kreditní karta.</p>

          <div className="role-selector" style={{ marginBottom: 28 }}>
            <button className={`role-btn ${role === 'customer' ? 'active' : ''}`} onClick={() => setRole('customer')}>👤 Zákazník</button>
            <button className={`role-btn ${role === 'sikula' ? 'active' : ''}`} onClick={() => setRole('sikula')}>🛠️ Šikula</button>
          </div>

          <div className="form-group">
            <label className="form-label">Celé jméno</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Jana Nováková" />
          </div>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="vas@email.cz" type="email" />
          </div>
          <div className="form-group">
            <label className="form-label">Město / PSČ</label>
            <input className="form-input" value={city} onChange={e => setCity(e.target.value)} placeholder="Praha 6" />
          </div>
          <div className="form-group">
            <label className="form-label">Heslo</label>
            <input className="form-input" placeholder="Alespoň 8 znaků" type="password" />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14 }} onClick={handleRegister}>
            Zaregistrovat se zdarma <Icon name="arrow" size={16} />
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

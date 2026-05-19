import { useState } from 'react'
import { USERS } from '../../data'

const menuItems = [
  { id: 'overview', icon: '📊', label: 'Přehled' },
  { id: 'users', icon: '👥', label: 'Uživatelé' },
  { id: 'orders', icon: '📋', label: 'Zakázky' },
  { id: 'payments', icon: '💳', label: 'Platby' },
  { id: 'disputes', icon: '⚖️', label: 'Spory' },
  { id: 'settings', icon: '⚙️', label: 'Nastavení' },
]

export default function AdminDashboard({ currentUser }) {
  const [activePage, setActivePage] = useState('overview')

  return (
    <div className="dash-layout">
      <div className="dash-sidebar">
        <div className="dash-user">
          <div className="dash-user-avatar" style={{ background: 'var(--red)' }}>{currentUser.avatar}</div>
          <div className="dash-user-name">{currentUser.name}</div>
          <div className="dash-user-role" style={{ color: 'rgba(255,100,100,0.8)' }}>Administrátor</div>
        </div>
        {menuItems.map(m => (
          <button key={m.id} className={`dash-nav-item ${activePage === m.id ? 'active' : ''}`} onClick={() => setActivePage(m.id)}>
            <span>{m.icon}</span>{m.label}
          </button>
        ))}
      </div>

      <div className="dash-content">
        {activePage === 'overview' && (
          <div className="page-enter">
            <div className="dash-header">
              <div>
                <div className="dash-title">Admin Dashboard</div>
                <div className="dash-subtitle">ŠikulaDoma – přehled platformy</div>
              </div>
              <div style={{ background: 'var(--bg)', padding: '8px 14px', borderRadius: 8, fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>🟢 Systém OK</div>
            </div>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-val">6 138</div><div className="stat-label">Celkem uživatelů</div><div className="stat-trend">↑ +124 tento týden</div></div>
              <div className="stat-card"><div className="stat-icon">🛠️</div><div className="stat-val">1 247</div><div className="stat-label">Registrovaných šikulů</div></div>
              <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-val">342</div><div className="stat-label">Aktivních zakázek</div></div>
              <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-val">84 600 Kč</div><div className="stat-label">MRR</div><div className="stat-trend">↑ +8% vs minulý</div></div>
              <div className="stat-card"><div className="stat-icon">👑</div><div className="stat-val">387</div><div className="stat-label">Profi / Premium šikulů</div></div>
              <div className="stat-card"><div className="stat-icon">⭐</div><div className="stat-val">4.8</div><div className="stat-label">Průměrné hodnocení</div></div>
            </div>
            <div className="table-wrap">
              <div className="table-header"><span className="table-title">Poslední registrace</span></div>
              <table className="table">
                <thead><tr><th>Jméno</th><th>Role</th><th>Registrace</th><th>Tarif</th><th>Stav</th></tr></thead>
                <tbody>
                  {[
                    { name:'Tomáš Dvořák', role:'Šikula', date:'dnes 14:22', plan:'Plus', status:'active' },
                    { name:'Eva Kratochvílová', role:'Zákazník', date:'dnes 12:05', plan:'—', status:'active' },
                    { name:'Martin Vávra', role:'Šikula', date:'včera', plan:'Profi', status:'active' },
                    { name:'Lucie Fišerová', role:'Zákazník', date:'včera', plan:'—', status:'active' },
                    { name:'Jakub Holub', role:'Šikula', date:'2 dny', plan:'Start', status:'pending' },
                  ].map((u, i) => (
                    <tr key={i}>
                      <td><strong>{u.name}</strong></td>
                      <td><span className={`badge ${u.role === 'Šikula' ? 'badge-blue' : 'badge-gray'}`}>{u.role}</span></td>
                      <td style={{ color: 'var(--text2)' }}>{u.date}</td>
                      <td>{u.plan !== '—' ? <span className="badge badge-orange">{u.plan}</span> : '—'}</td>
                      <td><span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>{u.status === 'active' ? 'Aktivní' : 'Čeká'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activePage === 'users' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 24 }}>Správa uživatelů</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <input className="form-input" placeholder="🔍 Hledat uživatele..." style={{ maxWidth: 300 }} />
              <select className="form-select" style={{ width: 'auto' }}><option>Všechny role</option><option>Zákazník</option><option>Šikula</option></select>
              <select className="form-select" style={{ width: 'auto' }}><option>Všechny tarify</option><option>Start</option><option>Plus</option><option>Profi</option><option>Premium</option></select>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Uživatel</th><th>Role</th><th>Tarif</th><th>Zakázky</th><th>Registrace</th><th>Akce</th></tr></thead>
                <tbody>
                  {[
                    USERS.customer,
                    USERS.sikula,
                    { name:'Tomáš Beneš', avatar:'TB', role:'customer', plan:'—', jobs:3, registered:'12.3.2024' },
                    { name:'Eva Procházková', avatar:'EP', role:'customer', plan:'—', jobs:1, registered:'2.4.2024' },
                    { name:'Radek Tesař', avatar:'RT', role:'sikula', plan:'Plus', jobs:34, registered:'1.2.2024' },
                  ].map((u, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 12 }}>
                            {u.avatar ?? u.name?.split(' ').map(w => w[0]).join('')}
                          </div>
                          <strong>{u.name}</strong>
                        </div>
                      </td>
                      <td><span className={`badge ${u.role === 'sikula' ? 'badge-blue' : 'badge-gray'}`}>{u.role === 'sikula' ? 'Šikula' : 'Zákazník'}</span></td>
                      <td>{u.plan && u.plan !== '—' ? <span className="badge badge-orange">{u.plan}</span> : '—'}</td>
                      <td>{u.jobs ?? 0}</td>
                      <td style={{ color: 'var(--text2)', fontSize: 13 }}>{u.registered ?? '2024'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm">Detail</button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }}>Blok</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!['overview', 'users'].includes(activePage) && (
          <div className="empty-state">
            <div className="empty-icon">🚧</div>
            <h3>Tato sekce se připravuje</h3>
            <p>Admin panel v rozšířené verzi bude dostupný brzy.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { DEMO_ORDERS, DEMO_OFFERS, ORDER_STATUS_MAP } from '../../data'
import Icon from '../../components/Icon'
import ChatPage from '../ChatPage'

const menuItems = [
  { id: 'overview', icon: '📊', label: 'Přehled' },
  { id: 'orders', icon: '📋', label: 'Moje poptávky' },
  { id: 'offers', icon: '💬', label: 'Nabídky' },
  { id: 'active', icon: '⚡', label: 'Aktivní zakázky' },
  { id: 'completed', icon: '✅', label: 'Dokončené' },
  { id: 'messages', icon: '💌', label: 'Zprávy' },
  { id: 'favorites', icon: '❤️', label: 'Oblíbení' },
  { id: 'reviews', icon: '⭐', label: 'Hodnocení' },
  { id: 'profile', icon: '👤', label: 'Profil' },
]

export default function CustomerDashboard({ currentUser, onNav, orders }) {
  const [activePage, setActivePage] = useState('overview')
  const myOrders = [...orders, ...DEMO_ORDERS.filter(o => o.customer === 'Jana N.').slice(0, 2)]

  return (
    <div className="dash-layout">
      <div className="dash-sidebar">
        <div className="dash-user">
          <div className="dash-user-avatar">{currentUser.avatar}</div>
          <div className="dash-user-name">{currentUser.name}</div>
          <div className="dash-user-role">Zákazník</div>
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
                <div className="dash-title">Vítejte, {currentUser.name.split(' ')[0]}! 👋</div>
                <div className="dash-subtitle">Co potřebujete dnes vyřešit?</div>
              </div>
              <button className="btn btn-primary" onClick={() => onNav('new-order')}><Icon name="plus" size={16} /> Nová poptávka</button>
            </div>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-val">{myOrders.length}</div><div className="stat-label">Celkem poptávek</div></div>
              <div className="stat-card"><div className="stat-icon">💬</div><div className="stat-val">8</div><div className="stat-label">Přijatých nabídek</div></div>
              <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-val">3</div><div className="stat-label">Dokončených zakázek</div></div>
              <div className="stat-card"><div className="stat-icon">⭐</div><div className="stat-val">4.9</div><div className="stat-label">Průměrné hodnocení</div></div>
            </div>
            <div className="table-wrap">
              <div className="table-header">
                <span className="table-title">Poslední poptávky</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setActivePage('orders')}>Zobrazit vše →</button>
              </div>
              {myOrders.slice(0, 4).map(o => (
                <div key={o.id} className="order-card" style={{ margin: 0, borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => onNav('order-detail', o)}>
                  <div className="order-cat-icon">{o.icon}</div>
                  <div className="order-info">
                    <div className="order-title">{o.title}</div>
                    <div className="order-meta">
                      <span><Icon name="map" size={13} /> {o.city}</span>
                      <span><Icon name="clock" size={13} /> {o.created}</span>
                    </div>
                  </div>
                  <div className="order-actions">
                    <div className={`badge ${ORDER_STATUS_MAP[o.status]?.color}`}>{ORDER_STATUS_MAP[o.status]?.label}</div>
                    {o.offers > 0 && <div className="badge badge-orange">{o.offers} nabídek</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePage === 'orders' && (
          <div className="page-enter">
            <div className="dash-header">
              <div className="dash-title">Moje poptávky</div>
              <button className="btn btn-primary btn-sm" onClick={() => onNav('new-order')}><Icon name="plus" size={14} /> Nová poptávka</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myOrders.map(o => (
                <div key={o.id} className="order-card" style={{ cursor: 'pointer' }} onClick={() => onNav('order-detail', o)}>
                  <div className="order-cat-icon">{o.icon}</div>
                  <div className="order-info">
                    <div className="order-title">{o.title}</div>
                    <div className="order-meta">
                      <span><Icon name="map" size={13} /> {o.city}</span>
                      <span><Icon name="wallet" size={13} /> {o.budget}</span>
                      <span><Icon name="clock" size={13} /> {o.created}</span>
                    </div>
                  </div>
                  <div className="order-actions">
                    <div className={`badge ${ORDER_STATUS_MAP[o.status]?.color}`}>{ORDER_STATUS_MAP[o.status]?.label}</div>
                    {o.offers > 0 && <div className="badge badge-orange">{o.offers} nabídek</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePage === 'offers' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 24 }}>Nabídky od šikulů</div>
            {DEMO_OFFERS.map(offer => (
              <div key={offer.id} className="offer-card">
                <div className="offer-header">
                  <div className="offer-avatar">{offer.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{offer.sikula}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                      Na poptávku: {DEMO_ORDERS.find(o => o.id === offer.orderId)?.title}
                    </div>
                  </div>
                  <div className="offer-price">{offer.price} Kč</div>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 12 }}>{offer.message}</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => onNav('chat')}>Chat</button>
                  <button className="btn btn-green btn-sm">Přijmout</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activePage === 'messages' && <ChatPage />}

        {activePage === 'profile' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 24 }}>Profil</div>
            <div className="card card-pad">
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 28 }}>
                <div className="profile-avatar-big">{currentUser.avatar}</div>
                <div>
                  <h2>{currentUser.name}</h2>
                  <p style={{ color: 'var(--text2)' }}>{currentUser.email}</p>
                  <p style={{ color: 'var(--text2)', fontSize: 14 }}>{currentUser.city}</p>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Jméno</label><input className="form-input" defaultValue={currentUser.name} /></div>
                <div className="form-group"><label className="form-label">E-mail</label><input className="form-input" defaultValue={currentUser.email} /></div>
              </div>
              <div className="form-group"><label className="form-label">Město</label><input className="form-input" defaultValue={currentUser.city} /></div>
              <button className="btn btn-primary">Uložit změny</button>
            </div>
          </div>
        )}

        {!['overview', 'orders', 'offers', 'messages', 'profile'].includes(activePage) && (
          <div className="empty-state">
            <div className="empty-icon">🚧</div>
            <h3>Tato sekce se načítá</h3>
            <p>V prototypu je tato část připravena k implementaci.</p>
          </div>
        )}
      </div>
    </div>
  )
}

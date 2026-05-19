import { useState } from 'react'
import { DEMO_OFFERS, ORDER_STATUS_MAP } from '../data'
import Icon from '../components/Icon'

export default function OrderDetailPage({ order, onNav, currentUser, onAcceptOffer }) {
  const [activeTab, setActiveTab] = useState('detail')
  if (!order) return null
  const offers = DEMO_OFFERS.filter(o => o.orderId === order.id)

  return (
    <div className="page-enter" style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={() => onNav('back')} style={{ marginBottom: 16 }}>← Zpět</button>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div className="order-cat-icon" style={{ width: 56, height: 56, fontSize: 28 }}>{order.icon}</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, marginBottom: 8 }}>{order.title}</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 14, color: 'var(--text2)' }}>
              <span><Icon name="map" size={14} /> {order.city}</span>
              <span><Icon name="wallet" size={14} /> {order.budget}</span>
              <span><Icon name="clock" size={14} /> {order.created}</span>
            </div>
          </div>
          <div className={`badge ${ORDER_STATUS_MAP[order.status]?.color}`} style={{ fontSize: 14, padding: '6px 14px' }}>
            {ORDER_STATUS_MAP[order.status]?.label}
          </div>
        </div>

        <div className="tabs" style={{ margin: '16px 16px 0' }}>
          {[['detail', '📋 Detail'], ['offers', `💬 Nabídky (${offers.length})`]].map(([t, label]) => (
            <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{label}</button>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          {activeTab === 'detail' && (
            <div>
              <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.8, marginBottom: 20 }}>{order.desc || 'Žádný popis.'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[['Patro / přístup', order.access], ['Parkování', order.parking], ['Pohlaví šikuly', 'Jedno mi je'], ['Urgentní', order.urgent ? '🚨 Ano' : 'Ne']].map(([k, v]) => v && (
                  <div key={k} style={{ background: 'var(--bg)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'offers' && (
            <div>
              {offers.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 0' }}>
                  <div className="empty-icon">⏳</div>
                  <h3>Čekáme na nabídky</h3>
                  <p>Šikulové se brzy ozvou.</p>
                </div>
              ) : offers.map(offer => (
                <div key={offer.id} className="offer-card">
                  <div className="offer-header">
                    <div className="offer-avatar">{offer.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{offer.sikula}</span>
                        {offer.verified && <span className="badge badge-green" style={{ fontSize: 11 }}>✓ Ověřen</span>}
                        <span className="badge badge-blue" style={{ fontSize: 11 }}>{offer.plan}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', gap: 10, marginTop: 2 }}>
                        <span className="stars">{'★'.repeat(Math.floor(offer.rating))}</span>
                        <span>{offer.rating} ({offer.jobs} zakázek)</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="offer-price">{offer.price} Kč</div>
                      <div className="offer-price-label">celková cena</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.7 }}>{offer.message}</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>📅 {offer.date} &nbsp;·&nbsp; ⏱️ {offer.time}</div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => onNav('chat')}>Napsat zprávu</button>
                      {currentUser?.role === 'customer' && (
                        <button className="btn btn-green btn-sm" onClick={() => { onAcceptOffer(offer); onNav('dash-customer') }}>
                          <Icon name="check" size={14} /> Přijmout nabídku
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

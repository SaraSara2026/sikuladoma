import { useEffect, useState } from 'react'
import { ORDER_STATUS_MAP } from '../data'
import Icon from '../components/Icon'
import { offersApi } from '../lib/api'

export default function OrderDetailPage({ order, onNav, currentUser, onAcceptOffer }) {
  const [activeTab, setActiveTab] = useState('detail')
  const [offers, setOffers]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [acting, setActing]       = useState(null) // id právě akceptované nabídky

  useEffect(() => {
    if (!order?.id) return
    let alive = true
    setLoading(true)
    offersApi.listByOrder(order.id)
      .then(({ offers }) => { if (alive) { setOffers(offers); setError(null) } })
      .catch(e => { if (alive) setError(e.message) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [order?.id])

  if (!order) return null

  const accept = async (offer) => {
    setActing(offer.id)
    try {
      await offersApi.patch(offer.id, 'accept')
      const { offers: fresh } = await offersApi.listByOrder(order.id)
      setOffers(fresh)
      onAcceptOffer?.(offer)
    } catch (e) {
      alert(e.message)
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="page-enter" style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={() => onNav('back')} style={{ marginBottom: 16 }}>← Zpět</button>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div className="order-cat-icon" style={{ width: 56, height: 56, fontSize: 28 }}>{order.icon || '🔧'}</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, marginBottom: 8 }}>{order.title}</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 14, color: 'var(--text2)' }}>
              <span><Icon name="map" size={14} /> {order.city}</span>
              {order.budget && <span><Icon name="wallet" size={14} /> {order.budget}</span>}
              {order.created_at && <span><Icon name="clock" size={14} /> {new Date(order.created_at).toLocaleDateString('cs-CZ')}</span>}
            </div>
          </div>
          <div className={`badge ${ORDER_STATUS_MAP[order.status]?.color || 'badge-gray'}`} style={{ fontSize: 14, padding: '6px 14px' }}>
            {ORDER_STATUS_MAP[order.status]?.label || order.status}
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
              <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.8, marginBottom: 20 }}>
                {order.description || order.desc || 'Žádný popis.'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['Patro / přístup', order.floor || order.access],
                  ['Parkování',       order.parking],
                  ['Pohlaví šikuly',  { jedno: 'Jedno mi je', zena: 'Žena', muz: 'Muž' }[order.gender_preference || order.gender]],
                  ['Urgentní',        order.urgent ? '🚨 Ano' : 'Ne'],
                  ['Preferovaný termín', order.preferred_date],
                ].filter(([, v]) => v).map(([k, v]) => (
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
              {loading && <div style={{ color: 'var(--text3)' }}>Načítám nabídky…</div>}
              {error && <div style={{ color: '#B91C1C' }}>Chyba: {error}</div>}
              {!loading && !error && offers.length === 0 && (
                <div className="empty-state" style={{ padding: '40px 0' }}>
                  <div className="empty-icon">⏳</div>
                  <h3>Čekáme na nabídky</h3>
                  <p>Šikulové se brzy ozvou.</p>
                </div>
              )}
              {!loading && offers.map(offer => (
                <div key={offer.id} className="offer-card">
                  <div className="offer-header">
                    <div className="offer-avatar">{offer.sikula_avatar || offer.sikula_name?.[0] || '?'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{offer.sikula_name}</span>
                        {offer.sikula_verified && <span className="badge badge-green" style={{ fontSize: 11 }}>✓ Ověřen</span>}
                        {offer.sikula_plan && <span className="badge badge-blue" style={{ fontSize: 11 }}>{offer.sikula_plan}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', gap: 10, marginTop: 2 }}>
                        {offer.sikula_rating && <>
                          <span className="stars">{'★'.repeat(Math.floor(offer.sikula_rating))}</span>
                          <span>{offer.sikula_rating} ({offer.sikula_jobs || 0} zakázek)</span>
                        </>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="offer-price">{offer.price} Kč</div>
                      <div className="offer-price-label">celková cena</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.7 }}>{offer.message}</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                      {offer.available_date && <>📅 {offer.available_date}</>}
                      {offer.available_time && <> &nbsp;·&nbsp; ⏱️ {offer.available_time}</>}
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => onNav('chat')}>Napsat zprávu</button>
                      {currentUser?.role === 'customer' && offer.status === 'pending' && (
                        <button className="btn btn-green btn-sm" disabled={acting === offer.id} onClick={() => accept(offer)}>
                          {acting === offer.id ? 'Přijímám…' : <><Icon name="check" size={14} /> Přijmout nabídku</>}
                        </button>
                      )}
                      {offer.status === 'accepted' && <span className="badge badge-green">Přijato</span>}
                      {offer.status === 'rejected' && <span className="badge badge-gray">Odmítnuto</span>}
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

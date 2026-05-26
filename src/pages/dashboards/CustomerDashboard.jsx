import { useEffect, useState } from 'react'
import { CATEGORIES, ORDER_STATUS_MAP } from '../../data'
import Icon from '../../components/Icon'
import ChatPage from '../ChatPage'
import { ordersApi, offersApi, reviewsApi } from '../../lib/api.js'
import HodnoceniForm from '../../modals/HodnoceniForm.jsx'

const menuItems = [
  { id: 'overview',  icon: '📊', label: 'Přehled' },
  { id: 'orders',    icon: '📋', label: 'Moje poptávky' },
  { id: 'offers',    icon: '💬', label: 'Nabídky' },
  { id: 'active',    icon: '⚡', label: 'Aktivní zakázky' },
  { id: 'completed', icon: '✅', label: 'Dokončené' },
  { id: 'reviews',   icon: '⭐', label: 'Hodnocení' },
  { id: 'messages',  icon: '💌', label: 'Zprávy' },
  { id: 'profile',   icon: '👤', label: 'Profil' },
]

const CAT_ICON = Object.fromEntries(CATEGORIES.map(c => [c.id, c.icon]))

function relativni(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Math.max(0, Date.now() - d.getTime())
  const min = Math.floor(diff / 60000)
  if (min < 1)  return 'právě teď'
  if (min < 60) return `před ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24)   return `před ${h} h`
  const dn = Math.floor(h / 24)
  if (dn < 7)   return `před ${dn} dny`
  return d.toLocaleDateString('cs-CZ')
}

function Stars({ n, size = 14 }) {
  return (
    <span style={{ color: '#F07800', fontSize: size }}>
      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
    </span>
  )
}

// Načte moje poptávky a ke každé doplní počet nabídek.
function useMyOrders() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    ordersApi.list()
      .then(async ({ orders }) => {
        const withCounts = await Promise.all(orders.map(async (o) => {
          try {
            const { offers } = await offersApi.listByOrder(o.id)
            return { ...o, offers_count: offers.length }
          } catch { return { ...o, offers_count: 0 } }
        }))
        if (alive) { setOrders(withCounts); setError(null) }
      })
      .catch(e => { if (alive) setError(e.message) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [refresh])

  return { orders, loading, error, reload: () => setRefresh(x => x + 1) }
}

function useAllMyOffers(myOrders) {
  const [offers, setOffers]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    if (myOrders.length === 0) { setOffers([]); setLoading(false); return }
    setLoading(true)
    Promise.all(
      myOrders.map(o =>
        offersApi.listByOrder(o.id)
          .then(({ offers }) => offers.map(off => ({ ...off, order_title: o.title, order_id: o.id })))
          .catch(() => [])
      )
    )
      .then(arrays => { if (alive) setOffers(arrays.flat()) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [myOrders])

  return { offers, loading }
}

function useMyReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let alive = true
    reviewsApi.myReviews()
      .then(({ reviews }) => { if (alive) setReviews(reviews) })
      .catch(() => { if (alive) setReviews([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [refresh])

  return { reviews, loading, reload: () => setRefresh(x => x + 1) }
}

export default function CustomerDashboard({ currentUser, onNav, onLogout }) {
  const [activePage, setActivePage] = useState('overview')
  const { orders, loading, error, reload } = useMyOrders()
  const { offers: allOffers } = useAllMyOffers(orders)
  const { reviews: myReviews, loading: reviewsLoading, reload: reloadReviews } = useMyReviews()

  const completedOrders  = orders.filter(o => o.status === 'completed')
  const activeOrders     = orders.filter(o => o.status === 'accepted')
  const completedCount   = completedOrders.length
  const reviewedOrderIds = new Set(myReviews.map(r => r.order_id))

  const initials = (currentUser?.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const avatar   = currentUser?.avatar || initials
  const [reviewOrderId, setReviewOrderId] = useState(null)

  const handleAcceptOffer = async (offerId) => {
    try { await offersApi.patch(offerId, 'accept'); reload() } catch (e) { alert(e.message) }
  }

  const handleCompleteOrder = async (orderId) => {
    if (!confirm('Označit zakázku jako dokončenou?')) return
    try { await ordersApi.patch(orderId, 'complete'); reload() } catch (e) { alert(e.message) }
  }

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Opravdu zrušit tuto poptávku?')) return
    try { await ordersApi.patch(orderId, 'cancel'); reload() } catch (e) { alert(e.message) }
  }

  const renderOrderCard = (o, opts = {}) => (
    <div key={o.id} className="order-card" style={{ ...(opts.flat && { margin: 0, borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border)' }) }}>
      <div className="order-cat-icon">{CAT_ICON[o.category] || '🔧'}</div>
      <div className="order-info" style={{ cursor: 'pointer' }} onClick={() => onNav?.('order-detail', o)}>
        <div className="order-title">{o.title}</div>
        <div className="order-meta">
          <span><Icon name="map" size={13} /> {o.city}</span>
          {o.budget && <span><Icon name="wallet" size={13} /> {o.budget}</span>}
          <span><Icon name="clock" size={13} /> {relativni(o.created_at)}</span>
        </div>
      </div>
      <div className="order-actions" style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
        <div className={`badge ${ORDER_STATUS_MAP[o.status]?.color || 'badge-gray'}`}>
          {ORDER_STATUS_MAP[o.status]?.label || o.status}
        </div>
        {o.offers_count > 0 && <div className="badge badge-orange">{o.offers_count} nabídek</div>}
        {o.status === 'accepted' && (
          <button className="btn btn-green btn-sm" onClick={(e) => { e.stopPropagation(); handleCompleteOrder(o.id) }}>
            ✓ Dokončeno
          </button>
        )}
        {o.status === 'completed' && !reviewedOrderIds.has(o.id) && (
          <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); setReviewOrderId(o.id) }}>
            ⭐ Hodnotit
          </button>
        )}
        {o.status === 'completed' && reviewedOrderIds.has(o.id) && (
          <span className="badge badge-green">Ohodnoceno ✓</span>
        )}
        {(o.status === 'new' || o.status === 'in_progress') && (
          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleCancelOrder(o.id) }} style={{ color: '#B91C1C' }}>
            Zrušit
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="dash-layout">
      <div className="dash-sidebar">
        <div className="dash-user">
          <div className="dash-user-avatar">{avatar}</div>
          <div className="dash-user-name">{currentUser?.name}</div>
          <div className="dash-user-role">Zákazník</div>
        </div>
        {menuItems.map(m => (
          <button key={m.id} className={`dash-nav-item ${activePage === m.id ? 'active' : ''}`} onClick={() => setActivePage(m.id)}>
            <span>{m.icon}</span>{m.label}
          </button>
        ))}
        {onLogout && (
          <button className="dash-nav-item" onClick={onLogout}
            style={{ marginTop: 'auto', color: 'var(--red, #B91C1C)' }}>
            <span>🚪</span>Odhlásit
          </button>
        )}
      </div>

      <div className="dash-content">

        {/* ── PŘEHLED ─────────────────────────────────────────────────────── */}
        {activePage === 'overview' && (
          <div className="page-enter">
            <div className="dash-header">
              <div>
                <div className="dash-title">Vítejte, {(currentUser?.name || '').split(' ')[0]}! 👋</div>
                <div className="dash-subtitle">Co potřebujete dnes vyřešit?</div>
              </div>
              <button className="btn btn-primary" onClick={() => onNav('new-order')}><Icon name="plus" size={16} /> Nová poptávka</button>
            </div>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-val">{orders.length}</div><div className="stat-label">Celkem poptávek</div></div>
              <div className="stat-card"><div className="stat-icon">⚡</div><div className="stat-val">{activeOrders.length}</div><div className="stat-label">Aktivní zakázky</div></div>
              <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-val">{completedCount}</div><div className="stat-label">Dokončené</div></div>
              <div className="stat-card"><div className="stat-icon">⭐</div><div className="stat-val">{myReviews.length}</div><div className="stat-label">Moje hodnocení</div></div>
            </div>
            <div className="table-wrap">
              <div className="table-header">
                <span className="table-title">Poslední poptávky</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setActivePage('orders')}>Zobrazit vše →</button>
              </div>
              {loading && <div style={{ padding: 16, color: 'var(--text3)' }}>Načítám…</div>}
              {error && <div style={{ padding: 16, color: '#B91C1C' }}>Chyba: {error}</div>}
              {!loading && !error && orders.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)' }}>
                  Zatím žádné poptávky. <button className="btn btn-link" onClick={() => onNav('new-order')}>Zadat první poptávku →</button>
                </div>
              )}
              {!loading && orders.slice(0, 4).map(o => renderOrderCard(o, { flat: true }))}
            </div>
          </div>
        )}

        {/* ── MOJE POPTÁVKY ────────────────────────────────────────────────── */}
        {activePage === 'orders' && (
          <div className="page-enter">
            <div className="dash-header">
              <div className="dash-title">Moje poptávky</div>
              <button className="btn btn-primary btn-sm" onClick={() => onNav('new-order')}><Icon name="plus" size={14} /> Nová poptávka</button>
            </div>
            {loading && <div style={{ color: 'var(--text3)' }}>Načítám…</div>}
            {!loading && orders.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>Žádné poptávky</h3>
                <p>Zadejte první poptávku a šikulové vám pošlou nabídky.</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!loading && orders.map(o => renderOrderCard(o))}
            </div>
          </div>
        )}

        {/* ── NABÍDKY ──────────────────────────────────────────────────────── */}
        {activePage === 'offers' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 24 }}>Nabídky od šikulů</div>
            {allOffers.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📨</div>
                <h3>Žádné nabídky zatím</h3>
                <p>Jakmile šikulové nabídnou cenu, uvidíte je tady.</p>
              </div>
            )}
            {allOffers.map(offer => (
              <div key={offer.id} className="offer-card">
                <div className="offer-header">
                  <div className="offer-avatar">{offer.sikula_avatar || offer.sikula_name?.[0] || '?'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{offer.sikula_name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>Na poptávku: {offer.order_title}</div>
                    {offer.sikula_rating && <Stars n={Math.round(offer.sikula_rating)} />}
                  </div>
                  <div className="offer-price">{offer.price} Kč</div>
                </div>
                {offer.message && <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 12 }}>{offer.message}</p>}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => onNav('chat')}>💬 Chat</button>
                  {offer.status === 'pending' && (
                    <button className="btn btn-green btn-sm" onClick={() => handleAcceptOffer(offer.id)}>✓ Přijmout nabídku</button>
                  )}
                  {offer.status === 'accepted' && <span className="badge badge-green">✓ Přijato</span>}
                  {offer.status === 'rejected' && <span className="badge badge-gray">Odmítnuto</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── AKTIVNÍ ZAKÁZKY ──────────────────────────────────────────────── */}
        {activePage === 'active' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 24 }}>Aktivní zakázky</div>
            {loading && <div style={{ color: 'var(--text3)' }}>Načítám…</div>}
            {!loading && activeOrders.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">⚡</div>
                <h3>Žádné aktivní zakázky</h3>
                <p>Aktivní zakázka vznikne po přijetí nabídky od šikuly.</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!loading && activeOrders.map(o => renderOrderCard(o))}
            </div>
          </div>
        )}

        {/* ── DOKONČENÉ ────────────────────────────────────────────────────── */}
        {activePage === 'completed' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 24 }}>Dokončené zakázky</div>
            {loading && <div style={{ color: 'var(--text3)' }}>Načítám…</div>}
            {!loading && completedOrders.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <h3>Žádné dokončené zakázky</h3>
                <p>Zde se zobrazí zakázky označené jako hotové.</p>
              </div>
            )}
            {!loading && completedOrders.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {completedOrders.map(o => renderOrderCard(o))}
              </div>
            )}
          </div>
        )}

        {/* ── HODNOCENÍ ────────────────────────────────────────────────────── */}
        {activePage === 'reviews' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 8 }}>Moje hodnocení</div>
            <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>Recenze šikulů, které jste zanechali po dokončené zakázce.</div>

            {/* Zakázky čekající na hodnocení */}
            {completedOrders.filter(o => !reviewedOrderIds.has(o.id)).length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 600, marginBottom: 12, color: 'var(--orange, #F07800)' }}>
                  ⭐ Zakázky čekající na hodnocení
                </div>
                {completedOrders.filter(o => !reviewedOrderIds.has(o.id)).map(o => (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--orange-pale, #fff7ed)', border: '1px solid var(--orange, #F07800)', borderRadius: 'var(--radius)', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{o.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--text2)' }}>{o.city} · {relativni(o.updated_at || o.created_at)}</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => setReviewOrderId(o.id)}>⭐ Hodnotit šikulu</button>
                  </div>
                ))}
              </div>
            )}

            {/* Odeslaná hodnocení */}
            {reviewsLoading && <div style={{ color: 'var(--text3)' }}>Načítám hodnocení…</div>}
            {!reviewsLoading && myReviews.length === 0 && completedOrders.filter(o => !reviewedOrderIds.has(o.id)).length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">⭐</div>
                <h3>Zatím žádná hodnocení</h3>
                <p>Po dokončení první zakázky budete moci ohodnotit svého šikulu.</p>
              </div>
            )}
            {!reviewsLoading && myReviews.length > 0 && (
              <>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>Odeslaná hodnocení ({myReviews.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {myReviews.map(r => (
                    <div key={r.id} className="card card-pad" style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--purple-pale, #f5f3ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                          {r.target_avatar || r.target_name?.[0] || '?'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{r.target_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text3)' }}>{r.order_title}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Stars n={r.stars} />
                          <div style={{ fontSize: 12, color: 'var(--text3)' }}>{relativni(r.created_at)}</div>
                        </div>
                      </div>
                      {r.comment && <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 0 }}>{r.comment}</p>}
                      {r.recommend !== null && (
                        <div style={{ fontSize: 12, color: r.recommend ? 'var(--green, #16a34a)' : 'var(--text3)', marginTop: 6 }}>
                          {r.recommend ? '👍 Doporučuji šikulu' : '👎 Nedoporučuji'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── ZPRÁVY ────────────────────────────────────────────────────────── */}
        {activePage === 'messages' && <ChatPage />}

        {/* ── PROFIL ────────────────────────────────────────────────────────── */}
        {activePage === 'profile' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 24 }}>Profil</div>
            <div className="card card-pad">
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 28 }}>
                <div className="profile-avatar-big">{avatar}</div>
                <div>
                  <h2>{currentUser?.name}</h2>
                  <p style={{ color: 'var(--text2)' }}>{currentUser?.email}</p>
                  <p style={{ color: 'var(--text2)', fontSize: 14 }}>{currentUser?.city}</p>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Jméno</label><input className="form-input" defaultValue={currentUser?.name} /></div>
                <div className="form-group"><label className="form-label">E-mail</label><input className="form-input" defaultValue={currentUser?.email} disabled /></div>
              </div>
              <div className="form-group"><label className="form-label">Město</label><input className="form-input" defaultValue={currentUser?.city} /></div>
              <button className="btn btn-primary">Uložit změny</button>
            </div>
          </div>
        )}
      </div>

      {reviewOrderId && (
        <HodnoceniForm orderId={reviewOrderId}
          onClose={() => setReviewOrderId(null)}
          onSubmitted={() => { setReviewOrderId(null); reload(); reloadReviews() }} />
      )}
    </div>
  )
}

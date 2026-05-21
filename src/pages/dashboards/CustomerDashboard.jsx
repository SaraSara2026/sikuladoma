import { useEffect, useState } from 'react'
import { CATEGORIES, ORDER_STATUS_MAP } from '../../data'
import Icon from '../../components/Icon'
import ChatPage from '../ChatPage'
import { ordersApi, offersApi } from '../../lib/api.js'
import HodnoceniForm from '../../modals/HodnoceniForm.jsx'

const menuItems = [
  { id: 'overview',  icon: '📊', label: 'Přehled' },
  { id: 'orders',    icon: '📋', label: 'Moje poptávky' },
  { id: 'offers',    icon: '💬', label: 'Nabídky' },
  { id: 'active',    icon: '⚡', label: 'Aktivní zakázky' },
  { id: 'completed', icon: '✅', label: 'Dokončené' },
  { id: 'messages',  icon: '💌', label: 'Zprávy' },
  { id: 'favorites', icon: '❤️', label: 'Oblíbení' },
  { id: 'reviews',   icon: '⭐', label: 'Hodnocení' },
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

// Načte všechny nabídky napříč mými poptávkami.
function useAllMyOffers(myOrders) {
  const [offers, setOffers]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    if (myOrders.length === 0) { setOffers([]); setLoading(false); return }
    setLoading(true)
    Promise.all(myOrders.map(o => offersApi.listByOrder(o.id).then(({ offers }) => offers.map(off => ({ ...off, order_title: o.title }))).catch(() => [])))
      .then(arrays => { if (alive) setOffers(arrays.flat()) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [myOrders])

  return { offers, loading }
}

export default function CustomerDashboard({ currentUser, onNav, onLogout }) {
  const [activePage, setActivePage] = useState('overview')
  const { orders, loading, error, reload } = useMyOrders()
  const { offers: allOffers } = useAllMyOffers(orders)

  const completedCount = orders.filter(o => o.status === 'completed').length
  const initials = (currentUser?.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const avatar = currentUser?.avatar || initials
  const [reviewOrderId, setReviewOrderId] = useState(null)

  const handleAcceptOffer = async (offerId) => {
    try { await offersApi.patch(offerId, 'accept'); reload() } catch (e) { alert(e.message) }
  }

  const handleCompleteOrder = async (orderId) => {
    if (!confirm('Označit zakázku jako dokončenou? Toto potvrzuje, že šikula svou práci dokončil.')) return
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
        {o.status === 'completed' && (
          <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); setReviewOrderId(o.id) }}>
            ⭐ Hodnotit
          </button>
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
              <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-val">{orders.length}</div><div className="stat-label">Celkem poptávek</div></div>
              <div className="stat-card"><div className="stat-icon">💬</div><div className="stat-val">{allOffers.length}</div><div className="stat-label">Přijatých nabídek</div></div>
              <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-val">{completedCount}</div><div className="stat-label">Dokončených zakázek</div></div>
              <div className="stat-card"><div className="stat-icon">⭐</div><div className="stat-val">—</div><div className="stat-label">Průměrné hodnocení</div></div>
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
                  </div>
                  <div className="offer-price">{offer.price} Kč</div>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 12 }}>{offer.message}</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => onNav('chat')}>Chat</button>
                  {offer.status === 'pending' && (
                    <button className="btn btn-green btn-sm" onClick={() => handleAcceptOffer(offer.id)}>Přijmout</button>
                  )}
                  {offer.status === 'accepted' && <span className="badge badge-green">Přijato</span>}
                  {offer.status === 'rejected' && <span className="badge badge-gray">Odmítnuto</span>}
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
            <h3>Tato sekce se připravuje</h3>
            <p>Bude napojena v dalším kroku.</p>
          </div>
        )}
      </div>

      {reviewOrderId && (
        <HodnoceniForm orderId={reviewOrderId}
          onClose={() => setReviewOrderId(null)}
          onSubmitted={() => { setReviewOrderId(null); reload() }} />
      )}
    </div>
  )
}

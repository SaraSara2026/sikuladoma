import { useEffect, useState } from 'react'
import { CATEGORIES, DEMO_INVOICES, REVIEWS, INVOICE_STATUS_MAP } from '../../data'
import Icon from '../../components/Icon'
import InvoicePage from '../InvoicePage'
import PricingPage from '../PricingPage'
import ChatPage from '../ChatPage'
import { ordersApi, offersApi } from '../../lib/api'

// Mapování id kategorie → emoji ikona (pro hezké zobrazení v dashboardu).
const CAT_ICON = Object.fromEntries(CATEGORIES.map(c => [c.id, c.icon]))

// Lidsky čitelný relativní čas: „před 12 min", „před 3 h", „včera"
function relativni(iso) {
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

// Hook pro načtení otevřených poptávek (refetch každých 30 s).
function useOpenOrders() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let alive = true
    const load = () => ordersApi.list()
      .then(({ orders }) => { if (alive) { setOrders(orders); setError(null) } })
      .catch(e => { if (alive) setError(e.message) })
      .finally(() => { if (alive) setLoading(false) })
    load()
    const id = setInterval(load, 30000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  return { orders, loading, error }
}

// Hook: vrátí všechny mé nabídky (sikula). Pro 'Odeslané nabídky' a 'Aktivní zakázky' taby.
function useMyOffers() {
  const [offers, setOffers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [bump, setBump]       = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    offersApi.myOffers()
      .then(({ offers }) => { if (alive) { setOffers(offers); setError(null) } })
      .catch(e => { if (alive) setError(e.message) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [bump])

  return { offers, loading, error, reload: () => setBump(x => x + 1) }
}

const menuItems = [
  { id: 'overview', icon: '📊', label: 'Přehled' },
  { id: 'new-jobs', icon: '🔔', label: 'Nové zakázky' },
  { id: 'offers-sent', icon: '📤', label: 'Odeslané nabídky' },
  { id: 'active', icon: '⚡', label: 'Aktivní zakázky' },
  { id: 'calendar', icon: '📅', label: 'Kalendář' },
  { id: 'history', icon: '📁', label: 'Historie' },
  { id: 'earnings', icon: '💰', label: 'Výdělky' },
  { id: 'invoices', icon: '🧾', label: 'Faktury' },
  { id: 'reviews', icon: '⭐', label: 'Recenze' },
  { id: 'membership', icon: '👑', label: 'Členství' },
  { id: 'profile', icon: '👤', label: 'Profil' },
]

function CalendarSection() {
  const days = ['Po','Út','St','Čt','Pá','So','Ne']
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const eventDays = [3, 7, 12, 15, 18, 22, 25]
  const cells = []
  for (let i = 0; i < (firstDay || 7) - 1; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)

  return (
    <div className="page-enter">
      <div className="dash-title" style={{ marginBottom: 24 }}>Kalendář</div>
      <div className="card card-pad" style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3>{today.toLocaleDateString('cs', { month: 'long', year: 'numeric' })}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm">←</button>
            <button className="btn btn-ghost btn-sm">→</button>
          </div>
        </div>
        <div className="calendar-grid" style={{ marginBottom: 8 }}>
          {days.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text3)', padding: '4px 0' }}>{d}</div>)}
        </div>
        <div className="calendar-grid">
          {cells.map((d, i) => (
            <div key={i} className={`cal-day ${d === today.getDate() ? 'today' : eventDays.includes(d) ? 'has-event' : d ? '' : 'other-month'}`}>
              {d ?? ''}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Nadcházející zakázky</h3>
        {[{ date: '15.4.', time: '10:00', title: 'Montáž skříně', customer: 'Jana N.' }, { date: '18.4.', time: '14:00', title: 'Čištění sedačky', customer: 'Petra M.' }].map((e, i) => (
          <div key={i} className="card card-pad" style={{ marginBottom: 10, display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ textAlign: 'center', background: 'var(--brand)', color: 'var(--accent)', padding: '8px 12px', borderRadius: 10, fontFamily: 'Syne', fontWeight: 800, minWidth: 54 }}>
              <div style={{ fontSize: 18 }}>{e.date.split('.')[0]}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>dubna</div>
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{e.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{e.customer} · {e.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SikulaDashboard({ currentUser, onNav, onLogout }) {
  const [activePage, setActivePage] = useState('overview')
  const [available, setAvailable] = useState(true)
  const { orders, loading: ordersLoading, error: ordersError } = useOpenOrders()
  const { offers: myOffers, reload: reloadMyOffers } = useMyOffers()

  const acceptedJobs = myOffers.filter(o => o.status === 'accepted')

  const markComplete = async (orderId) => {
    if (!confirm('Označit zakázku jako hotovou?')) return
    try {
      await ordersApi.patch(orderId, 'complete')
      reloadMyOffers()
    } catch (e) {
      alert(e.message)
    }
  }

  // Field-name kompatibilita: nový backend vrací `jobs_count`, demo data místy `jobs`.
  const jobsCount = currentUser?.jobs_count ?? currentUser?.jobs ?? 0
  const initials = (currentUser?.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const avatar = currentUser?.avatar || initials

  return (
    <div className="dash-layout">
      <div className="dash-sidebar">
        <div className="dash-user">
          <div className="dash-user-avatar">{avatar}</div>
          <div className="dash-user-name">{currentUser?.name}</div>
          <div className="dash-user-role" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="online-dot" style={{ background: available ? 'var(--green)' : 'var(--text3)' }} />
            {available ? 'Dostupný' : 'Nedostupný'}
          </div>
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
                <div className="dash-title">Ahoj, {(currentUser?.name || '').split(' ')[0] || 'šikulo'}! 🛠️</div>
                <div className="dash-subtitle">{currentUser?.plan || 'start'} · {jobsCount} zakázek celkem</div>
              </div>
              <div className="avail-toggle">
                <span style={{ fontSize: 14, fontWeight: 600 }}>{available ? 'Dostupný' : 'Nedostupný'}</span>
                <button className={`toggle-switch ${available ? 'on' : ''}`} onClick={() => setAvailable(a => !a)} />
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-val">18 400 Kč</div><div className="stat-label">Tento měsíc</div><div className="stat-trend">↑ +12% vs minulý</div></div>
              <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-val">6</div><div className="stat-label">Aktivní zakázky</div></div>
              <div className="stat-card"><div className="stat-icon">⭐</div><div className="stat-val">4.9</div><div className="stat-label">Hodnocení</div></div>
              <div className="stat-card"><div className="stat-icon">👁️</div><div className="stat-val">342</div><div className="stat-label">Zobrazení profilu</div><div className="stat-trend">↑ tento týden</div></div>
            </div>
            <div className="table-wrap">
              <div className="table-header">
                <span className="table-title">Nové zakázky v okolí</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setActivePage('new-jobs')}>Zobrazit vše →</button>
              </div>
              {ordersLoading && <div style={{ padding: 16, color: 'var(--text3)', fontSize: 14 }}>Načítám…</div>}
              {ordersError && !ordersLoading && (
                <div style={{ padding: 16, color: 'var(--red, #B91C1C)', fontSize: 13 }}>Nepodařilo se načíst zakázky: {ordersError}</div>
              )}
              {!ordersLoading && !ordersError && orders.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🕊️</div>
                  Zatím žádné nové poptávky. Zkontroluju to znovu za 30 s.
                </div>
              )}
              {!ordersLoading && !ordersError && orders.slice(0, 3).map(o => (
                <div key={o.id} className="order-card" style={{ margin: 0, borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border)' }}>
                  <div className="order-cat-icon">{CAT_ICON[o.category] || '🔧'}</div>
                  <div className="order-info">
                    <div className="order-title">{o.title}</div>
                    <div className="order-meta">
                      <span><Icon name="map" size={13} /> {o.city}</span>
                      {o.budget && <span><Icon name="wallet" size={13} /> {o.budget}</span>}
                      <span><Icon name="clock" size={13} /> {relativni(o.created_at)}</span>
                      {o.urgent && <span style={{ color: 'var(--red)' }}>🚨 Urgentní</span>}
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => onNav('send-offer', o)}>Nabídnout se</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePage === 'new-jobs' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 24 }}>Nové zakázky v okolí</div>
            {ordersLoading && <div style={{ color: 'var(--text3)' }}>Načítám zakázky…</div>}
            {ordersError && !ordersLoading && (
              <div style={{ color: 'var(--red, #B91C1C)' }}>Nepodařilo se načíst: {ordersError}</div>
            )}
            {!ordersLoading && !ordersError && orders.length === 0 && (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-icon">🕊️</div>
                <h3>Žádné nové poptávky</h3>
                <p>Až přijde nová poptávka, ukáže se tu automaticky.</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!ordersLoading && !ordersError && orders.map(o => (
                <div key={o.id} className="order-card">
                  <div className="order-cat-icon">{CAT_ICON[o.category] || '🔧'}</div>
                  <div className="order-info">
                    <div className="order-title">{o.title}</div>
                    <div className="order-meta">
                      <span><Icon name="map" size={13} /> {o.city}</span>
                      {o.budget && <span><Icon name="wallet" size={13} /> {o.budget}</span>}
                      <span><Icon name="clock" size={13} /> {relativni(o.created_at)}</span>
                      {o.urgent && <span style={{ color: 'var(--red)' }}>🚨 Urgentní</span>}
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => onNav('send-offer', o)}>Nabídnout se</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePage === 'active' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 24 }}>Aktivní zakázky</div>
            {acceptedJobs.length === 0 && (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-icon">📭</div>
                <h3>Žádné aktivní zakázky</h3>
                <p>Jakmile zákazník přijme některou z vašich nabídek, zobrazí se zde.</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {acceptedJobs.map(o => (
                <div key={o.id} className="order-card">
                  <div className="order-info">
                    <div className="order-title">{o.order_title || 'Zakázka'}</div>
                    <div className="order-meta">
                      <span><Icon name="map" size={13} /> {o.order_city}</span>
                      <span><Icon name="wallet" size={13} /> {o.price} Kč (dohodnutá cena)</span>
                      {o.available_date && <span><Icon name="calendar" size={13} /> {o.available_date}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <span className="badge badge-green">Přijato</span>
                    <button className="btn btn-green btn-sm" onClick={() => markComplete(o.order_id)}>
                      ✓ Označit jako hotovou
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePage === 'offers-sent' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 24 }}>Odeslané nabídky</div>
            {myOffers.length === 0 && (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-icon">📤</div>
                <h3>Žádné odeslané nabídky</h3>
                <p>Vyberte zakázku ze záložky „Nové zakázky" a pošlete svou první nabídku.</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myOffers.map(o => (
                <div key={o.id} className="order-card">
                  <div className="order-info">
                    <div className="order-title">{o.order_title || 'Zakázka'}</div>
                    <div className="order-meta">
                      <span><Icon name="map" size={13} /> {o.order_city}</span>
                      <span><Icon name="wallet" size={13} /> {o.price} Kč</span>
                    </div>
                    {o.message && <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>{o.message}</p>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    {o.status === 'pending'  && <span className="badge badge-orange">Čeká na odpověď</span>}
                    {o.status === 'accepted' && <span className="badge badge-green">Přijato ✓</span>}
                    {o.status === 'rejected' && <span className="badge badge-gray">Odmítnuto</span>}
                    {o.status === 'withdrawn' && <span className="badge badge-gray">Staženo</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePage === 'invoices' && <InvoicePage />}
        {activePage === 'calendar' && <CalendarSection />}
        {activePage === 'membership' && <PricingPage onNav={onNav} inDash />}
        {activePage === 'messages' && <ChatPage />}

        {activePage === 'earnings' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 24 }}>Výdělky</div>
            <div className="stats-grid" style={{ marginBottom: 24 }}>
              <div className="stat-card"><div className="stat-val">18 400 Kč</div><div className="stat-label">Tento měsíc</div></div>
              <div className="stat-card"><div className="stat-val">142 600 Kč</div><div className="stat-label">Celkem</div></div>
              <div className="stat-card"><div className="stat-val">1 635 Kč</div><div className="stat-label">Průměr zakázka</div></div>
              <div className="stat-card"><div className="stat-val">87</div><div className="stat-label">Zakázek celkem</div></div>
            </div>
            <div className="table-wrap">
              <div className="table-header"><span className="table-title">Historie plateb</span></div>
              <table className="table">
                <thead><tr><th>Zakázka</th><th>Zákazník</th><th>Částka</th><th>Datum</th><th>Stav</th></tr></thead>
                <tbody>
                  {DEMO_INVOICES.map(inv => (
                    <tr key={inv.id}>
                      <td><strong>{inv.title}</strong></td>
                      <td>{inv.customer}</td>
                      <td><strong>{inv.amount.toLocaleString()} Kč</strong></td>
                      <td>{inv.created}</td>
                      <td><span className={`badge ${INVOICE_STATUS_MAP[inv.status]?.color}`}>{INVOICE_STATUS_MAP[inv.status]?.label}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activePage === 'reviews' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 8 }}>Moje recenze</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ fontFamily: 'Syne', fontSize: 48, fontWeight: 800, color: 'var(--brand)' }}>4.9</div>
              <div>
                <div className="stars" style={{ fontSize: 20 }}>★★★★★</div>
                <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4 }}>87 hodnocení</div>
              </div>
            </div>
            <div className="reviews-grid">
              {REVIEWS.slice(0, 4).map((r, i) => (
                <div key={i} className="review-card">
                  <div className="review-header">
                    <div className="review-avatar" style={{ width: 36, height: 36, fontSize: 13 }}>{r.initials}</div>
                    <div className="review-meta"><div className="review-name" style={{ fontSize: 14 }}>{r.name}</div><div className="review-service">{r.service}</div></div>
                    <div className="stars">{'★'.repeat(r.stars)}</div>
                  </div>
                  <div className="review-text">&ldquo;{r.text}&rdquo;</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePage === 'profile' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 24 }}>Profil šikuly</div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="profile-hero">
                <div className="profile-avatar-big">{avatar}</div>
                <div className="profile-info">
                  <h2>{currentUser?.name}</h2>
                  <p>📍 {currentUser?.city || '—'}</p>
                  <div className="profile-badges">
                    {currentUser?.verified && <span className="badge badge-green">✓ Ověřený šikula</span>}
                    {currentUser?.plan && <span className="badge badge-blue">👑 {currentUser.plan}</span>}
                    {currentUser?.rating && <span className="badge badge-orange">⭐ {currentUser.rating} ({jobsCount} recenzí)</span>}
                  </div>
                </div>
              </div>
              <div style={{ padding: 24 }}>
                <div className="form-group">
                  <label className="form-label">Bio / Představení</label>
                  <textarea className="form-textarea" defaultValue="Zkušený šikula s 10+ lety praxe. Rychlý, precizní, spolehlivý." />
                </div>
                <div className="form-group">
                  <label className="form-label">Moje služby</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {(currentUser?.services ?? []).map(s => <span key={s} className="pill-tag">{s}</span>)}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">IČO</label><input className="form-input" defaultValue="12345678" /></div>
                  <div className="form-group"><label className="form-label">Hodinová sazba</label><input className="form-input" defaultValue="350 Kč" /></div>
                </div>
                <button className="btn btn-primary">Uložit změny</button>
              </div>
            </div>
          </div>
        )}

        {!['overview','new-jobs','invoices','earnings','calendar','profile','membership','reviews','messages','offers-sent','active','history'].includes(activePage) && (
          <div className="empty-state">
            <div className="empty-icon">🚧</div>
            <h3>Tato sekce se připravuje</h3>
            <p>Bude napojena v dalším kroku.</p>
          </div>
        )}
        {activePage === 'history' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 24 }}>Historie</div>
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-icon">📚</div>
              <h3>Historie zakázek</h3>
              <p>Brzy zde uvidíte všechny dokončené zakázky.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

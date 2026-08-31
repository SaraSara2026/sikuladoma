import { useEffect, useState } from 'react'
import { ORDER_STATUS_MAP } from '../data'
import Icon from '../components/Icon'
import { offersApi, ordersApi } from '../lib/api'
import { formatCurrencyCz, formatDateCz, getOrderTiming } from '../lib/format.js'
import { isSikulaPlanActive } from '../lib/plan.js'
import ChatPage from './ChatPage.jsx'
import LinkAccountMismatch from '../components/LinkAccountMismatch.jsx'

const TIMING_COLOR = { urgent: '#B91C1C', soon: '#C2410C', flexible: 'var(--text2)' }
const TIMING_ICON  = { urgent: '🚨', soon: '⚡', flexible: '🕊️' }

const fieldLabel = { fontSize: 11, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }
const fieldValue = { fontSize: 15, fontWeight: 600, marginTop: 4 }

export default function OrderDetailPage({ order: orderProp, onNav, currentUser, onAcceptOffer }) {
  const [activeTab, setActiveTab] = useState('detail')
  const [offers, setOffers]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [acting, setActing]       = useState(null) // id právě akceptované nabídky
  const [fullOrder, setFullOrder] = useState(null)
  const [fetchError, setFetchError] = useState(null)

  // Bez aktivního tarifu šikula nesmí vidět detail poptávky ani nabídky/zprávy k ní.
  // Zrušený tarif zůstává funkční až do konce zaplaceného období.
  const sikulaHasActivePlan = isSikulaPlanActive(currentUser)
  const gateForSikula = currentUser?.role === 'sikula' && !sikulaHasActivePlan

  // Navigace sem občas nese jen část polí zakázky (např. ze seznamu nabídek
  // v dashboardu, nebo jen {id} z e-mailového odkazu) — vždy dotáhneme
  // autoritativní plný detail přes API, které samo maskuje popis/adresu/
  // kontakt podle role a vztahu k zakázce.
  useEffect(() => {
    if (!orderProp?.id || gateForSikula) return
    let alive = true
    setFetchError(null)
    ordersApi.get(orderProp.id)
      .then(({ order }) => { if (alive) setFullOrder(order) })
      .catch(e => { if (alive) setFetchError(e) })
    return () => { alive = false }
  }, [orderProp?.id, gateForSikula])

  const order = fullOrder || orderProp

  useEffect(() => {
    if (!orderProp?.id || gateForSikula) return
    let alive = true
    setLoading(true)
    offersApi.listByOrder(orderProp.id)
      .then(({ offers }) => { if (alive) { setOffers(offers); setError(null) } })
      .catch(e => { if (alive) setError(e.message) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [orderProp?.id, gateForSikula])

  if (!orderProp) return null

  if (gateForSikula) {
    return (
      <div className="page-enter" style={{ padding: '32px 24px', maxWidth: 640, margin: '0 auto' }}>
        <button className="btn btn-ghost" onClick={() => onNav('back')} style={{ marginBottom: 16 }}>← Zpět</button>
        <div className="card card-pad" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h2 style={{ marginBottom: 22 }}>Pro zobrazení detailu poptávky a odeslání nabídky si aktivujte tarif.</h2>
          <button className="btn btn-primary" onClick={() => onNav('dash-sikula')}>Aktivovat tarif</button>
        </div>
      </div>
    )
  }

  // Autoritativní dotažení selhalo a nemáme z navigace ani žádná smysluplná
  // data k zobrazení — typicky přišel uživatel rovnou z e-mailového odkazu
  // pod jiným účtem, než pro který byl e-mail určený. Radši jasná hláška
  // (a možnost přihlásit se pod správným účtem) než cizí/rozbitá stránka.
  if (fetchError && !orderProp.title) {
    if (fetchError.message === 'Poptávka neexistuje.') {
      return (
        <div className="page-enter" style={{ padding: '32px 24px', maxWidth: 640, margin: '0 auto' }}>
          <button className="btn btn-ghost" onClick={() => onNav('back')} style={{ marginBottom: 16 }}>← Zpět</button>
          <div className="card card-pad" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
            <h2 style={{ marginBottom: 8 }}>Tuto poptávku nelze zobrazit</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>Poptávka neexistuje nebo byla zrušena.</p>
          </div>
        </div>
      )
    }
    return <LinkAccountMismatch onNav={onNav} text="Přihlaste se prosím správným e-mailem, abyste viděli tuto poptávku." />
  }

  // "Zprávy k zakázce" má smysl jen když je jasné, s kým — u přijaté/dokončené
  // zakázky je to jednoznačně buď přijatý šikula, nebo zadavatel poptávky.
  const isResolved = order.status === 'accepted' || order.status === 'completed'
  const timing = getOrderTiming(order)
  const acceptedOffer = offers.find(o => o.status === 'accepted')
  const chatOtherUserId = currentUser?.role === 'customer' ? acceptedOffer?.sikula_id : order.customer_id

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
          {[
            ['detail', '📋 Detail'],
            ['offers', `💬 Nabídky (${offers.length})`],
            ...(isResolved && chatOtherUserId ? [['messages', '✉️ Zprávy k zakázce']] : []),
          ].map(([t, label]) => (
            <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{label}</button>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          {activeTab === 'detail' && (
            <div>
              <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.8, marginBottom: 20 }}>
                {order.description || order.desc || 'Žádný popis.'}
              </p>
              <div className="rgrid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['Patro / přístup', order.floor || order.access],
                  ['Parkování',       order.parking],
                  ['Termín', timing && (
                    <span style={{ color: TIMING_COLOR[timing.tone] }}>{TIMING_ICON[timing.tone]} {timing.label}</span>
                  )],
                  ['Preferovaný termín', formatDateCz(order.preferred_date)],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--bg)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Kontakt na zákazníka se u šikuly zobrazí, jen když ho API
                  vrátilo — to se stane až u zakázky s přijatou nabídkou. */}
              {currentUser?.role === 'sikula' && (order.customer_name || order.customer_phone || order.customer_email) && (
                <div style={{ marginTop: 16, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 12, color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Kontakt na zákazníka</div>
                  {order.customer_name && <div style={{ fontSize: 14, fontWeight: 600 }}>{order.customer_name}</div>}
                  {order.customer_phone && <div style={{ fontSize: 14 }}>📞 {order.customer_phone}</div>}
                  {order.customer_email && <div style={{ fontSize: 14 }}>✉️ {order.customer_email}</div>}
                </div>
              )}
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
                      <div style={fieldLabel}>Nabídka od</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{offer.sikula_name}</span>
                        {offer.sikula_verified && <span className="badge badge-green" style={{ fontSize: 11 }}>✓ Ověřen</span>}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', gap: 10, marginTop: 2 }}>
                        {offer.sikula_rating && <>
                          <span className="stars">{'★'.repeat(Math.floor(offer.sikula_rating))}</span>
                          <span>{offer.sikula_rating} ({offer.sikula_jobs || 0} zakázek)</span>
                        </>}
                      </div>
                      {/* Telefon šikuly vidí zákazník až u přijaté nabídky (API ho jinak nevrátí). */}
                      {offer.sikula_phone && (
                        <div style={{ fontSize: 13, color: '#166534', fontWeight: 600, marginTop: 4 }}>📞 {offer.sikula_phone}</div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, margin: '14px 0' }}>
                    <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 12 }}>
                      <div style={fieldLabel}>Předběžná cena</div>
                      <div style={fieldValue}>{formatCurrencyCz(offer.price)}</div>
                    </div>
                    {offer.available_time && (
                      <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 12 }}>
                        <div style={fieldLabel}>Odhad délky práce</div>
                        <div style={fieldValue}>{offer.available_time}</div>
                      </div>
                    )}
                    {formatDateCz(offer.available_date) && (
                      <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 12 }}>
                        <div style={fieldLabel}>Navrhovaný termín</div>
                        <div style={fieldValue}>{formatDateCz(offer.available_date)}</div>
                      </div>
                    )}
                  </div>

                  {offer.message && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={fieldLabel}>Zpráva šikuly</div>
                      <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginTop: 4 }}>{offer.message}</div>
                    </div>
                  )}

                  {offer.status === 'pending' && (
                    <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'right', marginBottom: 8 }}>
                      Zprávy budou dostupné po přijetí nabídky.
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {/* Konverzace vzniká až po přijetí nabídky (viz api/conversations.js) —
                        u nepřijaté nabídky by tlačítko jen skončilo chybou 403. */}
                    {offer.status === 'accepted' && (
                      <button className="btn btn-outline btn-sm"
                        onClick={() => onNav('chat', { otherUserId: offer.sikula_id, orderId: order.id })}>
                        Napsat zprávu
                      </button>
                    )}
                    {currentUser?.role === 'customer' && offer.status === 'pending' && (
                      <button className="btn btn-green btn-sm" disabled={acting === offer.id} onClick={() => accept(offer)}>
                        {acting === offer.id ? 'Přijímám…' : <><Icon name="check" size={14} /> Přijmout nabídku</>}
                      </button>
                    )}
                    {offer.status === 'accepted' && <span className="badge badge-green">Přijato</span>}
                    {offer.status === 'rejected' && <span className="badge badge-gray">Odmítnuto</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'messages' && isResolved && chatOtherUserId && (
            <div style={{ margin: '-24px' }}>
              <ChatPage currentUser={currentUser} startWith={{ otherUserId: chatOtherUserId, orderId: order.id }} embedded />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

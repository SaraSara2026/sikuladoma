import { useEffect, useRef, useState } from 'react'
import { CATEGORIES } from '../../data'
import Icon from '../../components/Icon'
import InvoicePage from '../InvoicePage'
import { ordersApi, offersApi, reviewsApi, usersApi, conversationsApi } from '../../lib/api'
import { apiMe, apiResendVerification } from '../../lib/auth'
import VerificationBanner from '../../components/VerificationBanner'
import AvatarUpload from '../../components/AvatarUpload'
import { SERVICES } from '../../lib/categories'
import { formatPhoneCZ, isValidPhoneCZ } from '../../lib/phone'
import { formatCurrencyCz, formatDateCz, getOrderTiming } from '../../lib/format.js'
import { isSikulaPlanActive } from '../../lib/plan.js'

// Po návratu ze Stripe checkoutu webhook aktivuje tarif v DB až s malým zpožděním.
// currentUser v appce žije v localStorage a sám se neobnoví, tak ho tu pár vteřin
// dotahujeme přes /api/auth/me, dokud se tarif neprojeví (nebo dokud to nevzdáme).
async function pollUserAfterCheckout(onUpdateUser, attempt = 0) {
  try {
    const { user } = await apiMe()
    if (user) onUpdateUser?.(user)
    if (user?.subscription_status === 'active') return
  } catch (err) {
    console.warn('[stripe/success] obnovení uživatele selhalo:', err)
  }
  if (attempt < 6) {
    setTimeout(() => pollUserAfterCheckout(onUpdateUser, attempt + 1), 2000)
  }
}

// Mapování id kategorie → emoji ikona (pro hezké zobrazení v dashboardu).
const CAT_ICON = Object.fromEntries(CATEGORIES.map(c => [c.id, c.icon]))
// Mapování id služby (hlavní kategorie) → čitelný název, pro sekci "Moje služby".
const SVC_LABEL = Object.fromEntries(SERVICES.map(s => [s.id, s.label]))

const PLAN_LABELS = {
  start: 'Start', plus: 'Plus', profi: 'Profi',
  'aktiv': 'Aktivní šikula', 'aktiv-plus': 'Aktivní šikula Plus',
}
const PLAN_COLORS = {
  start: 'var(--text3)',
  plus:  'var(--blue, #2563eb)',
  profi: 'var(--purple, #7c3aed)',
  'aktiv':      'var(--orange, #F07800)',
  'aktiv-plus': 'var(--purple, #7c3aed)',
}

function PlanBadge({ plan, expiresAt }) {
  const p = plan || 'start'
  const label = PLAN_LABELS[p] || p
  const color = PLAN_COLORS[p] || 'var(--text3)'
  const expiry = expiresAt ? new Date(expiresAt) : null
  const expStr = expiry ? `do ${expiry.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })}` : null
  return (
    <span style={{ color, fontWeight: 700 }}>
      {p !== 'start' ? '👑 ' : ''}{label}
      {expStr && <span style={{ fontWeight: 400, color: 'var(--text3)', fontSize: 12, marginLeft: 4 }}>({expStr})</span>}
    </span>
  )
}

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
function useOpenOrders(city, services) {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const categoriesKey = Array.isArray(services) ? services.join(',') : ''

  useEffect(() => {
    let alive = true
    const params = {}
    if (city) params.city = city
    if (categoriesKey) params.categories = categoriesKey
    const load = () => ordersApi.list(params)
      .then(({ orders }) => { if (alive) { setOrders(orders); setError(null) } })
      .catch(e => { if (alive) setError(e.message) })
      .finally(() => { if (alive) setLoading(false) })
    load()
    const id = setInterval(load, 30000)
    return () => { alive = false; clearInterval(id) }
  }, [city, categoriesKey])

  return { orders, loading, error }
}

// Hook: načte recenze o tomto šikulovi (jsem-li target).
function useMyReviews(sikulaId) {
  const [data, setData] = useState({ reviews: [], summary: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!sikulaId) return
    let alive = true
    setLoading(true)
    reviewsApi.byTarget(sikulaId)
      .then(d => { if (alive) setData(d) })
      .catch(e => { if (alive) setError(e.message) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [sikulaId])

  return { ...data, loading, error }
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

// Hook: součet nepřečtených zpráv napříč konverzacemi — pro badge u „Zprávy“.
// Vrací všechny konverzace (pro badge "Zprávy" u konkrétní zakázky) i součet
// nepřečtených napříč všemi — pro badge v levém menu.
function useConversations() {
  const [conversations, setConversations] = useState([])
  useEffect(() => {
    let alive = true
    const load = () => conversationsApi.list()
      .then(({ conversations }) => { if (alive) setConversations(conversations) })
      .catch(() => {})
    load()
    const id = setInterval(load, 30000)
    return () => { alive = false; clearInterval(id) }
  }, [])
  const unreadTotal = conversations.reduce((sum, c) => sum + (Number(c.unread_count) || 0), 0)
  return { conversations, unreadTotal }
}

// lock: 'plan' = vyžaduje alespoň Aktivní šikula (199 Kč)
// lock: 'plus'  = vyžaduje Aktivní šikula Plus (299 Kč)
// 'new-jobs' záměrně bez zámku — náhled poptávek je zdarma, platí se až za reakci (viz SendOfferPage).
const menuItems = [
  { id: 'profile',      icon: '👤', label: 'Profil šikuly' },
  { id: 'overview',     icon: '📊', label: 'Přehled' },
  { id: 'new-jobs',     icon: '🔔', label: 'Nové zakázky' },
  { id: 'offers-sent',  icon: '📤', label: 'Odeslané nabídky',  lock: 'plan' },
  { id: 'active',       icon: '⚡', label: 'Aktivní zakázky',   lock: 'plan' },
  { id: 'oznameni',     icon: '📣', label: 'Oznámení' },
  { id: 'calendar',     icon: '📅', label: 'Kalendář',          lock: 'plus' },
  { id: 'earnings',     icon: '💰', label: 'Výdělky',           lock: 'plus' },
  { id: 'invoices',     icon: '🧾', label: 'Faktury',           lock: 'plus' },
  { id: 'reviews',      icon: '⭐', label: 'Recenze',           lock: 'plan' },
  { id: 'history',      icon: '📁', label: 'Dokončené zakázky',  lock: 'plan' },
  { id: 'membership',   icon: '👑', label: 'Aktivace tarifu' },
]

// Obrazovka pro zamčenou funkci
// Krátký benefit text pro jednotlivé Plus funkce — místo jednoho obecného
// textu pro všechny tři, ať je jasné, co konkrétně Plus u dané sekce přináší.
const PLUS_FEATURE_COPY = {
  calendar: 'Mějte zakázky přehledně v kalendáři. Termíny, domluvy a práce na jednom místě.',
  invoices: 'Faktury bez papírů a složité administrativy. V tarifu Plus si jednoduše vystavíte fakturu k dokončené zakázce.',
  earnings: 'Vidíte, kolik vám zakázky přinesly. Přehled příjmů z dokončených prací bez počítání bokem.',
}

function LockedScreen({ type, feature, onActivate }) {
  const isPlus = type === 'plus'
  return (
    <div className="page-enter" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ maxWidth: 420, textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1F2E', marginBottom: 12 }}>
          {isPlus ? 'Tato funkce je dostupná v tarifu Plus.' : 'Váš profil je připravený.'}
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
          {isPlus
            ? (PLUS_FEATURE_COPY[feature] || 'Tato funkce je součástí tarifu Aktivní šikula Plus za 299 Kč / měsíc.')
            : 'Aktivujte tarif a můžete začít reagovat na poptávky.'}
        </p>
        <button onClick={onActivate}
          style={{ height: 48, padding: '0 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#F97316,#EA580C)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(249,115,22,.35)', marginBottom: 14 }}>
          {isPlus ? 'Přejít na Plus' : 'Aktivovat tarif'}
        </button>
        <p style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>
          Platba probíhá bezpečně kartou online přes platební bránu. Tarif se obnovuje měsíčně a lze ho kdykoliv zrušit.
        </p>
      </div>
    </div>
  )
}

// Neověřený šikula nesmí vidět žádný pracovní obsah (Nové zakázky, nabídky,
// zprávy…) — ověření e-mailu je první brána, tarif až druhá.
function VerifyGate({ user }) {
  const [state, setState] = useState('idle') // idle | sending | sent | error
  const [msg, setMsg] = useState('')

  const resend = async () => {
    setState('sending')
    setMsg('')
    try {
      await apiResendVerification()
      setState('sent')
      setMsg('Poslali jsme vám ověřovací e-mail znovu.')
    } catch (e) {
      setState('error')
      setMsg(e.message || 'Ověřovací e-mail se nepodařilo odeslat. Zkuste to znovu.')
    }
  }

  return (
    <div className="page-enter" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ maxWidth: 440, textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1F2E', marginBottom: 12 }}>Ověřte svůj e-mail</h2>
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 20 }}>
          Poslali jsme vám ověřovací odkaz na <strong>{user?.email}</strong>.<br />
          Bez ověření e-mailu nemůžete používat profil šikuly.
        </p>
        {msg && (
          <div style={{ marginBottom: 16, fontSize: 13, color: state === 'error' ? '#B91C1C' : '#166534' }}>
            {msg}
          </div>
        )}
        <button onClick={resend} disabled={state === 'sending' || state === 'sent'}
          style={{ height: 46, padding: '0 26px', borderRadius: 12, border: 'none', background: state === 'sent' ? '#D1FAE5' : 'linear-gradient(135deg,#F97316,#EA580C)', color: state === 'sent' ? '#065F46' : '#fff', fontWeight: 700, fontSize: 15, cursor: state === 'sending' || state === 'sent' ? 'default' : 'pointer', marginBottom: 16 }}>
          {state === 'sending' ? 'Posílám…' : state === 'sent' ? '✓ Odesláno' : 'Poslat ověřovací e-mail znovu'}
        </button>
        <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>
          Po ověření e-mailu se vraťte zpět a pokračujte v nastavení profilu.
        </p>
      </div>
    </div>
  )
}

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
        <div style={{ padding: '20px 16px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 12, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
          Zatím nemáte naplánované žádné zakázky.
        </div>
      </div>
    </div>
  )
}


function VylepseniProfilu({ currentUser, onLogout }) {
  const subStatus = currentUser?.subscription_status || 'inactive'
  const currentPlan = currentUser?.plan || 'start'
  const renewalEnd = currentUser?.plan_expires_at
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' }) : null
  // Tarif se obnoví (skutečně "aktivní") vs. byl zrušený, ale zaplacené
  // období ještě neuplynulo (grace period — profil je pořád plně funkční,
  // jen se nebude obnovovat).
  const isTrulyActive   = subStatus === 'active' && (currentPlan === 'aktiv' || currentPlan === 'aktiv-plus')
  const isCancelledGrace = subStatus === 'cancelled' && isSikulaPlanActive(currentUser)
  const isActive = isTrulyActive || isCancelledGrace
  const [billing, setBilling] = useState('monthly') // 'monthly' | 'yearly'
  const [busyPlan, setBusyPlan] = useState(null)   // null | 'aktiv' | 'aktiv-plus'
  const [errPlan, setErrPlan] = useState(null)
  const [checkoutErr, setCheckoutErr] = useState(null)

  const goCheckout = async (plan) => {
    setBusyPlan(plan)
    setErrPlan(null)
    setCheckoutErr(null)
    try {
      const r = await fetch('/api/stripe?action=checkout', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billing }),
      })
      const text = await r.text()
      let d = null
      try { d = JSON.parse(text) } catch { /* non-JSON */ }
      console.log('[stripe/checkout] HTTP', r.status, 'plan:', plan, 'billing:', billing, 'raw:', text.slice(0, 500))
      if (d?.url) { window.location.href = d.url; return }
      if (r.status === 401) {
        console.warn('[stripe/checkout] session expired/invalid, code:', d?.code)
        setErrPlan(plan)
        setCheckoutErr('Přihlášení vypršelo. Přihlas se prosím znovu.')
        onLogout?.()
        return
      }
      const msg = d?.error || text.slice(0, 300) || `HTTP ${r.status}`
      console.error('[stripe/checkout] failed:', msg)
      setErrPlan(plan)
      setCheckoutErr(`Chyba (${r.status}): ${msg}`)
    } catch (err) {
      console.error('[stripe/checkout] network error:', err)
      setErrPlan(plan)
      setCheckoutErr(`Síťová chyba: ${err.message || 'Nepodařilo se připojit k serveru.'}`)
    } finally {
      setBusyPlan(null)
    }
  }

  const TARIFY = [
    {
      id: 'aktiv',
      name: 'Aktivní šikula',
      monthlyPrice: 199,
      yearlyPrice: 2240,
      yearlyOriginal: 2388,
      color: '#F97316',
      border: '#FED7AA',
      features: [
        'Profil šikuly',
        'Nové zakázky',
        'Odeslané nabídky',
        'Aktivní zakázky',
        'Recenze',
        'Zobrazení zákazníkům',
        'Možnost reagovat na poptávky',
        'Bez kreditů za odpovědi',
        'Žádná provize ze zakázky',
        'Zákazník platí přímo šikulovi',
      ],
    },
    {
      id: 'aktiv-plus',
      name: 'Aktivní šikula Plus',
      monthlyPrice: 299,
      yearlyPrice: 3300,
      yearlyOriginal: 3588,
      color: '#7C3AED',
      border: '#C4B5FD',
      badge: 'Více funkcí',
      features: [
        'Vše z tarifu Aktivní šikula',
        'Bez kreditů za odpovědi',
        'Přehled zakázek na jednom místě',
        'Kalendář zakázek',
        'Jednoduchý fakturovač',
        'Přehled zákazníků',
        'Přehled vystavených faktur',
        'Dokončené zakázky',
        'Evidence příjmů ze zakázek',
        'Vhodné pro šikuly, kteří chtějí mít zakázky, zákazníky a faktury přehledně pohromadě',
      ],
    },
  ]

  const price = (t) => billing === 'yearly' ? t.yearlyPrice : t.monthlyPrice
  const unit = billing === 'yearly' ? '/ rok' : '/ měsíc'
  const btnLabel = (t) => {
    const p = price(t).toLocaleString('cs-CZ')
    if (t.id === 'aktiv')      return billing === 'yearly' ? `Aktivovat ročně za ${p} Kč` : `Aktivovat za ${p} Kč`
    return billing === 'yearly' ? `Aktivovat Plus ročně za ${p} Kč` : `Aktivovat Plus za ${p} Kč`
  }

  return (
    <div className="page-enter">
      <div className="dash-title" style={{ marginBottom: 8 }}>Aktivace tarifu</div>

      {/* Aktuální stav */}
      {isTrulyActive && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '12px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: '#166534' }}>
            ✓ Váš tarif je aktivní{renewalEnd ? ` — obnoví se ${fmtDate(renewalEnd)}` : ''}
          </span>
          <button onClick={() => {
            fetch('/api/stripe?action=portal', { credentials: 'include' })
              .then(r => r.json()).then(d => { if (d.url) window.location.href = d.url; });
          }} style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
            Spravovat / zrušit
          </button>
        </div>
      )}
      {isCancelledGrace && (
        <div style={{ padding: '12px 16px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: '#9A3412' }}>
            Tarif je zrušený, ale zůstává aktivní do <strong>{fmtDate(renewalEnd)}</strong>. Po tomto datu se profil přepne do neaktivního režimu.
          </span>
        </div>
      )}

      {/* Přepínač Měsíčně / Ročně */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 10, padding: 4, gap: 2 }}>
          {[['monthly','Měsíčně'],['yearly','Ročně']].map(([k,l]) => (
            <button key={k} onClick={() => setBilling(k)}
              style={{ height: 36, padding: '0 20px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all .14s', fontFamily: 'inherit',
                background: billing === k ? '#fff' : 'transparent',
                color: billing === k ? '#1A1F2E' : '#6B7280',
                boxShadow: billing === k ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
              }}>
              {l}{k === 'yearly' && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, color: '#16A34A', background: '#F0FDF4', padding: '1px 6px', borderRadius: 999 }}>Ušetřete</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Info blok — bez kreditů, jedna měsíční cena */}
      <div style={{ marginBottom: 24, padding: '18px 22px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#166534', marginBottom: 6 }}>Žádné kredity. Žádné skryté poplatky. Jen jedna měsíční cena.</div>
        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>
          U ŠikulaDoma neplatíte za každou odpověď zvlášť. Neřešíte kredity ani to, jestli se vám poptávka vyplatí otevřít. Máte jeden jasný měsíční tarif a zákazník platí přímo vám.
        </p>
      </div>

      {/* Tarifní boxy */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 28, alignItems: 'stretch' }}>
        {TARIFY.map(t => {
          const isCurrentPlan = currentPlan === t.id && isActive
          return (
            <div key={t.id} style={{ background: '#fff', border: `2px solid ${isCurrentPlan ? t.color : t.border}`, borderRadius: 16, padding: '24px 22px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {t.badge && !isCurrentPlan && (
                <div style={{ position: 'absolute', top: -12, right: 16, background: t.color, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>{t.badge}</div>
              )}
              {isCurrentPlan && (
                <div style={{ position: 'absolute', top: -12, right: 16, background: '#16A34A', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>✓ Aktivní</div>
              )}

              <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1F2E', marginBottom: 8 }}>{t.name}</div>

              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: t.color }}>{price(t).toLocaleString('cs-CZ')}</span>
                <span style={{ fontSize: 14, color: '#9CA3AF', marginLeft: 4 }}>Kč {unit}</span>
              </div>

              {billing === 'yearly' && (
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>
                  <s style={{ color: '#9CA3AF' }}>{t.yearlyOriginal.toLocaleString('cs-CZ')} Kč</s>
                  <span style={{ color: '#16A34A', fontWeight: 600, marginLeft: 6 }}>Ušetříte {(t.yearlyOriginal - t.yearlyPrice).toLocaleString('cs-CZ')} Kč</span>
                </div>
              )}

              <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 12px', display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                {t.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151' }}>
                    <svg style={{ flexShrink: 0, marginTop: 2 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              {t.note && <p style={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic', margin: '0 0 16px', lineHeight: 1.5 }}>{t.note}</p>}

              <div style={{ marginTop: 'auto' }}>
                {!isCurrentPlan ? (
                  <>
                    <button onClick={() => goCheckout(t.id)}
                      disabled={busyPlan === t.id}
                      style={{ width: '100%', height: 44, borderRadius: 10, border: 'none', background: busyPlan === t.id ? '#9CA3AF' : `linear-gradient(135deg,${t.color},${t.id === 'aktiv' ? '#EA580C' : '#6D28D9'})`, color: '#fff', fontWeight: 700, fontSize: 13, cursor: busyPlan === t.id ? 'wait' : 'pointer', transition: 'background .2s' }}>
                      {busyPlan === t.id ? 'Přesměrovávám na platbu…' : btnLabel(t)}
                    </button>
                    {errPlan === t.id && checkoutErr && (
                      <div style={{ marginTop: 8, padding: '6px 10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 12, color: '#B91C1C' }}>
                        {checkoutErr}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0FDF4', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#16A34A' }}>
                    ✓ Váš aktuální tarif
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 16, lineHeight: 1.6 }}>
        Platba probíhá bezpečně kartou online přes platební bránu. Tarif se obnovuje automaticky a lze ho kdykoliv zrušit. Zaplaceno = aktivní profil. Nezaplaceno nebo zrušeno = neaktivní.
      </p>
    </div>
  )
}

export default function SikulaDashboard({ currentUser, onNav, onLogout, onUpdateUser }) {
  // Návrat ze Stripe checkoutu (success i cancel) míří rovnou na Aktivaci
  // tarifu, ať je tam vidět stavová hláška a šikula nemusí nikam přecházet sám.
  const [activePage, setActivePage] = useState(() => {
    try {
      if (new URLSearchParams(window.location.search).get('stripe')) return 'membership'
    } catch {}
    return 'overview'
  })
  const [available, setAvailable] = useState(true)
  const [stripeMsg, setStripeMsg] = useState(null)   // { type: 'success'|'cancel', plan? }

  // Profil edit state
  const [profileForm, setProfileForm] = useState({
    name: '', bio: '', ico: '', phone: '', hourly_rate: '', services: [], avatar: '', platce_dph: false,
    worker_type: '', street: '', zip: '', city_area: '',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)
  const [phoneError, setPhoneError] = useState(null)
  useEffect(() => {
    if (!currentUser) return
    setProfileForm({
      name: currentUser.name || '',
      bio: currentUser.bio || '',
      ico: currentUser.ico || '',
      phone: currentUser.phone || '',
      hourly_rate: currentUser.hourly_rate ?? '',
      services: currentUser.services || [],
      avatar: currentUser.avatar || '',
      platce_dph: currentUser.platce_dph || false,
      worker_type: currentUser.worker_type || '',
      street: currentUser.street || '',
      zip: currentUser.zip || '',
      city_area: currentUser.city_area || '',
    })
  }, [currentUser?.id])

  const saveProfile = async () => {
    setProfileMsg(null)
    // Client-side validace — celé jméno povinné
    const trimmedName = (profileForm.name || '').trim()
    if (!trimmedName) {
      setProfileMsg({ type: 'error', text: 'Zadej jméno.' })
      return
    }
    if (!/^\S+\s+\S+/.test(trimmedName)) {
      setProfileMsg({ type: 'error', text: 'Zadej celé jméno (jméno i příjmení).' })
      return
    }
    if (profileForm.services.length === 0) {
      setProfileMsg({ type: 'error', text: 'Vyberte alespoň jednu službu, aby se vám zobrazovaly relevantní poptávky.' })
      return
    }
    if (!profileForm.phone.trim()) {
      setProfileMsg({ type: 'error', text: 'Zadejte telefonní číslo — zákazník se s vámi jinak nemůže domluvit.' })
      setPhoneError('Zadejte telefonní číslo.')
      return
    }
    if (!isValidPhoneCZ(profileForm.phone)) {
      setProfileMsg({ type: 'error', text: 'Zadejte platné české telefonní číslo.' })
      setPhoneError('Zadejte platné české telefonní číslo.')
      return
    }
    if (!['zivnostnik_firma', 'prilezitostna_vypomoc'].includes(profileForm.worker_type)) {
      setProfileMsg({ type: 'error', text: 'Vyberte typ šikuly.' })
      return
    }
    if (!profileForm.street.trim()) {
      setProfileMsg({ type: 'error', text: 'Zadejte ulici a číslo.' })
      return
    }
    if (!profileForm.zip.trim()) {
      setProfileMsg({ type: 'error', text: 'Zadejte PSČ.' })
      return
    }
    if (!profileForm.city_area.trim()) {
      setProfileMsg({ type: 'error', text: 'Zadejte město / oblast.' })
      return
    }
    if (profileForm.worker_type === 'zivnostnik_firma' && !profileForm.ico.trim()) {
      setProfileMsg({ type: 'error', text: 'Zadejte IČO — je povinné pro typ Živnostník / firma.' })
      return
    }
    const formattedPhone = formatPhoneCZ(profileForm.phone)
    setProfileSaving(true)
    try {
      // IČO se posílá jen pro Živnostník/firma — jinak se v payloadu vůbec
      // neuvádí (COALESCE na backendu tak ponechá stávající hodnotu, místo
      // jejího smazání prázdným řetězcem).
      const payload = {
        name: trimmedName,
        bio: profileForm.bio,
        phone: formattedPhone,
        hourly_rate: profileForm.hourly_rate === '' ? null : Number(profileForm.hourly_rate),
        services: profileForm.services,
        avatar: profileForm.avatar,
        platce_dph: profileForm.platce_dph,
        worker_type: profileForm.worker_type,
        street: profileForm.street,
        zip: profileForm.zip,
        city_area: profileForm.city_area,
      }
      if (profileForm.worker_type === 'zivnostnik_firma') payload.ico = profileForm.ico
      const { user } = await usersApi.updateMe(payload)
      // PATCH /api/users/me nevrací celý řádek (např. subscription_status chybí) —
      // sloučíme s dosavadním currentUser, ať se plný přepis nesmaže tarifní stav.
      onUpdateUser?.({ ...currentUser, ...user })
      setProfileForm(p => ({ ...p, phone: formattedPhone }))
      setPhoneError(null)
      setProfileMsg({ type: 'success', text: 'Profil uložen ✓' })
      setTimeout(() => setProfileMsg(null), 3000)
    } catch (e) {
      setProfileMsg({ type: 'error', text: e.message || 'Nepodařilo se uložit.' })
    } finally {
      setProfileSaving(false)
    }
  }

  // "Moje služby" se editují odděleně od zbytku profilu — v běžném zobrazení
  // vidí šikula jen svoje aktuálně vybrané služby, úprava (výběr ze všech
  // kategorií + vlastní uložení) se otevírá tlačítkem "Upravit služby".
  const [editingServices, setEditingServices] = useState(false)
  const [servicesDraft, setServicesDraft]     = useState([])
  const [servicesErr, setServicesErr]         = useState(null)
  const [servicesSaving, setServicesSaving]   = useState(false)

  const openServicesEditor = () => {
    setServicesDraft(profileForm.services)
    setServicesErr(null)
    setEditingServices(true)
  }
  const cancelServicesEdit = () => {
    setEditingServices(false)
    setServicesErr(null)
  }
  const toggleDraftService = (id) => setServicesDraft(d => (
    d.includes(id) ? d.filter(s => s !== id) : [...d, id]
  ))
  const saveServices = async () => {
    if (servicesDraft.length === 0) {
      setServicesErr('Vyberte alespoň jednu službu.')
      return
    }
    setServicesErr(null)
    setServicesSaving(true)
    try {
      const { user } = await usersApi.updateMe({ services: servicesDraft })
      onUpdateUser?.({ ...currentUser, ...user })
      setProfileForm(p => ({ ...p, services: servicesDraft }))
      setEditingServices(false)
    } catch (e) {
      setServicesErr(e.message || 'Nepodařilo se uložit.')
    } finally {
      setServicesSaving(false)
    }
  }
  // city_area je nové, čisté pole pro veřejnou oblast — preferuje se. Starší
  // účty bez vyplněné city_area (před touto migrací) mají adresu ještě
  // slepenou v legacy `city` ("ulice, PSČ, město") — tam bereme poslední
  // segment, protože je to město, ne ulice.
  const sikulaCity = currentUser?.city_area || (currentUser?.city || '').split(',').pop().trim()
  const { orders, loading: ordersLoading, error: ordersError } = useOpenOrders(sikulaCity, currentUser?.services)
  const { offers: myOffers, reload: reloadMyOffers } = useMyOffers()
  const { reviews: myReviews, summary: reviewsSummary, loading: reviewsLoading } = useMyReviews(currentUser?.id)
  const { conversations } = useConversations()
  const conversationForOrder = (orderId) => conversations.find(c => c.order_id === orderId)
  const renderMsgBadge = (orderId) => {
    const conv = conversationForOrder(orderId)
    if (!conv) return null
    const unread = Number(conv.unread_count) || 0
    const total  = Number(conv.total_count) || 0
    if (unread === 0 && total === 0) return null
    const openChat = (e) => { e.stopPropagation(); onNav('chat', { otherUserId: conv.customer_id, orderId }) }
    return unread > 0
      ? <span className="badge badge-orange" style={{ fontSize: 11, cursor: 'pointer' }} onClick={openChat}>✉️ Nová zpráva ({unread})</span>
      : <span className="badge badge-gray" style={{ fontSize: 11, cursor: 'pointer' }} onClick={openChat}>💬 Zprávy ({total})</span>
  }
  const TIMING_ICON = { urgent: '🚨', soon: '⚡', flexible: '🕊️' }
  const renderTiming = (o) => {
    const t = getOrderTiming(o)
    if (!t) return null
    return (
      <span style={{ color: t.tone === 'urgent' ? 'var(--red)' : t.tone === 'soon' ? '#C2410C' : 'var(--text3)' }}>
        {TIMING_ICON[t.tone]} Termín: {t.label}
      </span>
    )
  }

  // Detekce ?stripe=success/cancel po návratu ze Stripe Checkout
  const stripeHandled = useRef(false)
  useEffect(() => {
    if (stripeHandled.current) return
    const params = new URLSearchParams(window.location.search)
    const s = params.get('stripe')
    const plan = params.get('plan')
    if (s === 'success') {
      setStripeMsg({ type: 'success', plan })
      stripeHandled.current = true
      // Vyčistíme URL
      window.history.replaceState({}, '', window.location.pathname)
      pollUserAfterCheckout(onUpdateUser)
    } else if (s === 'cancel') {
      setStripeMsg({ type: 'cancel' })
      stripeHandled.current = true
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // offer.status zůstává 'accepted' napořád (accept ho nemění) — jestli je
  // zakázka pořád aktivní nebo už dokončená, poznáme podle order_status
  // (ord.status z listOffers), ne podle offer.status.
  const acceptedJobs  = myOffers.filter(o => o.status === 'accepted' && o.order_status === 'accepted')
  const completedJobs = myOffers.filter(o => o.status === 'accepted' && o.order_status === 'completed')
  // "Odeslané nabídky" = jen nabídky čekající na rozhodnutí zákazníka. Jakmile
  // ji zákazník přijme/odmítne (nebo ji šikula stáhne), patří do jiné sekce
  // (Aktivní zakázky / Historie) a odsud zmizí.
  const pendingOffers = myOffers.filter(o => o.status === 'pending')

  const markComplete = async (orderId) => {
    if (!confirm('Označit zakázku jako hotovou?')) return
    try {
      await ordersApi.patch(orderId, 'complete')
      reloadMyOffers()
    } catch (e) {
      alert(e.message)
    }
  }

  // Počítáno živě z myOffers, ne z currentUser.jobs_count — ten sloupec se
  // po "Označit jako hotovou" na frontendu neobnoví (jen se přenačtou
  // nabídky), takže by ukazoval starý počet, dokud se stránka znovu nenačte.
  const jobsCount = completedJobs.length
  const initials = (currentUser?.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const avatar = currentUser?.avatar || initials

  // Zamčenost dle tarifu — aktivní je subscription_status='active', nebo
  // 'cancelled' dokud neuplyne zaplacené období (plan_expires_at), NA tarifu
  // aktiv/aktiv-plus.
  const subStatus = currentUser?.subscription_status || 'inactive'
  const currentPlanId = currentUser?.plan || 'start'
  const isActivePlan = isSikulaPlanActive(currentUser)
  const isInactive = !isActivePlan
  const hasPlusPlan = isActivePlan && currentPlanId === 'aktiv-plus'
  const activeItem = menuItems.find(m => m.id === activePage)
  const lockedType = activeItem?.lock === 'plan' && !isActivePlan ? 'plan'
                   : activeItem?.lock === 'plus' && !hasPlusPlan ? 'plus'
                   : null

  // Ověření e-mailu je první brána, tarif až druhá — bez ověřeného e-mailu
  // šikula nesmí vidět žádný pracovní obsah (Nové zakázky, nabídky, zprávy…),
  // jen hlavičku profilu, odhlásit a výzvu k ověření.
  const emailUnverified = !currentUser?.email_verified_at

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
        {!emailUnverified && menuItems.map(m => {
          const locked = m.lock === 'plan' ? !isActivePlan
                       : m.lock === 'plus' ? !hasPlusPlan
                       : false
          const menuLabel = m.label
          const badgeCount = m.id === 'active'      ? acceptedJobs.length
                           : m.id === 'offers-sent' ? pendingOffers.length
                           : 0
          return (
            <button key={m.id}
              className={`dash-nav-item ${activePage === m.id ? 'active' : ''}`}
              style={{ opacity: 1 }}
              onClick={() => setActivePage(m.id)}>
              <span>{m.icon}</span>
              {menuLabel}
              {locked && <span style={{ marginLeft: 'auto', fontSize: 11 }}>🔒</span>}
              {!locked && badgeCount > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--brand, #0EA5A4)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 999 }}>
                  {badgeCount}
                </span>
              )}
            </button>
          )
        })}
        {onLogout && (
          <button className="dash-nav-item" onClick={onLogout}
            style={{ marginTop: 'auto', color: 'var(--red, #B91C1C)' }}>
            <span>🚪</span>Odhlásit
          </button>
        )}
      </div>

      <div className="dash-content">

        {emailUnverified ? <VerifyGate user={currentUser} /> : (
        <>
        <VerificationBanner user={currentUser} />

        {/* Stripe Checkout — zprávy po návratu */}
        {stripeMsg && (
          <div style={{
            margin: '0 0 20px',
            padding: '14px 20px',
            borderRadius: 'var(--radius)',
            background: stripeMsg.type === 'success' ? 'var(--green-pale, #dcfce7)' : 'var(--canvas)',
            border: `1px solid ${stripeMsg.type === 'success' ? 'var(--green, #16a34a)' : 'var(--border)'}`,
            color: stripeMsg.type === 'success' ? 'var(--green, #15803d)' : 'var(--text2)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <span>
              {stripeMsg.type === 'success'
                ? `🎉 Platba proběhla úspěšně! Váš tarif ${stripeMsg.plan ? `(${stripeMsg.plan})` : ''} bude aktivován do pár minut.`
                : 'Platba byla zrušena. Váš tarif nebyl změněn.'}
            </span>
            <button onClick={() => setStripeMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px', color: 'inherit' }}>×</button>
          </div>
        )}

        {/* Banner pro neaktivní tarif — registrace a náhled poptávek jsou zdarma,
            reakce na poptávky a kontakt na zákazníka vyžadují aktivní tarif. */}
        {isInactive && activePage !== 'membership' && activePage !== 'profile' && (
          <div style={{ margin: '0 0 20px', padding: '14px 20px', borderRadius: 12, background: '#FFF7ED', border: '1px solid #FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#9A3412' }}>
              {subStatus === 'payment_failed'
                ? 'Platba za tarif selhala. Aktivujte si ho prosím znovu, ať můžete reagovat na poptávky.'
                : subStatus === 'cancelled'
                  ? 'Váš tarif byl zrušen a platnost vypršela. Aktivujte si ho prosím znovu, ať můžete reagovat na poptávky.'
                  : 'Váš profil je připravený. Aktivujte tarif a můžete začít reagovat na poptávky.'}
            </span>
            <button onClick={() => setActivePage('membership')}
              style={{ height: 36, padding: '0 16px', borderRadius: 9, border: 'none', background: '#F97316', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Aktivovat tarif
            </button>
          </div>
        )}

        {/* Zamčená sekce */}
        {lockedType && <LockedScreen type={lockedType} feature={activePage} onActivate={() => setActivePage('membership')} />}

        {!lockedType && activePage === 'overview' && (
          <div className="page-enter">
            <div className="dash-header">
              <div>
                <div className="dash-title">Váš přehled 🛠️</div>
                <div className="dash-subtitle">
                  <PlanBadge plan={currentUser?.plan} expiresAt={currentUser?.plan_expires_at} />
                  {' · '}{jobsCount} zakázek celkem
                </div>
              </div>
              <div className="avail-toggle">
                <span style={{ fontSize: 14, fontWeight: 600 }}>{available ? 'Dostupný' : 'Nedostupný'}</span>
                <button className={`toggle-switch ${available ? 'on' : ''}`} onClick={() => setAvailable(a => !a)} />
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-val">{jobsCount}</div>
                <div className="stat-label">Dokončené zakázky</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-val">{acceptedJobs.length}</div>
                <div className="stat-label">Aktivní zakázky</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-val">{reviewsSummary?.avg_stars || currentUser?.rating || '—'}</div>
                <div className="stat-label">Průměrné hodnocení</div>
                {reviewsSummary?.total > 0 && <div className="stat-trend">{reviewsSummary.total} recenzí</div>}
              </div>
              <div className="stat-card">
                <div className="stat-icon">📤</div>
                <div className="stat-val">{pendingOffers.length}</div>
                <div className="stat-label">Odeslané nabídky</div>
              </div>
            </div>
            {/* Upgrade banner — pro Aktivní šikula (199 Kč), nabízí Plus (299 Kč) */}
            {isActivePlan && currentPlanId === 'aktiv' && (
              <div style={{
                marginBottom: 20,
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #f5f0ff 0%, #fff7ed 100%)',
                border: '1px solid var(--purple-pale, #e9d5ff)',
                borderRadius: 'var(--radius)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>⭐ Aktivní šikula Plus</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>S tariferem Aktivní šikula Plus (299 Kč) získáte kalendář, fakturovač a přehled příjmů.</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setActivePage('membership')}>
                  Zobrazit tarify →
                </button>
              </div>
            )}

            <div className="table-wrap">
              <div className="table-header">
                <span className="table-title">Poslední poptávky v okolí {orders.length > 0 && <span style={{ fontWeight: 400, color: 'var(--text3)' }}>({Math.min(orders.length, 3)} z {orders.length})</span>}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setActivePage('new-jobs')}>Zobrazit všechny poptávky →</button>
              </div>
              {ordersLoading && <div style={{ padding: 16, color: 'var(--text3)', fontSize: 14 }}>Načítám…</div>}
              {ordersError && !ordersLoading && (
                <div style={{ padding: 16, color: 'var(--red, #B91C1C)', fontSize: 13 }}>Nepodařilo se načíst zakázky: {ordersError}</div>
              )}
              {!ordersLoading && !ordersError && orders.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🕊️</div>
                  Zatím žádné nové poptávky ve vaší lokalitě. Zkontroluju to znovu za 30 s.
                </div>
              )}
              {!ordersLoading && !ordersError && orders.slice(0, 3).map(o => (
                <div key={o.id} className="order-card" onClick={() => onNav('order-detail', o)} style={{
                  margin: 0, borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border)',
                  background: o.has_my_offer ? '#F0FDF4' : undefined, cursor: 'pointer',
                }}>
                  <div className="order-cat-icon">{CAT_ICON[o.category] || '🔧'}</div>
                  <div className="order-info">
                    <div className="order-title">{o.title}</div>
                    <div className="order-meta">
                      <span><Icon name="map" size={13} /> {o.city}</span>
                      {o.budget && <span><Icon name="wallet" size={13} /> {o.budget}</span>}
                      <span><Icon name="clock" size={13} /> {relativni(o.created_at)}</span>
                      {renderTiming(o)}
                      {o.has_my_offer && <span className="badge badge-green" style={{ fontSize: 11 }}>✓ Nabídka odeslána</span>}
                      {renderMsgBadge(o.id)}
                    </div>
                    {o.description && (
                      <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
                        {o.description.length > 140 ? `${o.description.slice(0, 140)}…` : o.description}
                      </div>
                    )}
                  </div>
                  {isActivePlan ? (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); onNav('order-detail', o) }}>Detail</button>
                      {!o.has_my_offer && (
                        <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); onNav('send-offer', o) }}>
                          Nabídnout se
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', maxWidth: 170, flexShrink: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'right' }}>
                        Pro zobrazení detailu poptávky a odeslání nabídky si aktivujte tarif.
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); setActivePage('membership') }}>
                        Aktivovat tarif
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!lockedType && activePage === 'new-jobs' && (
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
                <div key={o.id} className="order-card" onClick={() => onNav('order-detail', o)}
                  style={{ background: o.has_my_offer ? '#F0FDF4' : undefined, cursor: 'pointer' }}>
                  <div className="order-cat-icon">{CAT_ICON[o.category] || '🔧'}</div>
                  <div className="order-info">
                    <div className="order-title">{o.title}</div>
                    <div className="order-meta">
                      <span><Icon name="map" size={13} /> {o.city}</span>
                      {o.budget && <span><Icon name="wallet" size={13} /> {o.budget}</span>}
                      <span><Icon name="clock" size={13} /> {relativni(o.created_at)}</span>
                      {renderTiming(o)}
                      {o.has_my_offer && <span className="badge badge-green" style={{ fontSize: 11 }}>✓ Nabídka odeslána</span>}
                      {renderMsgBadge(o.id)}
                    </div>
                    {o.description && (
                      <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
                        {o.description.length > 140 ? `${o.description.slice(0, 140)}…` : o.description}
                      </div>
                    )}
                  </div>
                  {isActivePlan ? (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); onNav('order-detail', o) }}>Detail</button>
                      {!o.has_my_offer && (
                        <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); onNav('send-offer', o) }}>
                          Nabídnout se
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', maxWidth: 170, flexShrink: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'right' }}>
                        Pro zobrazení detailu poptávky a odeslání nabídky si aktivujte tarif.
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); setActivePage('membership') }}>
                        Aktivovat tarif
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!lockedType && activePage === 'active' && (
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
                <div key={o.id} className="order-card" style={{ cursor: 'pointer' }}
                  onClick={() => onNav('order-detail', { id: o.order_id, title: o.order_title, city: o.order_city, status: o.order_status, customer_id: o.customer_id, customer_name: o.customer_name })}>
                  <div className="order-info">
                    <div className="order-title">{o.order_title || 'Zakázka'}</div>
                    <div className="order-meta">
                      <span><Icon name="map" size={13} /> {o.order_city}</span>
                      <span><Icon name="wallet" size={13} /> {formatCurrencyCz(o.price)} (předběžná nabídka)</span>
                      {formatDateCz(o.available_date) && <span><Icon name="calendar" size={13} /> {formatDateCz(o.available_date)}</span>}
                      {renderMsgBadge(o.order_id)}
                    </div>
                    {o.customer_name && <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Zákazník: {o.customer_name}</div>}
                    {o.customer_phone && <div style={{ fontSize: 13, color: 'var(--text3)' }}>Tel: {o.customer_phone}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <span className="badge badge-green">Přijato</span>
                    <button className="btn btn-outline btn-sm"
                      onClick={(e) => { e.stopPropagation(); onNav('chat', { otherUserId: o.customer_id, orderId: o.order_id }) }}>
                      💬 Napsat zprávu
                    </button>
                    <button className="btn btn-green btn-sm" onClick={(e) => { e.stopPropagation(); markComplete(o.order_id) }}>
                      ✓ Označit jako hotovou
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!lockedType && activePage === 'offers-sent' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 24 }}>Odeslané nabídky</div>
            {pendingOffers.length === 0 && (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-icon">📤</div>
                <h3>Žádné odeslané nabídky</h3>
                <p>Vyberte zakázku ze záložky „Nové zakázky" a pošlete svou první nabídku.</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingOffers.map(o => (
                <div key={o.id} className="order-card" style={{ cursor: 'pointer' }}
                  onClick={() => onNav('order-detail', { id: o.order_id, title: o.order_title, city: o.order_city, status: o.order_status, customer_id: o.customer_id, customer_name: o.customer_name })}>
                  <div className="order-info">
                    <div className="order-title">{o.order_title || 'Zakázka'}</div>
                    <div className="order-meta">
                      <span><Icon name="map" size={13} /> {o.order_city}</span>
                      <span><Icon name="wallet" size={13} /> {formatCurrencyCz(o.price)}</span>
                      {o.available_time && <span><Icon name="clock" size={13} /> {o.available_time}</span>}
                      {formatDateCz(o.available_date) && <span><Icon name="calendar" size={13} /> {formatDateCz(o.available_date)}</span>}
                      {renderMsgBadge(o.order_id)}
                    </div>
                    {o.customer_name && <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Zákazník: {o.customer_name}</div>}
                    {o.customer_phone && <div style={{ fontSize: 13, color: 'var(--text3)' }}>Tel: {o.customer_phone}</div>}
                    {o.message && <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>{o.message}</p>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    {/* Konverzace vzniká až po přijetí nabídky — dokud zákazník
                        nerozhodne, tu není s kým chatovat (viz api/conversations.js). */}
                    <span className="badge badge-blue">Čeká na odpověď</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right' }}>Zprávy budou dostupné po přijetí nabídky.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!lockedType && activePage === 'invoices' && <InvoicePage />}
        {!lockedType && activePage === 'calendar' && <CalendarSection />}
        {activePage === 'membership' && <VylepseniProfilu currentUser={currentUser} onLogout={onLogout} />}
        {activePage === 'oznameni' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 24 }}>Oznámení</div>
            {/* Zatím jediný typ oznámení — odvozený přímo z aktuálního
                subscription_status/plan_expires_at, nic se neukládá zvlášť. */}
            {currentUser?.subscription_status === 'cancelled' ? (
              <div style={{ padding: '16px 20px', borderRadius: 10, background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>📣 Váš tarif byl zrušen.</div>
                <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                  {isActivePlan ? (
                    <>Zůstává aktivní do <strong>{formatDateCz(currentUser.plan_expires_at)}</strong>. Po tomto datu se profil přepne do neaktivního režimu.</>
                  ) : (
                    <>Profil zůstává zachovaný, ale bez aktivního tarifu nemůžete reagovat na poptávky ani komunikovat se zákazníky. Tarif si můžete kdykoliv znovu aktivovat.</>
                  )}
                </p>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-icon">📣</div>
                <p>Zatím nemáte žádná oznámení.</p>
              </div>
            )}
          </div>
        )}

        {!lockedType && activePage === 'earnings' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 24 }}>Výdělky</div>
            <div className="stats-grid" style={{ marginBottom: 24 }}>
              <div className="stat-card"><div className="stat-val">0 Kč</div><div className="stat-label">Tento měsíc</div></div>
              <div className="stat-card"><div className="stat-val">0 Kč</div><div className="stat-label">Celkem</div></div>
              <div className="stat-card"><div className="stat-val">—</div><div className="stat-label">Průměr zakázka</div></div>
              <div className="stat-card"><div className="stat-val">0</div><div className="stat-label">Zakázek celkem</div></div>
            </div>
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-icon">💰</div>
              <h3>Zatím žádné příjmy</h3>
              <p>Příjmy ze zakázek se zobrazí zde po dokončení první zakázky.</p>
            </div>
          </div>
        )}

        {!lockedType && activePage === 'reviews' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 8 }}>Moje recenze</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ fontFamily: 'Syne', fontSize: 48, fontWeight: 800, color: 'var(--brand)' }}>
                {reviewsSummary?.avg_stars || '—'}
              </div>
              <div>
                <div className="stars" style={{ fontSize: 20 }}>
                  {reviewsSummary?.avg_stars ? '★'.repeat(Math.round(reviewsSummary.avg_stars)) : ''}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4 }}>
                  {reviewsSummary?.total || 0} hodnocení
                  {reviewsSummary?.recommended != null && reviewsSummary.total > 0 && (
                    <> · {Math.round((reviewsSummary.recommended / reviewsSummary.total) * 100)}% doporučuje</>
                  )}
                </div>
              </div>
            </div>
            {reviewsLoading && <div style={{ color: 'var(--text3)' }}>Načítám…</div>}
            {!reviewsLoading && myReviews.length === 0 && (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-icon">⭐</div>
                <h3>Zatím žádné recenze</h3>
                <p>Po dokončení zakázek dostane zákazník odkaz na hodnocení. Recenze se zobrazí zde.</p>
              </div>
            )}
            <div className="reviews-grid">
              {myReviews.map(r => (
                <div key={r.id} className="review-card">
                  <div className="review-header">
                    <div className="review-avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
                      {r.reviewer_avatar || (r.reviewer_name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="review-meta">
                      <div className="review-name" style={{ fontSize: 14 }}>{r.reviewer_name}</div>
                      <div className="review-service">{new Date(r.created_at).toLocaleDateString('cs-CZ')}</div>
                    </div>
                    <div className="stars">{'★'.repeat(r.stars)}</div>
                  </div>
                  {r.comment && <div className="review-text">&ldquo;{r.comment}&rdquo;</div>}
                  {r.recommend === false && (
                    <div style={{ fontSize: 12, color: 'var(--red, #B91C1C)', marginTop: 6 }}>❌ Nedoporučuje</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activePage === 'profile' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 24 }}>Profil šikuly</div>
            {!currentUser?.phone && (
              <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10,
                background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: 13 }}>
                📞 Chybí vám telefon — doplňte ho níže. Bez telefonu nejde poslat nabídku ani zprávu, zákazník se s vámi jinak nedomluví.
              </div>
            )}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="profile-hero">
                <AvatarUpload
                  currentSrc={profileForm.avatar}
                  name={profileForm.name || currentUser?.name}
                  onChange={src => setProfileForm(p => ({ ...p, avatar: src }))}
                />
                <div className="profile-info">
                  <h2>{profileForm.name || '—'}</h2>
                  <p>📍 {profileForm.city_area || '—'}</p>
                  <div className="profile-badges">
                    {currentUser?.email_verified_at && <span className="badge badge-green">✓ Ověřený e-mail</span>}
                    {currentUser?.plan && <span className="badge badge-blue">👑 {currentUser.plan}</span>}
                    {currentUser?.rating && <span className="badge badge-orange">⭐ {currentUser.rating} ({reviewsSummary?.total ?? 0} recenzí)</span>}
                  </div>
                </div>
              </div>
              <div style={{ padding: 24 }}>
                <div className="form-group">
                  <label className="form-label">Jméno a příjmení</label>
                  <input className="form-input" value={profileForm.name}
                    onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Jan Novák" />
                </div>
                <div className="form-group">
                  <label className="form-label">Bio / Představení</label>
                  <textarea className="form-textarea" value={profileForm.bio}
                    onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Napiš pár vět o sobě, své praxi a tom co děláš..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Moje služby</label>
                  {editingServices ? (
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
                        Klikněte na službu pro přidání, opětovným kliknutím ji odeberete.
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                        {SERVICES.map(s => {
                          const sel = servicesDraft.includes(s.id)
                          return (
                            <button key={s.id} type="button" onClick={() => toggleDraftService(s.id)}
                              aria-pressed={sel}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                                borderRadius: 8, border: `1.5px solid ${sel ? '#0EA5A4' : 'var(--border)'}`,
                                background: sel ? '#F0FDFA' : '#fff', cursor: 'pointer',
                                fontSize: 12, fontWeight: sel ? 700 : 500, color: sel ? '#0F766E' : 'var(--text3)',
                                opacity: sel ? 1 : 0.7,
                                transition: 'all .14s', fontFamily: 'inherit',
                              }}>
                              {sel && <span aria-hidden="true">✓</span>}
                              {s.label}
                            </button>
                          )
                        })}
                      </div>
                      {servicesErr && (
                        <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 10,
                          background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: 13 }}>
                          {servicesErr}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button type="button" className="btn btn-primary btn-sm" onClick={saveServices} disabled={servicesSaving}>
                          {servicesSaving ? 'Ukládám…' : 'Uložit služby'}
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={cancelServicesEdit} disabled={servicesSaving}>
                          Zrušit
                        </button>
                      </div>
                    </div>
                  ) : profileForm.services.length > 0 ? (
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
                        Tyto služby nabízíte zákazníkům. Podle nich se vám zobrazují relevantní poptávky.
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                        {profileForm.services.map(id => (
                          <span key={id} className="badge badge-blue" style={{ fontSize: 12 }}>
                            {SVC_LABEL[id] || id}
                          </span>
                        ))}
                      </div>
                      <button type="button" className="btn btn-outline btn-sm" onClick={openServicesEditor}>
                        Upravit služby
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '10px 14px', borderRadius: 10,
                      background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412', fontSize: 13 }}>
                      <div style={{ marginBottom: 8 }}>
                        Nemáte vybranou žádnou službu. Vyberte alespoň jednu službu, aby se vám zobrazovaly relevantní poptávky.
                      </div>
                      <button type="button" className="btn btn-primary btn-sm" onClick={openServicesEditor}>
                        Vybrat službu
                      </button>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Typ šikuly</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { id: 'zivnostnik_firma', label: 'Živnostník / firma', desc: 'Mám nebo budu mít IČO' },
                      { id: 'prilezitostna_vypomoc', label: 'Příležitostná výpomoc', desc: 'Bez IČO' },
                    ].map(t => {
                      const sel = profileForm.worker_type === t.id
                      return (
                        <button key={t.id} type="button" onClick={() => setProfileForm(p => ({ ...p, worker_type: t.id }))}
                          style={{
                            textAlign: 'left', padding: '12px 14px', borderRadius: 10,
                            border: `1.5px solid ${sel ? '#0EA5A4' : 'var(--border)'}`,
                            background: sel ? '#F0FDFA' : '#fff', cursor: 'pointer',
                            fontFamily: 'inherit', transition: 'all .14s',
                          }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: sel ? '#0F766E' : 'var(--text)', marginBottom: 2 }}>{t.label}</div>
                          <div style={{ fontSize: 12, color: 'var(--text3)' }}>{t.desc}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="form-row">
                  {profileForm.worker_type === 'zivnostnik_firma' && (
                    <div className="form-group"><label className="form-label">IČO</label>
                      <input className="form-input" value={profileForm.ico}
                        onChange={e => setProfileForm(p => ({ ...p, ico: e.target.value.replace(/\D/g,'').slice(0,8) }))}
                        placeholder="12345678" inputMode="numeric" /></div>
                  )}
                  <div className="form-group"><label className="form-label">Hodinová sazba (Kč)</label>
                    <input className="form-input" type="number" min="0" value={profileForm.hourly_rate}
                      onChange={e => setProfileForm(p => ({ ...p, hourly_rate: e.target.value }))}
                      placeholder="350" /></div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'#F9FAFB', borderRadius:10, border:'1px solid #E5E7EB', cursor:'pointer', marginBottom:4 }}
                  onClick={() => setProfileForm(p => ({ ...p, platce_dph: !p.platce_dph }))}>
                  <div style={{ width:20, height:20, borderRadius:4, border:`2px solid ${profileForm.platce_dph?'#F07800':'#D1D5DB'}`, background:profileForm.platce_dph?'#F07800':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .14s' }}>
                    {profileForm.platce_dph && <span style={{ color:'#fff', fontSize:11, fontWeight:800 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14 }}>Jsem plátce DPH</div>
                    <div style={{ fontSize:12, color:'#6B7280' }}>Fakturám přidáš sazbu DPH 12 % nebo 21 %</div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Telefon</label>
                  <input className="form-input" value={profileForm.phone}
                    onChange={e => { setProfileForm(p => ({ ...p, phone: e.target.value })); if (phoneError) setPhoneError(null) }}
                    onBlur={e => {
                      const formatted = formatPhoneCZ(e.target.value)
                      setProfileForm(p => ({ ...p, phone: formatted }))
                      setPhoneError(isValidPhoneCZ(formatted) ? null : 'Zadejte platné české telefonní číslo.')
                    }}
                    placeholder="+420 777 123 456" />
                  {phoneError && <div style={{ color: '#B91C1C', fontSize: 12, marginTop: 4 }}>{phoneError}</div>}
                </div>
                {/* Ulice a PSČ jsou vždy neveřejné — jen city_area se ukazuje
                    zákazníkovi na veřejném profilu. */}
                <div className="form-group"><label className="form-label">Ulice a číslo</label>
                  <input className="form-input" value={profileForm.street}
                    onChange={e => setProfileForm(p => ({ ...p, street: e.target.value }))}
                    placeholder="Hlavní 42" /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Město / oblast</label>
                    <input className="form-input" value={profileForm.city_area}
                      onChange={e => setProfileForm(p => ({ ...p, city_area: e.target.value }))}
                      placeholder="Praha a okolí" /></div>
                  <div className="form-group"><label className="form-label">PSČ</label>
                    <input className="form-input" value={profileForm.zip}
                      onChange={e => setProfileForm(p => ({ ...p, zip: e.target.value }))}
                      placeholder="110 00" /></div>
                </div>
                {profileMsg && (
                  <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10,
                    background: profileMsg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                    border: `1px solid ${profileMsg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
                    color: profileMsg.type === 'success' ? '#166534' : '#B91C1C',
                    fontSize: 13 }}>
                    {profileMsg.text}
                  </div>
                )}
                <button className="btn btn-primary" onClick={saveProfile} disabled={profileSaving}>
                  {profileSaving ? 'Ukládám…' : 'Uložit změny'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!['overview','new-jobs','invoices','earnings','calendar','profile','membership','reviews','oznameni','offers-sent','active','history'].includes(activePage) && (
          <div className="empty-state">
            <div className="empty-icon">🚧</div>
            <h3>Tato sekce se připravuje</h3>
            <p>Bude napojena v dalším kroku.</p>
          </div>
        )}
        {!lockedType && activePage === 'history' && (
          <div className="page-enter">
            <div className="dash-title" style={{ marginBottom: 24 }}>Dokončené zakázky</div>
            {completedJobs.length === 0 && (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-icon">📚</div>
                <h3>Zatím žádné dokončené zakázky</h3>
                <p>Jakmile zakázku označíte jako hotovou, zobrazí se tady.</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {completedJobs.map(o => {
                const review = myReviews.find(r => r.order_id === o.order_id)
                return (
                  <div key={o.id} className="order-card" style={{ background: '#F8FAFC', cursor: 'pointer' }}
                    onClick={() => onNav('order-detail', { id: o.order_id, title: o.order_title, city: o.order_city, status: o.order_status, customer_id: o.customer_id, customer_name: o.customer_name })}>
                    <div className="order-info">
                      <div className="order-title">{o.order_title || 'Zakázka'}</div>
                      <div className="order-meta">
                        <span><Icon name="map" size={13} /> {o.order_city}</span>
                        <span><Icon name="wallet" size={13} /> {formatCurrencyCz(o.price)}</span>
                        {formatDateCz(o.available_date) && <span><Icon name="calendar" size={13} /> {formatDateCz(o.available_date)}</span>}
                        {renderMsgBadge(o.order_id)}
                      </div>
                      {o.customer_name && <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Zákazník: {o.customer_name}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                      <span className="badge badge-gray">Dokončeno</span>
                      {review ? (
                        <div style={{ textAlign: 'right' }}>
                          <div className="stars" style={{ fontSize: 13 }}>{'★'.repeat(review.stars)}</div>
                          {review.comment && <div style={{ fontSize: 12, color: 'var(--text3)', maxWidth: 200 }}>&ldquo;{review.comment}&rdquo;</div>}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text3)' }}>Zatím bez hodnocení</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  )
}

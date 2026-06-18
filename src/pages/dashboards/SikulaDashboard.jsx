import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, DEMO_INVOICES, INVOICE_STATUS_MAP } from '../../data'
import Icon from '../../components/Icon'
import InvoicePage from '../InvoicePage'
import PricingPage from '../PricingPage'
import ChatPage from '../ChatPage'
import { ordersApi, offersApi, reviewsApi, usersApi } from '../../lib/api'
import VerificationBanner from '../../components/VerificationBanner'
import AvatarUpload from '../../components/AvatarUpload'
import { SERVICES } from '../../lib/categories'

// Mapování id kategorie → emoji ikona (pro hezké zobrazení v dashboardu).
const CAT_ICON = Object.fromEntries(CATEGORIES.map(c => [c.id, c.icon]))

const PLAN_LABELS = { start: 'Start', plus: 'Plus', profi: 'Profi', top: 'Top Šikula' }
const PLAN_COLORS = {
  start: 'var(--text3)',
  plus:  'var(--blue, #2563eb)',
  profi: 'var(--purple, #7c3aed)',
  top:   'var(--orange, #F07800)',
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

const menuItems = [
  { id: 'profile',      icon: '👤', label: 'Profil šikuly' },
  { id: 'overview',     icon: '📊', label: 'Přehled' },
  { id: 'new-jobs',     icon: '🔔', label: 'Nové zakázky',      lock: 'plan' },
  { id: 'offers-sent',  icon: '📤', label: 'Odeslané nabídky',  lock: 'plan' },
  { id: 'active',       icon: '⚡', label: 'Aktivní zakázky',   lock: 'plan' },
  { id: 'calendar',     icon: '📅', label: 'Kalendář',          lock: 'plan' },
  { id: 'earnings',     icon: '💰', label: 'Výdělky',           lock: 'plan' },
  { id: 'invoices',     icon: '🧾', label: 'Faktury',           lock: 'fakturovac' },
  { id: 'reviews',      icon: '⭐', label: 'Recenze',           lock: 'plan' },
  { id: 'history',      icon: '📁', label: 'Historie',          lock: 'plan' },
  { id: 'membership',   icon: '👑', label: 'Členství' },
]

// Obrazovka pro zamčenou funkci
function LockedScreen({ type, onActivate }) {
  const isFak = type === 'fakturovac'
  return (
    <div className="page-enter" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ maxWidth: 420, textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{isFak ? '🧾' : '🔒'}</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1F2E', marginBottom: 12 }}>
          {isFak ? 'Fakturovač není aktivní' : 'Tato funkce je dostupná po aktivaci profilu'}
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
          {isFak
            ? 'Přidejte fakturovač za +100 Kč / měsíc a mějte zákazníky, zakázky i faktury na jednom místě.'
            : 'Tato funkce je dostupná po aktivaci profilu. Aktivujte tarif Aktivní šikula za 399 Kč / měsíc.'}
        </p>
        <button onClick={onActivate}
          style={{ height: 48, padding: '0 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#F97316,#EA580C)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(249,115,22,.35)', marginBottom: 14 }}>
          {isFak ? 'Přidat fakturovač' : 'Aktivovat profil za 399 Kč'}
        </button>
        <p style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>
          {isFak
            ? 'Fakturovač se přidá k vašemu aktivnímu tarifu.'
            : 'Platba probíhá kartou přes Stripe. Tarif se obnovuje měsíčně a lze ho kdykoliv zrušit.'}
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

function VylepseniProfilu({ currentUser }) {
  const subStatus = currentUser?.subscription_status || 'inactive'
  const isActive = subStatus === 'active'
  const renewalEnd = currentUser?.plan_expires_at
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' }) : null

  const [fakturovac, setFakturovac] = useState(false)
  const [priorita, setPriorita] = useState(false)

  const base = 399
  const celkem = base + (fakturovac ? 100 : 0) + (priorita ? 99 : 0)

  const CENY = [
    ['Aktivní šikula', '399 Kč / měsíc'],
    ['+ Jednoduchý fakturovač', '499 Kč / měsíc'],
    ['+ Přednostní zobrazení', '498 Kč / měsíc'],
    ['Fakturovač + přednostní zobrazení', '598 Kč / měsíc'],
  ]

  const row = (label, val) => (
    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#4B5563', padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
      <span>{label}</span><span style={{ fontWeight: 600 }}>{val}</span>
    </div>
  )

  return (
    <div className="page-enter">
      <div className="dash-title" style={{ marginBottom: 24 }}>Vylepšení profilu</div>

      {/* Aktuální tarif */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Váš aktivní tarif</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1F2E' }}>{isActive ? 'Aktivní šikula' : 'Základní (neaktivní)'}</div>
            <div style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
              {isActive
                ? <><strong style={{ color: '#F97316' }}>{celkem} Kč / měsíc</strong>{(fakturovac || priorita) ? ' (vč. doplňků)' : ''}</>
                : 'Pro přijímání poptávek aktivujte profil.'}
            </div>
            {renewalEnd && isActive && (
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>
                Obnoví se: {fmtDate(renewalEnd)}
              </div>
            )}
          </div>
          {isActive
            ? <span style={{ fontSize: 12, fontWeight: 700, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', borderRadius: 999, padding: '4px 12px' }}>✓ Aktivní</span>
            : <span style={{ fontSize: 12, fontWeight: 700, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 999, padding: '4px 12px' }}>Neaktivní</span>
          }
        </div>
        {isActive && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 9, fontSize: 13, color: '#6B7280', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span>Tarif se obnovuje měsíčně. Zrušit lze kdykoliv v profilu.</span>
            <button onClick={() => {
              fetch('/api/stripe?action=portal', { credentials: 'include' })
                .then(r => r.json()).then(d => { if (d.url) window.location.href = d.url; });
            }} style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0, whiteSpace: 'nowrap' }}>
              Zrušit tarif
            </button>
          </div>
        )}
      </div>

      {/* Doplňkové funkce */}
      {!isActive && (
        <div style={{ padding: '16px 18px', background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 12, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: '#C2410C', fontSize: 14, marginBottom: 6 }}>Profil není aktivní</div>
          <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.6, marginBottom: 12 }}>
            Aktivujte profil za 399 Kč / měsíc. Platba probíhá kartou přes Stripe. Tarif se obnovuje měsíčně a lze ho kdykoliv zrušit v profilu.
          </div>
          <button onClick={() => {
            fetch('/api/stripe?action=checkout', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: 'aktiv' }) })
              .then(r => r.json()).then(d => { if (d.url) window.location.href = d.url; });
          }}
            style={{ height: 44, padding: '0 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#F97316,#EA580C)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Aktivovat profil za 399 Kč
          </button>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 10 }}>
            Doplňkové funkce jsou dostupné až po aktivaci tarifu.
          </div>
        </div>
      )}

      <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1F2E', marginBottom: 14 }}>Doplňkové funkce</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Fakturovač */}
        <div style={{ background: '#fff', border: `1.5px solid ${fakturovac ? '#3B82F6' : '#E5E7EB'}`, borderRadius: 14, padding: '18px 20px', opacity: isActive ? 1 : .5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1F2E' }}>Jednoduchý fakturovač</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 999, padding: '2px 10px' }}>+100 Kč / měsíc</span>
              </div>
              <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>
                Chcete mít zákazníky, zakázky a jednoduché faktury na jednom místě? Přidejte si fakturovač k aktivnímu profilu.
                {fakturovac && <><br /><strong style={{ color: '#3B82F6' }}>Aktivní šikula + fakturovač = 499 Kč / měsíc</strong></>}
              </p>
            </div>
            <button disabled={!isActive} onClick={() => setFakturovac(v => !v)}
              style={{ height: 38, padding: '0 16px', borderRadius: 9, border: `1.5px solid ${fakturovac ? '#3B82F6' : '#E5E7EB'}`, background: fakturovac ? '#3B82F6' : '#F9FAFB', color: fakturovac ? '#fff' : '#4B5563', fontWeight: 600, fontSize: 13, cursor: isActive ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .14s' }}>
              {fakturovac ? '✓ Aktivní' : 'Přidat fakturovač'}
            </button>
          </div>
        </div>

        {/* Přednostní zobrazení */}
        <div style={{ background: '#fff', border: `1.5px solid ${priorita ? '#A855F7' : '#E5E7EB'}`, borderRadius: 14, padding: '18px 20px', opacity: isActive ? 1 : .5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1F2E' }}>Přednostní zobrazení</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#A855F7', background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: 999, padding: '2px 10px' }}>+99 Kč / měsíc</span>
              </div>
              <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>
                Chcete být tento měsíc více vidět? Zapněte si přednostní zobrazení profilu. Profil se bude zobrazovat přednostněji ve výsledcích podle služby a lokality.
              </p>
              {priorita && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: 8, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, color: '#7C3AED', marginBottom: 6 }}>
                    Přednostní zobrazení je aktivní do: {fmtDate(aktivniDo.toISOString())}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button style={{ height: 30, padding: '0 12px', borderRadius: 7, border: '1px solid #E9D5FF', background: '#EDE9FE', color: '#7C3AED', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                      Prodloužit o měsíc
                    </button>
                    <button onClick={() => setPriorita(false)} style={{ height: 30, padding: '0 12px', borderRadius: 7, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                      Vypnout automatické prodloužení
                    </button>
                  </div>
                </div>
              )}
            </div>
            {!priorita && (
              <button disabled={!isActive} onClick={() => setPriorita(true)}
                style={{ height: 38, padding: '0 16px', borderRadius: 9, border: '1.5px solid #E9D5FF', background: '#FAF5FF', color: '#A855F7', fontWeight: 600, fontSize: 13, cursor: isActive ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .14s' }}>
                Zapnout přednostní zobrazení
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Přehled cen */}
      <div style={{ marginTop: 20, background: '#F9FAFB', borderRadius: 12, padding: '14px 18px', border: '1px solid #E5E7EB' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Přehled cen</div>
        {CENY.map(([l, p]) => row(l, p))}
      </div>
    </div>
  )
}

export default function SikulaDashboard({ currentUser, onNav, onLogout, onUpdateUser }) {
  const [activePage, setActivePage] = useState('overview')
  const [available, setAvailable] = useState(true)
  const [stripeMsg, setStripeMsg] = useState(null)   // { type: 'success'|'cancel', plan? }

  // Profil edit state
  const [profileForm, setProfileForm] = useState({
    name: '', bio: '', ico: '', phone: '', city: '', hourly_rate: '', services: [], avatar: '', platce_dph: false,
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)
  useEffect(() => {
    if (!currentUser) return
    setProfileForm({
      name: currentUser.name || '',
      bio: currentUser.bio || '',
      ico: currentUser.ico || '',
      phone: currentUser.phone || '',
      city: currentUser.city || '',
      hourly_rate: currentUser.hourly_rate ?? '',
      services: currentUser.services || [],
      avatar: currentUser.avatar || '',
      platce_dph: currentUser.platce_dph || false,
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
      setProfileMsg({ type: 'error', text: 'Vyber alespoň jednu službu, kterou nabízíš.' })
      return
    }
    setProfileSaving(true)
    try {
      const { user } = await usersApi.updateMe({
        name: trimmedName,
        bio: profileForm.bio,
        ico: profileForm.ico,
        phone: profileForm.phone,
        city: profileForm.city,
        hourly_rate: profileForm.hourly_rate === '' ? null : Number(profileForm.hourly_rate),
        services: profileForm.services,
        avatar: profileForm.avatar,
        platce_dph: profileForm.platce_dph,
      })
      onUpdateUser?.(user)
      setProfileMsg({ type: 'success', text: 'Profil uložen ✓' })
      setTimeout(() => setProfileMsg(null), 3000)
    } catch (e) {
      setProfileMsg({ type: 'error', text: e.message || 'Nepodařilo se uložit.' })
    } finally {
      setProfileSaving(false)
    }
  }

  const toggleService = (id) => setProfileForm(p => ({
    ...p,
    services: p.services.includes(id) ? p.services.filter(s => s !== id) : [...p.services, id],
  }))
  const { orders, loading: ordersLoading, error: ordersError } = useOpenOrders()
  const { offers: myOffers, reload: reloadMyOffers } = useMyOffers()
  const { reviews: myReviews, summary: reviewsSummary, loading: reviewsLoading } = useMyReviews(currentUser?.id)

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
    } else if (s === 'cancel') {
      setStripeMsg({ type: 'cancel' })
      stripeHandled.current = true
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

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

  // Zamčenost dle subscription_status
  const subStatus = currentUser?.subscription_status || 'inactive'
  const isActivePlan = subStatus === 'active'
  const isInactive = !isActivePlan
  const hasFakturovac = isActivePlan  // TODO: oddělit přes DB pole has_fakturovac
  const activeItem = menuItems.find(m => m.id === activePage)
  const lockedType = activeItem?.lock === 'plan' && !isActivePlan ? 'plan'
                   : activeItem?.lock === 'fakturovac' && !hasFakturovac ? 'fakturovac'
                   : null

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
        {menuItems.map(m => {
          const isActivePlan = currentUser?.plan && currentUser.plan !== 'start'
          const hasFakturovac = isActivePlan // TODO: rozšířit o DB pole has_fakturovac
          const locked = m.lock === 'plan' ? !isActivePlan
                       : m.lock === 'fakturovac' ? !hasFakturovac
                       : false
          const menuLabel = m.id === 'membership' && !isActivePlan ? 'Aktivace tarifu' : m.label
          return (
            <button key={m.id}
              className={`dash-nav-item ${activePage === m.id ? 'active' : ''}`}
              style={{ opacity: 1 }}
              onClick={() => setActivePage(m.id)}>
              <span>{m.icon}</span>
              {menuLabel}
              {locked && <span style={{ marginLeft: 'auto', fontSize: 11 }}>🔒</span>}
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

        {/* Banner pro neaktivní / zrušený profil */}
        {isInactive && activePage !== 'membership' && activePage !== 'profile' && (
          <div style={{ margin: '0 0 20px', padding: '14px 20px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#B91C1C' }}>
              {subStatus === 'payment_failed'
                ? 'Platba selhala. Váš profil není aktivní a nezobrazuje se zákazníkům.'
                : 'Váš profil není aktivní. Nezobrazuje se zákazníkům a nové poptávky vám nechodí.'}
            </span>
            <button onClick={() => setActivePage('membership')}
              style={{ height: 36, padding: '0 16px', borderRadius: 9, border: 'none', background: '#F97316', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Aktivovat profil
            </button>
          </div>
        )}

        {/* Zamčená sekce */}
        {lockedType && <LockedScreen type={lockedType} onActivate={() => setActivePage('membership')} />}

        {!lockedType && activePage === 'overview' && (
          <div className="page-enter">
            <div className="dash-header">
              <div>
                <div className="dash-title">Ahoj, {(currentUser?.name || '').split(' ')[0] || 'šikulo'}! 🛠️</div>
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
                <div className="stat-val">{myOffers.length}</div>
                <div className="stat-label">Odeslané nabídky</div>
              </div>
            </div>
            {/* Upgrade banner — jen pro Start tarif */}
            {(!currentUser?.plan || currentUser.plan === 'start') && (
              <div style={{
                marginBottom: 20,
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #f5f0ff 0%, #fff7ed 100%)',
                border: '1px solid var(--purple-pale, #e9d5ff)',
                borderRadius: 'var(--radius)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>⚡ Získejte více zakázek</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>S tariferem Plus nebo Profi získáte přednostní zobrazení a více reakcí.</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setActivePage('membership')}>
                  Zobrazit tarify →
                </button>
              </div>
            )}

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
        {activePage === 'membership' && <VylepseniProfilu currentUser={currentUser} />}
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
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="profile-hero">
                <AvatarUpload
                  currentSrc={profileForm.avatar}
                  name={profileForm.name || currentUser?.name}
                  onChange={src => setProfileForm(p => ({ ...p, avatar: src }))}
                />
                <div className="profile-info">
                  <h2>{profileForm.name || '—'}</h2>
                  <p>📍 {profileForm.city || '—'}</p>
                  <div className="profile-badges">
                    {currentUser?.email_verified_at && <span className="badge badge-green">✓ Ověřený e-mail</span>}
                    {currentUser?.plan && <span className="badge badge-blue">👑 {currentUser.plan}</span>}
                    {currentUser?.rating && <span className="badge badge-orange">⭐ {currentUser.rating} ({jobsCount} recenzí)</span>}
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                    {SERVICES.map(s => {
                      const sel = profileForm.services.includes(s.id)
                      return (
                        <button key={s.id} type="button" onClick={() => toggleService(s.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                            borderRadius: 8, border: `1.5px solid ${sel ? '#0EA5A4' : 'var(--border)'}`,
                            background: sel ? '#F0FDFA' : '#fff', cursor: 'pointer',
                            fontSize: 12, fontWeight: 600, color: sel ? '#0F766E' : 'var(--text2)',
                            transition: 'all .14s', fontFamily: 'inherit',
                          }}>
                          {s.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">IČO</label>
                    <input className="form-input" value={profileForm.ico}
                      onChange={e => setProfileForm(p => ({ ...p, ico: e.target.value.replace(/\D/g,'').slice(0,8) }))}
                      placeholder="12345678" inputMode="numeric" /></div>
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
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Telefon</label>
                    <input className="form-input" value={profileForm.phone}
                      onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+420 777 123 456" /></div>
                  <div className="form-group"><label className="form-label">Město / oblast</label>
                    <input className="form-input" value={profileForm.city}
                      onChange={e => setProfileForm(p => ({ ...p, city: e.target.value }))}
                      placeholder="Praha a okolí" /></div>
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

import { useState } from 'react'
import { contactApi } from '../lib/api'

// ─── SVG ikony ───────────────────────────────────────────────────────────────
const IcMail    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>
const IcWrench  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
const IcHome    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
const IcCheck   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcArrow   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
const IcBack    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
const IcZap     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
const IcScissors= () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
const IcUsers   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>

// ─── Data ─────────────────────────────────────────────────────────────────────
const TEMATA = [
  { label: "Chybí mi služba",     bg: "#FFF7ED", color: "#F97316", activeBg: "#F97316" },
  { label: "Dotaz k poptávce",    bg: "#EFF6FF", color: "#3B82F6", activeBg: "#3B82F6" },
  { label: "Chci být šikula",     bg: "#F0FDF4", color: "#22C55E", activeBg: "#22C55E" },
  { label: "Technický problém",   bg: "#FDF4FF", color: "#A855F7", activeBg: "#A855F7" },
  { label: "Jen vám chci napsat", bg: "#F0F9FF", color: "#0EA5E9", activeBg: "#0EA5E9" },
]

const CARDS = [
  { Icon: IcMail,   bg: "#EFF6FF", color: "#3B82F6", title: "Napište nám přímo",  text: "Preferujete přímou cestu? Napište nám rovnou na e-mail.", email: "info@sikuladoma.cz", subject: "Dotaz ze ŠikulaDoma" },
  { Icon: IcWrench, bg: "#FFF7ED", color: "#F97316", title: "Pro šikuly",          text: 'Dotazy k registraci, tarifům nebo zakázkám nám napište přes formulář vlevo. Vyberte téma „Chci být šikula".', email: null },
  { Icon: IcHome,   bg: "#F0FDF4", color: "#22C55E", title: "Pro zákazníky",       text: 'Chybí vám služba nebo si nevíte rady s poptávkou? Napište nám přes formulář vlevo. Vyberte téma „Dotaz k poptávce" nebo „Chybí mi služba".', email: null },
]

const SLIBY = [
  { Icon: IcZap,      bg: "#FFF7ED", color: "#F97316", text: "Odpovíme co nejdříve" },
  { Icon: IcScissors, bg: "#EFF6FF", color: "#3B82F6", text: "Bez zbytečných formulářů" },
  { Icon: IcUsers,    bg: "#F0FDF4", color: "#22C55E", text: "Nasloucháme vám" },
]

// ─── Hlavní komponenta ────────────────────────────────────────────────────────
export default function KontaktPage({ onBack }) {
  const [tema, setTema] = useState(null)
  const [form, setForm] = useState({ jmeno: '', email: '', predmet: '', zprava: '', souhlas: false })
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr]   = useState(null)
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  const ok = form.jmeno.trim().length >= 1 && emailOk && form.zprava.trim().length >= 1 && form.souhlas

  const odeslat = async () => {
    if (!ok || busy) return
    setBusy(true); setErr(null)
    try {
      await contactApi.send({
        name:    form.jmeno,
        email:   form.email,
        subject: form.predmet || tema || null,
        message: form.zprava,
      })
      setSent(true)
    } catch (e) {
      setErr(e.message || 'Odeslání se nezdařilo.')
    } finally {
      setBusy(false)
    }
  }

  // ── Potvrzení ──────────────────────────────────────────────────────────────
  if (sent) return (
    <div style={S.page}>
      <Breadcrumb onBack={onBack} />
      <div style={{ maxWidth: 440, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#F0FDF4', border: '2px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px', color: '#22C55E' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={S.h2}>Zpráva odeslána</h2>
        <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7, marginBottom: 32 }}>
          Děkujeme, zprávu jsme uložili.<br />Ozveme se vám co nejdříve.
        </p>
        <button style={S.btnOrange} onClick={onBack}>Zpět na úvod</button>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <Breadcrumb onBack={onBack} />

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(150deg,#fff 0%,#FFF7ED 100%)', padding: '72px 24px 64px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 45% 55% at 5% 95%,rgba(219,234,254,.5) 0%,transparent 60%),radial-gradient(ellipse 40% 45% at 95% 5%,rgba(255,237,213,.5) 0%,transparent 55%)' }} />
        <div style={{ position: 'relative', maxWidth: 580, margin: '0 auto' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFF7ED', border: '1.5px solid #FED7AA', color: '#C2410C', borderRadius: 999, padding: '5px 16px', fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 24 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F97316', display: 'inline-block' }} />
            JSME TU PRO VÁS
          </div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, color: '#1A1F2E', letterSpacing: '-.025em', lineHeight: 1.15, marginBottom: 16 }}>
            Chybí vám nějaký šikula?<br />
            <span style={{ color: '#F97316' }}>Napište nám.</span>
          </h1>
          <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.7, maxWidth: 460, margin: '0 auto' }}>
            Máte dotaz, chybí vám nějaká služba nebo nám chcete jen něco napsat? Dejte nám vědět. Vaše zprávy nám pomáhají vylepšovat služby tak, aby opravdu dávaly smysl.
          </p>
        </div>
      </section>

      {/* ── OBSAH ───────────────────────────────────────────────────────── */}
      <section style={{ padding: '64px 24px 72px', background: '#F9FAFB' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1.45fr) minmax(0,1fr)', gap: 28, alignItems: 'start' }}>

          {/* Formulář */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', boxShadow: '0 1px 3px rgba(0,0,0,.05),0 6px 24px rgba(0,0,0,.06)', border: '1px solid #F3F4F6' }}>
            <h2 style={{ ...S.h2, textAlign: 'center' }}>S čím vám můžeme pomoct?</h2>
            <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 22, lineHeight: 1.55, textAlign: 'center' }}>
              Vyberte téma a napište nám zprávu. Ozveme se vám co nejdříve.
            </p>

            {/* Chips – každé téma má vlastní barvu */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 26 }}>
              {TEMATA.map(t => {
                const sel = tema === t.label
                return (
                  <button key={t.label}
                    onClick={() => { setTema(t.label); u('predmet', t.label) }}
                    style={{
                      padding: '7px 15px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: 13, fontWeight: sel ? 700 : 500, transition: 'all .14s',
                      border: `1.5px solid ${sel ? t.activeBg : '#E5E7EB'}`,
                      background: sel ? t.activeBg : t.bg,
                      color: sel ? '#fff' : t.color,
                    }}>
                    {t.label}
                  </button>
                )
              })}
            </div>

            {/* Pole */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Jméno" value={form.jmeno} onChange={v => u('jmeno', v)} placeholder="Jana Nováková" />
                <Field label="E-mail" type="email" value={form.email} onChange={v => u('email', v)} placeholder="vas@email.cz" />
              </div>
              <Field label="Předmět" value={form.predmet} onChange={v => u('predmet', v)} placeholder="O čem chcete psát?" />
              <Field label="Zpráva" type="textarea" value={form.zprava} onChange={v => u('zprava', v)} placeholder="Napište nám cokoliv…" />

              {/* Souhlas */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginTop: 2 }}
                onClick={() => u('souhlas', !form.souhlas)}>
                <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${form.souhlas ? '#F97316' : '#D1D5DB'}`, background: form.souhlas ? '#F97316' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all .14s', color: '#fff' }}>
                  {form.souhlas && <IcCheck />}
                </div>
                <span style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.55 }}>
                  Souhlasím se zpracováním zprávy podle{' '}
                  <span style={{ color: '#3B82F6', textDecoration: 'underline' }}>zásad ochrany soukromí</span>.
                </span>
              </div>

              {err && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C',
                  padding: '10px 12px', borderRadius: 10, fontSize: 13 }}>
                  {err}
                </div>
              )}

              <button
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', height: 52, borderRadius: 12, border: 'none',
                  fontFamily: 'inherit', fontSize: 15, fontWeight: 700, letterSpacing: '-.01em',
                  marginTop: 4,
                  background: ok
                    ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
                    : '#F3F4F6',
                  color: ok ? '#fff' : '#9CA3AF',
                  cursor: ok ? 'pointer' : 'not-allowed',
                  boxShadow: ok ? '0 4px 18px rgba(249,115,22,.38)' : 'none',
                  transform: 'translateY(0)',
                  transition: 'all .2s ease',
                }}
                onMouseEnter={e => {
                  if (!ok) return
                  e.currentTarget.style.background = 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(249,115,22,.45)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  if (!ok) return
                  e.currentTarget.style.background = 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
                  e.currentTarget.style.boxShadow = '0 4px 18px rgba(249,115,22,.38)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
                disabled={busy}
                onClick={odeslat}>
                {busy ? 'Odesílám…' : 'Odeslat zprávu'}
                {ok && !busy && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Kontaktní karty */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {CARDS.map(c => (
              <div key={c.title}
                style={{ background: '#fff', borderRadius: 16, padding: '22px', border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,.05)', transition: 'all .18s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.09)'; e.currentTarget.style.borderColor = c.color + '44' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.05)'; e.currentTarget.style.borderColor = '#F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <c.Icon />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1F2E', marginBottom: 4, letterSpacing: '-.01em' }}>{c.title}</div>
                    <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.55, marginBottom: 10 }}>{c.text}</div>
                    {c.email && (
                      <a href={`mailto:${c.email}?subject=${encodeURIComponent(c.subject || '')}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: c.color, textDecoration: 'none' }}>
                        {c.email} <IcArrow />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Firemní údaje */}
            <div style={{ background: '#F9FAFB', borderRadius: 16, padding: '20px 22px', border: '1px solid #F3F4F6' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#CBD5E1', marginBottom: 10 }}>Provozovatel</div>
              <div style={{ fontSize: 13, color: '#374151', fontWeight: 500, marginBottom: 1 }}>ŠikulaDoma.cz</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.75 }}>
                Stavira s.r.o.<br />
                Mokošínská 913/4<br />
                190 17 Praha 9<br />
                Česká republika<br />
                IČ: 29228379<br />
                DIČ: CZ29228379
              </div>
              <a href="mailto:info@sikuladoma.cz?subject=Dotaz ze ŠikulaDoma"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 12, fontSize: 13, fontWeight: 600, color: '#F97316', textDecoration: 'none' }}>
                info@sikuladoma.cz <IcArrow />
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* ── SLIB ────────────────────────────────────────────────────────── */}
      <section style={{ padding: '56px 24px 72px', background: '#fff' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {SLIBY.map(({ Icon, bg, color, text }) => (
              <div key={text} style={{ background: bg, borderRadius: 16, padding: '26px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff', color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
                  <Icon />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1F2E', lineHeight: 1.45, textAlign: 'center' }}>{text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Subkomponenty ────────────────────────────────────────────────────────────

function Breadcrumb({ onBack }) {
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #F3F4F6', padding: '10px 24px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#9CA3AF', fontFamily: 'inherit', padding: 0, transition: 'color .12s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#1A1F2E'}
          onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}>
          <IcBack /> Zpět na úvod
        </button>
      </div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  const isTA = type === 'textarea'
  const Tag = isTA ? 'textarea' : 'input'
  return (
    <div>
      <label style={S.lbl}>{label}</label>
      <Tag
        type={isTA ? undefined : type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...S.inp, ...(isTA ? { minHeight: 120, resize: 'vertical' } : {}) }}
        onFocus={e => e.target.style.borderColor = '#3B82F6'}
        onBlur={e => e.target.style.borderColor = '#E5E7EB'}
      />
    </div>
  )
}

// ─── Styly ────────────────────────────────────────────────────────────────────
const S = {
  page:      { minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Inter', system-ui, sans-serif" },
  h2:        { fontSize: 22, fontWeight: 700, color: '#1A1F2E', letterSpacing: '-.02em', marginBottom: 8 },
  lbl:       { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, letterSpacing: '.02em' },
  inp:       { width: '100%', padding: '11px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', color: '#1A1F2E', background: '#fff', boxSizing: 'border-box', transition: 'border-color .15s' },
  btnOrange: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 50, borderRadius: 12, border: 'none', background: '#F97316', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-.01em' },
}

import { useState } from 'react'
import { CATEGORIES } from '../data'
import Icon from '../components/Icon'

const TOTAL_STEPS = 5
const STEP_LABELS = ['Popis', 'Lokalita a termín', 'Detaily', 'Váš kontakt', 'Souhrn']

export default function NewOrderPage({ onNav, onSubmit }) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState({
    title: '', category: '', desc: '', city: '', budget: '',
    urgent: false, date: '', gender: 'jedno', floor: '', parking: '', note: '',
    // contact – collected last
    name: '', email: '', phone: '',
  })

  const update = (k, v) => setData(p => ({ ...p, [k]: v }))

  const handleSubmit = () => {
    const cat = CATEGORIES.find(c => c.id === data.category)
    const newOrder = {
      id: Date.now(),
      ...data,
      status: 'new',
      created: 'Právě teď',
      offers: 0,
      icon: cat?.icon ?? '🔧',
      customer: data.name || 'Anonymní zákazník',
    }
    onSubmit(newOrder)
    onNav('order-confirm')
  }

  return (
    <div className="page-enter" style={{ minHeight: 'calc(100vh - 68px)', padding: '40px 20px', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ marginBottom: 8 }}>
          <h2 style={{ fontSize: 26, marginBottom: 4 }}>Zadat poptávku</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>
            Krok {step} z {TOTAL_STEPS}: <strong>{STEP_LABELS[step - 1]}</strong>
            {step < 4 && <span style={{ color: 'var(--text3)', marginLeft: 8 }}>· Kontaktní údaje zadáte až na konci</span>}
          </p>
        </div>

        {/* STEP INDICATOR */}
        <div className="step-indicator" style={{ marginBottom: 24 }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`step-dot ${i < step - 1 ? 'done' : i === step - 1 ? 'active' : ''}`} />
          ))}
        </div>

        <div className="card card-pad">

          {/* STEP 1 – Popis */}
          {step === 1 && (
            <>
              <div className="form-group">
                <label className="form-label">Co potřebujete udělat? *</label>
                <input className="form-input" value={data.title} onChange={e => update('title', e.target.value)}
                  placeholder="např. Smontovat skříň IKEA PAX" />
              </div>
              <div className="form-group">
                <label className="form-label">Kategorie *</label>
                <select className="form-select" value={data.category} onChange={e => update('category', e.target.value)}>
                  <option value="">— Vyberte kategorii —</option>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Podrobnější popis</label>
                <textarea className="form-textarea" value={data.desc} onChange={e => update('desc', e.target.value)}
                  placeholder="Popište situaci, materiál, rozměry – čím víc informací, tím přesnější nabídka." />
              </div>
              <div className="form-group">
                <label className="form-label">Orientační rozpočet</label>
                <select className="form-select" value={data.budget} onChange={e => update('budget', e.target.value)}>
                  <option value="">Nevím / nechám na šikulovi</option>
                  <option value="do 500 Kč">Do 500 Kč</option>
                  <option value="500–1000 Kč">500 – 1 000 Kč</option>
                  <option value="1000–2000 Kč">1 000 – 2 000 Kč</option>
                  <option value="2000–5000 Kč">2 000 – 5 000 Kč</option>
                  <option value="nad 5000 Kč">Nad 5 000 Kč</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#FEF7E0', borderRadius: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={data.urgent} onChange={e => update('urgent', e.target.checked)} style={{ width: 17, height: 17 }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>🚨 Urgentní – potřebuji co nejdříve</span>
              </label>
            </>
          )}

          {/* STEP 2 – Lokalita */}
          {step === 2 && (
            <>
              <div className="form-group">
                <label className="form-label">Město nebo adresa *</label>
                <input className="form-input" value={data.city} onChange={e => update('city', e.target.value)}
                  placeholder="Praha 6 – Dejvice" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Preferovaný termín</label>
                  <input className="form-input" value={data.date} onChange={e => update('date', e.target.value)} type="date" />
                </div>
                <div className="form-group">
                  <label className="form-label">Čas</label>
                  <select className="form-select">
                    <option>Kdykoliv</option>
                    <option>Dopoledne (8–12)</option>
                    <option>Odpoledne (12–17)</option>
                    <option>Večer (17–20)</option>
                    <option>Víkend</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Patro / přístup</label>
                <input className="form-input" value={data.floor} onChange={e => update('floor', e.target.value)}
                  placeholder="např. 3. patro, výtah k dispozici" />
              </div>
              <div className="form-group">
                <label className="form-label">Parkování pro šikulu</label>
                <select className="form-select" value={data.parking} onChange={e => update('parking', e.target.value)}>
                  <option value="">— Vyberte —</option>
                  <option>Zdarma před domem</option>
                  <option>Placené parkoviště v blízkosti</option>
                  <option>Parkovací místo k dispozici</option>
                  <option>Bez parkování</option>
                </select>
              </div>
            </>
          )}

          {/* STEP 3 – Detaily */}
          {step === 3 && (
            <>
              <div className="form-group">
                <label className="form-label">Preference pohlaví šikuly</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['jedno', '🤷 Jedno mi je'], ['zena', '👩 Žena'], ['muz', '👨 Muž']].map(([g, label]) => (
                    <button key={g} onClick={() => update('gender', g)}
                      style={{ flex: 1, padding: '10px 8px', border: `2px solid ${data.gender === g ? 'var(--brand)' : 'var(--border)'}`, borderRadius: 10, background: data.gender === g ? 'var(--brand)' : 'white', color: data.gender === g ? 'white' : 'var(--text)', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.15s' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Fotky (volitelné)</label>
                <div style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: '28px', textAlign: 'center', background: 'var(--bg)', cursor: 'pointer' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                  <p style={{ fontSize: 14, color: 'var(--text2)' }}>Kliknutím nebo přetažením přidejte fotky</p>
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>JPG, PNG do 10 MB</p>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Poznámka pro šikuly</label>
                <textarea className="form-textarea" value={data.note} onChange={e => update('note', e.target.value)}
                  placeholder="Cokoliv dalšího, co by šikula měl vědět…" style={{ minHeight: 80 }} />
              </div>
            </>
          )}

          {/* STEP 4 – Kontakt (bez registrace) */}
          {step === 4 && (
            <>
              <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: '14px 16px', marginBottom: 20, fontSize: 14, color: 'var(--text2)' }}>
                <strong style={{ color: 'var(--brand)' }}>Skoro hotovo!</strong> Vyplňte kontaktní údaje a poptávka bude odeslána šikulům. Automaticky vám vytvoříme účet a pošleme nabídky na e-mail.
              </div>
              <div className="form-group">
                <label className="form-label">Vaše jméno *</label>
                <input className="form-input" value={data.name} onChange={e => update('name', e.target.value)}
                  placeholder="Jana Nováková" />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail *</label>
                <input className="form-input" value={data.email} onChange={e => update('email', e.target.value)}
                  placeholder="vas@email.cz" type="email" />
                <p className="form-hint">Na tento e-mail vám pošleme nabídky od šikulů.</p>
              </div>
              <div className="form-group">
                <label className="form-label">Telefon (volitelné)</label>
                <input className="form-input" value={data.phone} onChange={e => update('phone', e.target.value)}
                  placeholder="+420 777 000 000" type="tel" />
                <p className="form-hint">Šikula vás může kontaktovat i telefonicky.</p>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                Odesláním souhlasíte se <span style={{ color: 'var(--brand)', cursor: 'pointer' }}>zpracováním osobních údajů</span> a <span style={{ color: 'var(--brand)', cursor: 'pointer' }}>podmínkami služby</span>.
              </div>
            </>
          )}

          {/* STEP 5 – Souhrn */}
          {step === 5 && (
            <div>
              <h3 style={{ marginBottom: 18 }}>Zkontrolujte poptávku</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  ['Název', data.title || '—'],
                  ['Kategorie', CATEGORIES.find(c => c.id === data.category)?.name ?? '—'],
                  ['Popis', data.desc || '—'],
                  ['Lokalita', data.city || '—'],
                  ['Termín', data.date || 'Flexibilní'],
                  ['Rozpočet', data.budget || 'Na dohodě'],
                  ['Urgentní', data.urgent ? '🚨 Ano' : 'Ne'],
                  ['Kontakt', data.name ? `${data.name} · ${data.email}` : '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 600, flexShrink: 0, marginRight: 16 }}>{k}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, textAlign: 'right', color: 'var(--text)' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: '#EAF3EE', borderRadius: 10, padding: 14, marginTop: 18 }}>
                <p style={{ fontSize: 14, color: 'var(--green)', fontWeight: 600 }}>
                  ✓ Vaše poptávka bude odeslána ověřeným šikulům ve vašem okolí. Nabídky dostanete na e-mail i do svého účtu.
                </p>
              </div>
            </div>
          )}

          {/* NAVIGATION */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'space-between' }}>
            {step > 1
              ? <button className="btn btn-outline" onClick={() => setStep(s => s - 1)}>← Zpět</button>
              : <button className="btn btn-ghost" onClick={() => onNav('home')}>← Zpět na úvod</button>
            }
            {step < TOTAL_STEPS
              ? <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
                  Pokračovat <Icon name="arrow" size={16} />
                </button>
              : <button className="btn btn-green" onClick={handleSubmit}>
                  <Icon name="check" size={16} /> Odeslat poptávku
                </button>
            }
          </div>
        </div>

        {step <= 3 && (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)', marginTop: 14 }}>
            Registraci nevyžadujeme. Kontakt zadáte až v posledním kroku.
          </p>
        )}
      </div>
    </div>
  )
}

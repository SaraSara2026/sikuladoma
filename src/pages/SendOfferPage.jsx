import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import { offersApi } from '../lib/api'
import { apiResendVerification, apiMe } from '../lib/auth.js'

export default function SendOfferPage({ order, onNav, onSend, currentUser, onUpdateUser }) {
  const [price, setPrice] = useState('')
  const [time, setTime]   = useState('')
  const [date, setDate]   = useState('')
  const [msg, setMsg]     = useState('')
  const [busy, setBusy]   = useState(false)
  const [err, setErr]     = useState(null)
  const [verifyState, setVerifyState] = useState('idle') // idle | sending | sent | error
  const [verifyMsg, setVerifyMsg]     = useState('')
  // localStorage/App state může být zastaralý (typicky po ověření e-mailu
  // v jiné kartě/zařízení) — než rozhodneme, jestli je e-mail ověřený, si
  // stránka vždy nejdřív ověří čerstvý stav ze serveru.
  const [freshUser, setFreshUser] = useState(currentUser)
  const [checkingUser, setCheckingUser] = useState(true)

  useEffect(() => {
    let alive = true
    apiMe()
      .then(({ user }) => {
        if (!alive) return
        if (user) { setFreshUser(user); onUpdateUser?.(user) }
        setCheckingUser(false)
      })
      .catch(() => { if (alive) setCheckingUser(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!order) return null

  if (checkingUser) {
    return (
      <div className="page-enter" style={{ padding: '32px 24px', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ color: 'var(--text3)', padding: 24, textAlign: 'center' }}>Načítám…</div>
      </div>
    )
  }

  // Reakce na poptávku vyžaduje aktivní placený tarif — žádné reakce zdarma.
  const hasActivePlan = freshUser?.subscription_status === 'active'
    && (freshUser?.plan === 'aktiv' || freshUser?.plan === 'aktiv-plus')

  if (!hasActivePlan) {
    return (
      <div className="page-enter" style={{ padding: '32px 24px', maxWidth: 640, margin: '0 auto' }}>
        <button className="btn btn-ghost" onClick={() => onNav('back')} style={{ marginBottom: 16 }}>← Zpět</button>
        <div className="card card-pad" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h2 style={{ marginBottom: 10 }}>Pro odeslání nabídky si aktivujte tarif.</h2>
          <p style={{ color: 'var(--text2)', lineHeight: 1.7, marginBottom: 22 }}>
            Tarif Aktivní šikula od 199 Kč / měsíc odemyká odesílání nabídek i kontakt se zákazníkem. Neplatíte žádné kredity ani provizi ze zakázky.
          </p>
          <button className="btn btn-primary" onClick={() => onNav('dash-sikula')}>Aktivovat tarif</button>
        </div>
      </div>
    )
  }

  // Zaplacený tarif nestačí — bez ověřeného e-mailu se nabídka poslat nesmí.
  const resendVerification = async () => {
    setVerifyState('sending')
    setVerifyMsg('')
    try {
      await apiResendVerification()
      setVerifyState('sent')
      setVerifyMsg('Ověřovací e-mail jsme vám poslali.')
    } catch (e) {
      setVerifyState('error')
      setVerifyMsg(e.message || 'Odeslání se nepodařilo. Zkuste to prosím znovu.')
    }
  }

  if (!freshUser?.email_verified_at) {
    return (
      <div className="page-enter" style={{ padding: '32px 24px', maxWidth: 640, margin: '0 auto' }}>
        <button className="btn btn-ghost" onClick={() => onNav('back')} style={{ marginBottom: 16 }}>← Zpět</button>
        <div className="card card-pad" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
          <h2 style={{ marginBottom: 10 }}>Ověřte svůj e-mail, abyste mohli posílat nabídky.</h2>
          <p style={{ color: 'var(--text2)', lineHeight: 1.7, marginBottom: 22 }}>
            Poslali jsme vám ověřovací odkaz na <strong>{freshUser?.email}</strong>. Klikněte na něj, nebo si nechte poslat nový.
          </p>
          {verifyMsg && (
            <div style={{
              marginBottom: 16, fontSize: 13, padding: '10px 12px', borderRadius: 8,
              background: verifyState === 'error' ? '#FEF2F2' : '#F0FDF4',
              color: verifyState === 'error' ? '#B91C1C' : '#166534',
            }}>
              {verifyMsg}
            </div>
          )}
          <button className="btn btn-primary" onClick={resendVerification}
            disabled={verifyState === 'sending' || verifyState === 'sent'}>
            {verifyState === 'sending' ? 'Posílám…' : verifyState === 'sent' ? '✓ Odesláno' : 'Poslat ověřovací e-mail'}
          </button>
        </div>
      </div>
    )
  }

  // Bez telefonu se zákazník se šikulou nemůže domluvit na detailech zakázky.
  if (!freshUser?.phone) {
    return (
      <div className="page-enter" style={{ padding: '32px 24px', maxWidth: 640, margin: '0 auto' }}>
        <button className="btn btn-ghost" onClick={() => onNav('back')} style={{ marginBottom: 16 }}>← Zpět</button>
        <div className="card card-pad" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📞</div>
          <h2 style={{ marginBottom: 10 }}>Doplňte telefon, abyste mohli posílat nabídky.</h2>
          <p style={{ color: 'var(--text2)', lineHeight: 1.7, marginBottom: 22 }}>
            Zákazník potřebuje mít na vás telefonní kontakt, aby se s vámi mohl domluvit na detailech zakázky.
          </p>
          <button className="btn btn-primary" onClick={() => onNav('dash-sikula')}>Doplnit telefon v profilu</button>
        </div>
      </div>
    )
  }

  const submit = async () => {
    setErr(null)
    const priceNum = Number(price)
    if (!priceNum || priceNum <= 0) return setErr('Zadejte platnou cenu.')
    if (time.trim() && /^\d+([.,]\d+)?$/.test(time.trim())) {
      return setErr('U odhadu délky práce napište i jednotku, například "5 hodin" nebo "2 dny".')
    }
    if (msg.trim().length < 10)     return setErr('Napište aspoň krátkou zprávu (min. 10 znaků).')

    setBusy(true)
    try {
      await offersApi.create({
        order_id:       order.id,
        price:          priceNum,
        message:        msg,
        available_date: date || null,
        available_time: time || null,
      })
      onSend?.()
      onNav('dash-sikula')
    } catch (e) {
      if (e.code === 'verify_required') {
        setErr('Váš e-mail ještě není ověřený. Zkuste stránku znovu otevřít z přehledu zakázek.')
      } else {
        setErr(e.message || 'Odeslání nabídky selhalo.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-enter" style={{ padding: '32px 24px', maxWidth: 640, margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={() => onNav('back')} style={{ marginBottom: 16 }}>← Zpět</button>
      <h2 style={{ marginBottom: 4 }}>Poslat nabídku</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 24 }}>Na poptávku: <strong>{order.title}</strong></p>
      <div className="card card-pad">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Vaše cena (Kč) *</label>
            <input className="form-input" value={price} onChange={e => setPrice(e.target.value)} placeholder="900" type="number" min="1" />
          </div>
          <div className="form-group">
            <label className="form-label">Odhad délky práce</label>
            <input className="form-input" value={time} onChange={e => setTime(e.target.value)} placeholder="např. 5 hodin, 2 dny, 1 týden" />
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
              Napište odhad včetně jednotky, například 5 hodin nebo 2 dny.
            </div>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Navrhovaný termín</label>
          <input className="form-input" value={date} onChange={e => setDate(e.target.value)} placeholder="2026-05-22" type="date" />
        </div>
        <div className="form-group">
          <label className="form-label">Zpráva zákazníkovi *</label>
          <textarea className="form-textarea" value={msg} onChange={e => setMsg(e.target.value)} placeholder="Představte se, popište jak to uděláte..." />
        </div>
        <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>
            💡 <strong>Tip:</strong> Nabídky s konkrétním popisem mají 3× vyšší šanci na přijetí.
          </p>
        </div>

        {err && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C',
            padding: '10px 12px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>
            {err}
          </div>
        )}

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14 }}
          onClick={submit} disabled={busy}>
          {busy ? 'Odesílám…' : <><Icon name="send" size={16} /> Odeslat nabídku</>}
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import Icon from '../components/Icon'
import { offersApi } from '../lib/api'

export default function SendOfferPage({ order, onNav, onSend }) {
  const [price, setPrice] = useState('')
  const [time, setTime]   = useState('')
  const [date, setDate]   = useState('')
  const [msg, setMsg]     = useState('')
  const [busy, setBusy]   = useState(false)
  const [err, setErr]     = useState(null)

  if (!order) return null

  const submit = async () => {
    setErr(null)
    const priceNum = Number(price)
    if (!priceNum || priceNum <= 0) return setErr('Zadejte platnou cenu.')
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
      setErr(e.message || 'Odeslání nabídky selhalo.')
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
            <label className="form-label">Odhadovaný čas</label>
            <input className="form-input" value={time} onChange={e => setTime(e.target.value)} placeholder="1,5 hod" />
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

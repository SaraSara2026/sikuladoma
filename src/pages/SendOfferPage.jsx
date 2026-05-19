import { useState } from 'react'
import Icon from '../components/Icon'

export default function SendOfferPage({ order, onNav, onSend }) {
  const [price, setPrice] = useState('')
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  const [msg, setMsg] = useState('')

  if (!order) return null

  return (
    <div className="page-enter" style={{ padding: '32px 24px', maxWidth: 640, margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={() => onNav('back')} style={{ marginBottom: 16 }}>← Zpět</button>
      <h2 style={{ marginBottom: 4 }}>Poslat nabídku</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 24 }}>Na poptávku: <strong>{order.title}</strong></p>
      <div className="card card-pad">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Vaše cena (Kč) *</label>
            <input className="form-input" value={price} onChange={e => setPrice(e.target.value)} placeholder="900" type="number" />
          </div>
          <div className="form-group">
            <label className="form-label">Odhadovaný čas</label>
            <input className="form-input" value={time} onChange={e => setTime(e.target.value)} placeholder="1,5 hod" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Navrhovaný termín</label>
          <input className="form-input" value={date} onChange={e => setDate(e.target.value)} placeholder="Zítra od 10:00" />
        </div>
        <div className="form-group">
          <label className="form-label">Zpráva zákazníkovi *</label>
          <textarea className="form-textarea" value={msg} onChange={e => setMsg(e.target.value)} placeholder="Představte se, popište jak to uděláte..." />
        </div>
        <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 14, marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>
            💡 <strong>Tip:</strong> Nabídky s konkrétním popisem mají 3× vyšší šanci na přijetí.
          </p>
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14 }} onClick={() => { onSend(); onNav('dash-sikula') }}>
          <Icon name="send" size={16} /> Odeslat nabídku
        </button>
      </div>
    </div>
  )
}

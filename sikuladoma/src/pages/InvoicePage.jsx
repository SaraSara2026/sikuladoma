import { useState } from 'react'
import { DEMO_INVOICES, INVOICE_STATUS_MAP } from '../data'
import Icon from '../components/Icon'

export default function InvoicePage() {
  const [invoices, setInvoices] = useState(DEMO_INVOICES)
  const [showNew, setShowNew] = useState(false)
  const [newInv, setNewInv] = useState({ customer: '', title: '', amount: '', note: '' })

  const createInvoice = () => {
    const inv = {
      id: `FAK-2024-00${invoices.length + 1}`,
      customer: newInv.customer || 'Nový zákazník',
      title: newInv.title || 'Zakázka',
      amount: parseInt(newInv.amount) || 0,
      status: 'draft',
      created: new Date().toLocaleDateString('cs'),
      due: new Date(Date.now() + 7 * 86400000).toLocaleDateString('cs'),
      ico: '12345678',
    }
    setInvoices(p => [inv, ...p])
    setShowNew(false)
    setNewInv({ customer: '', title: '', amount: '', note: '' })
  }

  return (
    <div className="page-enter">
      <div className="dash-header">
        <div>
          <div className="dash-title">Fakturace</div>
          <div className="dash-subtitle">Vystavte fakturu jedním kliknutím</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          <Icon name="plus" size={16} /> Nová faktura
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-val">4 600 Kč</div><div className="stat-label">Čeká na platbu</div></div>
        <div className="stat-card"><div className="stat-val">400 Kč</div><div className="stat-label">Zaplaceno</div></div>
        <div className="stat-card"><div className="stat-val">{invoices.length}</div><div className="stat-label">Faktur celkem</div></div>
      </div>

      {invoices.map(inv => (
        <div key={inv.id} className="invoice-card">
          <div className="invoice-header">
            <div>
              <div className="invoice-num">{inv.id}</div>
              <div className="invoice-meta">{inv.customer} · {inv.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Vystaveno: {inv.created} | Splatnost: {inv.due}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="invoice-amount">{inv.amount.toLocaleString()} Kč</div>
              <div style={{ marginTop: 6 }}>
                <span className={`badge ${INVOICE_STATUS_MAP[inv.status]?.color}`}>{INVOICE_STATUS_MAP[inv.status]?.label}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <button className="btn btn-ghost btn-sm"><Icon name="eye" size={14} /> Náhled PDF</button>
            <button className="btn btn-ghost btn-sm"><Icon name="download" size={14} /> Stáhnout</button>
            {inv.status === 'draft' && <button className="btn btn-primary btn-sm"><Icon name="send" size={14} /> Odeslat zákazníkovi</button>}
            {inv.status === 'sent' && <button className="btn btn-green btn-sm"><Icon name="check" size={14} /> Označit jako zaplaceno</button>}
          </div>
        </div>
      ))}

      {showNew && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Nová faktura</span>
              <button className="modal-close" onClick={() => setShowNew(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Zákazník *</label>
                <input className="form-input" value={newInv.customer} onChange={e => setNewInv(p => ({ ...p, customer: e.target.value }))} placeholder="Jméno zákazníka" />
              </div>
              <div className="form-group">
                <label className="form-label">Popis práce *</label>
                <input className="form-input" value={newInv.title} onChange={e => setNewInv(p => ({ ...p, title: e.target.value }))} placeholder="Montáž nábytku" />
              </div>
              <div className="form-group">
                <label className="form-label">Částka (Kč) *</label>
                <input className="form-input" value={newInv.amount} onChange={e => setNewInv(p => ({ ...p, amount: e.target.value }))} placeholder="1500" type="number" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">IČO</label>
                  <input className="form-input" placeholder="12345678" defaultValue="12345678" />
                </div>
                <div className="form-group">
                  <label className="form-label">Plátce DPH</label>
                  <select className="form-select">
                    <option>Neplátce DPH</option>
                    <option>Plátce DPH 21%</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Poznámka</label>
                <textarea className="form-textarea" value={newInv.note} onChange={e => setNewInv(p => ({ ...p, note: e.target.value }))} style={{ minHeight: 70 }} placeholder="Volitelná poznámka na faktuře" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Zrušit</button>
              <button className="btn btn-primary" onClick={createInvoice}>
                <Icon name="check" size={15} /> Vystavit fakturu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

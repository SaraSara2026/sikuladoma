import { useState, useEffect } from 'react'
import { INVOICE_STATUS_MAP } from '../data'
import { useAuth } from '../contexts/AuthContext'

function dnes() {
  return new Date().toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function plusDni(n) {
  const d = new Date(); d.setDate(d.getDate() + n)
  return d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function noveCislo(pocet) {
  return `FAK-${new Date().getFullYear()}-${String(pocet + 1).padStart(3, '0')}`
}
function fKc(n) { return Number(n).toLocaleString('cs-CZ') + ' Kč' }
// "27. 5. 2026" → "2026-05-27" (pro Postgres DATE)
function parseCzechDate(s) {
  if (!s) return null
  const m = String(s).match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/)
  if (!m) return s
  const [, d, mo, y] = m
  return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

const EMPTY_PROFIL = { jmeno: '', ico: '', dic: '', adresa: '', platceDph: false }

// Inicializuje fakturační profil z přihlášeného uživatele + uloženého localStorage.
function initProfilFor(user) {
  if (!user) return EMPTY_PROFIL
  try {
    const saved = localStorage.getItem(`sd_invoice_profile_${user.id}`)
    if (saved) return { ...EMPTY_PROFIL, ...JSON.parse(saved) }
  } catch {}
  return {
    jmeno: user.name || '',
    ico: user.ico || '',
    dic: '',
    adresa: user.city ? `${user.city}` : '',
    platceDph: false,
  }
}

// ─── Náhled / tisk faktury ────────────────────────────────────────────────────
function FakturaView({ inv, profil, onClose }) {
  const base = Number(inv.castka || inv.amount || 0)
  const dphC = profil.platceDph ? Math.round(base * 0.21) : 0
  const celk = base + dphC

  const stahnout = async () => {
    try {
      // 1. Importy – staticky aby Vite správně zbundloval
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF }   = await import('jspdf')

      // 2. Zdrojový element
      const source = document.getElementById('f-tisk')
      if (!source) throw new Error('Element #f-tisk nenalezen')

      // 3. Klon do body – viditelný, pevná šířka A4, mimo viewport
      const clone = source.cloneNode(true)
      Object.assign(clone.style, {
        position:   'absolute',
        top:        '-9999px',
        left:       '0',
        width:      '794px',
        minHeight:  '100px',
        padding:    '56px 60px 72px',
        boxSizing:  'border-box',
        background: '#fff',
        fontFamily: 'Arial, sans-serif',
        fontSize:   '13px',
        lineHeight: '1.6',
        color:      '#1A1F2E',
        overflow:   'visible',
        maxHeight:  'none',
      })
      document.body.appendChild(clone)

      // 4. Počkat na vykreslení
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

      // 5. Renderovat
      const canvas = await html2canvas(clone, {
        scale:           2,
        useCORS:         true,
        allowTaint:      true,
        backgroundColor: '#ffffff',
        logging:         false,
        width:           794,
        windowWidth:     794,
        scrollX:         0,
        scrollY:         0,
      })

      document.body.removeChild(clone)

      // 6. Sestavit PDF
      const doc    = new jsPDF({ unit: 'mm', format: 'a4' })
      const A4w    = 210
      const A4h    = 297
      const ratio  = A4w / canvas.width          // px → mm
      const imgH   = canvas.height * ratio

      if (imgH <= A4h) {
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, A4w, imgH)
      } else {
        const pageHpx = A4h / ratio
        let y = 0
        while (y < canvas.height) {
          const h = Math.min(pageHpx, canvas.height - y)
          const pg = Object.assign(document.createElement('canvas'), { width: canvas.width, height: Math.ceil(h) })
          const ctx = pg.getContext('2d')
          ctx.fillStyle = '#fff'
          ctx.fillRect(0, 0, pg.width, pg.height)
          ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h)
          if (y > 0) doc.addPage()
          doc.addImage(pg.toDataURL('image/png'), 'PNG', 0, 0, A4w, h * ratio)
          y += h
        }
      }

      doc.save(inv.id + '.pdf')

    } catch (err) {
      console.error('PDF export selhal:', err)
      alert('PDF se nepodařilo vytvořit:\n' + err.message)
    }
  }

  const tisk = () => {
    const el = document.getElementById('f-tisk')
    const html = `<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"><title>Faktura ${inv.id}</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;font-size:13px;color:#1A1F2E;padding:40px;line-height:1.55;}table{width:100%;border-collapse:collapse;}th{background:#1A1F2E;color:#fff;padding:8px 10px;font-size:11px;text-transform:uppercase;}td{padding:10px;border-bottom:1px solid #E5E7EB;}.right{text-align:right;}</style></head><body>${el.innerHTML}</body></html>`
    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print() }, 400)
  }

  return (
    <div style={OV} onClick={onClose}>
      <div style={{ ...MOD, maxWidth: 660 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 22px', borderBottom:'1px solid #E5E7EB' }}>
          <div style={{ fontWeight:700, fontSize:16, color:'#1A1F2E' }}>Náhled faktury</div>
          <div style={{ display:'flex', gap:8 }}>
            <button style={BG} onClick={onClose}>Zavřít</button>
            <button style={{ ...BG }} onClick={tisk}>🖨 Tisknout</button>
            <button style={BP} onClick={stahnout}>⬇ Stáhnout PDF</button>
          </div>
        </div>
        <div style={{ padding:'22px', overflowY:'auto', maxHeight:'75vh' }}>
          <div id="f-tisk" style={{ fontFamily:'Arial,sans-serif', fontSize:13, color:'#1A1F2E', lineHeight:1.55 }}>

            {/* Hlavička */}
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:24 }}>
              <div>
                <div style={{ fontSize:20, fontWeight:800 }}><span style={{ color:'#0066CC' }}>Šikula</span><span style={{ color:'#F07800' }}>Doma</span></div>
                <div style={{ fontSize:11, color:'#9CA3AF' }}>sikuladoma.cz</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:18, fontWeight:800 }}>FAKTURA</div>
                <div style={{ color:'#F07800', fontWeight:700 }}>{inv.id}</div>
              </div>
            </div>

            {/* Strany */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
              {[
                ['Dodavatel', [profil.jmeno, profil.adresa, `IČO: ${profil.ico}`, profil.dic && `DIČ: ${profil.dic}`, !profil.platceDph && 'Neplátce DPH'].filter(Boolean)],
                ['Odběratel', [inv.zakaznik || inv.customer, inv.zakaznikAdresa, inv.zakaznikIco && `IČO: ${inv.zakaznikIco}`].filter(Boolean)],
              ].map(([tit, radky]) => (
                <div key={tit} style={{ background:'#F9FAFB', borderRadius:9, padding:'12px 14px', border:'1px solid #E5E7EB' }}>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#9CA3AF', marginBottom:6 }}>{tit}</div>
                  {radky.map((r, i) => <div key={i} style={{ fontSize: i===0?14:12, fontWeight: i===0?700:400, color: i===0?'#1A1F2E':'#4B5563', marginBottom:2 }}>{r}</div>)}
                </div>
              ))}
            </div>

            {/* Datumy */}
            <div style={{ display:'flex', gap:12, marginBottom:18 }}>
              {[['Datum vystavení', inv.datumVystaveni||inv.created], ['Datum plnění', inv.datumPlneni||inv.created], ['Splatnost', inv.splatnost||inv.due]].map(([k,v]) => (
                <div key={k} style={{ flex:1, background:'#EFF6FF', borderRadius:8, padding:'8px 12px' }}>
                  <div style={{ fontSize:10, color:'#6B7280', marginBottom:2 }}>{k}</div>
                  <div style={{ fontWeight:600, fontSize:12 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Položky */}
            <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:18 }}>
              <thead>
                <tr style={{ background:'#EFF6FF', color:'#1E3A5F', borderBottom:'2px solid #BFDBFE' }}>
                  {['Popis', 'Ks', profil.platceDph?'Základ':'Cena', profil.platceDph&&'DPH 21%', profil.platceDph&&'S DPH'].filter(Boolean).map(h=>(
                    <th key={h} style={{ padding:'8px 10px', textAlign:h==='Popis'?'left':'right', fontSize:11, fontWeight:700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom:'1px solid #E5E7EB' }}>
                  <td style={{ padding:'10px 10px', fontSize:13 }}>{inv.sluzba||inv.title}</td>
                  <td style={{ padding:'10px 10px', textAlign:'right', fontSize:13 }}>1</td>
                  <td style={{ padding:'10px 10px', textAlign:'right', fontSize:13 }}>{fKc(base)}</td>
                  {profil.platceDph && <td style={{ padding:'10px 10px', textAlign:'right', fontSize:13 }}>{fKc(dphC)}</td>}
                  {profil.platceDph && <td style={{ padding:'10px 10px', textAlign:'right', fontWeight:700, fontSize:13 }}>{fKc(celk)}</td>}
                </tr>
              </tbody>
            </table>

            {/* Rekapitulace */}
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
              <div style={{ minWidth:220 }}>
                {profil.platceDph && (
                  <>
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:12, color:'#6B7280' }}><span>Základ DPH</span><span>{fKc(base)}</span></div>
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:12, color:'#6B7280' }}><span>DPH 21 %</span><span>{fKc(dphC)}</span></div>
                    <div style={{ height:1, background:'#E5E7EB', margin:'6px 0' }} />
                  </>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'#EFF6FF', border:'1.5px solid #BFDBFE', borderRadius:10 }}>
                  <span style={{ fontWeight:700, color:'#1E3A5F' }}>K úhradě</span>
                  <span style={{ fontWeight:800, color:'#1D4ED8', fontSize:15 }}>{fKc(celk)}</span>
                </div>
              </div>
            </div>

            {inv.poznamka && (
              <div style={{ padding:'10px 12px', background:'#FFFBEB', border:'1px solid #FEF08A', borderRadius:8, fontSize:12, color:'#6B7280' }}>
                <strong>Poznámka:</strong> {inv.poznamka}
              </div>
            )}
            <div style={{ marginTop:32, paddingTop:14, borderTop:'1px solid #F3F4F6', fontSize:10, color:'#CBD5E1', textAlign:'center', paddingBottom:8, letterSpacing:'.02em' }}>
              Vystaveno přes ŠikulaDoma
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Nová / upravit fakturu ──────────────────────────────────────────────────
function NovaFaktura({ profil, pocet, editing, onSave, onClose }) {
  const isEdit = !!editing
  const [f, setF] = useState(editing ? {
    sluzba: editing.sluzba || editing.title || '',
    castka: editing.castka || editing.amount || '',
    zakaznik: editing.zakaznik || editing.customer || '',
    zakaznikAdresa: editing.zakaznikAdresa || '',
    zakaznikIco: editing.zakaznikIco || '',
    datumPlneni: editing.datumPlneni || editing.created || dnes(),
    poznamka: editing.poznamka || '',
  } : { sluzba:'', castka:'', zakaznik:'', zakaznikAdresa:'', zakaznikIco:'', datumPlneni:dnes(), poznamka:'' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)
  const u = (k,v) => setF(p=>({...p,[k]:v}))
  const ok = f.sluzba && f.castka && f.zakaznik

  const submit = async () => {
    if (!ok || saving) return
    setSaving(true); setErr(null)
    try {
      if (isEdit) {
        await onSave({ id: editing.id, ...f, castka: Number(f.castka) })
      } else {
        await onSave({ id: noveCislo(pocet), ...f, castka: Number(f.castka), datumVystaveni: dnes(), splatnost: plusDni(14), status: 'draft' })
      }
    } catch (e) {
      setErr(e.message || 'Něco se pokazilo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={OV} onClick={onClose}>
      <div style={{ ...MOD, maxWidth:500 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid #E5E7EB' }}>
          <div style={{ fontWeight:700, fontSize:16, color:'#1A1F2E' }}>{isEdit ? `Upravit ${editing.id}` : 'Nová faktura'}</div>
          <button style={BC} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:13 }}>
          <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:9, padding:'9px 13px', fontSize:13, color:'#1D4ED8' }}>
            Fakturant: <strong>{profil.jmeno}</strong> · IČO {profil.ico}{profil.platceDph?' · Plátce DPH':' · Neplátce DPH'}
          </div>
          <div><label style={LB}>Popis služby *</label><input style={IN} value={f.sluzba} onChange={e=>u('sluzba',e.target.value)} placeholder="Montáž nábytku, úklid bytu…" autoFocus /></div>
          <div>
            <label style={LB}>Částka {profil.platceDph?'(bez DPH) *':'*'}</label>
            <div style={{ position:'relative' }}>
              <input style={{ ...IN, paddingRight:42 }} type="number" value={f.castka} onChange={e=>u('castka',e.target.value)} placeholder="1500" />
              <span style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF', fontSize:13 }}>Kč</span>
            </div>
            {profil.platceDph && f.castka && (
              <div style={{ fontSize:12, color:'#6B7280', marginTop:4 }}>
                DPH 21 %: {fKc(Math.round(Number(f.castka)*0.21))} · Celkem s DPH: <strong>{fKc(Math.round(Number(f.castka)*1.21))}</strong>
              </div>
            )}
          </div>
          <div><label style={LB}>Zákazník *</label><input style={IN} value={f.zakaznik} onChange={e=>u('zakaznik',e.target.value)} placeholder="Jana Nováková" /></div>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:10 }}>
            <div><label style={LB}>Adresa zákazníka</label><input style={IN} value={f.zakaznikAdresa} onChange={e=>u('zakaznikAdresa',e.target.value)} placeholder="Ulice 1, Praha" /></div>
            <div><label style={LB}>IČO zákazníka</label><input style={IN} value={f.zakaznikIco} onChange={e=>u('zakaznikIco',e.target.value)} placeholder="volitelné" /></div>
          </div>
          <div><label style={LB}>Datum plnění</label><input style={IN} type="date" value={f.datumPlneni.split('.').reverse().join('-')} onChange={e=>{ const[y,m,d]=e.target.value.split('-'); u('datumPlneni',`${d}.${m}.${y}`) }} /></div>
          <div><label style={LB}>Poznámka</label><textarea style={{ ...IN, minHeight:60, resize:'vertical' }} value={f.poznamka} onChange={e=>u('poznamka',e.target.value)} placeholder="Platba převodem…" /></div>
          {err && <div style={{ padding:'9px 12px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, fontSize:12, color:'#B91C1C' }}>{err}</div>}
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E5E7EB', display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button style={BG} onClick={onClose}>Zrušit</button>
          <button style={{ ...BP, opacity:(ok&&!saving)?1:.45, cursor:(ok&&!saving)?'pointer':'not-allowed' }} onClick={submit}>
            {saving ? 'Ukládám…' : (isEdit ? 'Uložit změny ✓' : 'Vystavit fakturu ✓')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Profil / fakturační údaje ────────────────────────────────────────────────
function ProfilModal({ profil, onSave, onClose }) {
  const [f, setF] = useState({...profil})
  const u = (k,v) => setF(p=>({...p,[k]:v}))
  return (
    <div style={OV} onClick={onClose}>
      <div style={{ ...MOD, maxWidth:460 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid #E5E7EB' }}>
          <div style={{ fontWeight:700, fontSize:16, color:'#1A1F2E' }}>Fakturační údaje</div>
          <button style={BC} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:12 }}>
          <div><label style={LB}>Jméno / název firmy *</label><input style={IN} value={f.jmeno} onChange={e=>u('jmeno',e.target.value)} /></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><label style={LB}>IČO *</label><input style={IN} value={f.ico} onChange={e=>u('ico',e.target.value)} placeholder="12345678" /></div>
            <div><label style={LB}>DIČ (volitelné)</label><input style={IN} value={f.dic} onChange={e=>u('dic',e.target.value)} placeholder="CZ12345678" /></div>
          </div>
          <div><label style={LB}>Adresa</label><input style={IN} value={f.adresa} onChange={e=>u('adresa',e.target.value)} /></div>
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'#F9FAFB', borderRadius:10, border:'1px solid #E5E7EB', cursor:'pointer' }} onClick={()=>u('platceDph',!f.platceDph)}>
            <div style={{ width:20, height:20, borderRadius:4, border:`2px solid ${f.platceDph?'#F07800':'#D1D5DB'}`, background:f.platceDph?'#F07800':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .14s' }}>
              {f.platceDph && <span style={{ color:'#fff', fontSize:11, fontWeight:800 }}>✓</span>}
            </div>
            <div>
              <div style={{ fontWeight:600, fontSize:14 }}>Jsem plátce DPH</div>
              <div style={{ fontSize:12, color:'#6B7280' }}>Faktury budou obsahovat sazbu a výši DPH 21 %</div>
            </div>
          </div>
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E5E7EB', display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button style={BG} onClick={onClose}>Zrušit</button>
          <button style={BP} onClick={()=>{ onSave(f); onClose() }}>Uložit</button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function InvoicePage() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/invoices')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('API ' + r.status)))
      .then(rows => setInvoices(rows.map(i => ({
        ...i,
        amount: Number(i.amount),
        sluzba: i.title, castka: Number(i.amount), zakaznik: i.customer,
        datumVystaveni: i.created, datumPlneni: i.created, splatnost: i.due,
        poznamka: '', zakaznikAdresa: '', zakaznikIco: '',
      }))))
      .catch(err => console.error('Načítání faktur selhalo:', err))
      .finally(() => setLoading(false))
  }, [])

  const [profil, setProfilState] = useState(() => initProfilFor(user))

  // Re-init profile when user changes (login/logout).
  useEffect(() => { setProfilState(initProfilFor(user)) }, [user?.id])

  const setProfil = (next) => {
    setProfilState(next)
    if (user?.id) {
      try { localStorage.setItem(`sd_invoice_profile_${user.id}`, JSON.stringify(next)) } catch {}
    }
  }
  const [showNova, setShowNova] = useState(false)
  const [showProfil, setShowProfil] = useState(false)
  const [nahled, setNahled] = useState(null)
  const [editing, setEditing] = useState(null)  // faktura která se právě edituje (null = nová)

  // POST nové faktury do DB
  const saveInvoice = async (inv) => {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: inv.id,
        title: inv.sluzba,
        amount: inv.castka,
        customer_name: inv.zakaznik,
        due_date: parseCzechDate(inv.splatnost),
      }),
    })
    if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'Faktura se nepodařila uložit.')
    setInvoices(p => [inv, ...p])
    setShowNova(false)
    setNahled(inv)
  }

  // PATCH editace draft faktury
  const editInvoice = async (inv) => {
    const res = await fetch(`/api/invoices?id=${encodeURIComponent(inv.id)}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: inv.sluzba,
        amount: inv.castka,
        customer_name: inv.zakaznik,
      }),
    })
    if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'Úprava se nezdařila.')
    setInvoices(p => p.map(i => i.id === inv.id ? { ...i, ...inv } : i))
    setEditing(null)
  }

  // PATCH status change (sent / paid)
  const changeStatus = async (id, status) => {
    const before = invoices.find(i => i.id === id)
    setInvoices(p => p.map(i => i.id === id ? { ...i, status } : i))  // optimistic
    try {
      const res = await fetch(`/api/invoices?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('PATCH failed')
    } catch {
      setInvoices(p => p.map(i => i.id === id ? before : i))  // rollback
      alert('Nepodařilo se změnit stav faktury.')
    }
  }

  // DELETE draft
  const deleteInvoice = async (id) => {
    if (!confirm(`Opravdu smazat fakturu ${id}?`)) return
    try {
      const res = await fetch(`/api/invoices?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'Smazání selhalo.')
      setInvoices(p => p.filter(i => i.id !== id))
    } catch (e) {
      alert(e.message)
    }
  }

  const zaplaceno = invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+(i.castka||0),0)
  const ceka = invoices.filter(i=>i.status!=='paid').reduce((s,i)=>s+(i.castka||0),0)

  return (
    <div className="page-enter">
      <div className="dash-header">
        <div>
          <div className="dash-title">Fakturace</div>
          <div className="dash-subtitle">Faktura do 60 sekund · Splňuje právní požadavky ČR</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={BG} onClick={()=>setShowProfil(true)}>⚙ Fakturační údaje</button>
          <button style={BP} onClick={()=>setShowNova(true)}>+ Nová faktura</button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom:24 }}>
        <div className="stat-card"><div className="stat-val" style={{ color:'#F97316' }}>{fKc(ceka)}</div><div className="stat-label">Čeká na úhradu</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color:'#22C55E' }}>{fKc(zaplaceno)}</div><div className="stat-label">Zaplaceno</div></div>
        <div className="stat-card"><div className="stat-val">{invoices.length}</div><div className="stat-label">Faktur celkem</div></div>
      </div>

      {invoices.map(inv => {
        const base = inv.castka || inv.amount || 0
        const celk = profil.platceDph ? Math.round(base*1.21) : base
        const st = INVOICE_STATUS_MAP[inv.status] || { label:inv.status, color:'badge-gray' }
        return (
          <div key={inv.id} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:14, padding:'16px 18px', marginBottom:10, boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'#9CA3AF' }}>{inv.id}</span>
                  <span className={`badge ${st.color}`}>{st.label}</span>
                  {profil.platceDph && <span style={{ fontSize:11, padding:'1px 7px', borderRadius:999, background:'#F0FDF4', color:'#16A34A', fontWeight:600 }}>DPH 21%</span>}
                </div>
                <div style={{ fontWeight:700, fontSize:14, color:'#1A1F2E', marginBottom:2 }}>{inv.sluzba||inv.title}</div>
                <div style={{ fontSize:12, color:'#9CA3AF' }}>{inv.zakaznik||inv.customer} · {inv.datumVystaveni||inv.created} · Splatnost {inv.splatnost||inv.due}</div>
              </div>
              <div style={{ textAlign:'right', marginLeft:16 }}>
                <div style={{ fontWeight:800, fontSize:17, color:inv.status==='paid'?'#22C55E':'#1A1F2E' }}>{fKc(celk)}</div>
                {profil.platceDph && <div style={{ fontSize:11, color:'#9CA3AF' }}>základ {fKc(base)}</div>}
              </div>
            </div>
            <div style={{ display:'flex', gap:7, marginTop:12, paddingTop:12, borderTop:'1px solid #F3F4F6', flexWrap:'wrap' }}>
              <button style={BS} onClick={()=>setNahled(inv)}>👁 Náhled / PDF</button>
              {inv.status==='draft' && <button style={{ ...BS, background:'#FFF7ED', color:'#C2410C', border:'1px solid #FED7AA' }} onClick={()=>setEditing(inv)}>✎ Upravit</button>}
              {inv.status==='draft' && <button style={{ ...BS, background:'#EFF6FF', color:'#1D4ED8', border:'1px solid #BFDBFE' }} onClick={()=>changeStatus(inv.id,'sent')}>✉ Odeslat zákazníkovi</button>}
              {inv.status==='sent' && <button style={{ ...BS, background:'#F0FDF4', color:'#16A34A', border:'1px solid #BBF7D0' }} onClick={()=>changeStatus(inv.id,'paid')}>✓ Zaplaceno</button>}
              {inv.status==='draft' && <button style={{ ...BS, background:'#FEF2F2', color:'#B91C1C', border:'1px solid #FECACA' }} onClick={()=>deleteInvoice(inv.id)}>🗑 Smazat</button>}
            </div>
          </div>
        )
      })}

      {showNova && <NovaFaktura profil={profil} pocet={invoices.length} onSave={saveInvoice} onClose={()=>setShowNova(false)} />}
      {editing && <NovaFaktura profil={profil} editing={editing} onSave={editInvoice} onClose={()=>setEditing(null)} />}
      {showProfil && <ProfilModal profil={profil} onSave={setProfil} onClose={()=>setShowProfil(false)} />}
      {nahled && <FakturaView inv={nahled} profil={profil} onClose={()=>setNahled(null)} />}
    </div>
  )
}

const OV = { position:'fixed', inset:0, background:'rgba(10,15,30,.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(6px)' }
const MOD = { background:'#fff', borderRadius:16, width:'100%', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.18)' }
const IN = { width:'100%', padding:'10px 13px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:14, outline:'none', fontFamily:'inherit', color:'#1A1F2E', background:'#fff', boxSizing:'border-box' }
const LB = { display:'block', fontSize:11, fontWeight:700, color:'#6B7280', marginBottom:5, letterSpacing:'.04em', textTransform:'uppercase' }
const BP = { display:'inline-flex', alignItems:'center', gap:6, height:38, padding:'0 16px', borderRadius:10, border:'none', background:'#F07800', color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }
const BG = { display:'inline-flex', alignItems:'center', gap:6, height:38, padding:'0 14px', borderRadius:10, border:'1.5px solid #E5E7EB', background:'transparent', color:'#6B7280', fontWeight:500, fontSize:13, cursor:'pointer', fontFamily:'inherit' }
const BC = { width:28, height:28, borderRadius:7, border:'none', background:'#F1F5F9', color:'#6B7280', cursor:'pointer', fontFamily:'inherit' }
const BS = { display:'inline-flex', alignItems:'center', gap:5, height:30, padding:'0 11px', borderRadius:8, border:'1px solid #E5E7EB', background:'#F9FAFB', color:'#4B5563', fontWeight:500, fontSize:12, cursor:'pointer', fontFamily:'inherit' }

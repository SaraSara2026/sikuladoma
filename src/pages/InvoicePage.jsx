import { useState, useEffect } from 'react'
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

const EMPTY_PROFIL = { jmeno: '', ico: '', dic: '', ulice: '', mesto: '', psc: '', platceDph: false }

function parseCzechDateToObj(s) {
  if (!s) return null
  const m = String(s).match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/)
  if (!m) return null
  const [, d, mo, y] = m
  return new Date(Number(y), Number(mo) - 1, Number(d))
}

function effectivniStav(inv) {
  if (inv.status === 'paid') return 'paid'
  if (inv.status === 'draft') return 'draft'
  const due = parseCzechDateToObj(inv.splatnost || inv.due)
  if (due && due < new Date()) return 'late'
  return 'sent'
}

const STATUS_STYLE = {
  paid:  { label: 'Zaplacená',     color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  late:  { label: 'Po splatnosti', color: '#fff',    bg: '#1A1F2E', border: '#1A1F2E' },
  sent:  { label: 'Posláno',       color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  draft: { label: 'Vytvořeno',     color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
}

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
    ulice: '',
    mesto: user.city || '',
    psc: '',
    platceDph: user.platce_dph || false,
  }
}

// ─── Náhled / tisk faktury ────────────────────────────────────────────────────
function FakturaView({ inv, profil, onClose, onEdit }) {
  const base = Number(inv.castka || inv.amount || 0)
  const sazba = Number(inv.sazba_dph ?? (profil.platceDph ? 21 : 0))
  const dphC = sazba > 0 ? Math.round(base * sazba / 100) : 0
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
            {onEdit && <button style={{ ...BG, color:'#C2410C', borderColor:'#FED7AA' }} onClick={onEdit}>✎ Upravit</button>}
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
                ['Dodavatel', [profil.jmeno, profil.ulice, [profil.psc, profil.mesto].filter(Boolean).join(' '), profil.ico && `IČO: ${profil.ico}`, profil.platceDph && profil.dic && `DIČ: ${profil.dic}`, profil.platceDph ? 'Plátce DPH' : 'Neplátce DPH'].filter(Boolean)],
                ['Odběratel', [inv.zakaznik || inv.customer, inv.zakaznikAdresa, [inv.zakaznikPsc, inv.zakaznikMesto].filter(Boolean).join(' '), inv.zakaznikIco && `IČO: ${inv.zakaznikIco}`, inv.zakaznikEmail, inv.zakaznikTel].filter(Boolean)],
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
                  {['Popis', 'Ks', sazba>0?'Základ':'Cena', sazba>0&&`DPH ${sazba}%`, sazba>0&&'S DPH'].filter(Boolean).map(h=>(
                    <th key={h} style={{ padding:'8px 10px', textAlign:h==='Popis'?'left':'right', fontSize:11, fontWeight:700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom:'1px solid #E5E7EB' }}>
                  <td style={{ padding:'10px 10px', fontSize:13 }}>{inv.sluzba||inv.title}</td>
                  <td style={{ padding:'10px 10px', textAlign:'right', fontSize:13 }}>1</td>
                  <td style={{ padding:'10px 10px', textAlign:'right', fontSize:13 }}>{fKc(base)}</td>
                  {sazba>0 && <td style={{ padding:'10px 10px', textAlign:'right', fontSize:13 }}>{fKc(dphC)}</td>}
                  {sazba>0 && <td style={{ padding:'10px 10px', textAlign:'right', fontWeight:700, fontSize:13 }}>{fKc(celk)}</td>}
                </tr>
              </tbody>
            </table>

            {/* Rekapitulace */}
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
              <div style={{ minWidth:220 }}>
                {sazba > 0 ? (
                  <>
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:12, color:'#6B7280' }}><span>Základ DPH</span><span>{fKc(base)}</span></div>
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:12, color:'#6B7280' }}><span>DPH {sazba} %</span><span>{fKc(dphC)}</span></div>
                    <div style={{ height:1, background:'#E5E7EB', margin:'6px 0' }} />
                  </>
                ) : (
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:12, color:'#6B7280' }}><span>DPH</span><span>Neplátce DPH</span></div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'#EFF6FF', border:'1.5px solid #BFDBFE', borderRadius:10 }}>
                  <span style={{ fontWeight:700, color:'#1E3A5F' }}>K úhradě</span>
                  <span style={{ fontWeight:800, color:'#1D4ED8', fontSize:15 }}>{fKc(celk)}</span>
                </div>
              </div>
            </div>

            <div style={{ display:'flex', gap:10, marginBottom:10, flexWrap:'wrap' }}>
              {(inv.zpusobPlatby) && (
                <div style={{ padding:'8px 12px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:8, fontSize:12, color:'#166534' }}>
                  <strong>Způsob platby:</strong> {inv.zpusobPlatby}
                </div>
              )}
              {inv.poznamka && (
                <div style={{ padding:'8px 12px', background:'#FFFBEB', border:'1px solid #FEF08A', borderRadius:8, fontSize:12, color:'#6B7280', flex:1 }}>
                  <strong>Poznámka:</strong> {inv.poznamka}
                </div>
              )}
            </div>
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
function NovaFaktura({ profil, pocet, editing, onSave, onClose, zakaznici = [] }) {
  const isEdit = !!editing
  const defaultSazba = profil.platceDph ? 21 : 0
  const [f, setF] = useState(editing ? {
    sluzba: editing.sluzba || editing.title || '',
    castka: editing.castka || editing.amount || '',
    zakaznik: editing.zakaznik || editing.customer || '',
    zakaznikAdresa: editing.zakaznikAdresa || '',
    zakaznikMesto: editing.zakaznikMesto || '',
    zakaznikPsc: editing.zakaznikPsc || '',
    zakaznikIco: editing.zakaznikIco || '',
    zakaznikEmail: editing.zakaznikEmail || '',
    zakaznikTel: editing.zakaznikTel || '',
    datumVystaveni: editing.datumVystaveni || dnes(),
    splatnost: editing.splatnost || editing.due || plusDni(14),
    zpusobPlatby: editing.zpusobPlatby || 'převodem',
    sazba_dph: editing.sazba_dph ?? defaultSazba,
    poznamka: editing.poznamka || '',
  } : { sluzba:'', castka:'', zakaznik:'', zakaznikAdresa:'', zakaznikMesto:'', zakaznikPsc:'', zakaznikIco:'', zakaznikEmail:'', zakaznikTel:'', datumVystaveni:dnes(), splatnost:plusDni(14), zpusobPlatby:'převodem', sazba_dph: defaultSazba, poznamka:'' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)
  const [acOpen, setAcOpen] = useState(false)
  const [zakázkyOpen, setZakázkyOpen] = useState(false)
  const [zakázky, setZakázky] = useState(null)
  const u = (k,v) => setF(p=>({...p,[k]:v}))
  const ok = f.sluzba && f.castka && f.zakaznik

  const nacistZakazky = async () => {
    if (zakázky) { setZakázkyOpen(v => !v); return }
    try {
      const res = await fetch('/api/offers?accepted=1', { credentials: 'include' })
      const data = await res.json()
      setZakázky(data.offers || [])
      setZakázkyOpen(true)
    } catch { setZakázky([]) }
  }

  const vyplnitZeZakazky = (z) => {
    setF(p => ({
      ...p,
      sluzba: z.order_title || p.sluzba,
      zakaznik: z.customer_name || p.zakaznik,
      zakaznikEmail: z.customer_email || p.zakaznikEmail,
      zakaznikTel: z.customer_phone || p.zakaznikTel,
      zakaznikMesto: z.order_city || p.zakaznikMesto,
      zakaznikAdresa: z.order_address || p.zakaznikAdresa,
    }))
    setZakázkyOpen(false)
  }

  const acMatches = f.zakaznik.length >= 1
    ? zakaznici.filter(z => z.jmeno.toLowerCase().includes(f.zakaznik.toLowerCase()))
    : []

  const vyberZakaznika = (z) => {
    setF(p => ({ ...p, zakaznik: z.jmeno, zakaznikAdresa: z.adresa||'', zakaznikMesto: z.mesto||'', zakaznikPsc: z.psc||'', zakaznikIco: z.ico||'', zakaznikEmail: z.email||'', zakaznikTel: z.tel||'' }))
    setAcOpen(false)
  }

  const submit = async () => {
    if (!ok || saving) return
    setSaving(true); setErr(null)
    try {
      if (isEdit) {
        await onSave({ id: editing.id, ...f, castka: Number(f.castka) })
      } else {
        await onSave({ id: noveCislo(pocet), ...f, castka: Number(f.castka), splatnost: plusDni(14), status: 'draft' })
      }
    } catch (e) {
      setErr(e.message || 'Něco se pokazilo.')
    } finally {
      setSaving(false)
    }
  }

  const datToInput = (s) => { const m = String(s||'').match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/); return m ? `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}` : '' }
  const inputToDat = (s) => { const [y,m,d] = (s||'').split('-'); return d ? `${d}.${m}.${y}` : '' }

  return (
    <div style={OV} onClick={onClose}>
      <div style={{ ...MOD, maxWidth:520 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid #E5E7EB' }}>
          <div style={{ fontWeight:700, fontSize:16, color:'#1A1F2E' }}>{isEdit ? `Upravit ${editing.id}` : 'Nová faktura'}</div>
          <button style={BC} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:13 }}>
          <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:9, padding:'9px 13px', fontSize:13, color:'#1D4ED8' }}>
            Fakturant: <strong>{profil.jmeno}</strong> · IČO {profil.ico}{profil.platceDph?' · Plátce DPH':' · Neplátce DPH'}
          </div>

          {/* Předvyplnit ze zakázky */}
          {!isEdit && (
            <div style={{ position:'relative' }}>
              <button type="button" style={{ ...BG, width:'100%', justifyContent:'center', gap:8 }} onClick={nacistZakazky}>
                📋 Vyplnit ze zakázky {zakázkyOpen ? '▲' : '▼'}
              </button>
              {zakázkyOpen && (
                <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,.12)', zIndex:20, maxHeight:240, overflowY:'auto' }}>
                  {zakázky === null && <div style={{ padding:16, textAlign:'center', color:'#9CA3AF', fontSize:13 }}>Načítám…</div>}
                  {zakázky?.length === 0 && <div style={{ padding:16, textAlign:'center', color:'#9CA3AF', fontSize:13 }}>Žádné přijaté zakázky</div>}
                  {zakázky?.map(z => (
                    <div key={z.id} onMouseDown={()=>vyplnitZeZakazky(z)}
                      style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid #F3F4F6' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#F9FAFB'}
                      onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                      <div style={{ fontWeight:600, fontSize:13 }}>{z.order_title}</div>
                      <div style={{ fontSize:12, color:'#6B7280' }}>{z.customer_name} · {z.order_city}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div><label style={LB}>Popis služby *</label><input style={IN} value={f.sluzba} onChange={e=>u('sluzba',e.target.value)} placeholder="Montáž nábytku, úklid bytu…" autoFocus /></div>

          {/* DPH */}
          <div>
            <label style={LB}>Sazba DPH</label>
            {!profil.platceDph ? (
              <div style={{ padding:'9px 13px', background:'#F9FAFB', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, color:'#6B7280' }}>
                Bez DPH — nejste plátce DPH
              </div>
            ) : (
              <div style={{ display:'flex', gap:8 }}>
                {[[12,'12 %'],[21,'21 %']].map(([v,l]) => (
                  <label key={v} style={{ flex:1, display:'flex', alignItems:'center', gap:6, padding:'10px 14px', borderRadius:8, border:`1.5px solid ${f.sazba_dph===v?'#F07800':'#E5E7EB'}`, background:f.sazba_dph===v?'#FFF7ED':'#fff', cursor:'pointer', transition:'all .12s' }}>
                    <input type="radio" name="sazba_dph" value={v} checked={f.sazba_dph===v} onChange={()=>u('sazba_dph',v)} style={{ accentColor:'#F07800' }} />
                    <span style={{ fontSize:13, fontWeight:f.sazba_dph===v?700:500 }}>{l}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Částka */}
          <div>
            <label style={LB}>Částka {f.sazba_dph>0?'(bez DPH) *':'*'}</label>
            <div style={{ position:'relative' }}>
              <input style={{ ...IN, paddingRight:42 }} type="number" value={f.castka} onChange={e=>u('castka',e.target.value)} placeholder="1500" />
              <span style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF', fontSize:13 }}>Kč</span>
            </div>
            {f.castka && f.sazba_dph > 0 && (
              <div style={{ fontSize:12, color:'#6B7280', marginTop:4 }}>
                DPH {f.sazba_dph} %: {fKc(Math.round(Number(f.castka)*f.sazba_dph/100))} · Celkem: <strong>{fKc(Math.round(Number(f.castka)*(1+f.sazba_dph/100)))}</strong>
              </div>
            )}
          </div>

          {/* Způsob platby */}
          <div>
            <label style={LB}>Způsob platby</label>
            <div style={{ display:'flex', gap:8 }}>
              {['převodem','hotově'].map(v => (
                <label key={v} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:`1.5px solid ${f.zpusobPlatby===v?'#F07800':'#E5E7EB'}`, background:f.zpusobPlatby===v?'#FFF7ED':'#fff', cursor:'pointer', fontSize:13, fontWeight:f.zpusobPlatby===v?600:400, transition:'all .12s' }}>
                  <input type="radio" name="zpusobPlatby" value={v} checked={f.zpusobPlatby===v} onChange={()=>u('zpusobPlatby',v)} style={{ accentColor:'#F07800' }} />
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Zákazník s autocomplete */}
          <div style={{ position:'relative' }}>
            <label style={LB}>Zákazník *</label>
            <input style={IN} value={f.zakaznik}
              onChange={e=>{ u('zakaznik',e.target.value); setAcOpen(true) }}
              onFocus={()=>setAcOpen(true)}
              onBlur={()=>setTimeout(()=>setAcOpen(false),150)}
              placeholder="Jana Nováková" />
            {acOpen && acMatches.length > 0 && (
              <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:10, boxShadow:'0 4px 16px rgba(0,0,0,.1)', zIndex:10, maxHeight:180, overflowY:'auto', marginTop:2 }}>
                {acMatches.map(z => (
                  <div key={z.jmeno} onMouseDown={()=>vyberZakaznika(z)} style={{ padding:'9px 13px', cursor:'pointer', fontSize:13, borderBottom:'1px solid #F3F4F6' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#F9FAFB'}
                    onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                    <div style={{ fontWeight:600 }}>{z.jmeno}</div>
                    {(z.adresa||z.mesto) && <div style={{ fontSize:11, color:'#9CA3AF' }}>{[z.adresa, z.mesto].filter(Boolean).join(', ')}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Adresa zákazníka */}
          <div><label style={LB}>Ulice a číslo popisné</label><input style={IN} value={f.zakaznikAdresa} onChange={e=>u('zakaznikAdresa',e.target.value)} placeholder="Hlavní 123/4" /></div>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:8 }}>
            <div><label style={LB}>Město</label><input style={IN} value={f.zakaznikMesto} onChange={e=>u('zakaznikMesto',e.target.value)} placeholder="Praha" /></div>
            <div><label style={LB}>PSČ</label><input style={IN} value={f.zakaznikPsc} onChange={e=>u('zakaznikPsc',e.target.value)} placeholder="19000" /></div>
            <div><label style={LB}>IČO</label><input style={IN} value={f.zakaznikIco} onChange={e=>u('zakaznikIco',e.target.value)} placeholder="volitelné" /></div>
          </div>

          {/* Email + tel */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><label style={LB}>E-mail zákazníka</label><input style={IN} type="email" value={f.zakaznikEmail||''} onChange={e=>u('zakaznikEmail',e.target.value)} placeholder="jana@email.cz" /></div>
            <div><label style={LB}>Telefon zákazníka</label><input style={IN} type="tel" value={f.zakaznikTel||''} onChange={e=>u('zakaznikTel',e.target.value)} placeholder="+420 xxx xxx xxx" /></div>
          </div>

          {/* Datumy */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><label style={LB}>Datum vystavení</label><input style={IN} type="date" value={datToInput(f.datumVystaveni)} onChange={e=>u('datumVystaveni', inputToDat(e.target.value))} /></div>
            <div><label style={LB}>Datum splatnosti</label><input style={IN} type="date" value={datToInput(f.splatnost)} onChange={e=>u('splatnost', inputToDat(e.target.value))} /></div>
          </div>

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
          <div><label style={LB}>Jméno / název firmy *</label><input style={IN} value={f.jmeno} onChange={e=>u('jmeno',e.target.value)} placeholder="Jana Nováková" /></div>
          <div><label style={LB}>Ulice a číslo popisné</label><input style={IN} value={f.ulice||''} onChange={e=>u('ulice',e.target.value)} placeholder="Hlavní 123/4" /></div>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:10 }}>
            <div><label style={LB}>Město</label><input style={IN} value={f.mesto||''} onChange={e=>u('mesto',e.target.value)} placeholder="Praha" /></div>
            <div><label style={LB}>PSČ</label><input style={IN} value={f.psc||''} onChange={e=>u('psc',e.target.value)} placeholder="19000" maxLength={6} /></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={LB}>IČO *</label>
              <input style={IN} value={f.ico} onChange={e=>u('ico', e.target.value.replace(/\D/g,'').slice(0,8))} placeholder="12345678" inputMode="numeric" />
            </div>
            <div>
              <label style={LB}>DIČ {f.platceDph ? '*' : '(jen pro plátce DPH)'}</label>
              <input style={{ ...IN, background: f.platceDph ? '#fff' : '#F9FAFB', color: f.platceDph ? '#1A1F2E' : '#9CA3AF' }}
                value={f.dic} onChange={e=>{ if (!f.platceDph) return; u('dic', e.target.value.toUpperCase()) }}
                placeholder={f.platceDph ? 'CZ12345678' : '—'}
                disabled={!f.platceDph} />
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'#F9FAFB', borderRadius:10, border:'1px solid #E5E7EB', cursor:'pointer' }} onClick={()=>u('platceDph',!f.platceDph)}>
            <div style={{ width:20, height:20, borderRadius:4, border:`2px solid ${f.platceDph?'#F07800':'#D1D5DB'}`, background:f.platceDph?'#F07800':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .14s' }}>
              {f.platceDph && <span style={{ color:'#fff', fontSize:11, fontWeight:800 }}>✓</span>}
            </div>
            <div style={{ fontWeight:600, fontSize:14 }}>Jsem plátce DPH</div>
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
        poznamka: '', zakaznikAdresa: '', zakaznikMesto: '', zakaznikPsc: '', zakaznikIco: '',
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
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('faktury')

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

  // Unikátní zákazníci z faktur (pro autocomplete + seznam)
  const zakaznici = Object.values(
    invoices.reduce((acc, inv) => {
      const jmeno = inv.zakaznik || inv.customer
      if (!jmeno) return acc
      if (!acc[jmeno]) acc[jmeno] = { jmeno, adresa: inv.zakaznikAdresa||'', mesto: inv.zakaznikMesto||'', psc: inv.zakaznikPsc||'', ico: inv.zakaznikIco||'', email: inv.zakaznikEmail||'', tel: inv.zakaznikTel||'', pocetFaktur:0, celkem:0 }
      acc[jmeno].pocetFaktur++
      acc[jmeno].celkem += (inv.castka || inv.amount || 0)
      return acc
    }, {})
  ).sort((a,b) => a.jmeno.localeCompare(b.jmeno, 'cs'))

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

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:20, borderBottom:'2px solid #E5E7EB' }}>
        {[['faktury','Faktury'],['zakaznici','Zákazníci']].map(([k,l]) => (
          <button key={k} onClick={()=>setView(k)} style={{ padding:'8px 20px', border:'none', borderBottom:`2.5px solid ${view===k?'#F07800':'transparent'}`, background:'transparent', color:view===k?'#F07800':'#6B7280', fontWeight:view===k?700:500, fontSize:14, cursor:'pointer', fontFamily:'inherit', marginBottom:-2, transition:'all .12s' }}>{l}</button>
        ))}
      </div>

      {view === 'faktury' && <>
      {/* Filtry */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {[['all','Vše'],['unpaid','Nezaplacené'],['paid','Zaplacené']].map(([k,l]) => (
          <button key={k} onClick={()=>setFilter(k)} style={{ height:34, padding:'0 14px', borderRadius:8, border:`1.5px solid ${filter===k?'#F07800':'#E5E7EB'}`, background:filter===k?'#FFF7ED':'#fff', color:filter===k?'#F07800':'#6B7280', fontWeight:filter===k?700:500, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all .12s' }}>{l}</button>
        ))}
      </div>

      {/* Tabulka */}
      <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#F9FAFB', borderBottom:'1px solid #E5E7EB' }}>
              <th style={TH}>Vystavena</th>
              <th style={TH}>Číslo faktury</th>
              <th style={TH}>Stav</th>
              <th style={TH}>Zákazník</th>
              <th style={{ ...TH, textAlign:'right' }}>Částka</th>
              <th style={{ ...TH, textAlign:'right' }}>Akce</th>
            </tr>
          </thead>
          <tbody>
            {invoices.filter(inv => {
              if (filter === 'paid') return inv.status === 'paid'
              if (filter === 'unpaid') return inv.status !== 'paid'
              return true
            }).map((inv, idx, arr) => {
              const base = inv.castka || inv.amount || 0
              const celk = profil.platceDph ? Math.round(base*1.21) : base
              const stav = effectivniStav(inv)
              const st = STATUS_STYLE[stav]
              return (
                <tr key={inv.id} style={{ borderBottom: idx < arr.length-1 ? '1px solid #F3F4F6' : 'none', background: stav==='late' ? '#FFF5F5' : '#fff' }}>
                  <td style={TD}><span style={{ fontSize:13, color:'#6B7280' }}>{inv.datumVystaveni||inv.created||'—'}</span></td>
                  <td style={TD}><span style={{ fontSize:13, fontWeight:600, color:'#1D4ED8' }}>{inv.id}</span></td>
                  <td style={TD}>
                    <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center' }}>
                      <span style={{ fontSize:12, fontWeight:700, color:st.color, background:st.bg, border:`1px solid ${st.border}`, borderRadius:6, padding:'2px 8px', whiteSpace:'nowrap' }}>{st.label}</span>
                      {stav==='paid' && inv.splatnost && <span style={{ fontSize:10, color:'#9CA3AF', marginTop:1 }}>{inv.splatnost}</span>}
                      {stav==='late' && inv.splatnost && <span style={{ fontSize:10, color:'#DC2626', marginTop:1, textDecoration:'underline dotted' }}>{inv.splatnost}</span>}
                    </div>
                  </td>
                  <td style={TD}><span style={{ fontSize:13, color:'#1A1F2E' }}>{inv.zakaznik||inv.customer||'—'}</span></td>
                  <td style={{ ...TD, textAlign:'right' }}>
                    <span style={{ fontSize:14, fontWeight:700, color:stav==='paid'?'#16A34A':'#1A1F2E' }}>{fKc(celk)}</span>
                    {profil.platceDph && <div style={{ fontSize:11, color:'#9CA3AF' }}>základ {fKc(base)}</div>}
                  </td>
                  <td style={{ ...TD, textAlign:'right' }}>
                    <div style={{ display:'flex', gap:5, justifyContent:'flex-end', flexWrap:'wrap' }}>
                      <button title="Náhled / PDF" style={BI} onClick={()=>setNahled(inv)}>👁</button>
                      {inv.status==='draft' && <button title="Upravit" style={BI} onClick={()=>setEditing(inv)}>✎</button>}
                      {inv.status!=='paid' && <button title="Označit jako zaplaceno" style={{ ...BI, background: stav==='late'?'#FEF2F2':'#F0FDF4', color: stav==='late'?'#DC2626':'#16A34A', border: `1px solid ${stav==='late'?'#FECACA':'#BBF7D0'}`, fontWeight:700 }} onClick={()=>changeStatus(inv.id,'paid')}>✓ Zaplaceno</button>}
                      {inv.status==='paid' && <button title="Označit jako nezaplaceno" style={{ ...BI, background:'#FFF7ED', color:'#D97706', border:'1px solid #FDE68A' }} onClick={()=>changeStatus(inv.id,'sent')}>↩ Vrátit</button>}
                      {inv.status==='draft' && <button title="Smazat" style={{ ...BI, background:'#FEF2F2', color:'#B91C1C', border:'1px solid #FECACA' }} onClick={()=>deleteInvoice(inv.id)}>🗑</button>}
                    </div>
                  </td>
                </tr>
              )
            })}
            {invoices.filter(inv => filter==='paid'?inv.status==='paid':filter==='unpaid'?inv.status!=='paid':true).length === 0 && (
              <tr><td colSpan={6} style={{ padding:'32px', textAlign:'center', color:'#9CA3AF', fontSize:13 }}>Žádné faktury</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </>}

      {view === 'zakaznici' && (
        <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#F9FAFB', borderBottom:'1px solid #E5E7EB' }}>
                <th style={TH}>Zákazník</th>
                <th style={TH}>Adresa</th>
                <th style={TH}>IČO</th>
                <th style={{ ...TH, textAlign:'right' }}>Faktur</th>
                <th style={{ ...TH, textAlign:'right' }}>Celkem</th>
                <th style={{ ...TH, textAlign:'right' }}>Akce</th>
              </tr>
            </thead>
            <tbody>
              {zakaznici.length === 0 && (
                <tr><td colSpan={6} style={{ padding:'32px', textAlign:'center', color:'#9CA3AF', fontSize:13 }}>Zatím žádní zákazníci</td></tr>
              )}
              {zakaznici.map((z, idx, arr) => (
                <tr key={z.jmeno} style={{ borderBottom: idx < arr.length-1 ? '1px solid #F3F4F6' : 'none' }}>
                  <td style={TD}><span style={{ fontWeight:600, fontSize:13 }}>{z.jmeno}</span></td>
                  <td style={TD}><span style={{ fontSize:12, color:'#6B7280' }}>{[z.adresa, z.psc, z.mesto].filter(Boolean).join(', ') || '—'}</span></td>
                  <td style={TD}><span style={{ fontSize:12, color:'#6B7280' }}>{z.ico || '—'}</span></td>
                  <td style={{ ...TD, textAlign:'right' }}><span style={{ fontSize:13 }}>{z.pocetFaktur}</span></td>
                  <td style={{ ...TD, textAlign:'right' }}><span style={{ fontSize:13, fontWeight:600 }}>{fKc(z.celkem)}</span></td>
                  <td style={{ ...TD, textAlign:'right' }}>
                    <button style={BI} onClick={()=>{ setShowNova(true); }}>+ Faktura</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNova && <NovaFaktura profil={profil} pocet={invoices.length} zakaznici={zakaznici} onSave={saveInvoice} onClose={()=>setShowNova(false)} />}
      {editing && <NovaFaktura profil={profil} editing={editing} zakaznici={zakaznici} onSave={editInvoice} onClose={()=>setEditing(null)} />}
      {showProfil && <ProfilModal profil={profil} onSave={setProfil} onClose={()=>setShowProfil(false)} />}
      {nahled && <FakturaView inv={nahled} profil={profil} onClose={()=>setNahled(null)} onEdit={nahled.status==='draft' ? ()=>{ setEditing(nahled); setNahled(null) } : undefined} />}
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
const TH = { padding:'10px 14px', fontSize:11, fontWeight:700, color:'#6B7280', textAlign:'left', textTransform:'uppercase', letterSpacing:'.05em', whiteSpace:'nowrap' }
const TD = { padding:'12px 14px', verticalAlign:'middle' }
const BI = { display:'inline-flex', alignItems:'center', gap:4, height:28, padding:'0 9px', borderRadius:7, border:'1px solid #E5E7EB', background:'#F9FAFB', color:'#4B5563', fontWeight:500, fontSize:12, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }

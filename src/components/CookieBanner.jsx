import { useState } from 'react'

const KEY = 'sikuladoma_cookies'

function hasConsent() {
  try { return !!localStorage.getItem(KEY) } catch { return false }
}

function saveConsent(analytics) {
  try { localStorage.setItem(KEY, JSON.stringify({ analytics, date: new Date().toISOString() })) } catch {}
}

export default function CookieBanner({ onCookiesPage }) {
  const [visible, setVisible] = useState(!hasConsent())
  const [detail, setDetail] = useState(false)

  if (!visible) return null

  const accept = (analytics) => { saveConsent(analytics); setVisible(false) }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      zIndex: 99999,
      background: '#EFF6FF',
      borderTop: '2px solid #BFDBFE',
      boxShadow: '0 -4px 24px rgba(0,102,204,.12)',
      padding: '16px 20px',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>

        {!detail ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1E3A5F', marginBottom: 3 }}>Používáme cookies</div>
              <p style={{ fontSize: 13, color: '#4B6A8F', lineHeight: 1.55, margin: 0 }}>
                Používáme nezbytné cookies pro správné fungování webu a analytické cookies pro zlepšení služeb.{' '}
                {onCookiesPage && <span onClick={onCookiesPage} style={{ color: '#0066CC', cursor: 'pointer', textDecoration: 'underline' }}>Více informací</span>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
              <button onClick={() => setDetail(true)} style={sGhost}>Nastavení</button>
              <button onClick={() => accept(false)} style={sOutline}>Pouze nezbytné</button>
              <button onClick={() => accept(true)} style={sPrimary}>Přijmout vše</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1E3A5F' }}>Nastavení cookies</div>
              <button onClick={() => setDetail(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94A3B8', padding: '0 4px' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {[
                { title: 'Nezbytné cookies', desc: 'Nutné pro fungování webu. Nelze vypnout.', badge: 'Vždy aktivní', badgeColor: '#16A34A', badgeBg: '#DCFCE7' },
                { title: 'Analytické cookies', desc: 'Pomáhají nám zlepšovat služby a sledovat výkon webu.', badge: 'Volitelné', badgeColor: '#6B7280', badgeBg: '#F3F4F6' },
              ].map(c => (
                <div key={c.title} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#fff', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1E3A5F', marginBottom: 2 }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: '#6B8AAF', lineHeight: 1.5 }}>{c.desc}</div>
                  </div>
                  <span style={{ flexShrink: 0, marginLeft: 12, marginTop: 2, fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: c.badgeBg, color: c.badgeColor }}>{c.badge}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button onClick={() => accept(false)} style={sOutline}>Uložit – pouze nezbytné</button>
              <button onClick={() => accept(true)} style={sPrimary}>Přijmout vše</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const sPrimary = { display:'inline-flex', alignItems:'center', justifyContent:'center', height:38, padding:'0 20px', borderRadius:10, border:'none', background:'#F97316', color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(249,115,22,.3)' }
const sOutline = { display:'inline-flex', alignItems:'center', justifyContent:'center', height:38, padding:'0 20px', borderRadius:10, border:'1.5px solid #BFDBFE', background:'#fff', color:'#0066CC', fontWeight:500, fontSize:13, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }
const sGhost  = { display:'inline-flex', alignItems:'center', justifyContent:'center', height:38, padding:'0 14px', borderRadius:10, border:'none', background:'transparent', color:'#6B8AAF', fontWeight:500, fontSize:13, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }

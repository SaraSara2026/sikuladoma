import { useState } from 'react'

// ŠikulaDoma aktuálně používá jen technická cookies/úložiště (přihlášení,
// zapamatování volby) — ty souhlas nevyžadují, jen o nich informujeme.
// Proto lišta nenabízí volbu "analytické cookies", která by naznačovala
// sledování, jež ve skutečnosti neexistuje. Až přibude analytika nebo
// marketing, bude potřeba tuhle lištu vrátit na plnou volbu se souhlasem.
const KEY = 'sikuladoma_cookies_ack'

function hasAck() {
  try { return !!localStorage.getItem(KEY) } catch { return false }
}

function saveAck() {
  try { localStorage.setItem(KEY, new Date().toISOString()) } catch {}
}

export default function CookieBanner({ onCookiesPage }) {
  const [visible, setVisible] = useState(!hasAck())

  if (!visible) return null

  const dismiss = () => { saveAck(); setVisible(false) }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      zIndex: 99999,
      background: '#EFF6FF',
      borderTop: '2px solid #BFDBFE',
      boxShadow: '0 -4px 24px rgba(0,102,204,.12)',
      padding: '16px 20px',
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ maxWidth: 1060, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1E3A5F', marginBottom: 3 }}>Používáme jen technické cookies</div>
          <p style={{ fontSize: 13, color: '#4B6A8F', lineHeight: 1.55, margin: 0 }}>
            Jsou nezbytné pro přihlášení a fungování webu. Analytické ani marketingové cookies nepoužíváme.{' '}
            {onCookiesPage && <span onClick={onCookiesPage} style={{ color: '#0066CC', cursor: 'pointer', textDecoration: 'underline' }}>Více informací</span>}
          </p>
        </div>
        <button onClick={dismiss} style={sPrimary}>Rozumím</button>
      </div>
    </div>
  )
}

const sPrimary = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 38, padding: '0 20px', borderRadius: 10, border: 'none', background: '#F97316', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(249,115,22,.3)', flexShrink: 0 }

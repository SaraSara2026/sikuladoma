import { useState } from 'react'
import Icon from './Icon'

// Spodní navigace dashboardu pro mobil — nahrazuje vodorovně scrollovací
// pruh (.dash-sidebar v row layoutu), kde s 8–13 položkami šlo najednou
// vidět jen jednu a nebylo poznat, že se dá vůbec scrollovat.
//
// `items`: pole { id, icon, label, locked?, badge? }
// `primaryIds`: id položek, které jdou přímo do spodní lišty (zbytek do "Více")
export default function DashBottomNav({ items, primaryIds, activeId, onSelect, onLogout }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const primary = primaryIds.map(id => items.find(i => i.id === id)).filter(Boolean)
  const rest = items.filter(i => !primaryIds.includes(i.id))
  const moreActive = rest.some(i => i.id === activeId)

  const select = id => { onSelect(id); setMoreOpen(false) }

  return (
    <>
      <nav className="dash-bottom-nav">
        {primary.map(item => (
          <button key={item.id}
            className={`dash-bottom-item ${activeId === item.id ? 'active' : ''}`}
            onClick={() => select(item.id)}>
            <span className="dash-bottom-icon">
              <Icon name={item.icon} size={19} />
              {item.locked && <span className="dash-bottom-lock"><Icon name="lock" size={9} /></span>}
              {!item.locked && item.badge > 0 && <span className="dash-bottom-badge">{item.badge > 9 ? '9+' : item.badge}</span>}
            </span>
            <span className="dash-bottom-label">{item.label}</span>
          </button>
        ))}
        <button
          className={`dash-bottom-item ${moreOpen || moreActive ? 'active' : ''}`}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(o => !o)}>
          <span className="dash-bottom-icon"><Icon name="dots" size={19} /></span>
          <span className="dash-bottom-label">Více</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="dash-more-backdrop" onClick={() => setMoreOpen(false)}>
          <div className="dash-more-sheet" onClick={e => e.stopPropagation()}>
            <div className="dash-more-handle" />
            {rest.map(item => (
              <button key={item.id}
                className={`dash-more-item ${activeId === item.id ? 'active' : ''}`}
                onClick={() => select(item.id)}>
                <span className="dash-more-icon"><Icon name={item.icon} size={18} /></span>
                <span className="dash-more-label">{item.label}</span>
                {item.locked && <span className="dash-more-lock"><Icon name="lock" size={12} /></span>}
                {!item.locked && item.badge > 0 && <span className="dash-more-badge">{item.badge}</span>}
              </button>
            ))}
            {onLogout && (
              <button className="dash-more-item dash-more-logout" onClick={() => { setMoreOpen(false); onLogout() }}>
                <span className="dash-more-icon"><Icon name="logout" size={18} /></span>
                <span className="dash-more-label">Odhlásit</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

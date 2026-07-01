import { useState } from 'react'

export default function Header({ T, BtnPrimary, onHome, onScrollTo, onOrder, onLogin, onDashboard, onProfil, onLogout, onSikuly, sikulaUser }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,.94)", backdropFilter: "blur(20px) saturate(180%)", borderBottom: `1px solid ${T.border}`, height: 64, display: "flex", alignItems: "center" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>

        {/* Left: Logo + odkazy */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-.03em", cursor: "pointer", flexShrink: 0 }} onClick={onHome}>
            <span style={{ color: T.blue }}>Šikula</span><span style={{ color: T.orange }}>Doma</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <button className="nav-link" onClick={() => onScrollTo("how")}>Jak to funguje</button>
            <button className="nav-link" onClick={() => onScrollTo("services")}>Služby</button>
            {onSikuly && <button className="nav-link" onClick={onSikuly}>Pro šikuly</button>}
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
          {sikulaUser ? (
            <div style={{ position: "relative" }}>
              {/* Avatar button */}
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: `1.5px solid ${menuOpen ? T.orange : T.border}`, borderRadius: 10, cursor: "pointer", padding: "5px 12px 5px 6px", fontFamily: "inherit", transition: "all .14s" }}
              >
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#F97316,#EA580C)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                  {(sikulaUser.name || "Š")[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.ink, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {sikulaUser.name?.split(" ")[0] || "Šikula"}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.ink3} strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>

              {menuOpen && (
                <>
                  {/* Backdrop – nižší z-index než dropdown */}
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 200 }}
                    onClick={() => setMenuOpen(false)}
                  />
                  {/* Dropdown – vyšší z-index */}
                  <div
                    style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 210, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,.14)", zIndex: 300, overflow: "hidden" }}
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Hlavička */}
                    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{sikulaUser.name}</div>
                      <div style={{ fontSize: 11, color: T.ink4, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sikulaUser.email}</div>
                    </div>

                    {/* Položky */}
                    <button
                      onClick={() => { setMenuOpen(false); onDashboard?.(); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: T.ink, fontFamily: "inherit", textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <span style={{ fontSize: 16 }}>⊞</span> Dashboard
                    </button>

                    <button
                      onClick={() => { setMenuOpen(false); onProfil?.(); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: T.ink, fontFamily: "inherit", textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <span style={{ fontSize: 16 }}>👤</span> Profil
                    </button>

                    <div style={{ borderTop: `1px solid ${T.border}` }}>
                      <button
                        onClick={() => { setMenuOpen(false); onLogout?.(); }}
                        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#EF4444", fontFamily: "inherit", textAlign: "left" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                      >
                        <span style={{ fontSize: 16 }}>→</span> Odhlásit se
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onLogin}
              style={{ background: T.orange, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#fff", padding: "9px 22px", transition: "all .14s", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(249,115,22,.3)" }}
              onMouseEnter={e => { e.currentTarget.style.background = T.orangeDk || "#EA580C"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(249,115,22,.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.orange; e.currentTarget.style.boxShadow = "0 2px 8px rgba(249,115,22,.3)"; }}
            >
              Přihlášení
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

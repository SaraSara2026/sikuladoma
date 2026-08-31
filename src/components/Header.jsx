import { useState, useEffect } from 'react'

export default function Header({ T, BtnPrimary, onHome, onScrollTo, onOrder, onLogin, onDashboard, onProfil, onLogout, onSikuly, sikulaUser }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Zavřít mobilní panel při přechodu na širší obrazovku (např. otočení
  // tabletu na šířku), ať nezůstane "zaseknutý" otevřený nad desktop layoutem.
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Zavření klávesou Esc (mobilní panel i účtové menu).
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') { setMobileOpen(false); setMenuOpen(false) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = fn => { setMobileOpen(false); fn && fn() }

  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,.94)", backdropFilter: "blur(20px) saturate(180%)", borderBottom: `1px solid ${T.border}`, minHeight: 64, display: "flex", alignItems: "center" }}>
      <style>{`
        .hdr-links{display:flex;align-items:center;gap:2px;}
        .hdr-burger{display:none;}
        .hdr-mobile-panel{display:none;}
        @media (max-width: 767px){
          .hdr-links{display:none;}
          .hdr-burger{display:inline-flex;}
          .hdr-mobile-panel.open{display:block;}
        }
      `}</style>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", minHeight: 64 }}>

        {/* Left: Logo + odkazy (desktop) */}
        <div style={{ display: "flex", alignItems: "center", gap: 32, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-.03em", cursor: "pointer", flexShrink: 0 }} onClick={onHome}>
            <span style={{ color: T.blue }}>Šikula</span><span style={{ color: T.orange }}>Doma</span>
          </div>
          <div className="hdr-links">
            <button className="nav-link" onClick={() => onScrollTo("how")}>Jak to funguje</button>
            <button className="nav-link" onClick={() => onScrollTo("services")}>Služby</button>
            {onSikuly && <button className="nav-link" onClick={onSikuly}>Pro šikuly</button>}
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative", flexShrink: 0 }}>
          {sikulaUser ? (
            <div style={{ position: "relative" }}>
              {/* Avatar button */}
              <button
                onClick={() => setMenuOpen(o => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: `1.5px solid ${menuOpen ? T.orange : T.border}`, borderRadius: 10, cursor: "pointer", padding: "5px 12px 5px 6px", fontFamily: "inherit", transition: "all .14s" }}
              >
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#F97316,#EA580C)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
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
                    style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 210, maxWidth: "calc(100vw - 32px)", background: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,.14)", zIndex: 300, overflow: "hidden" }}
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
              style={{ background: T.orange, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#fff", padding: "9px 16px", transition: "all .14s", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(249,115,22,.3)", whiteSpace: "nowrap" }}
              onMouseEnter={e => { e.currentTarget.style.background = T.orangeDk || "#EA580C"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(249,115,22,.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.orange; e.currentTarget.style.boxShadow = "0 2px 8px rgba(249,115,22,.3)"; }}
            >
              Přihlášení
            </button>
          )}

          {/* Hamburger — jen do 767px, viz .hdr-burger v <style> výše */}
          <button
            className="hdr-burger"
            onClick={() => setMobileOpen(o => !o)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Zavřít menu" : "Otevřít menu"}
            style={{ alignItems: "center", justifyContent: "center", width: 40, height: 40, background: "none", border: `1.5px solid ${T.border}`, borderRadius: 10, cursor: "pointer", flexShrink: 0, padding: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="2.3" strokeLinecap="round">
              {mobileOpen
                ? <><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></>
                : <><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></>}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobilní výsuvný panel s odkazy — jen do 767px */}
      <div className={`hdr-mobile-panel${mobileOpen ? " open" : ""}`} style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", borderBottom: `1px solid ${T.border}`, boxShadow: "0 12px 24px rgba(0,0,0,.08)" }}>
        <div style={{ padding: "8px 16px 16px", display: "flex", flexDirection: "column" }}>
          <button className="nav-link" style={{ textAlign: "left", padding: "12px 8px", fontSize: 15 }} onClick={() => go(() => onScrollTo("how"))}>Jak to funguje</button>
          <button className="nav-link" style={{ textAlign: "left", padding: "12px 8px", fontSize: 15 }} onClick={() => go(() => onScrollTo("services"))}>Služby</button>
          {onSikuly && <button className="nav-link" style={{ textAlign: "left", padding: "12px 8px", fontSize: 15 }} onClick={() => go(onSikuly)}>Pro šikuly</button>}
          {!sikulaUser && (
            <button className="nav-link" style={{ textAlign: "left", padding: "12px 8px", fontSize: 15 }} onClick={() => go(onLogin)}>Přihlášení</button>
          )}
          {sikulaUser && (
            <>
              <div style={{ borderTop: `1px solid ${T.border}`, margin: "6px 0" }} />
              <button className="nav-link" style={{ textAlign: "left", padding: "12px 8px", fontSize: 15 }} onClick={() => go(onDashboard)}>Dashboard</button>
              <button className="nav-link" style={{ textAlign: "left", padding: "12px 8px", fontSize: 15 }} onClick={() => go(onProfil)}>Profil</button>
              <button className="nav-link" style={{ textAlign: "left", padding: "12px 8px", fontSize: 15, color: "#EF4444" }} onClick={() => go(onLogout)}>Odhlásit se</button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

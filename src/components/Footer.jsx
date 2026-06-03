export default function Footer({ onOrder, onReg, onKontakt, onHow, onSikuly, onPodminkySikuly, onPodporaSikuly, onOchrana, onPodminkyPouziti, onGDPR, onCookies, onFAQ, onSikulove }) {
  const link = "rgba(255,255,255,.45)"
  const hover = "#fff"

  return (
    <footer style={{ background: "#0D1117", color: link, padding: "48px 24px 24px" }}>
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr", gap: 32, marginBottom: 36 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 10, letterSpacing: "-.03em" }}>
              <span style={{ color: "#60A5FA" }}>Šikula</span><span style={{ color: "#FB923C" }}>Doma</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.75, maxWidth: 240, color: "rgba(255,255,255,.4)" }}>
              Spojujeme lidi s šikulami. Montáž, opravy, úklid, čištění – cokoliv doma, v celé ČR.
            </p>
          </div>
          <div>
            <h4 style={{ color: "rgba(255,255,255,.35)", fontSize: 11, fontWeight: 700, marginBottom: 14, letterSpacing: ".08em", textTransform: "uppercase" }}>Pro zákazníky</h4>
            {[
              { label: "Zadat poptávku",  onClick: onOrder },
              { label: "Jak to funguje",  onClick: onHow },
              { label: "Najít šikulu",    onClick: onSikulove },
              { label: "Časté dotazy",    onClick: onFAQ },
              { label: "Kontakt",         onClick: onKontakt },
            ].map(({ label, onClick }) => (
              <div key={label}
                style={{ fontSize: 13, marginBottom: 9, cursor: onClick ? "pointer" : "default", transition: "color .12s", color: link }}
                onMouseEnter={e => { if (onClick) e.currentTarget.style.color = hover }}
                onMouseLeave={e => e.currentTarget.style.color = link}
                onClick={() => onClick && onClick()}
              >{label}</div>
            ))}
          </div>
          <div>
            <h4 style={{ color: "rgba(255,255,255,.35)", fontSize: 11, fontWeight: 700, marginBottom: 14, letterSpacing: ".08em", textTransform: "uppercase" }}>Pro šikuly</h4>
            {[
              { label: "Zaregistrovat se",  onClick: onReg },
              { label: "Jak to funguje",    onClick: onSikuly },
              { label: "Podmínky",          onClick: onPodminkySikuly },
              { label: "Podpora",           onClick: onPodporaSikuly },
            ].map(({ label, onClick }) => (
              <div key={label}
                style={{ fontSize: 13, marginBottom: 9, cursor: onClick ? "pointer" : "default", transition: "color .12s", color: link }}
                onMouseEnter={e => { if (onClick) e.currentTarget.style.color = hover }}
                onMouseLeave={e => e.currentTarget.style.color = link}
                onClick={() => onClick && onClick()}
              >{label}</div>
            ))}
          </div>
          <div>
            <h4 style={{ color: "rgba(255,255,255,.35)", fontSize: 11, fontWeight: 700, marginBottom: 14, letterSpacing: ".08em", textTransform: "uppercase" }}>Právní</h4>
            {[
              { label: "Ochrana soukromí", onClick: onOchrana },
              { label: "Podmínky použití", onClick: onPodminkyPouziti },
              { label: "GDPR",             onClick: onGDPR },
              { label: "Cookies",          onClick: onCookies },
            ].map(({ label, onClick }) => (
              <div key={label}
                style={{ fontSize: 13, marginBottom: 9, cursor: onClick ? "pointer" : "default", transition: "color .12s", color: link }}
                onMouseEnter={e => { if (onClick) e.currentTarget.style.color = hover }}
                onMouseLeave={e => e.currentTarget.style.color = link}
                onClick={() => onClick && onClick()}
              >{label}</div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 18, display: "flex", justifyContent: "space-between", fontSize: 12, flexWrap: "wrap", gap: 8, color: "rgba(255,255,255,.25)" }}>
          <span>© 2026 ŠikulaDoma s.r.o.</span>
          <span>Vyrobeno v Praze</span>
        </div>
      </div>
    </footer>
  )
}

export default function Footer({ onOrder, onReg, onKontakt, onHow, onSikuly, onPodminkySikuly, onPodporaSikuly, onOchrana, onPodminkyPouziti, onCookies, onFAQ, onSikulove }) {
  const link = "#334155"
  const hover = "#0B66D8"

  return (
    <footer style={{ background: "#F3F6FA", borderTop: "1px solid #CBD5E1", color: link, padding: "16px 24px 8px" }}>
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr", gap: 24, marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6, letterSpacing: "-.03em" }}>
              <span style={{ color: "#0066CC" }}>Šikula</span><span style={{ color: "#F07800" }}>Doma</span>
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.55, maxWidth: 220, color: "#475569", margin: 0 }}>
              Spojujeme lidi s šikulami. Montáž, opravy, úklid, čištění – cokoliv doma, v celé ČR.
            </p>
          </div>
          <div>
            <h4 style={{ color: "#0F172A", fontSize: 10, fontWeight: 700, marginBottom: 8, letterSpacing: ".08em", textTransform: "uppercase" }}>Pro zákazníky</h4>
            {[
              { label: "Zadat poptávku",  onClick: onOrder },
              { label: "Jak to funguje",  onClick: onHow },
              { label: "Najít šikulu",    onClick: onSikulove },
              { label: "Časté dotazy",    onClick: onFAQ },
              { label: "Kontakt",         onClick: onKontakt },
            ].map(({ label, onClick }) => (
              <div key={label}
                style={{ fontSize: 12, marginBottom: 3, cursor: onClick ? "pointer" : "default", transition: "color .12s", color: link, lineHeight: 1.5 }}
                onMouseEnter={e => { if (onClick) e.currentTarget.style.color = hover }}
                onMouseLeave={e => e.currentTarget.style.color = link}
                onClick={() => onClick && onClick()}
              >{label}</div>
            ))}
          </div>
          <div>
            <h4 style={{ color: "#0F172A", fontSize: 10, fontWeight: 700, marginBottom: 8, letterSpacing: ".08em", textTransform: "uppercase" }}>Pro šikuly</h4>
            {[
              { label: "Zaregistrovat se",  onClick: onReg },
              { label: "Jak to funguje",    onClick: onSikuly },
              { label: "Podmínky",          onClick: onPodminkySikuly },
              { label: "Podpora",           onClick: onPodporaSikuly },
            ].map(({ label, onClick }) => (
              <div key={label}
                style={{ fontSize: 12, marginBottom: 3, cursor: onClick ? "pointer" : "default", transition: "color .12s", color: link, lineHeight: 1.5 }}
                onMouseEnter={e => { if (onClick) e.currentTarget.style.color = hover }}
                onMouseLeave={e => e.currentTarget.style.color = link}
                onClick={() => onClick && onClick()}
              >{label}</div>
            ))}
          </div>
          <div>
            <h4 style={{ color: "#0F172A", fontSize: 10, fontWeight: 700, marginBottom: 8, letterSpacing: ".08em", textTransform: "uppercase" }}>Právní</h4>
            {[
              { label: "Ochrana osobních údajů", onClick: onOchrana },
              { label: "Obchodní podmínky",       onClick: onPodminkyPouziti },
              { label: "Cookies",                 onClick: onCookies },
            ].map(({ label, onClick }) => (
              <div key={label}
                style={{ fontSize: 12, marginBottom: 3, cursor: onClick ? "pointer" : "default", transition: "color .12s", color: link, lineHeight: 1.5 }}
                onMouseEnter={e => { if (onClick) e.currentTarget.style.color = hover }}
                onMouseLeave={e => e.currentTarget.style.color = link}
                onClick={() => onClick && onClick()}
              >{label}</div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: "1px solid #CBD5E1", paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 11, flexWrap: "wrap", gap: 6, color: "#64748B" }}>
          <span>© 2026 Stavira s.r.o. – provozovatel portálu ŠikulaDoma.cz</span>
          <span>Vyrobeno v Praze</span>
        </div>
      </div>
    </footer>
  )
}

export default function Footer({ onOrder, onReg, onKontakt, onHow, onSikuly, onPodminkySikuly, onPodporaSikuly, onOchrana, onPodminkyPouziti, onGDPR, onCookies, onFAQ, onSikulove }) {
  const link = "#475569"
  const hover = "#0B66D8"

  return (
    <footer style={{ background: "#F8FAFC", borderTop: "1px solid #E2E8F0", color: link, padding: "36px 24px 18px" }}>
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr", gap: 32, marginBottom: 24 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8, letterSpacing: "-.03em" }}>
              <span style={{ color: "#0066CC" }}>Šikula</span><span style={{ color: "#F07800" }}>Doma</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 240, color: "#64748B" }}>
              Spojujeme lidi s šikulami. Montáž, opravy, úklid, čištění – cokoliv doma, v celé ČR.
            </p>
          </div>
          <div>
            <h4 style={{ color: "#1E293B", fontSize: 11, fontWeight: 700, marginBottom: 12, letterSpacing: ".08em", textTransform: "uppercase" }}>Pro zákazníky</h4>
            {[
              { label: "Zadat poptávku",  onClick: onOrder },
              { label: "Jak to funguje",  onClick: onHow },
              { label: "Najít šikulu",    onClick: onSikulove },
              { label: "Časté dotazy",    onClick: onFAQ },
              { label: "Kontakt",         onClick: onKontakt },
            ].map(({ label, onClick }) => (
              <div key={label}
                style={{ fontSize: 13, marginBottom: 7, cursor: onClick ? "pointer" : "default", transition: "color .12s", color: link }}
                onMouseEnter={e => { if (onClick) e.currentTarget.style.color = hover }}
                onMouseLeave={e => e.currentTarget.style.color = link}
                onClick={() => onClick && onClick()}
              >{label}</div>
            ))}
          </div>
          <div>
            <h4 style={{ color: "#1E293B", fontSize: 11, fontWeight: 700, marginBottom: 12, letterSpacing: ".08em", textTransform: "uppercase" }}>Pro šikuly</h4>
            {[
              { label: "Zaregistrovat se",  onClick: onReg },
              { label: "Jak to funguje",    onClick: onSikuly },
              { label: "Podmínky",          onClick: onPodminkySikuly },
              { label: "Podpora",           onClick: onPodporaSikuly },
            ].map(({ label, onClick }) => (
              <div key={label}
                style={{ fontSize: 13, marginBottom: 7, cursor: onClick ? "pointer" : "default", transition: "color .12s", color: link }}
                onMouseEnter={e => { if (onClick) e.currentTarget.style.color = hover }}
                onMouseLeave={e => e.currentTarget.style.color = link}
                onClick={() => onClick && onClick()}
              >{label}</div>
            ))}
          </div>
          <div>
            <h4 style={{ color: "#1E293B", fontSize: 11, fontWeight: 700, marginBottom: 12, letterSpacing: ".08em", textTransform: "uppercase" }}>Právní</h4>
            {[
              { label: "Ochrana soukromí", onClick: onOchrana },
              { label: "Podmínky použití", onClick: onPodminkyPouziti },
              { label: "GDPR",             onClick: onGDPR },
              { label: "Cookies",          onClick: onCookies },
            ].map(({ label, onClick }) => (
              <div key={label}
                style={{ fontSize: 13, marginBottom: 7, cursor: onClick ? "pointer" : "default", transition: "color .12s", color: link }}
                onMouseEnter={e => { if (onClick) e.currentTarget.style.color = hover }}
                onMouseLeave={e => e.currentTarget.style.color = link}
                onClick={() => onClick && onClick()}
              >{label}</div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 14, display: "flex", justifyContent: "space-between", fontSize: 12, flexWrap: "wrap", gap: 8, color: "#94A3B8" }}>
          <span>© 2026 Stavira s.r.o. – provozovatel portálu ŠikulaDoma.cz</span>
          <span>Vyrobeno v Praze</span>
        </div>
      </div>
    </footer>
  )
}

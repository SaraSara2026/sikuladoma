// href pro odkazy vedoucí na jinou "stránku" appky (viz PAGE_META v App.jsx).
// `null` u položky = akce mimo routing (otevře modal/scroll), zůstává button.
const pageHref = page => page === "home" ? "/" : `/?page=${page}`;

function FooterLink({ label, page, onNavigate, onClick, link, hover }) {
  const style = { fontSize: 12, marginBottom: 3, display: "block", color: link, lineHeight: 1.5, textDecoration: "none", cursor: "pointer", transition: "color .12s" };
  if (page) {
    return (
      <a href={pageHref(page)} style={style}
        onMouseEnter={e => e.currentTarget.style.color = hover}
        onMouseLeave={e => e.currentTarget.style.color = link}
        onClick={e => { e.preventDefault(); onNavigate(page); }}>{label}</a>
    );
  }
  return (
    <div style={style}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.color = hover }}
      onMouseLeave={e => e.currentTarget.style.color = link}
      onClick={() => onClick && onClick()}>{label}</div>
  );
}

export default function Footer({ onOrder, onReg, onHow, onNavigate }) {
  const link = "#334155"
  const hover = "#0B66D8"

  return (
    <footer style={{ background: "#F3F6FA", borderTop: "1px solid #CBD5E1", color: link, padding: "16px 24px 8px" }}>
      <style>{`
        .ftr-grid{display:grid;grid-template-columns:1.8fr 1fr 1fr 1fr;gap:24px;margin-bottom:12px;}
        @media (max-width: 899px){ .ftr-grid{grid-template-columns:1fr 1fr;row-gap:28px;} }
        @media (max-width: 479px){ .ftr-grid{grid-template-columns:1fr;row-gap:24px;} }
      `}</style>
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>
        <div className="ftr-grid">
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
              { label: "Najít šikulu",    page: "sikulove" },
              { label: "Časté dotazy",    page: "faq" },
              { label: "Kontakt",         page: "kontakt" },
            ].map(item => <FooterLink key={item.label} {...item} onNavigate={onNavigate} link={link} hover={hover} />)}
          </div>
          <div>
            <h4 style={{ color: "#0F172A", fontSize: 10, fontWeight: 700, marginBottom: 8, letterSpacing: ".08em", textTransform: "uppercase" }}>Pro šikuly</h4>
            {[
              { label: "Zaregistrovat se",    onClick: onReg },
              { label: "Jak to funguje",      page: "sikuly" },
              { label: "Podmínky pro šikuly", page: "podminky-sikuly" },
              { label: "Časté dotazy",        page: "faq-sikuly" },
              { label: "Kontakt",             page: "kontakt" },
            ].map(item => <FooterLink key={item.label} {...item} onNavigate={onNavigate} link={link} hover={hover} />)}
          </div>
          <div>
            <h4 style={{ color: "#0F172A", fontSize: 10, fontWeight: 700, marginBottom: 8, letterSpacing: ".08em", textTransform: "uppercase" }}>Právní</h4>
            {[
              { label: "Ochrana osobních údajů", page: "ochrana-soukromi" },
              { label: "Obchodní podmínky",       page: "podminky-pouziti" },
              { label: "Podmínky pro šikuly",     page: "podminky-sikuly" },
              { label: "Cookies",                 page: "cookies" },
            ].map(item => <FooterLink key={item.label} {...item} onNavigate={onNavigate} link={link} hover={hover} />)}
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

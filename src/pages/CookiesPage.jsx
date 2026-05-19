const IcBack = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>

const SECTIONS = [
  {
    n: "1", title: "Co jsou cookies",
    text: "Cookies jsou malé textové soubory ukládané do zařízení uživatele při návštěvě webových stránek. Pomáhají správnému fungování webu a mohou zlepšovat uživatelské prostředí.",
  },
  {
    n: "2", title: "Jaké cookies můžeme používat",
    intro: "Platforma může používat zejména:",
    items: ["Technické cookies nezbytné pro fungování webu.", "Analytické cookies pro zlepšení služeb a výkonu webu.", "Bezpečnostní cookies.", "Preference uživatele."],
  },
  {
    n: "3", title: "K čemu cookies používáme",
    intro: "Cookies používáme například pro:",
    items: ["Správné fungování platformy.", "Zapamatování nastavení uživatele.", "Zabezpečení webu.", "Analýzu návštěvnosti a výkonu webu.", "Zlepšování uživatelského prostředí."],
  },
  {
    n: "4", title: "Cookies třetích stran",
    text: "Některé cookies mohou být poskytovány třetími stranami, například analytickými nebo technickými službami používanými při provozu platformy.",
  },
  {
    n: "5", title: "Nastavení cookies",
    text: "Používání cookies může uživatel upravit nebo omezit ve svém internetovém prohlížeči.",
  },
  {
    n: "6", title: "Ochrana osobních údajů",
    text: "Používání cookies souvisí také se zpracováním osobních údajů. Více informací je uvedeno na stránkách Ochrana soukromí a GDPR.",
  },
  {
    n: "7", title: "Závěrečná ustanovení",
    text: "Tyto informace mohou být průběžně aktualizovány.",
  },
]

export default function CookiesPage({ onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB" }}>

      {/* Breadcrumb */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F3F4F6", padding: "10px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#9CA3AF", fontFamily: "inherit", padding: 0, transition: "color .12s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#1A1F2E"}
            onMouseLeave={e => e.currentTarget.style.color = "#9CA3AF"}>
            <IcBack /> Zpět na úvod
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 80px" }}>

        {/* Hlavička */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#6B7280", marginBottom: 12 }}>PRÁVNÍ</div>
          <h1 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 700, color: "#1A1F2E", letterSpacing: "-.025em", lineHeight: 1.15, marginBottom: 14 }}>
            Cookies
          </h1>
          <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, maxWidth: 560 }}>
            Tato stránka vysvětluje, jak platforma ŠikulaDoma používá cookies a podobné technologie při používání webu.
          </p>
        </div>

        {/* Sekce */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {SECTIONS.map((s, i) => (
            <div key={s.n} style={{ paddingBottom: 32, marginBottom: 32, borderBottom: i < SECTIONS.length - 1 ? "1px solid #F3F4F6" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F9FAFB", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280" }}>{s.n}</span>
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1A1F2E", letterSpacing: "-.015em" }}>{s.title}</h2>
              </div>
              {s.text && <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>{s.text}</p>}
              {s.intro && <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, marginBottom: 10 }}>{s.intro}</p>}
              {s.items && (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {s.items.map(item => (
                    <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#6B7280", lineHeight: 1.65 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#9CA3AF", flexShrink: 0, marginTop: 8 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", fontSize: 12, color: "#6B7280", marginTop: 8 }}>
          Účinnost od: 11. 5. 2026
        </div>
      </div>
    </div>
  )
}

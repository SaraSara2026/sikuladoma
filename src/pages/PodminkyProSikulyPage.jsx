const IcBack = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

const SECTIONS = [
  {
    n: "1",
    title: "Kdo může používat ŠikulaDoma",
    text: "Platformu mohou používat živnostníci, firmy i jednotlivci, kteří nabízejí služby zákazníkům prostřednictvím ŠikulaDoma.",
  },
  {
    n: "2",
    title: "Registrace a účet",
    items: [
      "Uživatel je povinen uvádět pravdivé údaje.",
      "Každý uživatel může používat pouze jeden účet.",
      "Uživatel odpovídá za zabezpečení svého účtu.",
    ],
  },
  {
    n: "3",
    title: "Poptávky a zakázky",
    text: "Šikula reaguje pouze na zakázky, o které má zájem.",
    highlight: "ŠikulaDoma pouze propojuje zákazníky a šikuly. Za provedení práce, cenu, termíny a průběh zakázky odpovídá konkrétní šikula.",
  },
  {
    n: "4",
    title: "Hodnocení a recenze",
    items: [
      "Recenze musí vycházet ze skutečné zkušenosti.",
      "Nejsou povoleny falešné recenze, vulgarity ani osobní útoky.",
      "Provozovatel může odstranit nevhodný obsah.",
    ],
  },
  {
    n: "5",
    title: "Tarify a služby platformy",
    items: [
      "Platforma může nabízet bezplatné i placené tarify.",
      "Některé funkce (například online fakturovač) mohou být dostupné pouze u vybraných tarifů.",
      "Provozovatel si vyhrazuje právo upravit nabídku tarifů.",
    ],
  },
  {
    n: "6",
    title: "Zakázané jednání",
    intro: "Je zakázáno:",
    items: [
      "Vytvářet falešné účty.",
      "Vydávat se za jinou osobu nebo firmu.",
      "Zneužívat platformu.",
      "Rozesílat spam.",
      "Kopírovat obsah platformy bez souhlasu provozovatele.",
    ],
  },
  {
    n: "7",
    title: "Pozastavení nebo zrušení účtu",
    text: "Provozovatel může účet dočasně omezit nebo zrušit při porušení podmínek nebo podvodném jednání.",
  },
  {
    n: "8",
    title: "Ochrana osobních údajů",
    text: "Nakládání s osobními údaji se řídí zásadami ochrany osobních údajů a GDPR.",
  },
  {
    n: "9",
    title: "Závěrečná ustanovení",
    items: [
      "Podmínky se řídí právním řádem České republiky.",
      "Provozovatel si vyhrazuje právo podmínky aktualizovat.",
    ],
  },
]

export default function PodminkyProSikulyPage({ onBack }) {
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
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#F97316", marginBottom: 12 }}>
            PRO ŠIKULY
          </div>
          <h1 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 700, color: "#1A1F2E", letterSpacing: "-.025em", lineHeight: 1.15, marginBottom: 14 }}>
            Podmínky pro šikuly
          </h1>
          <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, maxWidth: 560 }}>
            Tyto podmínky upravují používání platformy ŠikulaDoma pro šikuly, živnostníky, firmy a další poskytovatele služeb.
          </p>
        </div>

        {/* Sekce */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {SECTIONS.map((s, i) => (
            <div key={s.n} style={{ paddingBottom: 32, marginBottom: 32, borderBottom: i < SECTIONS.length - 1 ? "1px solid #F3F4F6" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#F97316" }}>{s.n}</span>
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1A1F2E", letterSpacing: "-.015em" }}>{s.title}</h2>
              </div>

              {s.intro && (
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, marginBottom: 10 }}>{s.intro}</p>
              )}

              {s.text && (
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, marginBottom: s.highlight ? 14 : 0 }}>{s.text}</p>
              )}

              {s.highlight && (
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderLeft: "4px solid #3B82F6", borderRadius: "0 10px 10px 0", padding: "14px 18px", fontSize: 14, color: "#1E3A5F", lineHeight: 1.65, fontWeight: 500 }}>
                  {s.highlight}
                </div>
              )}

              {s.items && (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {s.items.map(item => (
                    <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#6B7280", lineHeight: 1.65 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#F97316", flexShrink: 0, marginTop: 8 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Provozovatel */}
        <div style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 16, padding: "24px 28px", marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#6B7280", marginBottom: 14 }}>Provozovatel</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1F2E", marginBottom: 4 }}>Stavira s.r.o.</div>
              <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.75 }}>
                Mokošínská 913/4<br />
                190 17 Praha 9<br />
                Česká republika
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.75 }}>
              IČ: 29228379<br />
              DIČ: CZ29228379<br />
              <a href="mailto:info@sikuladoma.cz" style={{ color: "#F97316", fontWeight: 600, textDecoration: "none", marginTop: 4, display: "inline-block" }}>
                info@sikuladoma.cz
              </a>
            </div>
          </div>
        </div>

        {/* Datum */}
        <div style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: "#6B7280" }}>
          Platnost od: 11. 5. 2026
        </div>

      </div>
    </div>
  )
}

const IcBack  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
const IcArrow = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>

const SECTIONS = [
  {
    n: "1", title: "Jaké údaje můžeme zpracovávat",
    intro: "Můžeme zpracovávat zejména:",
    items: ["Jméno a příjmení.", "E-mailovou adresu.", "Telefonní číslo.", "Údaje uvedené v poptávkách nebo profilech.", "Technické údaje o používání webu."],
  },
  {
    n: "2", title: "Proč údaje používáme",
    intro: "Osobní údaje používáme především pro:",
    items: ["Propojení zákazníků a šikulů.", "Komunikaci mezi uživateli.", "Správu uživatelských účtů.", "Zajištění fungování platformy.", "Zvýšení bezpečnosti a ochrany proti zneužití."],
  },
  {
    n: "3", title: "Komu mohou být údaje zpřístupněny",
    text: "Osobní údaje neprodáváme třetím stranám.",
    intro2: "Údaje mohou být zpřístupněny pouze:",
    items: ["Poskytovatelům technických služeb potřebných pro provoz platformy.", "V případech, kdy to vyžaduje právní předpis České republiky."],
  },
  {
    n: "4", title: "Jak údaje chráníme",
    text: "Používáme přiměřená technická a organizační opatření pro ochranu osobních údajů před ztrátou, zneužitím nebo neoprávněným přístupem.",
  },
  {
    n: "5", title: "Vaše práva",
    intro: "Máte právo:",
    items: ["Požádat o přístup ke svým údajům.", "Požádat o opravu nepřesných údajů.", "Požádat o výmaz údajů.", "Požádat o omezení zpracování.", "Vznést námitku proti zpracování."],
  },
  {
    n: "6", title: "Kontakt",
    text: "V případě dotazů týkajících se ochrany osobních údajů nás můžete kontaktovat na:",
    email: true,
  },
]

export default function OchranaSoukromiPage({ onBack }) {
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
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#3B82F6", marginBottom: 12 }}>
            PRÁVNÍ
          </div>
          <h1 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 700, color: "#1A1F2E", letterSpacing: "-.025em", lineHeight: 1.15, marginBottom: 14 }}>
            Ochrana soukromí
          </h1>
          <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, maxWidth: 560 }}>
            Vaše soukromí a ochrana osobních údajů jsou pro nás důležité. Na této stránce najdete základní informace o tom, jak ŠikulaDoma pracuje s osobními údaji a jak je chrání.
          </p>
        </div>

        {/* Sekce */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {SECTIONS.map((s, i) => (
            <div key={s.n} style={{ paddingBottom: 32, marginBottom: 32, borderBottom: i < SECTIONS.length - 1 ? "1px solid #F3F4F6" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6" }}>{s.n}</span>
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1A1F2E", letterSpacing: "-.015em" }}>{s.title}</h2>
              </div>

              {s.text && (
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, marginBottom: (s.intro2 || s.items) ? 12 : 0 }}>{s.text}</p>
              )}
              {s.email && (
                <a href="mailto:info@sikuladoma.cz" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14, fontWeight: 600, color: "#3B82F6", textDecoration: "none", marginTop: 4 }}>
                  info@sikuladoma.cz <IcArrow />
                </a>
              )}
              {s.intro && (
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, marginBottom: 10 }}>{s.intro}</p>
              )}
              {s.intro2 && (
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, marginBottom: 10, marginTop: s.text ? 4 : 0 }}>{s.intro2}</p>
              )}
              {s.items && (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {s.items.map(item => (
                    <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#6B7280", lineHeight: 1.65 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#3B82F6", flexShrink: 0, marginTop: 8 }} />
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
              <a href="mailto:info@sikuladoma.cz" style={{ color: "#3B82F6", fontWeight: 600, textDecoration: "none", display: "inline-block", marginTop: 4 }}>
                info@sikuladoma.cz
              </a>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: "#6B7280" }}>
          Účinnost od: 11. 5. 2026
        </div>

      </div>
    </div>
  )
}

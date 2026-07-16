const IcBack  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
const IcArrow = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>

const SECTIONS = [
  {
    n: "1", title: "Správce osobních údajů",
    firm: true,
  },
  {
    n: "2", title: "Jaké údaje zpracováváme",
    intro: "Můžeme zpracovávat zejména:",
    items: ["Identifikační údaje.", "Kontaktní údaje.", "Údaje uvedené v profilech a poptávkách.", "Údaje o komunikaci mezi uživateli.", "Technické údaje o používání platformy."],
  },
  {
    n: "3", title: "Účel zpracování osobních údajů",
    intro: "Osobní údaje zpracováváme zejména za účelem:",
    items: ["Provozu platformy ŠikulaDoma.", "Propojení zákazníků a šikulů.", "Komunikace mezi uživateli.", "Správy uživatelských účtů.", "Zajištění bezpečnosti platformy.", "Plnění právních povinností."],
  },
  {
    n: "4", title: "Právní základ zpracování",
    intro: "Osobní údaje zpracováváme zejména:",
    items: ["Na základě plnění smlouvy.", "Na základě oprávněného zájmu.", "Na základě souhlasu uživatele.", "Na základě právních povinností."],
  },
  {
    n: "5", title: "Doba uchování údajů",
    text: "Osobní údaje uchováváme pouze po dobu nezbytně nutnou pro splnění účelu zpracování nebo po dobu stanovenou právními předpisy České republiky a Evropské unie.",
  },
  {
    n: "6", title: "Předávání údajů třetím stranám",
    intro: "Osobní údaje mohou být zpřístupněny pouze:",
    items: ["Poskytovatelům technických služeb nezbytných pro provoz platformy.", "Platebnímu zpracovateli Stripe za účelem zpracování plateb tarifů a vystavení dokladů o zaplacení.", "Účetním nebo právním službám.", "Orgánům veřejné moci, pokud to vyžaduje právní předpis."],
    note: "Osobní údaje neprodáváme třetím stranám.",
  },
  {
    n: "7", title: "Práva uživatelů",
    intro: "Uživatel má právo:",
    items: ["Na přístup ke svým údajům.", "Na opravu nepřesných údajů.", "Na výmaz osobních údajů.", "Na omezení zpracování.", "Vznést námitku proti zpracování.", "Na přenositelnost údajů.", "Podat stížnost u Úřadu pro ochranu osobních údajů (ÚOOÚ)."],
  },
  {
    n: "8", title: "Zabezpečení údajů",
    text: "Používáme přiměřená technická a organizační opatření k ochraně osobních údajů před neoprávněným přístupem, ztrátou nebo zneužitím.",
  },
  {
    n: "9", title: "Cookies a analytické nástroje",
    text: "Platforma může používat cookies a analytické nástroje za účelem zlepšení fungování webu a uživatelského prostředí.",
  },
  {
    n: "10", title: "Závěrečná ustanovení",
    text: "Tyto informace mohou být průběžně aktualizovány.",
  },
]

export default function GDPRPage({ onBack }) {
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
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#6B7280", marginBottom: 12 }}>PRÁVNÍ · EU 2016/679</div>
          <h1 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 700, color: "#1A1F2E", letterSpacing: "-.025em", lineHeight: 1.15, marginBottom: 14 }}>
            GDPR – Ochrana osobních údajů
          </h1>
          <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, maxWidth: 580 }}>
            Tato stránka obsahuje informace o zpracování osobních údajů v souladu s Nařízením Evropského parlamentu a Rady (EU) 2016/679 (GDPR), právním řádem České republiky a souvisejícími předpisy Evropské unie.
          </p>
        </div>

        {/* Sekce */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {SECTIONS.map((s, i) => (
            <div key={s.n} style={{ paddingBottom: 32, marginBottom: 32, borderBottom: i < SECTIONS.length - 1 ? "1px solid #F3F4F6" : "none" }}>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#3B82F6" }}>{s.n}</span>
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1A1F2E", letterSpacing: "-.015em" }}>{s.title}</h2>
              </div>

              {s.text && !s.firm && (
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>{s.text}</p>
              )}

              {s.firm && (
                <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 20px", marginTop: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1F2E", marginBottom: 6 }}>Stavira s.r.o.</div>
                  <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.75 }}>
                    Mokošínská 913/4<br />
                    190 17 Praha 9<br />
                    Česká republika<br />
                    IČ: 29228379
                  </div>
                  <a href="mailto:info@sikuladoma.cz" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, fontSize: 13, fontWeight: 600, color: "#3B82F6", textDecoration: "none" }}>
                    info@sikuladoma.cz <IcArrow />
                  </a>
                </div>
              )}

              {s.intro && (
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, marginBottom: 10 }}>{s.intro}</p>
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

              {s.note && (
                <div style={{ marginTop: 14, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#166534", fontWeight: 500 }}>
                  {s.note}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Datum */}
        <div style={{ textAlign: "center", fontSize: 12, color: "#6B7280", marginTop: 8 }}>
          Účinnost od: 11. 5. 2026
        </div>
      </div>
    </div>
  )
}

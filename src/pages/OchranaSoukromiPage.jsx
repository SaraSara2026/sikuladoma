const IcBack  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
const IcArrow = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>

// Jediný zdroj pravdy pro ochranu osobních údajů — GDPRPage.jsx tento
// obsah jen znovu vykresluje, ať nikde nevznikají dvě různé verze textu.
const SECTIONS = [
  {
    n: "1", title: "Správce osobních údajů",
    firm: true,
  },
  {
    n: "2", title: "Jaké údaje zpracováváme",
    intro: "V souvislosti s provozem platformy zpracováváme zejména:",
    items: [
      "Jméno a příjmení.",
      "E-mailovou adresu.",
      "Telefonní číslo.",
      "Adresu nebo oblast poptávky.",
      "Obsah poptávek a nabídek.",
      "Zprávy mezi zákazníkem a šikulou.",
      "Údaje uvedené v profilu šikuly, včetně IČO u živnostníků a firem.",
      "Fakturační a platební údaje zpracovávané prostřednictvím platební brány Stripe.",
      "Technické údaje o používání platformy (IP adresa, soubory cookies, přihlašovací a bezpečnostní logy).",
    ],
  },
  {
    n: "3", title: "Účely zpracování",
    intro: "Osobní údaje zpracováváme za účelem:",
    items: [
      "Založení a správy uživatelského účtu.",
      "Zadání a správy poptávky.",
      "Propojení zákazníka a šikuly.",
      "Umožnění odeslání a přijetí nabídky.",
      "Komunikace mezi uživateli prostřednictvím platformy.",
      "Zpracování plateb tarifů šikulů a vystavení dokladů o zaplacení.",
      "Plnění účetních a daňových povinností.",
      "Zajištění bezpečnosti platformy a prevence zneužití.",
      "Plnění právních povinností.",
    ],
    note: "Marketingová sdělení v současné době nezasíláme. Pokud to v budoucnu zavedeme, uděláme tak jen na základě vašeho souhlasu.",
  },
  {
    n: "4", title: "Právní základy zpracování",
    intro: "Osobní údaje zpracováváme na základě:",
    items: [
      "Plnění smlouvy — poskytnutí přístupu k platformě a zprostředkování kontaktu.",
      "Oprávněného zájmu — bezpečnost, prevence zneužití, zlepšování služby.",
      "Plnění právních povinností — zejména účetních a daňových.",
      "Souhlasu — tam, kde je to nezbytné, například u netechnických cookies.",
    ],
  },
  {
    n: "5", title: "Příjemci a zpracovatelé",
    intro: "Osobní údaje mohou být zpřístupněny:",
    items: [
      "Poskytovateli hostingu a provozu aplikace (Vercel).",
      "Poskytovateli databázové infrastruktury (Neon).",
      "Poskytovateli e-mailové komunikace (Resend).",
      "Platebnímu zpracovateli Stripe za účelem zpracování plateb tarifů a vystavení dokladů o zaplacení.",
      "Účetním nebo daňovým poradcům, je-li to nutné.",
      "Orgánům veřejné moci, vyžaduje-li to právní předpis.",
    ],
    note: "Osobní údaje neprodáváme třetím stranám.",
  },
  {
    n: "6", title: "Předání mimo EU/EHP",
    text: "Platforma ŠikulaDoma je určena primárně pro uživatele v České republice. Někteří techničtí poskytovatelé služeb, které používáme pro provoz platformy, e-mailovou komunikaci, databázi nebo platby, však mohou zpracovávat osobní údaje i mimo EU/EHP. V takovém případě probíhá předání pouze za podmínek stanovených GDPR, zejména na základě odpovídajícího rozhodnutí Evropské komise, standardních smluvních doložek nebo jiného zákonného mechanismu.",
  },
  {
    n: "7", title: "Doba uchování údajů",
    text: "Údaje spojené s uživatelským účtem uchováváme po dobu jeho existence a přiměřenou dobu po jeho zrušení pro účely vyřízení případných nároků. Údaje o poptávkách a nabídkách uchováváme po dobu nezbytnou pro poskytování služby a řešení případných sporů. Účetní a daňové doklady uchováváme po dobu stanovenou právními předpisy. Technické logy uchováváme po přiměřenou dobu nezbytnou pro zajištění bezpečnosti. Souhlasy se zpracováním uchováváme do jejich odvolání.",
  },
  {
    n: "8", title: "Práva subjektů údajů",
    intro: "Máte právo:",
    items: [
      "Na přístup ke svým osobním údajům.",
      "Na opravu nepřesných údajů.",
      "Na výmaz osobních údajů.",
      "Na omezení zpracování.",
      "Na přenositelnost údajů.",
      "Vznést námitku proti zpracování založenému na oprávněném zájmu.",
      "Kdykoliv odvolat souhlas, byl-li právním základem zpracování.",
    ],
    note: "Vaši žádost vyřídíme zpravidla do 30 dnů. Pokud se domníváte, že vaše údaje zpracováváme v rozporu s právními předpisy, máte právo podat stížnost u Úřadu pro ochranu osobních údajů (uoou.cz).",
  },
  {
    n: "9", title: "Zabezpečení údajů",
    text: "Používáme přiměřená technická a organizační opatření k ochraně osobních údajů před neoprávněným přístupem, ztrátou nebo zneužitím. Žádný přenos dat po internetu ani systém uchovávání dat však nelze zaručit jako absolutně bezpečný.",
  },
  {
    n: "10", title: "Děti a věkové omezení",
    text: "Platforma není určena osobám mladším 18 let. Pokud zjistíme, že jsme neúmyslně zpracovali osobní údaje osoby mladší 18 let bez souhlasu zákonného zástupce, tyto údaje vymažeme.",
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
            PRÁVNÍ · GDPR (EU) 2016/679
          </div>
          <h1 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 700, color: "#1A1F2E", letterSpacing: "-.025em", lineHeight: 1.15, marginBottom: 14 }}>
            Ochrana osobních údajů
          </h1>
          <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, maxWidth: 580 }}>
            Tato stránka popisuje, jak ŠikulaDoma zpracovává osobní údaje v souladu s Nařízením Evropského parlamentu a Rady (EU) 2016/679 (GDPR) a právním řádem České republiky.
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

              {s.firm && (
                <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 20px", marginTop: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1F2E", marginBottom: 6 }}>Stavira s.r.o.</div>
                  <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.75 }}>
                    Mokošínská 913/4<br />
                    190 17 Praha 9<br />
                    Česká republika<br />
                    IČO: 29228379<br />
                    DIČ: CZ29228379
                  </div>
                  <a href="mailto:info@sikuladoma.cz" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, fontSize: 13, fontWeight: 600, color: "#3B82F6", textDecoration: "none" }}>
                    info@sikuladoma.cz <IcArrow />
                  </a>
                </div>
              )}

              {s.text && (
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>{s.text}</p>
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

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: "#6B7280" }}>
          Účinnost od: 18. 8. 2026
        </div>

      </div>
    </div>
  )
}

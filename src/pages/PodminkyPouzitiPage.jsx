const IcBack = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>

const SECTIONS = [
  {
    n: "1", title: "Provozovatel platformy",
    firm: true,
  },
  {
    n: "2", title: "Charakter platformy",
    text: "ŠikulaDoma je online platforma sloužící k propojení zákazníků a šikulů.",
    highlight: "ŠikulaDoma není poskytovatelem nabízených služeb a není smluvní stranou mezi zákazníkem a šikulou.",
  },
  {
    n: "3", title: "Používání platformy",
    intro: "Uživatelé jsou povinni používat platformu v souladu s právními předpisy České republiky a nesmí:",
    items: ["Vytvářet falešné účty.", "Vydávat se za jinou osobu nebo firmu.", "Zneužívat platformu.", "Rozesílat spam.", "Vkládat nepravdivý, urážlivý nebo nezákonný obsah."],
  },
  {
    n: "4", title: "Uživatelský obsah a recenze",
    text: "Recenze a hodnocení musí vycházet ze skutečné zkušenosti. Provozovatel si vyhrazuje právo odstranit obsah, který porušuje podmínky nebo právní předpisy.",
  },
  {
    n: "5", title: "Omezení odpovědnosti",
    intro: "Provozovatel nenese odpovědnost za:",
    items: ["Kvalitu poskytovaných služeb.", "Cenu nebo termíny zakázek.", "Komunikaci mezi uživateli.", "Případné škody vzniklé mezi zákazníkem a šikulou."],
  },
  {
    n: "6", title: "Dostupnost služby",
    text: "Provozovatel se snaží zajistit dostupnost platformy, negarantuje však nepřetržitý a bezchybný provoz.",
  },
  {
    n: "7", title: "Platby a fakturace",
    text: "Platby tarifů probíhají kartou prostřednictvím platební brány Stripe. Doklad o zaplacení (faktura/účtenka) je uživateli po úspěšné platbě automaticky vygenerován a zaslán e-mailem prostřednictvím Stripe jménem provozovatele.",
  },
  {
    n: "8", title: "Ochrana osobních údajů",
    text: "Nakládání s osobními údaji se řídí zásadami ochrany osobních údajů a GDPR.",
  },
  {
    n: "9", title: "Podmínky pro šikuly",
    text: "Pro registrované šikuly platí kromě těchto podmínek také samostatné Podmínky pro šikuly.",
  },
  {
    n: "10", title: "Změny podmínek",
    text: "Provozovatel si vyhrazuje právo tyto podmínky kdykoliv upravit nebo aktualizovat.",
  },
  {
    n: "11", title: "Závěrečná ustanovení",
    text: "Tyto podmínky se řídí právním řádem České republiky.",
  },
]

export default function PodminkyPouzitiPage({ onBack }) {
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
            Podmínky použití
          </h1>
          <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, maxWidth: 560 }}>
            Tyto podmínky upravují používání platformy ŠikulaDoma a vztahy mezi provozovatelem platformy a jejími uživateli.
          </p>
        </div>

        {/* Sekce */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {SECTIONS.map((s, i) => (
            <div key={s.n} style={{ paddingBottom: 32, marginBottom: 32, borderBottom: i < SECTIONS.length - 1 ? "1px solid #F3F4F6" : "none" }}>

              {/* Číslo + nadpis */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F9FAFB", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280" }}>{s.n}</span>
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1A1F2E", letterSpacing: "-.015em" }}>{s.title}</h2>
              </div>

              {s.firm && (
                <div style={{ background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 12, padding: "16px 20px", fontSize: 13, color: "#6B7280", lineHeight: 1.75, marginTop: 4 }}>
                  <div style={{ fontWeight: 600, color: "#1A1F2E", marginBottom: 4 }}>Stavira s.r.o.</div>
                  Mokošínská 913/4<br />
                  190 17 Praha 9<br />
                  Česká republika<br />
                  IČ: 29228379
                </div>
              )}

              {s.text && (
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, marginBottom: s.highlight ? 14 : 0 }}>{s.text}</p>
              )}

              {s.highlight && (
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderLeft: "4px solid #3B82F6", borderRadius: "0 10px 10px 0", padding: "14px 18px", fontSize: 14, color: "#1E3A5F", lineHeight: 1.65, fontWeight: 500 }}>
                  {s.highlight}
                </div>
              )}

              {s.intro && (
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, marginBottom: 10 }}>{s.intro}</p>
              )}

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

        {/* Datum */}
        <div style={{ textAlign: "center", fontSize: 12, color: "#6B7280", marginTop: 8 }}>
          Účinnost od: 11. 5. 2026
        </div>
      </div>
    </div>
  )
}

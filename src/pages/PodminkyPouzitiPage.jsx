const IcBack = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>

const SECTIONS = [
  {
    n: "1", title: "Provozovatel platformy",
    firm: true,
  },
  {
    n: "2", title: "Charakter platformy",
    text: "ŠikulaDoma je online platforma sloužící k propojení zákazníků a šikulů.",
    highlight: "ŠikulaDoma není poskytovatelem nabízených služeb, není smluvní stranou dohody uzavřené mezi zákazníkem a šikulou a není zaměstnavatelem šikulů.",
  },
  {
    n: "3", title: "Role zákazníka",
    intro: "Pro zákazníky platí zejména:",
    items: [
      "Zadání poptávky je zdarma.",
      "Zákazník si vybírá šikulu podle vlastního uvážení.",
      "Zákazník platí za provedenou práci přímo vybranému šikulovi, ne ŠikulaDoma.",
      "Zákazník si má se šikulou předem domluvit rozsah práce, cenu, termín a další podmínky.",
    ],
  },
  {
    n: "4", title: "Role šikuly",
    intro: "Pro šikuly platí zejména:",
    items: [
      "Registrace na platformě je zdarma.",
      "Šikula odpovídá za pravdivost údajů uvedených při registraci a v profilu.",
      "Šikula odpovídá za to, že má pro nabízenou činnost potřebné oprávnění k podnikání, případně odbornou způsobilost vyžadovanou právními předpisy.",
      "Šikula odpovídá za obsah svých nabídek, komunikaci se zákazníkem, sjednanou cenu a provedení práce.",
      "Příležitostná výpomoc nesmí být prezentována jako regulovaná odborná služba, pokud k ní osoba nemá zákonem vyžadované oprávnění.",
    ],
    note: "Podrobnosti pro šikuly upravují samostatné Podmínky pro šikuly.",
  },
  {
    n: "5", title: "Tarify",
    intro: "Pro tarify šikulů platí:",
    items: [
      "Aktivní šikula — 199 Kč / měsíc.",
      "Aktivní šikula Plus — 299 Kč / měsíc.",
      "Aktivní tarif odemyká odpovídání na poptávky a další funkce podle zvoleného tarifu.",
      "Tarify se automaticky obnovují za zvolené období, dokud je uživatel nezruší.",
      "Zrušení lze provést kdykoliv v uživatelském účtu; zaplacené období zůstává funkční až do svého konce.",
      "ŠikulaDoma si z uskutečněné zakázky neúčtuje žádnou provizi.",
      "Za zadání poptávky zákazník ŠikulaDoma neplatí nic.",
    ],
  },
  {
    n: "6", title: "Ověřený šikula",
    text: "Odznak Ověřený šikula označuje profil, u kterého provozovatel provedl základní kontrolu podle interních pravidel platformy. Tento odznak neznamená garanci kvality práce, odborné způsobilosti, bezúhonnosti ani převzetí odpovědnosti za provedenou službu.",
  },
  {
    n: "7", title: "Odpovědnost",
    intro: "Provozovatel neodpovídá zejména za:",
    items: [
      "Kvalitu, cenu, termín ani výsledek práce provedené šikulou.",
      "Obsah komunikace mezi uživateli.",
      "Škodu vzniklou v souvislosti se službou sjednanou mezi zákazníkem a šikulou.",
    ],
    text2: "Odpovědnost provozovatele se vztahuje na provoz a dostupnost platformy v rozsahu stanoveném právními předpisy.",
  },
  {
    n: "8", title: "Dostupnost služby",
    text: "Provozovatel se snaží zajistit dostupnost platformy, negarantuje však nepřetržitý a bezchybný provoz.",
  },
  {
    n: "9", title: "Používání platformy",
    intro: "Uživatelé jsou povinni používat platformu v souladu s právními předpisy České republiky a nesmí:",
    items: ["Vytvářet falešné účty.", "Vydávat se za jinou osobu nebo firmu.", "Zneužívat platformu.", "Rozesílat spam.", "Vkládat nepravdivý, urážlivý nebo nezákonný obsah."],
  },
  {
    n: "10", title: "Zakázané služby",
    intro: "Prostřednictvím platformy je zakázáno nabízet nebo poptávat zejména:",
    items: [
      "Nelegální služby.",
      "Regulované odborné služby, pokud k nim uživatel nemá zákonem vyžadované oprávnění.",
      "Zdravotní, sociální, právní, účetní nebo finanční služby bez příslušného oprávnění.",
      "Klamavé nebo nepravdivé informace o rozsahu, ceně či kvalifikaci.",
      "Zneužití kontaktů získaných prostřednictvím platformy k jinému účelu, než ke kterému byly poskytnuty.",
    ],
  },
  {
    n: "11", title: "Uživatelský obsah a recenze",
    text: "Recenze a hodnocení musí vycházet ze skutečné zkušenosti. Provozovatel si vyhrazuje právo odstranit obsah, který porušuje podmínky nebo právní předpisy.",
  },
  {
    n: "12", title: "Platby a fakturace",
    text: "Platby tarifů probíhají kartou prostřednictvím platební brány Stripe. Doklad o zaplacení (faktura/účtenka) je uživateli po úspěšné platbě automaticky vygenerován a zaslán e-mailem prostřednictvím Stripe jménem provozovatele.",
  },
  {
    n: "13", title: "Reklamace",
    text: "Reklamace týkající se provedené práce, ceny, termínu nebo kvality služby řeší zákazník přímo se šikulou, který zakázku provedl — ŠikulaDoma není stranou tohoto vztahu. Reklamace týkající se platby tarifu nebo fungování platformy samotné řeší uživatel s provozovatelem na info@sikuladoma.cz.",
  },
  {
    // Text níže je opatrně formulovaný návrh, ale klasifikace šikuly jako
    // spotřebitel vs. podnikatel (zejména u příležitostné výpomoci bez IČO)
    // by měla být před ostrým nasazením ještě potvrzena advokátem.
    n: "14", title: "Odstoupení od předplatného",
    text: "Pokud šikula aktivuje tarif v rámci své podnikatelské činnosti (jako OSVČ nebo firma), spotřebitelská ochrana včetně práva na odstoupení od smlouvy dle občanského zákoníku se na tento vztah nevztahuje. Pokud šikula jedná mimo rámec podnikatelské činnosti, aktivací tarifu a okamžitým zpřístupněním jeho funkcí výslovně žádá o zahájení poskytování služby před uplynutím lhůty pro odstoupení a bere na vědomí, že tímto právo na odstoupení od smlouvy v rozsahu již poskytnutého plnění zaniká.",
  },
  {
    n: "15", title: "Ochrana osobních údajů",
    text: "Nakládání s osobními údaji se řídí stránkou Ochrana osobních údajů.",
  },
  {
    n: "16", title: "Podmínky pro šikuly",
    text: "Pro registrované šikuly platí kromě těchto podmínek také samostatné Podmínky pro šikuly.",
  },
  {
    n: "17", title: "Změny podmínek a závěrečná ustanovení",
    items: [
      "Provozovatel si vyhrazuje právo tyto podmínky kdykoliv upravit nebo aktualizovat.",
      "Tyto podmínky se řídí právním řádem České republiky.",
    ],
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
            Obchodní podmínky
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
                  IČO: 29228379<br />
                  DIČ: CZ29228379
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

              {s.text2 && (
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, marginTop: 12 }}>{s.text2}</p>
              )}

              {s.note && (
                <div style={{ marginTop: 14, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#6B7280" }}>
                  {s.note}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Datum */}
        <div style={{ textAlign: "center", fontSize: 12, color: "#6B7280", marginTop: 8 }}>
          Účinnost od: 18. 8. 2026
        </div>
      </div>
    </div>
  )
}

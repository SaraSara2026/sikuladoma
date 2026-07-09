import { useState } from 'react';

const IcBack     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
const IcArrow    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
const IcUser     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IcTag      = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
const IcBell     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
const IcReceipt  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
const IcStar     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const IcMail     = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>

const FAQ_SIKULOVE = [
  {
    q: 'Kolik mě stojí registrace jako šikula?',
    a: 'Aktivní šikula stojí <strong>399 Kč / měsíc</strong>. Platba probíhá kartou přes Stripe. Po úspěšné platbě se profil aktivuje a můžete přijímat poptávky. Tarif se obnovuje měsíčně a lze ho kdykoliv zrušit.',
  },
  {
    q: 'Mohu jako šikula reagovat na poptávky bez omezení?',
    a: 'Ano. S tarifem <strong>Aktivní šikula (399 Kč / měsíc)</strong> reagujete na poptávky bez omezení počtu. Tarif se obnovuje každý měsíc a zrušit ho lze kdykoliv přímo v dashboardu.',
  },
  {
    q: 'Můžu kdykoliv změnit nebo zrušit tarif?',
    a: 'Ano. V dashboardu → Členství můžete kdykoliv upgradovat nebo přes Stripe portál zrušit. Zrušení se aktivuje po skončení aktuálního období — do té doby máte výhody zaplaceného tarifu.',
  },
  {
    q: 'Jak získám hodnocení a recenze?',
    a: 'Po každé dokončené zakázce dostane zákazník výzvu k hodnocení. Hvězdičky 1-5 + komentář + možnost doporučit. Recenze se zobrazí na vašem veřejném profilu a počítají se do vašeho hodnocení.',
  },
  {
    q: 'Musím odvádět z výdělků daně?',
    a: 'Ano, jako samostatně výdělečně činná osoba (OSVČ) odvádíte daně sami. Pomůže vám <strong>fakturovač</strong>, který je součástí tarifu <strong>Aktivní šikula Plus za 499 Kč / měsíc</strong> — vystavíte fakturu, stáhnete PDF, pošlete zákazníkovi.',
  },
  {
    q: 'Co když mi zákazník nezaplatí?',
    a: 'Vždy si dohodu dokumentujte v chatu. Pokud zákazník nezaplatí, máte důkaz. Kontaktujte nás, pomůžeme s mediací. V krajním případě se obraťte na advokáta — ŠikulaDoma platby nezprostředkovává, ale dohoda v chatu je platná.',
  },
];

const CARDS = [
  { Icon: IcUser,    bg: "#FFF7ED", color: "#F97316", title: "Registrace a profil",      desc: "Pomoc s vytvořením účtu, nastavením služeb a oblastí, kde chcete získávat zakázky." },
  { Icon: IcTag,     bg: "#EFF6FF", color: "#3B82F6", title: "Tarify a platby",           desc: "Dotazy k tarifům, změně tarifu nebo platbám za používání platformy." },
  { Icon: IcBell,    bg: "#F0FDF4", color: "#22C55E", title: "Poptávky a nabídky",        desc: "Pomoc s reakcemi na poptávky, komunikací se zákazníkem nebo nastavením upozornění." },
  { Icon: IcReceipt, bg: "#FDF4FF", color: "#A855F7", title: "Faktury",                   desc: "Podpora k fakturačnímu modulu dostupnému ve vybraných tarifech." },
  { Icon: IcStar,    bg: "#FFFBEB", color: "#D97706", title: "Hodnocení a recenze",       desc: "Dotazy k hodnocení, recenzím a profilu šikuly." },
]

function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 12, overflow: "hidden" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          width: "100%", padding: "18px 20px", background: "transparent", border: "none",
          cursor: "pointer", fontFamily: "inherit", textAlign: "left",
          fontSize: 15, fontWeight: 600, color: "#1A1F2E",
        }}>
        <span>{q}</span>
        <span style={{ flexShrink: 0, transition: "transform .2s", transform: open ? "rotate(180deg)" : "none", color: "#9CA3AF" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 20px 20px", fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}
          dangerouslySetInnerHTML={{ __html: a }} />
      )}
    </div>
  );
}

export default function PodporaProSikulyPage({ onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB" }}>

      {/* Breadcrumb */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F3F4F6", padding: "10px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#9CA3AF", fontFamily: "inherit", padding: 0, transition: "color .12s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#1A1F2E"}
            onMouseLeave={e => e.currentTarget.style.color = "#9CA3AF"}>
            <IcBack /> Zpět na úvod
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 24px 80px" }}>

        {/* Hlavička */}
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#F97316", marginBottom: 12 }}>
            PRO ŠIKULY
          </div>
          <h1 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 700, color: "#1A1F2E", letterSpacing: "-.025em", lineHeight: 1.15, marginBottom: 14 }}>
            Podpora pro šikuly
          </h1>
          <p style={{ fontSize: 16, color: "#6B7280", lineHeight: 1.7, maxWidth: 500, margin: "0 auto" }}>
            Potřebujete poradit s registrací, tarifem, poptávkou nebo fakturací? Napište nám, pomůžeme vám najít řešení.
          </p>
        </div>

        {/* Karty */}
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1F2E", letterSpacing: "-.015em", marginBottom: 20, textAlign: "center" }}>
            S čím vám můžeme pomoct?
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {CARDS.map(c => (
              <div key={c.title}
                style={{ background: "#fff", borderRadius: 16, padding: "22px", border: "1px solid #F3F4F6", boxShadow: "0 1px 3px rgba(0,0,0,.05)", transition: "all .18s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.09)"; e.currentTarget.style.borderColor = c.color + "33"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.05)"; e.currentTarget.style.borderColor = "#F3F4F6"; }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, color: c.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <c.Icon />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1F2E", marginBottom: 6, letterSpacing: "-.01em" }}>{c.title}</div>
                <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Časté dotazy */}
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1F2E", letterSpacing: "-.015em", marginBottom: 20, textAlign: "center" }}>
            Časté dotazy
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQ_SIKULOVE.map((it, i) => <AccordionItem key={i} q={it.q} a={it.a} />)}
          </div>
        </div>

        {/* Kontaktní blok */}
        <div style={{ marginTop: 40, background: "linear-gradient(135deg, #FFF7ED 0%, #FFF4E8 100%)", border: "1.5px solid #FED7AA", borderRadius: 20, padding: "36px 32px", textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#F97316", boxShadow: "0 2px 8px rgba(249,115,22,.2)" }}>
            <IcMail />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1A1F2E", marginBottom: 6, letterSpacing: "-.015em" }}>
            Napište nám na
          </h3>
          <a href="mailto:info@sikuladoma.cz?subject=Podpora pro šikuly"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 16, fontWeight: 700, color: "#F97316", textDecoration: "none", marginBottom: 20, letterSpacing: "-.01em" }}>
            info@sikuladoma.cz <IcArrow />
          </a>
          <div style={{ marginTop: 4 }}>
            <a href="mailto:info@sikuladoma.cz?subject=Podpora pro šikuly"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, padding: "0 28px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#F97316 0%,#EA580C 100%)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit", textDecoration: "none", letterSpacing: "-.01em", boxShadow: "0 4px 16px rgba(249,115,22,.35)", transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,#EA580C 0%,#C2410C 100%)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,#F97316 0%,#EA580C 100%)"; e.currentTarget.style.transform = "none"; }}>
              Napsat podpoře
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}

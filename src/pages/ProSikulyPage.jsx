// ─── SVG ikony ────────────────────────────────────────────────────────────────
const IcUser     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IcTag      = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
const IcBell     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
const IcCheck    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcUsers    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
const IcReceipt  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
const IcStar     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const IcArrow    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
const IcBack     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>

const STEPS = [
  { n: 1, Icon: IcUser,    bg: "#FFF7ED", color: "#F97316", title: "Zaregistrujete se jako šikula",        desc: "Vyplníte základní údaje, lokalitu a služby, které nabízíte." },
  { n: 2, Icon: IcTag,     bg: "#EFF6FF", color: "#3B82F6", title: "Vyberete si tarif",                    desc: "Zvolíte variantu podle toho, kolik zakázek chcete dostávat a jak aktivně chcete platformu využívat." },
  { n: 3, Icon: IcBell,    bg: "#F0FDF4", color: "#22C55E", title: "Dostáváte poptávky z okolí",           desc: "Když zákazník ve vaší lokalitě zadá poptávku, dostanete upozornění." },
  { n: 4, Icon: IcCheck,   bg: "#FAF5FF", color: "#A855F7", title: "Reagujete jen na zakázky, které chcete", desc: "Vy sami si vyberete, na co odpovíte. Žádné povinné zakázky, žádný tlak." },
  { n: 5, Icon: IcUsers,   bg: "#F0F9FF", color: "#0EA5E9", title: "Domluvíte se přímo se zákazníkem",    desc: "Cenu, termín i podrobnosti práce si domluvíte přímo mezi sebou." },
  { n: 6, Icon: IcReceipt, bg: "#FDF4FF", color: "#C026D3", title: "Vystavíte fakturu jednoduše",         desc: "Vyšší tarify obsahují jednoduchý online fakturovač pro rychlé vystavení faktury zákazníkovi." },
  { n: 7, Icon: IcStar,    bg: "#FFFBEB", color: "#D97706", title: "Budujete si hodnocení",               desc: "Spokojení zákazníci vám zanechají hodnocení a pomáhají vám získávat další práci." },
]

const BENEFITS = [
  { bg: "#FFF7ED", color: "#F97316", text: "Zakázky ve vašem okolí" },
  { bg: "#EFF6FF", color: "#3B82F6", text: "Bez zbytečné administrativy" },
  { bg: "#F0FDF4", color: "#22C55E", text: "Vy si vybíráte zakázky" },
  { bg: "#FAF5FF", color: "#A855F7", text: "Platba přímo od zákazníka" },
]

export default function ProSikulyPage({ onBack, onReg }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); * { font-family: 'Inter', system-ui, sans-serif !important; }`}</style>

      {/* Breadcrumb */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F3F4F6", padding: "10px 24px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#9CA3AF", fontFamily: "inherit", padding: 0, transition: "color .12s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#1A1F2E"}
            onMouseLeave={e => e.currentTarget.style.color = "#9CA3AF"}>
            <IcBack /> Zpět na úvod
          </button>
        </div>
      </div>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(150deg,#fff 0%,#FFF7ED 100%)", padding: "72px 24px 64px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 45% 55% at 5% 95%,rgba(219,234,254,.45) 0%,transparent 60%),radial-gradient(ellipse 40% 45% at 95% 5%,rgba(255,237,213,.5) 0%,transparent 55%)" }} />
        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>

          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FFF7ED", border: "1.5px solid #FED7AA", color: "#C2410C", borderRadius: 999, padding: "5px 16px", fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 24 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#F97316", display: "inline-block" }} />
            PRO ŠIKULY
          </div>

          <h1 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 700, color: "#1A1F2E", letterSpacing: "-.025em", lineHeight: 1.15, marginBottom: 16, fontFamily: "'Inter', system-ui, sans-serif" }}>
            Jak to funguje<br />
            <span style={{ color: "#F97316" }}>pro šikuly</span>
          </h1>

          <p style={{ fontSize: 16, color: "#6B7280", lineHeight: 1.75, maxWidth: 520, margin: "0 auto 16px" }}>
            Jste živnostník, šikovný domácí kutil nebo menší firma a chcete získávat zakázky ve svém okolí? ŠikulaDoma je postavený tak, aby registrace byla jednoduchá, rychlá a praktická. Žádné zbytečné papírování, žádné složité nastavování.
          </p>
          <p style={{ fontSize: 15, color: "#9CA3AF", lineHeight: 1.65, maxWidth: 480, margin: "0 auto 36px" }}>
            Vyplníte, co umíte, kde chcete zakázky, a můžete začít dostávat poptávky.
          </p>

          {/* Benefit chips */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 36 }}>
            {BENEFITS.map(b => (
              <div key={b.text} style={{ display: "inline-flex", alignItems: "center", padding: "6px 14px", borderRadius: 999, background: b.bg, color: b.color, fontSize: 13, fontWeight: 600 }}>
                {b.text}
              </div>
            ))}
          </div>

          <button
            onClick={onReg}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 52, padding: "0 32px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#F97316 0%,#EA580C 100%)", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "inherit", letterSpacing: "-.01em", boxShadow: "0 4px 18px rgba(249,115,22,.38)", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,#EA580C 0%,#C2410C 100%)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(249,115,22,.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,#F97316 0%,#EA580C 100%)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(249,115,22,.38)"; e.currentTarget.style.transform = "none"; }}
          >
            Chci být šikula <IcArrow />
          </button>

        </div>
      </section>

      {/* ── KROKY ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: "72px 24px 80px", background: "#F9FAFB" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#3B82F6", marginBottom: 10 }}>POSTUP</div>
            <h2 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 700, color: "#1A1F2E", letterSpacing: "-.02em", marginBottom: 10, fontFamily: "'Inter', system-ui, sans-serif" }}>
              Zaregistrujete se, vyberete si tarif a reagujete jen na zakázky, které vám dávají smysl.
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {STEPS.map((step, i) => (
              <div key={step.n} style={{ display: "flex", gap: 20, paddingBottom: i < STEPS.length - 1 ? 28 : 0 }}>
                {/* Číslo + linka */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: step.bg, display: "flex", alignItems: "center", justifyContent: "center", color: step.color, flexShrink: 0 }}>
                    <step.Icon />
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: "#E5E7EB", marginTop: 6, marginBottom: 0, borderRadius: 1 }} />
                  )}
                </div>
                {/* Text */}
                <div style={{ paddingBottom: i < STEPS.length - 1 ? 10 : 0, paddingTop: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: step.color, background: step.bg, padding: "2px 8px", borderRadius: 999 }}>{step.n}</span>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1A1F2E", letterSpacing: "-.01em", fontFamily: "'Inter', system-ui, sans-serif" }}>{step.title}</h3>
                  </div>
                  <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.65 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA dole */}
          <div style={{ textAlign: "center", marginTop: 56, padding: "40px 32px", background: "#fff", borderRadius: 20, border: "1px solid #F3F4F6", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1A1F2E", letterSpacing: "-.02em", marginBottom: 8 }}>
              Připraveni začít?
            </h3>
            <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 24, lineHeight: 1.65 }}>
              Registrace je zdarma. Tarif si vyberete po přihlášení.
            </p>
            <button
              onClick={onReg}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 50, padding: "0 32px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#F97316 0%,#EA580C 100%)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit", letterSpacing: "-.01em", boxShadow: "0 4px 16px rgba(249,115,22,.35)", transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,#EA580C 0%,#C2410C 100%)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,#F97316 0%,#EA580C 100%)"; e.currentTarget.style.transform = "none"; }}
            >
              Chci být šikula <IcArrow />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

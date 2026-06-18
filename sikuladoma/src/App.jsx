import { useState } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const SERVICES = [
  { id: "montaz", label: "Montáž nábytku", icon: "🪑" },
  { id: "vrtani", label: "Vrtání a věšení", icon: "🪛" },
  { id: "opravy", label: "Drobné opravy", icon: "🔧" },
  { id: "uklid", label: "Úklid", icon: "🧹" },
  { id: "zehleni", label: "Žehlení", icon: "👕" },
  { id: "cisteni", label: "Čištění sedačky", icon: "🛋️" },
  { id: "elektro", label: "Elektro", icon: "⚡" },
  { id: "instalater", label: "Instalatér", icon: "🚿" },
  { id: "malovani", label: "Malování", icon: "🖌️" },
  { id: "zahrada", label: "Zahrada", icon: "🌿" },
];

const PLANS = [
  {
    id: "start",
    name: "Start",
    price: "Zdarma",
    period: "",
    perks: ["3 reakce měsíčně", "Základní profil", "Recenze zákazníků"],
    featured: false,
  },
  {
    id: "plus",
    name: "Plus",
    price: "299 Kč",
    period: "/měs",
    perks: ["20 reakcí měsíčně", "Lepší pozice ve výsledcích", "Statistiky profilu", "Fakturační modul"],
    featured: false,
  },
  {
    id: "profi",
    name: "Profi",
    price: "599 Kč",
    period: "/měs",
    perks: ["80 reakcí měsíčně", "Přednostní zobrazení", "Ověřený odznak ✓", "Plný fakturační modul", "Urgentní notifikace"],
    featured: true,
  },
  {
    id: "top",
    name: "Top Šikula",
    price: "999 Kč",
    period: "/měs",
    perks: ["Neomezené reakce", "Top pozice vždy", "Dedikovaný support", "Vše z Profi tarifu", "Brandovaný profil"],
    featured: false,
  },
];

// ─── ICONS ───────────────────────────────────────────────────────────────────

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const X = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── MULTI-STEP FORM ─────────────────────────────────────────────────────────

const STEPS = ["Služba", "Popis", "Lokalita", "Rychlost", "Kontakt"];

function OrderForm({ initialService, onClose, onDone }) {
  const [step, setStep] = useState(initialService ? 1 : 0);
  const [form, setForm] = useState({
    service: initialService || null,
    desc: "",
    city: "",
    priority: null,
    name: "",
    email: "",
    phone: "",
  });

  const upd = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const canNext = () => {
    if (step === 0) return !!form.service;
    if (step === 1) return form.desc.trim().length >= 10;
    if (step === 2) return form.city.trim().length >= 2;
    if (step === 3) return !!form.priority;
    if (step === 4) return form.name.trim() && form.email.includes("@");
    return false;
  };

  const next = () => { if (canNext()) setStep((s) => s + 1); };
  const back = () => setStep((s) => Math.max(0, s - 1));

  if (step === 5) {
    return (
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={{ textAlign: "center", padding: "48px 32px" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1B2430", marginBottom: 8 }}>
              Poptávka odeslána!
            </h2>
            <p style={{ color: "#6B7A8D", fontSize: 15, lineHeight: 1.65, marginBottom: 8 }}>
              Šikulové z okolí vám brzy pošlou nabídky.<br />
              Nabídky najdete na <strong>{form.email}</strong>.
            </p>
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "14px 20px", marginBottom: 28, textAlign: "left" }}>
              {[
                ["📋", "Služba", form.service?.label],
                ["📍", "Lokalita", form.city],
                ["⚡", "Rychlost", { urgent: "Do 48 hodin", soon: "Do 14 dní", flexible: "Flexibilní" }[form.priority]],
              ].map(([ic, k, v]) => (
                <div key={k} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6, fontSize: 14 }}>
                  <span>{ic}</span><span style={{ color: "#6B7A8D" }}>{k}:</span><strong style={{ color: "#1B2430" }}>{v}</strong>
                </div>
              ))}
            </div>
            <button style={styles.btnOrange} onClick={onClose}>Zpět na úvod</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #E8EDF2" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#FF8C00", marginBottom: 2 }}>
              Krok {step + 1} z {STEPS.length} — {STEPS[step]}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1B2430" }}>Zadat poptávku</div>
          </div>
          <button style={styles.iconBtn} onClick={onClose}><X /></button>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 4, padding: "12px 22px 0" }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? "#FF8C00" : "#E8EDF2", transition: "background .3s" }} />
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: "22px 22px 4px" }}>

          {/* STEP 0 – Služba */}
          {step === 0 && (
            <div>
              <p style={styles.stepHint}>Co potřebujete vyřešit?</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {SERVICES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => upd("service", s)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "12px 14px", borderRadius: 10, border: "1.5px solid",
                      borderColor: form.service?.id === s.id ? "#FF8C00" : "#E8EDF2",
                      background: form.service?.id === s.id ? "#FFF7ED" : "#fff",
                      cursor: "pointer", fontSize: 14, fontWeight: 600,
                      color: form.service?.id === s.id ? "#C2410C" : "#1B2430",
                      transition: "all .14s",
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{s.icon}</span>{s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1 – Popis */}
          {step === 1 && (
            <div>
              <p style={styles.stepHint}>Popište, co přesně potřebujete</p>
              <textarea
                autoFocus
                value={form.desc}
                onChange={(e) => upd("desc", e.target.value)}
                placeholder="Např. potřebuji smontovat skříň PAX 200×60 cm, mám vše doma, jen nemám čas..."
                style={{ ...styles.input, minHeight: 120, resize: "vertical" }}
              />
              <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 6 }}>
                {form.desc.length < 10 ? `Napište alespoň ${10 - form.desc.length} znaků` : "✓ Dobrý popis"}
              </p>
              <div style={{ marginTop: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#6B7A8D", marginBottom: 8 }}>Fotky (volitelné)</p>
                <div style={{ border: "2px dashed #E8EDF2", borderRadius: 10, padding: "20px", textAlign: "center", color: "#94A3B8", fontSize: 13, cursor: "pointer" }}>
                  📷 Klikněte nebo přetáhněte fotky sem
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 – Lokalita */}
          {step === 2 && (
            <div>
              <p style={styles.stepHint}>Kde se práce provede?</p>
              <input
                autoFocus
                value={form.city}
                onChange={(e) => upd("city", e.target.value)}
                placeholder="Např. Praha 6 – Dejvice"
                style={styles.input}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                <div>
                  <label style={styles.label}>Patro</label>
                  <input style={styles.input} placeholder="přízemí / 3. patro" />
                </div>
                <div>
                  <label style={styles.label}>Parkování</label>
                  <select style={styles.input}>
                    <option>Zdarma před domem</option>
                    <option>Placené v okolí</option>
                    <option>Bez parkování</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 – Rychlost */}
          {step === 3 && (
            <div>
              <p style={styles.stepHint}>Jak rychle to potřebujete?</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { id: "urgent", emoji: "🔥", label: "Už to hoří", sub: "Do 48 hodin", bg: "#FEF2F2", border: "#FCA5A5", active: "#EF4444" },
                  { id: "soon", emoji: "⚡", label: "Spěchá", sub: "Do 14 dní", bg: "#FEFCE8", border: "#FDE68A", active: "#D97706" },
                  { id: "flexible", emoji: "🕐", label: "Počkám si", sub: "Flexibilní termín", bg: "#F8FAFC", border: "#E2E8F0", active: "#64748B" },
                ].map((opt) => {
                  const sel = form.priority === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => upd("priority", opt.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                        borderRadius: 12, border: `2px solid ${sel ? opt.active : opt.border}`,
                        background: sel ? opt.bg : "#fff", cursor: "pointer", textAlign: "left",
                        transition: "all .14s",
                      }}
                    >
                      <span style={{ fontSize: 26 }}>{opt.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: sel ? opt.active : "#1B2430" }}>{opt.label}</div>
                        <div style={{ fontSize: 13, color: "#6B7A8D", marginTop: 1 }}>{opt.sub}</div>
                      </div>
                      {sel && (
                        <div style={{ width: 22, height: 22, borderRadius: 999, background: opt.active, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                          <Check />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4 – Kontakt */}
          {step === 4 && (
            <div>
              <p style={styles.stepHint}>Kam vám pošleme nabídky?</p>
              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "12px 16px", marginBottom: 18, fontSize: 13, color: "#1D4ED8" }}>
                ✓ Registraci nevyžadujeme. Účet vytvoříme automaticky.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={styles.label}>Jméno *</label>
                  <input value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="Jana Nováková" style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>E-mail *</label>
                  <input value={form.email} onChange={(e) => upd("email", e.target.value)} placeholder="vas@email.cz" type="email" style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>Telefon (volitelné)</label>
                  <input value={form.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="+420 777 000 000" type="tel" style={styles.input} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "18px 22px", display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E8EDF2", marginTop: 18 }}>
          {step > 0
            ? <button style={styles.btnGhost} onClick={back}>← Zpět</button>
            : <span />}
          <button
            style={{ ...styles.btnOrange, opacity: canNext() ? 1 : .45, cursor: canNext() ? "pointer" : "not-allowed" }}
            onClick={step < 4 ? next : () => setStep(5)}
          >
            {step < 4 ? "Pokračovat" : "Odeslat poptávku ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── REGISTRATION FORM ────────────────────────────────────────────────────────

function RegForm({ plan, onClose }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", ico: "", email: "", services: [], city: "", plan: plan?.id || "start" });
  const upd = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const toggleSvc = (id) => setForm((p) => ({ ...p, services: p.services.includes(id) ? p.services.filter((x) => x !== id) : [...p.services, id] }));

  if (step === 2) return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: "center", padding: "48px 32px" }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🛠️</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1B2430", marginBottom: 8 }}>Profil vytvořen!</h2>
          <p style={{ color: "#6B7A8D", fontSize: 15, lineHeight: 1.65, marginBottom: 24 }}>
            Vítejte v ŠikulaDoma, <strong>{form.name}</strong>!<br />
            Tarif <strong>{PLANS.find(p => p.id === form.plan)?.name}</strong> je aktivní.
          </p>
          <button style={styles.btnOrange} onClick={onClose}>Jít na dashboard →</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #E8EDF2" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#0077B6", marginBottom: 2 }}>
              Registrace šikuly — krok {step + 1}/2
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1B2430" }}>
              {step === 0 ? "Základní údaje" : "Vaše služby a tarif"}
            </div>
          </div>
          <button style={styles.iconBtn} onClick={onClose}><X /></button>
        </div>
        <div style={{ padding: "22px" }}>
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label style={styles.label}>Jméno / název *</label><input value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="Pavel Šikovný" style={styles.input} /></div>
              <div><label style={styles.label}>IČO</label><input value={form.ico} onChange={(e) => upd("ico", e.target.value)} placeholder="12345678" style={styles.input} /></div>
              <div><label style={styles.label}>E-mail *</label><input value={form.email} onChange={(e) => upd("email", e.target.value)} placeholder="vas@email.cz" type="email" style={styles.input} /></div>
              <div><label style={styles.label}>Město / oblast</label><input value={form.city} onChange={(e) => upd("city", e.target.value)} placeholder="Praha a okolí" style={styles.input} /></div>
            </div>
          )}
          {step === 1 && (
            <div>
              <p style={styles.stepHint}>Jaké služby nabízíte?</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                {SERVICES.map((s) => {
                  const sel = form.services.includes(s.id);
                  return (
                    <button key={s.id} onClick={() => toggleSvc(s.id)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${sel ? "#0077B6" : "#E8EDF2"}`, background: sel ? "#EFF6FF" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: sel ? "#0077B6" : "#1B2430", transition: "all .14s" }}>
                      <span>{s.icon}</span>{s.label}
                    </button>
                  );
                })}
              </div>
              <p style={styles.stepHint}>Vybraný tarif</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {PLANS.map((p) => (
                  <button key={p.id} onClick={() => upd("plan", p.id)}
                    style={{ padding: "12px 14px", borderRadius: 10, border: `2px solid ${form.plan === p.id ? "#FF8C00" : "#E8EDF2"}`, background: form.plan === p.id ? "#FFF7ED" : "#fff", cursor: "pointer", textAlign: "left", transition: "all .14s" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: form.plan === p.id ? "#C2410C" : "#1B2430" }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: "#6B7A8D" }}>{p.price}{p.period}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: "16px 22px", borderTop: "1px solid #E8EDF2", display: "flex", gap: 10, justifyContent: "space-between" }}>
          {step > 0 ? <button style={styles.btnGhost} onClick={() => setStep(0)}>← Zpět</button> : <span />}
          <button style={{ ...styles.btnBlue }} onClick={() => { if (step === 0 && form.name && form.email) setStep(1); else if (step === 1) setStep(2); }}>
            {step === 0 ? "Pokračovat →" : "Vytvořit profil ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const styles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(6px)" },
  modal: { background: "#fff", borderRadius: 20, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.18)", animation: "modalUp .22s ease" },
  btnOrange: { display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 24px", borderRadius: 10, border: "none", background: "#FF8C00", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", transition: "all .14s", fontFamily: "inherit" },
  btnBlue: { display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 24px", borderRadius: 10, border: "none", background: "#0077B6", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", transition: "all .14s", fontFamily: "inherit" },
  btnGhost: { display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 18px", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "transparent", color: "#64748B", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
  iconBtn: { width: 32, height: 32, borderRadius: 999, border: "none", background: "#F1F5F9", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  input: { width: "100%", padding: "11px 14px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 15, outline: "none", fontFamily: "inherit", color: "#1B2430", background: "#fff", transition: "border-color .14s", boxSizing: "border-box" },
  label: { display: "block", fontSize: 12, fontWeight: 700, color: "#6B7A8D", marginBottom: 5, letterSpacing: ".03em", textTransform: "uppercase" },
  stepHint: { fontSize: 15, color: "#475569", marginBottom: 14, lineHeight: 1.5 },
};

// ─── APP SHELL ───────────────────────────────────────────────────────────────

export default function App() {
  const [orderForm, setOrderForm] = useState(null); // null | { service }
  const [regForm, setRegForm] = useState(null);     // null | { plan }
  const [priority, setPriority] = useState(null);

  const openOrder = (service = null) => setOrderForm({ service });
  const openReg = (plan = null) => setRegForm({ plan });
  const closeOrder = () => setOrderForm(null);
  const closeReg = () => setRegForm(null);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', system-ui, sans-serif; background: #F8FAFC; color: #1B2430; -webkit-font-smoothing: antialiased; }
        button { font-family: inherit; cursor: pointer; }
        input, textarea, select { font-family: inherit; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
        @keyframes modalUp { from { opacity:0; transform:translateY(14px) scale(.97); } to { opacity:1; transform:none; } }
        .nav-link { padding: 6px 12px; border-radius: 8px; font-size: 14px; font-weight: 500; color: #475569; border: none; background: none; cursor: pointer; transition: all .12s; }
        .nav-link:hover { color: #1B2430; background: #F1F5F9; }
        .svc-btn { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 18px 12px; background: #fff; border: 1.5px solid #E8EDF2; border-radius: 14px; cursor: pointer; font-size: 13px; font-weight: 600; color: #1B2430; transition: all .16s; }
        .svc-btn:hover { border-color: #FF8C00; background: #FFF7ED; color: #C2410C; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,.08); }
        .pri-btn { display: flex; align-items: center; gap: 10px; padding: 10px 18px; border-radius: 999px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .14s; }
        .pri-btn:hover { transform: translateY(-1px); }
        .how-card { background: #fff; border: 1px solid #E8EDF2; border-radius: 18px; padding: 28px; transition: all .16s; }
        .how-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,.08); transform: translateY(-2px); }
        .price-card { background: #fff; border: 1.5px solid #E8EDF2; border-radius: 18px; padding: 26px 22px; transition: all .16s; position: relative; }
        .price-card:hover { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(0,0,0,.1); }
        .price-card.featured { border: 2px solid #FF8C00; }
        .hero-input { flex: 1; padding: 16px 18px; border: 1.5px solid #E2E8F0; border-radius: 12px; font-size: 15px; outline: none; transition: border-color .14s; }
        .hero-input:focus { border-color: #0077B6; }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid #E8EDF2", height: 58, display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ fontWeight: 800, fontSize: 19, letterSpacing: "-.03em", cursor: "pointer" }} onClick={() => scrollTo("hero")}>
            <span style={{ color: "#0077B6" }}>Šikula</span><span style={{ color: "#FF8C00" }}>Doma</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button className="nav-link" onClick={() => scrollTo("how")}>Jak to funguje</button>
            <button className="nav-link" onClick={() => scrollTo("services")}>Služby</button>
            <button className="nav-link" onClick={() => scrollTo("pricing")}>Ceník</button>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ ...styles.btnGhost, fontSize: 14 }} onClick={() => openReg()}>Přihlásit</button>
            <button style={{ ...styles.btnOrange, fontSize: 14, padding: "8px 18px" }} onClick={() => openOrder()}>Zadat poptávku</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section id="hero" style={{ background: "linear-gradient(160deg,#F8FAFC 0%,#FFF7ED 100%)", padding: "88px 24px 72px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 55% 60% at 10% 90%,rgba(219,234,254,.6) 0%,transparent 65%),radial-gradient(ellipse 40% 50% at 90% 10%,rgba(255,237,213,.55) 0%,transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#2563EB", borderRadius: 999, padding: "4px 14px", fontSize: 13, fontWeight: 600, marginBottom: 26 }}>
            ✦ Nestíháte nebo doma něco spěchá? Šikula to udělá za vás.
          </div>

          <h1 style={{ fontSize: "clamp(36px,6vw,60px)", fontWeight: 800, color: "#1B2430", lineHeight: 1.12, letterSpacing: "-.03em", marginBottom: 16 }}>
            Doma něco čeká?{" "}
            <span style={{ color: "#FF8C00" }}>Šikula to zařídí.</span>
          </h1>

          <p style={{ fontSize: 18, color: "#64748B", marginBottom: 36, lineHeight: 1.65, maxWidth: 500, margin: "0 auto 36px" }}>
            Vyberte službu, napište pár detailů a šikulové z okolí vám pošlou nabídky.
          </p>

          {/* Search bar */}
          <div style={{ display: "flex", gap: 8, maxWidth: 580, margin: "0 auto 20px", background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,.08)" }}>
            <input className="hero-input" style={{ border: "none", borderRadius: 0, flex: 1 }} placeholder="Např. smontovat skříň, uklidit byt..." onKeyDown={(e) => e.key === "Enter" && openOrder()} />
            <button style={{ ...styles.btnOrange, borderRadius: 0, padding: "14px 24px", fontSize: 15 }} onClick={() => openOrder()}>
              Najít šikulu
            </button>
          </div>

          {/* Priority pills */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
            {[
              { id: "urgent", label: "🔥 Už to hoří (do 48 h)", bg: priority === "urgent" ? "#EF4444" : "#FEE2E2", color: priority === "urgent" ? "#fff" : "#991B1B" },
              { id: "soon", label: "⚡ Spěchá (do 14 dní)", bg: priority === "soon" ? "#D97706" : "#FEF3C7", color: priority === "soon" ? "#fff" : "#92400E" },
              { id: "flexible", label: "🕐 Počkám si", bg: priority === "flexible" ? "#475569" : "#F1F5F9", color: priority === "flexible" ? "#fff" : "#475569" },
            ].map((p) => (
              <button key={p.id} className="pri-btn" style={{ background: p.bg, color: p.color }} onClick={() => { setPriority(p.id); openOrder(); }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <button style={{ ...styles.btnOrange, padding: "13px 28px", fontSize: 15 }} onClick={() => openOrder()}>
              Zadat poptávku zdarma
            </button>
            <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "13px 24px", borderRadius: 10, border: "1.5px solid #0077B6", background: "transparent", color: "#0077B6", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }} onClick={() => scrollTo("pricing")}>
              Chci vydělávat jako šikula
            </button>
          </div>

          {/* Trust pills */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginTop: 28 }}>
            {["✓ Ověření šikulové", "✓ Nabídky zdarma", "✓ Zákazník nic neplatí", "✓ Platíte přímo šikulovi"].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 999, fontSize: 12, fontWeight: 500, color: "#475569", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE STATS ──────────────────────────────────── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E8EDF2", padding: "12px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", justifyContent: "center", flexWrap: "wrap" }}>
          {[["🟢", "23", "poptávek přidáno dnes"], ["👷", "187", "šikulů je aktivních"], ["⚡", "do 2 hodin", "průměrná první odezva"]].map(([ic, val, label], i, arr) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 24px", borderRight: i < arr.length - 1 ? "1px solid #E8EDF2" : "none" }}>
              <span>{ic}</span>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#1B2430" }}>{val}</span>
              <span style={{ fontSize: 13, color: "#64748B" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SERVICES ────────────────────────────────────── */}
      <section id="services" style={{ padding: "72px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#0077B6", marginBottom: 8 }}>CO VYŘEŠÍME</div>
            <h2 style={{ fontSize: "clamp(26px,3vw,38px)", fontWeight: 800, color: "#1B2430", letterSpacing: "-.025em" }}>Vyberte službu</h2>
            <p style={{ fontSize: 15, color: "#64748B", marginTop: 8 }}>Klikněte a rovnou zadejte poptávku – bez registrace.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>
            {SERVICES.map((s) => (
              <button key={s.id} className="svc-btn" onClick={() => openOrder(s)}>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <section id="how" style={{ padding: "72px 24px", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#0077B6", marginBottom: 8 }}>JAK TO FUNGUJE</div>
            <h2 style={{ fontSize: "clamp(26px,3vw,38px)", fontWeight: 800, color: "#1B2430", letterSpacing: "-.025em" }}>Tři kroky a je hotovo</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
            {[
              { n: "1", title: "Popište práci", desc: "Bez registrace. Napište, co potřebujete, kde a kdy. Trvá to 2 minuty.", icon: "📝" },
              { n: "2", title: "Dostanete nabídky", desc: "Ověření šikulové z vašeho okolí vám sami napíšou cenu a termín.", icon: "💬" },
              { n: "3", title: "Vyberete a hotovo", desc: "Porovnáte, vyberete, šikula přijede. Platíte přímo jemu po dokončení.", icon: "✅" },
            ].map((step) => (
              <div key={step.n} className="how-card">
                <div style={{ width: 38, height: 38, background: "#0077B6", color: "#fff", borderRadius: 9, fontWeight: 800, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{step.n}</div>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{step.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1B2430", marginBottom: 7 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────── */}
      <section id="pricing" style={{ padding: "72px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#0077B6", marginBottom: 8 }}>PRO ŠIKULY</div>
            <h2 style={{ fontSize: "clamp(26px,3vw,38px)", fontWeight: 800, color: "#1B2430", letterSpacing: "-.025em", marginBottom: 10 }}>Vyberte si tarif</h2>
            <p style={{ fontSize: 15, color: "#64748B" }}>Zákazníci zadávají poptávky vždy zdarma. Šikulové platí za přístup k poptávkám.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
            {PLANS.map((plan) => (
              <div key={plan.id} className={`price-card${plan.featured ? " featured" : ""}`} style={plan.featured ? { background: "#1E293B", color: "#fff", border: "2px solid #FF8C00" } : {}}>
                {plan.featured && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#FF8C00", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 14px", borderRadius: 999, letterSpacing: ".06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    Nejoblíbenější
                  </div>
                )}
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: plan.featured ? "rgba(255,255,255,.45)" : "#94A3B8", marginBottom: 6 }}>{plan.name}</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: plan.featured ? "#FF8C00" : "#1B2430", lineHeight: 1, marginBottom: 4 }}>
                  {plan.price}<span style={{ fontSize: 15, fontWeight: 400, opacity: .6 }}>{plan.period}</span>
                </div>
                <div style={{ height: 1, background: plan.featured ? "rgba(255,255,255,.12)" : "#E8EDF2", margin: "16px 0" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                  {plan.perks.map((perk) => (
                    <div key={perk} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: plan.featured ? "rgba(255,255,255,.7)" : "#475569" }}>
                      <span style={{ color: plan.featured ? "#FF8C00" : "#10B981", flexShrink: 0 }}><Check /></span>{perk}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => openReg(plan)}
                  style={{ width: "100%", padding: "11px", borderRadius: 9, border: "none", background: plan.featured ? "#FF8C00" : "#F1F5F9", color: plan.featured ? "#fff" : "#1B2430", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", transition: "all .14s" }}
                  onMouseEnter={(e) => { e.target.style.opacity = ".88"; }}
                  onMouseLeave={(e) => { e.target.style.opacity = "1"; }}
                >
                  {plan.price === "Zdarma" ? "Začít zdarma" : "Vybrat tarif"}
                </button>
              </div>
            ))}
          </div>
          <div style={{ background: "#F8FAFC", border: "1px solid #E8EDF2", borderRadius: 14, padding: "18px 24px", marginTop: 28, textAlign: "center", fontSize: 14, color: "#64748B" }}>
            ŠikulaDoma <strong>nebere provizi</strong> ze zakázky. Platba probíhá přímo mezi zákazníkem a šikulou.
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer style={{ background: "#0F172A", color: "rgba(255,255,255,.55)", padding: "48px 24px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr", gap: 40, marginBottom: 36 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
                <span style={{ color: "#60A5FA" }}>Šikula</span><span style={{ color: "#FB923C" }}>Doma</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 260 }}>Spojujeme lidi s šikulami. Montáž, opravy, úklid, čištění – cokoliv doma.</p>
            </div>
            <div>
              <h4 style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Pro zákazníky</h4>
              {["Zadat poptávku", "Jak to funguje", "Kategorie", "Bezpečnost"].map((l) => (
                <div key={l} style={{ fontSize: 13, marginBottom: 7, cursor: "pointer" }} onClick={() => l === "Zadat poptávku" && openOrder()}>{l}</div>
              ))}
            </div>
            <div>
              <h4 style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Pro šikuly</h4>
              {["Zaregistrovat se", "Tarify", "Podmínky", "Podpora"].map((l) => (
                <div key={l} style={{ fontSize: 13, marginBottom: 7, cursor: "pointer" }} onClick={() => l === "Zaregistrovat se" && openReg()}>{l}</div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 18, display: "flex", justifyContent: "space-between", fontSize: 12, flexWrap: "wrap", gap: 8 }}>
            <span>© 2024 ŠikulaDoma s.r.o.</span>
            <span>Vyrobeno v Praze 🇨🇿</span>
          </div>
        </div>
      </footer>

      {/* ── MODALS ──────────────────────────────────────── */}
      {orderForm !== null && (
        <OrderForm initialService={orderForm.service} onClose={closeOrder} />
      )}
      {regForm !== null && (
        <RegForm plan={regForm.plan} onClose={closeReg} />
      )}
    </>
  );
}

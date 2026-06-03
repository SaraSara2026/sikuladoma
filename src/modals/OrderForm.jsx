// Poptávkový formulář — 6 kroků (kategorie → služba → upřesnění → místo → čas → kontakt).
// Po dokončení zobrazí confirmation screen.
//
// Pozn. zatím neukládá poptávku do DB (App.jsx legacy). Reálné odesílání řeší
// src/pages/NewOrderPage.jsx přes ordersApi.create().

import { useState } from "react";
import { T, S, inp, lbl } from "../ui/theme";
import { IconBtn, BtnGhost } from "../ui/Button";
import {
  IcX, IcCheck, IcArrow, IcCheckCircle,
  IcMapPin, IcTag, IcClock, IcFlame, IcZap, IcCalendar, IcShield,
} from "../ui/icons/UIIcons";
import { CATEGORIES, SUBCATEGORIES, OTHER, CAT_COLORS } from "../lib/categories";

const STEP_LABELS = ["Kategorie", "Služba", "Upřesnění", "Místo", "Čas", "Kontakt"];
const TOTAL = 6;

export default function OrderForm({ initialService, initialCategory, initialCity, onClose }) {
  const initCat = initialService
    ? CATEGORIES.find(c => c.id === initialService.id) || null
    : initialCategory
      ? CATEGORIES.find(c => c.id === initialCategory) || null
      : null;
  const [step, setStep]     = useState(initCat ? (initialCity ? 3 : 1) : 0);
  const [category, setCat]  = useState(initCat);
  const [subSvc, setSubSvc] = useState(null);
  const [desc, setDesc]     = useState("");
  const [city, setCity]     = useState(initialCity || "");
  const [floor, setFloor]   = useState("");
  const [priority, setPrio] = useState(null);
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [phone, setPhone]   = useState("");
  const [done, setDone]     = useState(false);

  const colCat = category ? (CAT_COLORS[category.id] || { bg:"#F8FAFC", ic:"#64748B" }) : null;

  const canNext = () => {
    if (step === 0) return !!category;
    if (step === 1) return !!subSvc;
    if (step === 2) return true;
    if (step === 3) return city.trim().length >= 2;
    if (step === 4) return !!priority;
    if (step === 5) return name.trim() && email.includes("@");
    return false;
  };

  const next = () => { if (canNext()) setStep(s => s + 1); };
  const back = () => setStep(s => Math.max(0, s - 1));

  if (done) return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "48px 36px", textAlign: "center" }}>
          <div style={{ width: 58, height: 58, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#16A34A" }}>
            <IcCheckCircle />
          </div>
          <h2 style={{ fontSize: 21, fontWeight: 700, color: T.ink, marginBottom: 8, letterSpacing: "-.02em" }}>
            Hotovo. Šikulové už o vás vědí.
          </h2>
          <p style={{ color: T.ink3, fontSize: 14, lineHeight: 1.65, marginBottom: 22 }}>
            Do pár minut začnete dostávat nabídky od šikulů z okolí.
          </p>
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "12px 16px", marginBottom: 20, textAlign: "left" }}>
            {["Průměrná první reakce do 2 hodin", "Nabídky zdarma", "Platíte až po dokončení práce"].map(t => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7, fontSize: 13, color: T.ink2 }}>
                <span style={{ color: "#16A34A", flexShrink: 0 }}><IcCheck /></span>{t}
              </div>
            ))}
          </div>
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px 15px", marginBottom: 22, textAlign: "left" }}>
            {[
              [<IcTag />,    "Kategorie", category?.label],
              [<IcTag />,    "Služba",    subSvc],
              [<IcMapPin />, "Místo",     city],
              [<IcClock />,  "Čas",       { urgent:"Do 48 hodin", soon:"Do 7 dní", flexible:"Flexibilně" }[priority]],
            ].filter(([,, v]) => v).map(([ic, k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, fontSize: 13 }}>
                <span style={{ color: T.ink4, flexShrink: 0 }}>{ic}</span>
                <span style={{ color: T.ink3 }}>{k}:</span>
                <strong style={{ color: T.ink }}>{v}</strong>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={onClose}
              style={{ height: 42, padding: "0 22px", borderRadius: 10, border: "none", background: T.orange, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              Zpět na úvod
            </button>
            <BtnGhost onClick={() => {
              setCat(null); setSubSvc(null); setDesc(""); setCity(""); setFloor("");
              setPrio(null); setName(""); setEmail(""); setPhone(""); setDone(false); setStep(0);
            }}>
              Zadat další poptávku
            </BtnGhost>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 540 }} onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {category && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 8, background: colCat.bg, fontSize: 12, fontWeight: 600, color: colCat.ic }}>
                <category.Icon size={13} /> {category.label}
              </div>
            )}
            {subSvc && step > 1 && (
              <div style={{ fontSize: 12, color: T.ink4, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                · {subSvc}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 12, color: T.ink4, fontWeight: 600 }}>{step + 1} / {TOTAL}</div>
            <IconBtn onClick={onClose}><IcX /></IconBtn>
          </div>
        </div>

        <div style={{ display: "flex", gap: 3, padding: "10px 20px 0" }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step ? T.blue : i === step ? T.orange : T.border, transition: "background .3s" }} />
          ))}
        </div>

        <div style={{ padding: "12px 20px 0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.orange }}>{STEP_LABELS[step]}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.ink, marginTop: 2 }}>
            {step === 0 && "Co potřebujete vyřešit?"}
            {step === 1 && "Vyberte konkrétní službu"}
            {step === 2 && "Upřesněte poptávku"}
            {step === 3 && "Kde se práce provede?"}
            {step === 4 && "Jak rychle to potřebujete?"}
            {step === 5 && "Kam vám pošleme nabídky?"}
          </div>
        </div>

        <div style={{ padding: "16px 20px 4px", maxHeight: "55vh", overflowY: "auto" }}>

          {step === 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {CATEGORIES.map(cat => {
                const c = CAT_COLORS[cat.id] || { bg:"#F8FAFC", ic:"#64748B" };
                return (
                  <button key={cat.id}
                    onClick={() => { setCat(cat); setSubSvc(null); setStep(1); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500, color: T.ink, transition: "all .14s", fontFamily: "inherit", textAlign: "left", boxShadow: "0 1px 2px rgba(0,0,0,.04)" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = c.ic; e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,.08)`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04)"; }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: c.ic }}>
                      <cat.Icon size={16} />
                    </div>
                    {cat.label}
                  </button>
                );
              })}
            </div>
          )}

          {step === 1 && category && (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {SUBCATEGORIES[category.id]?.filter(s => s !== OTHER).map(sub => {
                const sel = subSvc === sub;
                return (
                  <button key={sub}
                    onClick={() => { setSubSvc(sub); }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${sel ? colCat.ic : T.border}`, background: sel ? colCat.bg : "#fff", cursor: "pointer", fontSize: 14, fontWeight: sel ? 600 : 400, color: sel ? colCat.ic : T.ink, transition: "all .12s", fontFamily: "inherit", textAlign: "left" }}
                    onMouseEnter={e => { if (!sel) { e.currentTarget.style.borderColor = colCat.ic; e.currentTarget.style.background = colCat.bg; } }}
                    onMouseLeave={e => { if (!sel) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "#fff"; } }}
                  >
                    {sub}
                    {sel && <span style={{ color: colCat.ic, flexShrink: 0 }}><IcCheck /></span>}
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <textarea autoFocus value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Popište situaci, rozměry, co je potřeba přinést… Čím víc napíšete, tím přesnější nabídky dostanete."
              style={{ ...inp, minHeight: 110, resize: "vertical" }} />
          )}

          {step === 3 && (
            <div>
              <input autoFocus value={city} onChange={e => setCity(e.target.value)}
                placeholder="Praha 6 – Dejvice" style={inp} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                <div>
                  <label style={lbl}>Patro</label>
                  <input value={floor} onChange={e => setFloor(e.target.value)}
                    style={inp} placeholder="přízemí / 3. patro" />
                </div>
                <div>
                  <label style={lbl}>Parkování</label>
                  <select style={{ ...inp, cursor: "pointer", appearance: "none" }}>
                    <option>Zdarma před domem</option>
                    <option>Placené v okolí</option>
                    <option>Bez parkování</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { id: "urgent",   Icon: IcFlame,    label: "Do 48 hodin",  sub: "Urgentní – potřebuji co nejdříve", selBg: "#FEF2F2", selBorder: T.red,    selColor: T.red },
                { id: "soon",     Icon: IcZap,      label: "Do 7 dní",     sub: "Spěchá, ale není to požár",         selBg: "#FFF7ED", selBorder: "#F97316", selColor: "#C2410C" },
                { id: "flexible", Icon: IcCalendar, label: "Flexibilně",   sub: "Počkám si, domluva na termínu",    selBg: "#F8FAFC", selBorder: T.ink3,   selColor: T.ink3 },
              ].map(opt => {
                const sel = priority === opt.id;
                return (
                  <button key={opt.id} onClick={() => setPrio(opt.id)}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${sel ? opt.selBorder : T.border}`, background: sel ? opt.selBg : "#fff", cursor: "pointer", textAlign: "left", transition: "all .14s", fontFamily: "inherit" }}
                    onMouseEnter={e => { if (!sel) { e.currentTarget.style.borderColor = opt.selBorder; e.currentTarget.style.background = opt.selBg; } }}
                    onMouseLeave={e => { if (!sel) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "#fff"; } }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: sel ? opt.selBg : T.bg, display: "flex", alignItems: "center", justifyContent: "center", color: sel ? opt.selColor : T.ink4, flexShrink: 0 }}>
                      <opt.Icon />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: sel ? opt.selColor : T.ink, letterSpacing: "-.01em" }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: T.ink4, marginTop: 2 }}>{opt.sub}</div>
                    </div>
                    {sel && <span style={{ color: opt.selColor, flexShrink: 0 }}><IcCheck /></span>}
                  </button>
                );
              })}
            </div>
          )}

          {step === 5 && (
            <div>
              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 9, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: T.blueDark, display: "flex", alignItems: "center", gap: 8 }}>
                <IcShield /><span>Registraci nevyžadujeme. Účet vytvoříme automaticky.</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                <div><label style={lbl}>Jméno *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Jana Nováková" style={inp} autoFocus /></div>
                <div><label style={lbl}>E-mail *</label><input value={email} onChange={e => setEmail(e.target.value)} placeholder="vas@email.cz" type="email" style={inp} /></div>
                <div><label style={lbl}>Telefon</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+420 777 000 000" type="tel" style={inp} /></div>
              </div>
            </div>
          )}

        </div>

        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${T.border}`, marginTop: 12 }}>
          {step > 0
            ? <BtnGhost size="sm" onClick={back}>← Zpět</BtnGhost>
            : <span />}
          {step === 0 ? <span /> : (
            <button
              onClick={step < TOTAL - 1 ? next : () => setDone(true)}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, height: 42, padding: "0 22px", borderRadius: 10, border: "none", background: canNext() ? T.orange : T.border, color: canNext() ? "#fff" : T.ink4, fontWeight: 600, fontSize: 14, cursor: canNext() ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all .15s" }}
            >
              {step < TOTAL - 1 ? <>Pokračovat <IcArrow /></> : "Odeslat poptávku"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

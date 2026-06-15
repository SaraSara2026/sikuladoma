// Registrace šikuly — 2 kroky + úspěšná obrazovka.
// Volá /api/auth/register a předá user nadřazenému App.jsx přes onRegistered.

import { useState } from "react";
import { T, S, inp, lbl, hint } from "../ui/theme";
import { IconBtn, BtnGhost, BtnBlue } from "../ui/Button";
import { IcX, IcArrow, IcCheckCircle } from "../ui/icons/UIIcons";
import { SERVICES } from "../lib/categories";
import { PLANS } from "../lib/plans";
import { apiRegister } from "../lib/auth.js";
import PasswordField from "../components/PasswordField";

export default function RegForm({ plan, onClose, onRegistered }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", ico: "", email: "", password: "",
    street: "", city: "", psc: "",
    services: [], plan: plan?.id || "start",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [registeredUser, setRegisteredUser] = useState(null);

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleSvc = id => setForm(p => ({
    ...p,
    services: p.services.includes(id) ? p.services.filter(x => x !== id) : [...p.services, id],
  }));

  const submitRegistration = async () => {
    setErr(null);
    setBusy(true);
    try {
      const { user } = await apiRegister({
        email:    form.email,
        password: form.password,
        name:     form.name,
        role:     "sikula",
        city:     [form.street, form.psc, form.city].filter(Boolean).join(", ") || form.city,
      });
      // Pokud zvolen placený tarif → přesměruj na Stripe Checkout.
      // Backend stále uloží uživatele s plan='start'; Stripe webhook po platbě upraví na zvolený plán.
      if (form.plan && form.plan !== 'start') {
        try {
          const res = await fetch('/api/stripe?action=checkout', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: form.plan }),
          });
          const data = await res.json();
          if (res.ok && data.url) {
            window.location.href = data.url;
            return;
          }
          // Stripe selhal — pokračujeme jako start, řekneme uživateli ať platí později.
          console.warn('Stripe checkout selhal:', data.error);
        } catch (stripeErr) {
          console.warn('Stripe checkout error:', stripeErr);
        }
      }
      // Free tarif nebo Stripe selhání → ukáže success screen.
      // Pozn.: onRegistered NEZAVOLÁME hned — nejdřív musíme uživateli ukázat success obrazovku.
      // onRegistered (která změní page na dashboard) se zavolá až po kliknutí "Přejít do profilu".
      setRegisteredUser({ ...user, services: form.services, plan: form.plan, ico: form.ico });
      setStep(2);
    } catch (e) {
      setErr(e.message || "Registrace selhala.");
    } finally {
      setBusy(false);
    }
  };

  if (step === 2) return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "48px 32px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", color: "#16A34A" }}>
            <IcCheckCircle />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 10 }}>Profil vytvořen 🎉</h2>
          <p style={{ color: T.ink3, fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
            Vítej v ŠikulaDoma, <strong>{form.name}</strong>.
          </p>
          <div style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 10, padding: "14px 16px", marginBottom: 24, textAlign: "left" }}>
            <div style={{ fontWeight: 700, color: "#92400E", fontSize: 13, marginBottom: 6 }}>✉️ Ověř svůj e-mail</div>
            <div style={{ fontSize: 13, color: "#78350F", lineHeight: 1.5 }}>
              Poslali jsme ti ověřovací odkaz na <strong>{form.email}</strong>. Bez ověření nemůžeš posílat nabídky ani zprávy.
            </div>
          </div>
          <button onClick={() => { if (registeredUser) onRegistered(registeredUser); onClose(); }}
            style={{ height: 46, padding: "0 28px", borderRadius: 10, border: "none", background: T.orange, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8 }}>
            Přejít do profilu šikuly <IcArrow />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.blue, marginBottom: 2 }}>
              Registrace šikuly — krok {step + 1}/2
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.ink }}>{step === 0 ? "Základní údaje" : "Služby a tarif"}</div>
          </div>
          <IconBtn onClick={onClose}><IcX /></IconBtn>
        </div>

        <div style={{ padding: "20px" }}>
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <div><label style={lbl}>Jméno / název *</label><input value={form.name} onChange={e => upd("name", e.target.value)} placeholder="Pavel Šikovný" style={inp} autoFocus /></div>
              <div><label style={lbl}>IČO (volitelné)</label><input value={form.ico} onChange={e => upd("ico", e.target.value)} placeholder="12345678" style={inp} /></div>
              <div><label style={lbl}>E-mail *</label><input value={form.email} onChange={e => upd("email", e.target.value)} placeholder="vas@email.cz" type="email" autoComplete="email" style={inp} /></div>
              <div><label style={lbl}>Heslo * (min. 8 znaků)</label><PasswordField value={form.password} onChange={e => upd("password", e.target.value)} autoComplete="new-password" /></div>
              <div><label style={lbl}>Ulice a číslo popisné</label><input value={form.street || ""} onChange={e => upd("street", e.target.value)} placeholder="Hlavní 42" style={inp} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
                <div><label style={lbl}>Město / oblast *</label><input value={form.city} onChange={e => upd("city", e.target.value)} placeholder="Praha a okolí" style={inp} /></div>
                <div><label style={lbl}>PSČ</label><input value={form.psc || ""} onChange={e => upd("psc", e.target.value)} placeholder="110 00" style={inp} /></div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div>
              <p style={hint}>Jaké služby nabízíte?</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 20 }}>
                {SERVICES.map(s => {
                  const sel = form.services.includes(s.id);
                  return (
                    <button key={s.id} onClick={() => toggleSvc(s.id)} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "9px 12px",
                      borderRadius: 8, border: `1.5px solid ${sel ? T.blue : T.border}`,
                      background: sel ? T.blueLight : "#fff", cursor: "pointer",
                      fontSize: 13, fontWeight: 600, color: sel ? T.blue : T.ink,
                      transition: "all .14s", fontFamily: "inherit",
                    }}>
                      <span style={{ color: sel ? T.blue : T.ink4 }}><s.Icon size={16} /></span>{s.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ padding: "10px 13px", borderRadius: 9, border: `1.5px solid ${T.orange}`, background: T.orangeLt }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.orangeDk }}>Aktivní šikula — první měsíc zdarma</div>
                <div style={{ fontSize: 12, color: T.ink4, marginTop: 2 }}>399 Kč / měsíc · první platba až po skončení zkušebního měsíce</div>
              </div>
            </div>
          )}
        </div>

        {err && (
          <div style={{ margin: "0 20px", padding: "9px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 12, color: "#B91C1C" }}>
            {err}
          </div>
        )}

        <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between" }}>
          {step > 0 ? <BtnGhost size="sm" onClick={() => setStep(0)}>Zpět</BtnGhost> : <span />}
          <BtnBlue size="sm" disabled={busy} onClick={() => {
            setErr(null);
            if (step === 0) {
              const fullName = (form.name || "").trim();
              if (!fullName)                         return setErr("Zadejte jméno.");
              if (!/^\S+\s+\S+/.test(fullName))      return setErr("Zadejte jméno i příjmení.");
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setErr("Zadejte platný e-mail.");
              if ((form.password || "").length < 8) return setErr("Heslo musí mít alespoň 8 znaků.");
              if (!form.city?.trim())               return setErr("Zadejte město.");
              return setStep(1);
            }
            if (step === 1 && !busy) {
              if (form.services.length === 0) return setErr("Vyberte alespoň jednu službu, kterou nabízíte.");
              submitRegistration();
            }
          }}>
            {step === 0 ? <>Pokračovat <IcArrow /></> : (busy ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: 8 }} /> Vytvářím účet…</> : "Vytvořit profil")}
          </BtnBlue>
        </div>
      </div>
    </div>
  );
}

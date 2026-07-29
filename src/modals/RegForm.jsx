// Registrace šikuly — 2 kroky + úspěšná obrazovka.
// Volá /api/auth/register a předá user nadřazenému App.jsx přes onRegistered.

import { useState } from "react";
import { T, S, inp, lbl, hint } from "../ui/theme";
import { IconBtn, BtnGhost, BtnBlue } from "../ui/Button";
import { IcX, IcArrow } from "../ui/icons/UIIcons";
import { SERVICES } from "../lib/categories";
import { apiRegister, apiCheckEmail, apiResendVerification } from "../lib/auth.js";
import PasswordField from "../components/PasswordField";

export default function RegForm({ plan, onClose, onRegistered, onLogin, onForgot }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", ico: "", email: "", password: "",
    street: "", city: "", psc: "",
    services: [], plan: plan?.id || "start",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  // Po dokončení registrace ukážeme, jestli se ověřovací e-mail opravdu
  // odeslal — "Poslali jsme vám e-mail" nesmí tvrdit něco, co se nestalo.
  const [regResult, setRegResult] = useState(null); // { user, verificationEmailSent }
  const [resendState, setResendState] = useState('idle'); // idle | sending | sent | error
  const [resendMsg, setResendMsg] = useState('');

  const continueFromStep0 = async () => {
    setErr(null);
    const fullName = (form.name || "").trim();
    if (!fullName)                         return setErr("Zadejte jméno.");
    if (!/^\S+\s+\S+/.test(fullName))      return setErr("Zadejte jméno i příjmení.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setErr("Zadejte platný e-mail.");
    if ((form.password || "").length < 8) return setErr("Heslo musí mít alespoň 8 znaků.");
    if (!form.city?.trim())               return setErr("Zadejte město.");

    setCheckingEmail(true);
    try {
      const { exists } = await apiCheckEmail(form.email);
      if (exists) { setEmailTaken(true); return; }
      setStep(1);
    } catch (e) {
      setErr(e.message || "Nepodařilo se ověřit e-mail. Zkuste to znovu.");
    } finally {
      setCheckingEmail(false);
    }
  };

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleSvc = id => setForm(p => ({
    ...p,
    services: p.services.includes(id) ? p.services.filter(x => x !== id) : [...p.services, id],
  }));

  const submitRegistration = async () => {
    setErr(null);
    setBusy(true);
    try {
      // Registrace je zdarma — žádný Stripe checkout. Šikula se rovnou dostane
      // do dashboardu a tarif (aktivaci reakcí na poptávky) si vybere později sám.
      const { user, verificationEmailSent } = await apiRegister({
        email:    form.email,
        password: form.password,
        name:     form.name,
        role:     "sikula",
        city:     [form.street, form.psc, form.city].filter(Boolean).join(", ") || form.city,
        services: form.services,
      });
      setRegResult({ user: { ...user, ico: form.ico }, verificationEmailSent: !!verificationEmailSent });
    } catch (e) {
      setErr(e.message || "Registrace selhala.");
    } finally {
      setBusy(false);
    }
  };

  const resendVerification = async () => {
    setResendState('sending');
    setResendMsg('');
    try {
      await apiResendVerification();
      setResendState('sent');
      setResendMsg('Poslali jsme vám ověřovací e-mail znovu.');
    } catch (e) {
      setResendState('error');
      setResendMsg(e.message || 'Ověřovací e-mail se nepodařilo odeslat. Zkuste to znovu.');
    }
  };

  if (regResult) return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "8px 32px 32px", textAlign: "center", paddingTop: 32 }}>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: T.ink, marginBottom: 10 }}>Registrace dokončena</h2>
          <p style={{ color: T.ink3, fontSize: 14, lineHeight: 1.7, marginBottom: 18 }}>
            {regResult.verificationEmailSent
              ? "Poslali jsme vám ověřovací e-mail."
              : "Ověřovací e-mail se nepodařilo odeslat. Zkuste to znovu."}
          </p>
          {!regResult.verificationEmailSent && (
            <>
              {resendMsg && (
                <div style={{ marginBottom: 14, fontSize: 13, color: resendState === 'error' ? '#B91C1C' : '#166534' }}>
                  {resendMsg}
                </div>
              )}
              <button onClick={resendVerification} disabled={resendState === 'sending' || resendState === 'sent'}
                style={{ width: "100%", height: 46, borderRadius: 10, border: "none", background: resendState === 'sent' ? '#D1FAE5' : T.blue, color: resendState === 'sent' ? '#065F46' : "#fff", fontWeight: 700, fontSize: 14, cursor: resendState === 'sending' || resendState === 'sent' ? 'default' : "pointer", fontFamily: "inherit", marginBottom: 10 }}>
                {resendState === 'sending' ? 'Posílám…' : resendState === 'sent' ? '✓ Odesláno' : 'Poslat ověřovací e-mail znovu'}
              </button>
            </>
          )}
          <button onClick={() => { onRegistered(regResult.user); onClose(); }}
            style={{ width: "100%", height: 46, borderRadius: 10, border: `1.5px solid ${T.border}`, background: "#fff", color: T.ink, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            Pokračovat do profilu
          </button>
        </div>
      </div>
    </div>
  );

  if (emailTaken) return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "16px 20px 0" }}>
          <IconBtn onClick={onClose}><IcX /></IconBtn>
        </div>
        <div style={{ padding: "8px 32px 32px", textAlign: "center" }}>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: T.ink, marginBottom: 10 }}>Tento e-mail už je registrovaný</h2>
          <p style={{ color: T.ink3, fontSize: 14, lineHeight: 1.7, marginBottom: 22 }}>
            Tento e-mail už je registrovaný. Přihlaste se, nebo si obnovte heslo.
          </p>
          <button onClick={() => { onClose(); onLogin?.(); }}
            style={{ width: "100%", height: 46, borderRadius: 10, border: "none", background: T.blue, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>
            Přihlásit se
          </button>
          <button onClick={() => { onClose(); onForgot?.(); }}
            style={{ width: "100%", height: 46, borderRadius: 10, border: `1.5px solid ${T.border}`, background: "#fff", color: T.ink, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit", marginBottom: 14 }}>
            Zapomenuté heslo
          </button>
          <button onClick={() => setEmailTaken(false)}
            style={{ background: "none", border: "none", color: T.ink3, fontSize: 12, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
            Zkusit jiný e-mail
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
            <div style={{ fontSize: 17, fontWeight: 700, color: T.ink }}>{step === 0 ? "Základní údaje" : "Služby"}</div>
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
              <div style={{ padding: "16px 13px", borderRadius: 12, border: `1.5px solid ${T.border}`, background: T.blueLight, textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: T.ink, marginBottom: 4 }}>Registrace je zdarma</div>
                <div style={{ fontSize: 13, color: T.ink3 }}>Po registraci uvidíte poptávky ve svém okolí. Tarif pro reakce na poptávky a kontakt se zákazníky si vyberete později v profilu.</div>
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
          <BtnBlue size="sm" disabled={busy || checkingEmail} onClick={() => {
            if (step === 0) return continueFromStep0();
            if (step === 1 && !busy) {
              setErr(null);
              if (form.services.length === 0) return setErr("Vyberte alespoň jednu službu, kterou nabízíte.");
              submitRegistration();
            }
          }}>
            {step === 0
              ? (checkingEmail ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: 8 }} /> Ověřuji e-mail…</> : <>Pokračovat <IcArrow /></>)
              : (busy ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: 8 }} /> Zpracovávám…</> : <>Dokončit registraci <IcArrow /></>)}
          </BtnBlue>
        </div>
      </div>
    </div>
  );
}

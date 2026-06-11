// Login modal — e-mail + heslo. Bez magic-link, bez OAuth.
// Po úspěšném loginu volá onDemoLogin(user) (zachovaný název kvůli App.jsx state).

import { useState } from "react";
import { T, S, inp, lbl } from "../ui/theme";
import { IconBtn } from "../ui/Button";
import { IcX, IcArrow } from "../ui/icons/UIIcons";
import { apiLogin } from "../lib/auth.js";
import PasswordField from "../components/PasswordField";

export default function LoginModal({ onClose, onReg, onOrder, onFaktury, onDemoLogin, onGetDemo, onForgot }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async () => {
    setErr(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setErr("Zadejte platnou e-mailovou adresu.");
    if (password.length < 1) return setErr("Zadejte heslo.");
    setBusy(true);
    try {
      const { user } = await apiLogin({ email, password });
      onDemoLogin(user);
      onClose();
    } catch (e) {
      setErr(e.message || "Přihlášení selhalo.");
    } finally {
      setBusy(false);
    }
  };

  const loginAsDemoSikula = async () => {
    setEmail("pavel@example.com");
    setPassword("demo1234");
    setErr(null);
    setBusy(true);
    try {
      const { user } = await apiLogin({ email: "pavel@example.com", password: "demo1234" });
      onDemoLogin(user);
      onClose();
    } catch (e) {
      setErr(e.message || "Demo přihlášení selhalo. Spusť `npm run db:seed`?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.ink }}>Přihlášení</div>
          <IconBtn onClick={onClose}><IcX /></IconBtn>
        </div>

        <div style={{ padding: "22px 22px 14px" }}>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>E-mail</label>
            <input autoFocus value={email} onChange={e => { setEmail(e.target.value); setErr(null); }}
              type="email" placeholder="vas@email.cz" autoComplete="email" style={inp}
              onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Heslo</label>
            <PasswordField
              value={password}
              onChange={e => { setPassword(e.target.value); setErr(null); }}
              autoComplete="current-password"
              onKeyDown={e => e.key === "Enter" && submit()}
            />
          </div>

          {err && (
            <div style={{ marginBottom: 14, padding: "9px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 12, color: "#B91C1C" }}>
              {err}
            </div>
          )}

          <button onClick={submit} disabled={busy}
            style={{ width: "100%", height: 46, borderRadius: 10, border: "none",
              background: busy ? T.border : T.orange, color: "#fff",
              fontWeight: 700, fontSize: 14, cursor: busy ? "wait" : "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, transition: "all .15s" }}>
            {busy ? "Přihlašuji…" : <>Přihlásit se <IcArrow /></>}
          </button>

          {onForgot && (
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <button type="button" onClick={() => { onClose(); onForgot(); }}
                style={{ background: "none", border: "none", color: T.blue, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0, textDecoration: "underline" }}>
                Zapomenuté heslo?
              </button>
            </div>
          )}
        </div>

        {/* Demo přístup */}
        <div style={{ margin: "0 22px 16px", padding: "12px 14px", background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 8 }}>Demo přístup</div>
          <button onClick={loginAsDemoSikula} disabled={busy}
            style={{ width: "100%", height: 36, borderRadius: 9, border: "1px solid #CBD5E1", background: "#fff", color: "#1A1F2E", fontWeight: 600, fontSize: 13, cursor: busy ? "wait" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            🔑 Přihlásit jako demo šikula
          </button>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6, textAlign: "center" }}>
            pavel@example.com · heslo demo1234
          </div>
        </div>

        <div style={{ padding: "12px 22px 22px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10, textAlign: "center" }}>Nemáte účet?</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { onClose(); onReg(); }}
              style={{ flex: 1, height: 40, borderRadius: 10, border: `1.5px solid ${T.orange}`, background: "#FFF7ED", color: T.orange, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Registrace šikuly
            </button>
            <button onClick={() => { onClose(); onOrder(); }}
              style={{ flex: 1, height: 40, borderRadius: 10, border: `1.5px solid ${T.blue}`, background: "#EFF6FF", color: T.blue, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Poptávka zákazníka
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

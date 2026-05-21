// Legacy embedded SikulaDashboard z původního App.jsx — používá localStorage
// pro stav profilu (žádná DB integrace). App.jsx ho renderuje pro page="dashboard".
//
// Cílově nahradit `src/pages/dashboards/SikulaDashboard.jsx`, který už používá
// reálné /api/orders + /api/offers. Zatím existují vedle sebe (App.jsx používá tento).

import { useState } from "react";
import { T, inp, lbl } from "../../ui/theme";
import { SERVICES } from "../../lib/categories";
import { PLANS } from "../../lib/plans";

export default function SikulaDashboardLegacy({ user, onLogout, initTab }) {
  const [tab, setTab] = useState(initTab || "prehled");
  const [profile, setProfile] = useState({
    name:    user?.name    || "",
    email:   user?.email   || "",
    phone:   user?.phone   || "",
    city:    user?.city    || "",
    street:  user?.street  || "",
    psc:     user?.psc     || "",
    ico:     user?.ico     || "",
    bio:     user?.bio     || "",
    services: user?.services || [],
  });
  const [saved, setSaved] = useState(false);

  const plan = PLANS.find(p => p.id === user?.plan) || PLANS[0];
  const upd = (k, v) => setProfile(p => ({ ...p, [k]: v }));
  const toggleSvc = id => setProfile(p => ({
    ...p,
    services: p.services.includes(id) ? p.services.filter(x => x !== id) : [...p.services, id],
  }));

  const saveProfile = () => {
    try {
      const stored = localStorage.getItem("sd_user");
      if (stored) {
        const u = JSON.parse(stored);
        localStorage.setItem("sd_user", JSON.stringify({ ...u, ...profile }));
      }
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const TABS = [
    { id: "prehled",   label: "Přehled" },
    { id: "profil",    label: "Profil" },
    { id: "poptavky",  label: "Poptávky" },
    { id: "hodnoceni", label: "Hodnocení" },
  ];

  const STATS = [
    { label: "Stav účtu",          value: plan.name, color: "#F97316", bg: "#FFF7ED" },
    { label: "Dokončené zakázky",  value: "0",       color: "#3B82F6", bg: "#EFF6FF" },
    { label: "Průměrné hodnocení", value: "—",       color: "#22C55E", bg: "#F0FDF4" },
    { label: "Nové poptávky",      value: "0",       color: "#A855F7", bg: "#FAF5FF" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Header */}
        <div style={{ background: "#fff", borderRadius: 18, padding: "22px 26px", border: "1px solid #F3F4F6", boxShadow: "0 1px 4px rgba(0,0,0,.05)", marginBottom: 22, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#F97316,#EA580C)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
            {(profile.name || "Š")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1A1F2E", letterSpacing: "-.02em" }}>{profile.name || "Šikula"}</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>{profile.email} {profile.city ? `· ${profile.city}` : ""}</div>
          </div>
          <button onClick={onLogout}
            style={{ padding: "6px 14px", borderRadius: 9, border: "1px solid #E5E7EB", background: "none", fontSize: 13, color: "#6B7280", cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.borderColor = "#FECACA"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#6B7280"; e.currentTarget.style.borderColor = "#E5E7EB"; }}>
            Odhlásit
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 3, background: "#F3F4F6", borderRadius: 12, padding: 4, marginBottom: 24, width: "fit-content" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: "8px 18px", borderRadius: 9, border: "none", background: tab === t.id ? "#fff" : "transparent", color: tab === t.id ? "#1A1F2E" : "#6B7280", fontWeight: tab === t.id ? 600 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all .14s", boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,.08)" : "none" }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "prehled" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
              {STATS.map(s => (
                <div key={s.label} style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 14, padding: "18px 16px", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: "-.02em", marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 14, padding: "20px 22px", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1A1F2E", marginBottom: 4 }}>Moje poptávky</div>
                <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.55, marginBottom: 14 }}>Zatím žádné nové poptávky. Jakmile zákazník ve vašem okolí zadá poptávku, zobrazí se zde.</div>
                <button onClick={() => setTab("poptavky")} style={{ fontSize: 13, fontWeight: 600, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>Zobrazit poptávky →</button>
              </div>
              <div style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 14, padding: "20px 22px", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1A1F2E", marginBottom: 4 }}>Hodnocení</div>
                <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.55, marginBottom: 14 }}>Zatím žádná hodnocení. Po dokončení zakázky dostane zákazník odkaz na hodnocení.</div>
                <button onClick={() => setTab("hodnoceni")} style={{ fontSize: 13, fontWeight: 600, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>Zobrazit hodnocení →</button>
              </div>
            </div>
          </div>
        )}

        {tab === "profil" && (
          <div style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 16, padding: "28px 28px", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1F2E", marginBottom: 20, letterSpacing: "-.01em" }}>Základní informace</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div><label style={lbl}>Jméno / název *</label><input value={profile.name} onChange={e => upd("name", e.target.value)} style={inp} placeholder="Pavel Šikovný" /></div>
              <div><label style={lbl}>Telefon</label><input value={profile.phone} onChange={e => upd("phone", e.target.value)} style={inp} placeholder="+420 777 000 000" /></div>
              <div><label style={lbl}>E-mail</label><input value={profile.email} onChange={e => upd("email", e.target.value)} style={inp} type="email" /></div>
              <div><label style={lbl}>IČO (volitelné)</label><input value={profile.ico} onChange={e => upd("ico", e.target.value)} style={inp} placeholder="12345678" /></div>
              <div><label style={lbl}>Ulice a číslo</label><input value={profile.street} onChange={e => upd("street", e.target.value)} style={inp} placeholder="Hlavní 42" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
                <div><label style={lbl}>Město</label><input value={profile.city} onChange={e => upd("city", e.target.value)} style={inp} placeholder="Praha" /></div>
                <div><label style={lbl}>PSČ</label><input value={profile.psc} onChange={e => upd("psc", e.target.value)} style={inp} placeholder="110 00" /></div>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Krátký popis (volitelný)</label>
              <textarea value={profile.bio} onChange={e => upd("bio", e.target.value)} style={{ ...inp, minHeight: 80, resize: "vertical" }} placeholder="Čím se zabýváte, kde působíte, co umíte nejlépe…" />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={lbl}>Nabízené služby</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 6 }}>
                {SERVICES.map(s => {
                  const sel = profile.services.includes(s.id);
                  return (
                    <button key={s.id} onClick={() => toggleSvc(s.id)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 9, border: `1.5px solid ${sel ? T.blue : T.border}`, background: sel ? T.blueLight : "#fff", cursor: "pointer", fontSize: 13, fontWeight: sel ? 600 : 400, color: sel ? T.blue : T.ink, fontFamily: "inherit", transition: "all .12s" }}>
                      <span style={{ color: sel ? T.blue : T.ink4 }}><s.Icon size={15} /></span>{s.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={saveProfile}
                style={{ height: 44, padding: "0 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#F97316,#EA580C)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 3px 12px rgba(249,115,22,.3)", transition: "all .14s" }}>
                Uložit změny
              </button>
              {saved && <span style={{ fontSize: 13, color: "#22C55E", fontWeight: 600 }}>✓ Uloženo</span>}
            </div>
          </div>
        )}

        {tab === "poptavky" && (
          <div style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 16, padding: "48px 32px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 24 }}>📬</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1F2E", marginBottom: 6 }}>Zatím žádné poptávky</div>
            <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.65, maxWidth: 360, margin: "0 auto" }}>Jakmile zákazník ve vašem okolí zadá poptávku odpovídající vašim službám, zobrazí se zde.</div>
          </div>
        )}

        {tab === "hodnoceni" && (
          <div style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 16, padding: "48px 32px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 24 }}>⭐</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1F2E", marginBottom: 6 }}>Zatím žádná hodnocení</div>
            <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.65, maxWidth: 360, margin: "0 auto" }}>Hodnocení přibydou po dokončení zakázek. Zákazník dostane jednorázový odkaz na hodnocení e-mailem.</div>
          </div>
        )}

      </div>
    </div>
  );
}

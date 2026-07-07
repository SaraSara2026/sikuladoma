// Hlavní routing aplikace + globální stav (page, modaly, sikulaUser session).
// Veškerá UI byla rozdělena do menších souborů — viz src/ui/, src/modals/, src/pages/.

import { useState } from "react";

// Stránky
import InvoicePage from "./pages/InvoicePage";
import KontaktPage from "./pages/KontaktPage";
import ProSikulyPage from "./pages/ProSikulyPage.jsx";
import PodminkyProSikulyPage from "./pages/PodminkyProSikulyPage";
import PodporaProSikulyPage from "./pages/PodporaProSikulyPage";
import OchranaSoukromiPage from "./pages/OchranaSoukromiPage";
import PodminkyPouzitiPage from "./pages/PodminkyPouzitiPage";
import GDPRPage from "./pages/GDPRPage";
import CookiesPage from "./pages/CookiesPage";
import Layout from "./components/Layout";
import SikulaDashboard from "./pages/dashboards/SikulaDashboard.jsx";
import CustomerDashboard from "./pages/dashboards/CustomerDashboard.jsx";
import AdminDashboard from "./pages/dashboards/AdminDashboard.jsx";
import SendOfferPage from "./pages/SendOfferPage.jsx";
import SikulaProfilePage from "./pages/SikulaProfilePage.jsx";
import OrderDetailPage from "./pages/OrderDetailPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import SikuloveListPage from "./pages/SikuloveListPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import PageMeta from "./components/PageMeta.jsx";
import FAQPage from "./pages/FAQPage.jsx";

// Modaly
import OrderForm  from "./modals/OrderForm.jsx";
import RegForm    from "./modals/RegForm.jsx";
import LoginModal from "./modals/LoginModal.jsx";

// UI
import { T } from "./ui/theme";
import { BtnPrimary, BtnSecondary, BtnBlue } from "./ui/Button";
import { IcSearch, IcArrow, IcShield, IcStar, IcCheck, IcGlobe } from "./ui/icons/UIIcons";

// Data (jen pro homepage tile grid)
import { SERVICES } from "./lib/categories";

// SEO metadata pro každou hlavní route. Klíče = hodnoty `page` state.
const PAGE_META = {
  home:              { title: null, description: null }, // default z index.html
  sikulove:          { title: 'Šikulové v ČR',          description: 'Procházej ověřené šikuly podle kategorie a oblasti. Recenze, plán, kontakt.' },
  kontakt:           { title: 'Kontakt',                description: 'Napiš nám — odpovídáme do 24 hodin. ŠikulaDoma, Stavira s.r.o.' },
  sikuly:            { title: 'Chci vydělávat jako šikula', description: 'Registruj se zdarma a začni dostávat poptávky z okolí.' },
  faktury:           { title: 'Fakturace',              description: 'Vytvoř fakturu do 60 sekund — splňuje právní požadavky ČR.', noindex: true },
  dashboard:         { title: 'Můj dashboard',          description: null, noindex: true },
  chat:              { title: 'Zprávy',                 description: null, noindex: true },
  'order-detail':    { title: 'Detail poptávky',        description: null, noindex: true },
  'send-offer':      { title: 'Poslat nabídku',         description: null, noindex: true },
  cookies:           { title: 'Cookies',                description: 'Jak používáme cookies na ŠikulaDoma.' },
  gdpr:              { title: 'GDPR',                   description: 'Zásady ochrany osobních údajů.' },
  'ochrana-soukromi':   { title: 'Ochrana soukromí',    description: null },
  'podminky-pouziti':   { title: 'Podmínky používání',  description: null },
  'podminky-sikuly':    { title: 'Podmínky pro šikuly', description: null },
  'podpora-sikuly':     { title: 'Podpora pro šikuly',  description: null },
  'verify-email':       { title: 'Ověření e-mailu',     description: null, noindex: true },
  'forgot-password':    { title: 'Zapomenuté heslo',    description: null, noindex: true },
  'reset-password':     { title: 'Reset hesla',         description: null, noindex: true },
  faq:                  { title: 'Často kladené dotazy', description: 'Odpovědi na nejčastější otázky pro zákazníky i šikuly.' },
};


export default function App() {
  // Detekce ?page= z URL při startu (pro email linky verify-email + reset-password)
  const [page,        setPage]         = useState(() => {
    try {
      const p = new URL(window.location.href).searchParams.get('page');
      if (p === 'verify-email' || p === 'reset-password' || p === 'forgot-password') return p;
      if (p === 'sikulove' || p === 'kontakt' || p === 'sikuly' || p === 'pricing') return p;
    } catch {}
    return "home";
  });

  // SEO: per-route title + description
  const meta = PAGE_META[page] || PAGE_META.home;
  const [orderForm,   setOrderForm]    = useState(null);
  const [regForm,     setRegForm]      = useState(null);
  const [loginModal,  setLoginModal]   = useState(false);
  const [priority,    setPriority]     = useState(null);
  const [dashboardTab, setDashboardTab] = useState("prehled");
  const [currentOrder, setCurrentOrder] = useState(null); // pro SendOffer/OrderDetail navigaci
  const [profileId, setProfileId] = useState(() => {
    try { return new URL(window.location.href).searchParams.get('sikula'); } catch { return null; }
  });
  const [sikulaUser,  setSikulaUser]   = useState(() => {
    try { const s = localStorage.getItem("sd_user"); return s ? JSON.parse(s) : null; } catch { return null; }
  });

  // Navigace ze sub-stránek (dashboard, send-offer apod.).
  // Konvence: onNav('cílová-stránka', payload)
  const handleNav = (target, payload) => {
    if (target === "send-offer")   { setCurrentOrder(payload); setPage("send-offer"); window.scrollTo(0, 0); return; }
    if (target === "order-detail") { setCurrentOrder(payload); setPage("order-detail"); window.scrollTo(0, 0); return; }
    if (target === "chat")         { setPage("chat"); window.scrollTo(0, 0); return; }
    if (target === "dash-sikula" || target === "dash-customer") { setPage("dashboard"); window.scrollTo(0, 0); return; }
    if (target === "new-order")    { openOrder(); return; }
    if (target === "back" || target === "home") { setPage("home"); window.scrollTo(0, 0); return; }
    if (target === "logout")       { logoutSikula(); return; }
    // fallback: setPage napřímo (musí být známá stránka)
    setPage(target);
    window.scrollTo(0, 0);
  };

  // Login: uloží uživatele do localStorage + state, přesměruje dle role.
  const loginSikula = (user) => {
    try {
      localStorage.setItem("sd_user", JSON.stringify(user));
      if (user.email) {
        const profiles = JSON.parse(localStorage.getItem("sd_profiles") || "{}");
        profiles[user.email] = user;
        localStorage.setItem("sd_profiles", JSON.stringify(profiles));
      }
    } catch {}
    setSikulaUser(user);
    // Přesměrování dle role — všechny vedou na "dashboard", komponenta se vybere podle role
    setPage("dashboard");
    window.scrollTo(0, 0);
  };

  // Update přihlášeného uživatele (po PATCH /api/users/me) bez změny page.
  const updateSikula = (user) => {
    if (!user) return;
    try { localStorage.setItem("sd_user", JSON.stringify(user)); } catch {}
    setSikulaUser(user);
  };
  const logoutSikula = () => {
    try { localStorage.removeItem("sd_user"); } catch {}
    setSikulaUser(null);
    setPage("home");
    window.scrollTo(0, 0);
  };

  const openOrder = (svc = null, opts = {}) => setOrderForm({ service: svc, ...opts });
  const openReg   = (plan = null) => setRegForm({ plan });
  const scrollTo  = id => {
    if (page !== "home") {
      setPage("home");
      window.scrollTo(0, 0);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 120);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <PageMeta title={meta.title} description={meta.description} noindex={meta.noindex} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
        *{font-family:'Inter',system-ui,sans-serif;}
        body{background:${T.bg};color:${T.ink};}
        button,input,textarea,select{font-family:'Inter',system-ui,sans-serif;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-thumb{background:${T.border2};border-radius:3px;}
        @keyframes modalUp{from{opacity:0;transform:translateY(12px) scale(.98);}to{opacity:1;transform:none;}}
        @keyframes spin{to{transform:rotate(360deg);}}
        .nav-link{padding:6px 12px;border-radius:8px;font-size:14px;font-weight:500;color:${T.ink3};border:none;background:none;cursor:pointer;transition:all .12s;letter-spacing:-.01em;}
        .nav-link:hover{color:${T.ink};background:${T.bg};}
        .svc-tile{display:flex;flex-direction:column;align-items:center;gap:9px;padding:18px 12px;background:#fff;border:1px solid ${T.border};border-radius:14px;cursor:pointer;font-size:12px;font-weight:600;color:${T.ink};transition:all .18s;box-shadow:0 1px 3px rgba(0,0,0,.04);letter-spacing:-.01em;font-family:'Inter',system-ui,sans-serif;}
        .svc-tile:hover{border-color:${T.orange};color:${T.orangeDk};transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.08);}
        .svc-tile:hover .svc-tile-icon{color:${T.orange};}
        .how-card{background:#fff;border:1px solid ${T.border};border-radius:14px;padding:24px;transition:all .18s;box-shadow:0 1px 3px rgba(0,0,0,.05);font-family:'Inter',system-ui,sans-serif;}
        .how-card:hover{box-shadow:0 6px 24px rgba(0,0,0,.08);transform:translateY(-2px);}
        .pri-chip{display:inline-flex;align-items:center;gap:6px;padding:0 14px;height:36px;border-radius:10px;border:1.5px solid;font-size:13px;font-weight:500;cursor:pointer;transition:all .14s;font-family:inherit;letter-spacing:-.01em;}
      `}</style>

      <Layout
        T={T}
        BtnPrimary={BtnPrimary}
        onHome={() => { setPage("home"); window.scrollTo(0,0); }}
        onScrollTo={scrollTo}
        onOrder={() => openOrder()}
        onLogin={() => setLoginModal(true)}
        onReg={() => openReg()}
        onKontakt={() => { setPage("kontakt"); window.scrollTo(0,0); }}
        onSikuly={() => { setPage("sikuly"); window.scrollTo(0,0); }}
        onSikulove={() => { setPage("home"); window.scrollTo(0,0); }}
        onFAQ={() => { setPage("faq"); window.scrollTo(0,0); }}
        onPodminkySikuly={() => { setPage("podminky-sikuly"); window.scrollTo(0,0); }}
        onPodporaSikuly={() => { setPage("podpora-sikuly"); window.scrollTo(0,0); }}
        sikulaUser={sikulaUser}
        onDashboard={() => { setDashboardTab("prehled"); setPage("dashboard"); window.scrollTo(0,0); }}
        onProfil={() => { setDashboardTab("profil"); setPage("dashboard"); window.scrollTo(0,0); }}
        onLogout={logoutSikula}
        onOchrana={() => { setPage("ochrana-soukromi"); window.scrollTo(0,0); }}
        onPodminkyPouziti={() => { setPage("podminky-pouziti"); window.scrollTo(0,0); }}
        onCookies={() => { setPage("cookies"); window.scrollTo(0,0); }}
        onCookiesPage={() => { setPage("cookies"); window.scrollTo(0,0); }}
        onHow={() => { setPage("home"); window.scrollTo(0,0); setTimeout(() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" }), 100); }}
      >

      {profileId ? (
        <SikulaProfilePage id={profileId}
          onBack={() => { setProfileId(null); window.history.replaceState({}, '', '/'); }}
          onOrder={() => { setProfileId(null); window.history.replaceState({}, '', '/'); openOrder(); }} />
      ) : page === "dashboard" ? (
        sikulaUser?.role === "admin"
          ? <AdminDashboard     currentUser={sikulaUser} onLogout={logoutSikula} />
          : sikulaUser?.role === "customer"
            ? <CustomerDashboard currentUser={sikulaUser} onNav={handleNav} onLogout={logoutSikula} />
            : <SikulaDashboard   currentUser={sikulaUser} onNav={handleNav} onLogout={logoutSikula} onUpdateUser={updateSikula} />
      ) : page === "send-offer" ? (
        <SendOfferPage order={currentOrder} onNav={handleNav} onSend={() => { setCurrentOrder(null); }} />
      ) : page === "order-detail" ? (
        <OrderDetailPage order={currentOrder} currentUser={sikulaUser} onNav={handleNav}
          onAcceptOffer={() => { /* refresh dashboard po accept */ }} />
      ) : page === "chat" ? (
        <ChatPage />
      ) : page === "verify-email" ? (
        <VerifyEmailPage
          onBack={() => { setPage("home"); window.history.replaceState({}, '', '/'); }}
          onLogin={() => { setPage("home"); window.history.replaceState({}, '', '/'); setLoginModal(true); }} />
      ) : page === "forgot-password" ? (
        <ForgotPasswordPage
          onBack={() => { setPage("home"); window.history.replaceState({}, '', '/'); }} />
      ) : page === "reset-password" ? (
        <ResetPasswordPage
          onBack={() => { setPage("home"); window.history.replaceState({}, '', '/'); }}
          onLogin={() => { setPage("home"); window.history.replaceState({}, '', '/'); setLoginModal(true); }} />
      ) : page === "sikulove" ? (
        <SikuloveListPage
          onBack={() => { setPage("home"); window.scrollTo(0,0); }}
          onProfile={(id) => { setProfileId(String(id)); window.history.replaceState({}, '', `/?sikula=${id}`); }}
          onOrder={({ category, city }) => openOrder(null, { category, city })} />
      ) : page === "faq" ? (
        <FAQPage
          onBack={() => { setPage("home"); window.scrollTo(0,0); }}
          onOrder={() => openOrder()}
          onReg={() => openReg()} />
      ) : page === "cookies" ? (
        <CookiesPage onBack={() => { setPage("home"); window.scrollTo(0,0); }} />
      ) : page === "gdpr" ? (
        <GDPRPage onBack={() => { setPage("home"); window.scrollTo(0,0); }} />
      ) : page === "podminky-pouziti" ? (
        <PodminkyPouzitiPage onBack={() => { setPage("home"); window.scrollTo(0,0); }} />
      ) : page === "ochrana-soukromi" ? (
        <OchranaSoukromiPage onBack={() => { setPage("home"); window.scrollTo(0,0); }} />
      ) : page === "podpora-sikuly" ? (
        <PodporaProSikulyPage onBack={() => { setPage("home"); window.scrollTo(0,0); }} />
      ) : page === "podminky-sikuly" ? (
        <PodminkyProSikulyPage onBack={() => { setPage("home"); window.scrollTo(0,0); }} />
      ) : page === "sikuly" ? (
        <ProSikulyPage onBack={() => { setPage("home"); window.scrollTo(0,0); }} onReg={openReg} />
      ) : page === "kontakt" ? (
        <KontaktPage onBack={() => { setPage("home"); window.scrollTo(0,0); }} />
      ) : page === "faktury" ? (
        <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
          <div style={{ background: "#fff", borderBottom: `1px solid ${T.border}`, padding: "10px 24px" }}>
            <div style={{ maxWidth: 1060, margin: "0 auto" }}>
              <button onClick={() => { setPage("home"); window.scrollTo(0,0); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: T.ink3, fontFamily: "inherit", padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = T.ink}
                onMouseLeave={e => e.currentTarget.style.color = T.ink3}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                Zpět na úvod
              </button>
            </div>
          </div>
          <div style={{ maxWidth: 1060, margin: "0 auto", padding: "32px 24px" }}>
            <InvoicePage />
          </div>
        </div>
      ) : (<>

      {/* HERO */}
      <section id="hero" style={{ background: "#fff", padding: "clamp(40px, 8vw, 88px) clamp(16px, 4vw, 24px) clamp(36px, 6vw, 72px)", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -120, left: -80, width: 480, height: 480, borderRadius: "50%", background: "rgba(219,234,254,.45)", filter: "blur(80px)" }} />
          <div style={{ position: "absolute", bottom: -80, right: -60, width: 380, height: 380, borderRadius: "50%", background: "rgba(255,237,213,.5)", filter: "blur(70px)" }} />
        </div>

        <div style={{ position: "relative", maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8", borderRadius: 999, padding: "8px 20px 8px 14px", fontSize: 15, fontWeight: 600, marginBottom: 28, letterSpacing: "-.01em" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", display: "inline-block", boxShadow: "0 0 0 4px rgba(34,197,94,.2)" }} />
            Šikulové dostupní v celé ČR
          </div>

          <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800, color: T.ink, lineHeight: 1.2, letterSpacing: "-.03em", marginBottom: 16, fontFamily: "'Inter', system-ui, sans-serif" }}>
            Doma se vždycky něco najde.{" "}
            My najdeme <span style={{ color: T.orange }}>šikulu.</span>
          </h1>

          <p style={{ fontSize: "clamp(14px, 2vw, 17px)", color: T.ink3, lineHeight: 1.7, maxWidth: 640, margin: "0 auto 28px", letterSpacing: "-.01em" }}>
            Vyberte službu, napište pár detailů a šikulové z okolí vám mohou poslat nabídky.
          </p>

          <div style={{ display: "flex", maxWidth: 640, margin: "0 auto 16px", background: "#fff", borderRadius: 14, border: `1.5px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.06)", overflow: "hidden" }}>
            <span style={{ display: "flex", alignItems: "center", paddingLeft: 16, paddingRight: 10, color: T.ink4, flexShrink: 0 }}><IcSearch /></span>
            <input style={{ flex: 1, padding: "15px 4px", border: "none", outline: "none", fontSize: 15, color: T.ink, background: "transparent", fontFamily: "inherit", letterSpacing: "-.01em" }}
              placeholder="Co potřebujete doma vyřešit?"
              onKeyDown={e => e.key === "Enter" && openOrder()} />
            <div style={{ padding: "6px" }}>
              <BtnPrimary size="sm" onClick={() => openOrder()}>Najít šikulu</BtnPrimary>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
            {[
              { id: "urgent",   label: "Do 48 hodin",  selBg: "#EF4444", selBorder: "#EF4444", idleBg: "#FEF2F2", idleBorder: "#FCA5A5", idleColor: "#B91C1C" },
              { id: "soon",     label: "Do 7 dní",     selBg: "#F97316", selBorder: "#F97316", idleBg: "#FFF7ED", idleBorder: "#FED7AA", idleColor: "#C2410C" },
              { id: "flexible", label: "Flexibilně",   selBg: "#0F172A", selBorder: "#0F172A", idleBg: "#F8FAFC", idleBorder: "#CBD5E1", idleColor: "#475569" },
            ].map(p => {
              const sel = priority === p.id;
              return (
                <button key={p.id} onClick={() => { setPriority(p.id); openOrder(); }}
                  style={{
                    display: "inline-flex", alignItems: "center", height: 36, padding: "0 16px", borderRadius: 10,
                    border: `1.5px solid ${sel ? p.selBorder : p.idleBorder}`,
                    background: sel ? p.selBg : p.idleBg,
                    color: sel ? "#fff" : p.idleColor,
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    fontFamily: "inherit", letterSpacing: "-.01em", transition: "all .14s",
                  }}>
                  {p.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 32 }}>
            <BtnPrimary size="lg" onClick={() => openOrder()}>
              Zadat poptávku zdarma <IcArrow />
            </BtnPrimary>
            <BtnBlue size="lg" onClick={() => { setPage("sikuly"); window.scrollTo(0, 0); }}>
              Chci vydělávat jako šikula
            </BtnBlue>
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, flexWrap: "wrap", rowGap: 8 }}>
            {[
              { Icon: IcShield, text: "Ověřené profily",         iconColor: "#059669" },
              { Icon: IcStar,   text: "Poptávka zdarma",         iconColor: T.orange },
              { Icon: IcCheck,  text: "Zákazník nic neplatí",   iconColor: "#059669" },
              { Icon: IcGlobe,  text: "Platíte přímo šikulovi", iconColor: T.blue },
            ].map(({ Icon, text, iconColor }, i, arr) => (
              <span key={text} style={{ display: "inline-flex", alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "transparent", fontSize: 13, fontWeight: 500, color: T.ink2, letterSpacing: "-.01em", whiteSpace: "nowrap" }}>
                  <span style={{ color: iconColor, display: "flex", flexShrink: 0 }}><Icon /></span>
                  {text}
                </span>
                {i < arr.length - 1 && <span style={{ color: T.border2, fontSize: 10, padding: "0 2px" }}>·</span>}
              </span>
            ))}
          </div>

        </div>
      </section>

      {/* STATS STRIP */}
      <div style={{ background: "#0F172A", padding: "40px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 0 }}>
          {[
            { value: "1 200+", label: "šikulů v ČR",          color: "#F97316" },
            { value: "8 400+", label: "dokončených prací",     color: "#38BDF8" },
            { value: "do 2 h", label: "průměrná první reakce", color: "#34D399" },
            { value: "4.9 ★",  label: "průměrné hodnocení",    color: "#A78BFA" },
          ].map(({ value, label, color }, i, arr) => (
            <div key={label} style={{ textAlign: "center", padding: "8px 16px", borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,.08)" : "none" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: "-.03em", lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: "clamp(32px, 5vw, 56px) clamp(16px, 4vw, 24px)", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.blue, marginBottom: 10 }}>JAK TO FUNGUJE</div>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 700, color: T.ink, letterSpacing: "-.03em", marginBottom: 10 }}>Jak to funguje</h2>
            <p style={{ fontSize: "clamp(13px, 2vw, 15px)", color: T.ink3, maxWidth: 500, margin: "0 auto", lineHeight: 1.65 }}>
              Poptávku zadáte za pár minut. Vyberete službu, místo, čas a odešlete.
            </p>
          </div>
          <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            {[
              { n: 1, title: "Vyberete kategorii",       desc: "Například Domácnost, Zahrada, Elektro práce nebo Drobné opravy a montáže.", bg: "#FFF7ED", color: "#F97316" },
              { n: 2, title: "Vyberete konkrétní službu", desc: "Například u kategorie Domácnost zvolíte žehlení, úklid, mytí oken nebo jinou službu.", bg: "#EFF6FF", color: "#3B82F6" },
              { n: 3, title: "Upřesníte požadavek",      desc: "Můžete dopsat vlastní poznámku. Například kolik prádla chcete vyžehlit. Není to ale povinné.", bg: "#F0FDF4", color: "#22C55E" },
              { n: 4, title: "Zadáte místo a čas",       desc: "Vyplníte adresu nebo oblast, kde se má služba provést, a zvolíte, jak rychle ji potřebujete.", bg: "#FAF5FF", color: "#A855F7" },
              { n: 5, title: "Odešlete poptávku",        desc: "Šikulové z okolí se vám mohou ozvat s nabídkou. Vyberete podle ceny, termínu a recenzí.", bg: "#F0F9FF", color: "#0EA5E9" },
            ].map(step => (
              <div key={step.n} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: "24px 22px", boxShadow: "0 1px 3px rgba(0,0,0,.04)", transition: "all .18s", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.09)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.04)"; }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: step.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: step.color, letterSpacing: "-.02em" }}>{step.n}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 7, letterSpacing: "-.02em" }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ padding: "clamp(32px, 5vw, 56px) clamp(16px, 4vw, 24px)", background: "#fff" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.blue, marginBottom: 10 }}>SLUŽBY</div>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 700, color: T.ink, letterSpacing: "-.03em", marginBottom: 8 }}>Co potřebujete vyřešit?</h2>
            <p style={{ fontSize: "clamp(13px, 2vw, 15px)", color: T.ink3 }}>Vyberte kategorii a rovnou zadejte poptávku – bez registrace.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
            {[
              { s: SERVICES[0],  bg: "#FFF7ED", ic: "#F97316" },
              { s: SERVICES[1],  bg: "#EFF6FF", ic: "#3B82F6" },
              { s: SERVICES[2],  bg: "#F0FDF4", ic: "#22C55E" },
              { s: SERVICES[3],  bg: "#FAF5FF", ic: "#A855F7" },
              { s: SERVICES[4],  bg: "#FEF2F2", ic: "#EF4444" },
              { s: SERVICES[5],  bg: "#ECFDF5", ic: "#10B981" },
              { s: SERVICES[6],  bg: "#FFFBEB", ic: "#F59E0B" },
              { s: SERVICES[7],  bg: "#F0F9FF", ic: "#0EA5E9" },
              { s: SERVICES[8],  bg: "#FDF4FF", ic: "#C026D3" },
              { s: SERVICES[9],  bg: "#F7FEE7", ic: "#65A30D" },
              { s: SERVICES[10], bg: "#FFF1F2", ic: "#F43F5E" },
              { s: SERVICES[11], bg: "#F0FDFA", ic: "#14B8A6" },
              { s: SERVICES[12], bg: "#FEF3C7", ic: "#D97706" },
              { s: SERVICES[13], bg: "#EDE9FE", ic: "#7C3AED" },
              { s: SERVICES[14], bg: "#FDF2F8", ic: "#EC4899" },
              { s: SERVICES[15], bg: "#FFF7ED", ic: "#EA580C" },
              { s: SERVICES[16], bg: "#FEF9C3", ic: "#CA8A04" },
              { s: SERVICES[17], bg: "#F0F9FF", ic: "#0284C7" },
            ].map(({ s, bg, ic }) => (
              <button key={s.id} onClick={() => openOrder(s)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, cursor: "pointer", textAlign: "left", transition: "all .16s", boxShadow: "0 1px 2px rgba(0,0,0,.04)", fontFamily: "inherit" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,.09)"; e.currentTarget.style.borderColor = ic; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04)"; e.currentTarget.style.borderColor = "#E5E7EB"; }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: ic }}>
                  <s.Icon size={18} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.ink, letterSpacing: "-.01em", lineHeight: 1.3 }}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CO Z TOHO MÁTE JAKO ZÁKAZNÍK */}
      <section style={{ padding: "clamp(40px, 6vw, 64px) clamp(16px, 4vw, 24px)", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.blue, marginBottom: 10 }}>PRO ZÁKAZNÍKY</div>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 700, color: T.ink, letterSpacing: "-.03em" }}>Proč zadat poptávku přes ŠikulaDoma?</h2>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", padding: "clamp(24px, 4vw, 36px)", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
            <p style={{ fontSize: "clamp(14px, 2vw, 16px)", color: T.ink3, lineHeight: 1.8, marginBottom: 16 }}>
              Nemusíte obvolávat známé ani hledat pomoc po skupinách. Zadáte, co potřebujete vyřešit, vyberete místo a šikulové z okolí vám mohou poslat nabídku.
            </p>
            <p style={{ fontSize: "clamp(14px, 2vw, 16px)", color: T.ink3, lineHeight: 1.8, margin: 0 }}>
              Vy si pak vyberete podle ceny, termínu, hodnocení a domluvy. Za zadání poptávky nic neplatíte. Platíte až vybranému šikulovi přímo.
            </p>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <div style={{ background: "#F8FAFC", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB", padding: "14px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 24 }}>
          {[
            { emoji: "🔍", title: "Ověřené profily",         desc: "Profily šikulů jsou ověřeny e-mailem.", color: "#3B82F6", bg: "#EFF6FF" },
            { emoji: "💬", title: "Poptávka zdarma",         desc: "Zákazník za poptávku neplatí nic.",   color: "#22C55E", bg: "#F0FDF4" },
            { emoji: "⚡", title: "Reakce do 48 hodin",     desc: "Poptávku šikulům zobrazíme co nejdříve. U běžných požadavků cílíme na rychlou reakci.", color: "#F97316", bg: "#FFF7ED" },
            { emoji: "🤝", title: "Platíte přímo šikulovi", desc: "Žádná provize, žádný prostředník.",   color: "#A855F7", bg: "#FAF5FF" },
          ].map(({ emoji, title, desc, color, bg }) => (
            <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {emoji}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 2, letterSpacing: "-.01em" }}>{title}</div>
                <div style={{ fontSize: 12, color: T.ink3, lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      </>)}
      </Layout>

      {orderForm !== null && <OrderForm initialService={orderForm.service} initialCategory={orderForm.category} initialCity={orderForm.city} onClose={() => setOrderForm(null)} onHome={() => { setPage("home"); window.history.replaceState({}, '', '/'); window.scrollTo(0, 0); }} />}
      {regForm   !== null && <RegForm   plan={regForm.plan} onClose={() => setRegForm(null)} onRegistered={loginSikula} />}
      {loginModal && <LoginModal onClose={() => setLoginModal(false)} onReg={openReg} onOrder={openOrder} onFaktury={() => { setLoginModal(false); setPage("faktury"); window.scrollTo(0,0); }} onDemoLogin={loginSikula} onForgot={() => { setLoginModal(false); setPage("forgot-password"); window.scrollTo(0,0); }} />}

    </>
  );
}

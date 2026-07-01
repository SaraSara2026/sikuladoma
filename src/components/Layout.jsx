import Header from './Header'
import CookieBanner from './CookieBanner.jsx'
import Footer from './Footer'

export default function Layout({ children, T, BtnPrimary, onHome, onScrollTo, onOrder, onLogin, onReg, onKontakt, onHow, onSikuly, onSikulove, onFAQ, onPodminkySikuly, onPodporaSikuly, onOchrana, onPodminkyPouziti, onGDPR, onCookies, onCookiesPage, sikulaUser, onDashboard, onProfil, onLogout }) {
  return (
    <>
      <Header
        T={T}
        BtnPrimary={BtnPrimary}
        onHome={onHome}
        onScrollTo={onScrollTo}
        onOrder={onOrder}
        onLogin={onLogin}
        onSikuly={onSikuly}
        sikulaUser={sikulaUser}
        onDashboard={onDashboard}
        onProfil={onProfil}
        onLogout={onLogout}
      />
      <main>{children}</main>
      <Footer
        onOrder={onOrder}
        onReg={onReg}
        onKontakt={onKontakt}
        onHow={onHow}
        onSikuly={onSikuly}
        onSikulove={onSikulove}
        onFAQ={onFAQ}
        onPodminkySikuly={onPodminkySikuly}
        onPodporaSikuly={onPodporaSikuly}
        onOchrana={onOchrana}
        onPodminkyPouziti={onPodminkyPouziti}
        onGDPR={onGDPR}
        onCookies={onCookies}
      />
      <CookieBanner onCookiesPage={onCookiesPage} />
    </>
  )
}

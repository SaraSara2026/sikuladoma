import Header from './Header'
import CookieBanner from './CookieBanner.jsx'
import Footer from './Footer'

export default function Layout({ children, T, BtnPrimary, onHome, onScrollTo, onOrder, onLogin, onReg, onHow, onNavigate, sikulaUser, onDashboard, onProfil, onLogout, showFooter = true }) {
  return (
    <>
      <Header
        T={T}
        BtnPrimary={BtnPrimary}
        onHome={onHome}
        onScrollTo={onScrollTo}
        onOrder={onOrder}
        onLogin={onLogin}
        onNavigate={onNavigate}
        sikulaUser={sikulaUser}
        onDashboard={onDashboard}
        onProfil={onProfil}
        onLogout={onLogout}
      />
      <main>{children}</main>
      {showFooter && (
        <Footer
          onOrder={onOrder}
          onReg={onReg}
          onHow={onHow}
          onNavigate={onNavigate}
        />
      )}
      <CookieBanner onCookiesPage={() => onNavigate("cookies")} />
    </>
  )
}

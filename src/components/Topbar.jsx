import Icon from './Icon'

export default function Topbar({ currentUser, onNav, currentPage, onLogout }) {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <div className="logo" onClick={() => onNav('home')}>
          <div className="logo-icon">🏠</div>
          <span>
            <span style={{ color: 'var(--brand)' }}>Šikula</span><span style={{ color: 'var(--accent2)' }}>Doma</span>
          </span>
        </div>

        <div className="topbar-nav">
          {!currentUser ? (
            <>
              <button className="topbar-nav-link" onClick={() => onNav('pricing')}>Ceník pro šikuly</button>
              <button className="topbar-nav-link" onClick={() => onNav('home')}>Jak to funguje</button>
              <button className="btn btn-outline btn-sm" onClick={() => onNav('login')}>Přihlásit se</button>
              <button className="btn btn-primary btn-sm" onClick={() => onNav('register')}>Zaregistrovat se</button>            </>
          ) : (
            <>
              <button className="topbar-nav-link" onClick={() => onNav('home')}>Domů</button>
              <button
                className={`topbar-nav-link ${currentPage.startsWith('dash') ? 'active' : ''}`}
                onClick={() => onNav(
                  currentUser.role === 'customer' ? 'dash-customer'
                  : currentUser.role === 'admin' ? 'dash-admin'
                  : 'dash-sikula'
                )}
              >
                Dashboard
              </button>
              <button className="topbar-nav-link" onClick={() => onNav('chat')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="chat" size={16} /> Zprávy
                </span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                <div
                  style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                  onClick={() => onNav('profile')}
                >
                  {currentUser.avatar}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={onLogout} title="Odhlásit se">
                  <Icon name="logout" size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

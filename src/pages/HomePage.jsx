import { useState, useEffect } from 'react'
import { CATEGORIES, REVIEWS } from '../data'

function useLiveStats() {
  const [stats, setStats] = useState({ todayOrders: 23, activeShikulas: 187, avgReplyMinutes: 94 })
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        todayOrders: prev.todayOrders + (Math.random() < 0.3 ? 1 : 0),
        activeShikulas: Math.max(160, prev.activeShikulas + (Math.random() < 0.2 ? 1 : Math.random() < 0.1 ? -1 : 0)),
      }))
    }, 12000)
    return () => clearInterval(interval)
  }, [])
  return stats
}

const replyLabel = (mins) => {
  if (mins < 60) return `${mins} minut`
  if (mins < 120) return 'do hodiny'
  if (mins < 180) return 'do 2 hodin'
  return 'do 3 hodin'
}

const RECENT_FEED = [
  { icon: '🪑', text: 'Montáž nábytku', city: 'Praha 6', ago: 'před 8 minutami' },
  { icon: '🧹', text: 'Úklid bytu', city: 'Brno', ago: 'před 23 minutami' },
  { icon: '🪛', text: 'Pověšení obrazů', city: 'Praha 2', ago: 'před 41 minutami' },
  { icon: '🚿', text: 'Výměna kohoutku', city: 'Praha 10', ago: 'před 1 hodinou' },
]

export default function HomePage({ onNav }) {
  const [searchVal, setSearchVal] = useState('')
  const stats = useLiveStats()

  return (
    <div className="page-enter">

      {/* ── HERO – světlý gradient ── */}
      <div className="hero">
        <div className="hero-content">
          <h1>
            Doma se vždycky něco najde.<br />
            <span>My najdeme šikulu.</span>
          </h1>
          <p>
            Popište, co potřebujete – montáž, opravu, úklid nebo čištění.<br />
            Šikulové z vašeho okolí vám pošlou nabídky.
          </p>

          {/* SEARCH BOX */}
          <div className="hero-search-wrap">
            <div className="hero-search-box">
              <input
                className="hero-search-input"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onNav('new-order')}
                placeholder="Např. smontovat skříň, pověsit poličku, uklidit byt…"
              />
              <button className="hero-search-btn" onClick={() => onNav('new-order')}>
                Najít šikulu →
              </button>
            </div>
          </div>

          {/* SECONDARY CTAs */}
          <div className="hero-ctas" style={{ marginBottom: 20 }}>
            <button
              className="btn btn-outline"
              style={{ fontSize: 14, padding: '10px 22px' }}
              onClick={() => onNav('new-order')}
            >
              Zadat podrobnou poptávku
            </button>
            <button
              className="btn"
              style={{ background: 'transparent', color: 'var(--text2)', border: '1.5px solid var(--border)', fontSize: 14, padding: '10px 22px' }}
              onClick={() => onNav('register-sikula')}
            >
              🛠️ Chci vydělávat jako šikula
            </button>
          </div>

          {/* TRUST PILLS */}
          <div className="hero-trust-pills">
            {[
              ['✓', 'Ověření šikulové'],
              ['✓', 'Nabídky zdarma'],
              ['✓', 'Zákazník nic neplatí'],
              ['✓', 'Vybíráte podle ceny a hodnocení'],
            ].map(([ic, txt]) => (
              <div key={txt} className="hero-trust-pill">
                <span className="hero-trust-pill-icon">{ic}</span>
                {txt}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── LIVE STATS STRIP ── */}
      <div className="live-stats-strip">
        <div className="live-stats-inner">
          <div className="live-stat-item">
            <span className="live-stat-dot" />
            <div>
              <span className="live-stat-value">{stats.todayOrders}</span>
              <span className="live-stat-label"> poptávek přidáno dnes</span>
            </div>
          </div>
          <div className="live-stat-item">
            <div>
              <span className="live-stat-value">{stats.activeShikulas}</span>
              <span className="live-stat-label"> šikulů je aktivních</span>
            </div>
          </div>
          <div className="live-stat-item">
            <div>
              <span className="live-stat-value">{replyLabel(stats.avgReplyMinutes)}</span>
              <span className="live-stat-label"> průměrná první odezva</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MINI FEED ── */}
      <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '20px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
            Poslední přidané poptávky
          </p>
          <div className="mini-feed">
            {RECENT_FEED.map((item, i) => (
              <div key={i} className="mini-feed-item">
                <span className="mini-feed-icon">{item.icon}</span>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>{item.text}</span>
                <span style={{ color: 'var(--text3)' }}>· {item.city}</span>
                <span className="mini-feed-time">{item.ago}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8, textAlign: 'right' }}>
            Ukázkový přehled aktivity portálu.
          </p>
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <div className="section" style={{ background: 'white' }}>
        <div className="section-inner">
          <div className="section-header">
            <div className="section-label">CO VYŘEŠÍME</div>
            <h2>Vyberte, s čím potřebujete pomoct</h2>
            <p>Klikněte na kategorii a rovnou zadejte poptávku – bez registrace, zdarma.</p>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map(cat => (
              <div key={cat.id} className="cat-card" onClick={() => onNav('new-order')}>
                <div className="cat-card-icon">{cat.icon}</div>
                <div className="cat-card-name">{cat.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="section" style={{ background: 'var(--bg)' }}>
        <div className="section-inner">
          <div className="section-header">
            <div className="section-label">JAK TO FUNGUJE</div>
            <h2>Tři kroky a máte hotovo</h2>
          </div>
          <div className="how-grid">
            {[
              ['1', 'Popište, co potřebujete', 'Zadejte poptávku bez registrace – napište, co potřebujete, kde a kdy. Trvá to 2 minuty.'],
              ['2', 'Dostanete nabídky', 'Ověření šikulové z vašeho okolí vám sami napíšou nabídku s cenou a termínem.'],
              ['3', 'Vyberete šikulu', 'Porovnáte nabídky, přečtete recenze a vyberete toho pravého. Platíte přímo šikulovi.'],
            ].map(([n, t, d]) => (
              <div key={n} className="how-step">
                <div className="how-num">{n}</div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TRUST BAR ── */}
      <div className="trust-bar">
        <div className="trust-items">
          {[
            ['✓', 'Profily šikulů jsou ověřeny', 'IČO, recenze, zkušenosti'],
            ['★', 'Hodnocení po každé práci', 'Transparentní zpětná vazba'],
            ['0 Kč', 'Zákazník neplatí nic', 'Žádná provize, žádný poplatek'],
            ['⇄', 'Platíte přímo šikulovi', 'Bez prostředníka'],
          ].map(([ic, t, d]) => (
            <div key={t} className="trust-item">
              <div className="trust-icon">{ic}</div>
              <div className="trust-item-text"><strong>{t}</strong><span>{d}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* ── REVIEWS ── */}
      <div className="section" style={{ background: 'white' }}>
        <div className="section-inner">
          <div className="section-header">
            <div className="section-label">ZKUŠENOSTI</div>
            <h2>Co říkají zákazníci a šikulové</h2>
          </div>
          <div className="reviews-grid">
            {REVIEWS.map((r, i) => (
              <div key={i} className="review-card">
                <div className="review-header">
                  <div className="review-avatar">{r.initials}</div>
                  <div className="review-meta">
                    <div className="review-name">{r.name}</div>
                    <div className="review-service">{r.service}</div>
                  </div>
                  <div className="stars">{'★'.repeat(r.stars)}</div>
                </div>
                <div className="review-text">&ldquo;{r.text}&rdquo;</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM CTA ── */}
      <div style={{ background: 'var(--accent-pale)', borderTop: '1px solid var(--border)', padding: '72px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(24px,3vw,34px)', marginBottom: 12, color: 'var(--text)' }}>
            Máte doma něco k vyřešení?
          </h2>
          <p style={{ color: 'var(--text2)', marginBottom: 28, fontSize: 16 }}>
            Zadejte poptávku – bez registrace, zdarma. Šikulové vám napíšou sami.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ fontSize: 16, padding: '14px 32px' }} onClick={() => onNav('new-order')}>
              Zadat poptávku zdarma
            </button>
            <button className="btn btn-outline" style={{ fontSize: 16, padding: '14px 28px' }} onClick={() => onNav('pricing')}>
              Chci vydělávat jako šikula
            </button>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer>
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <h3>
                🏠 <span style={{ color: 'white' }}>Šikula</span><span style={{ color: 'var(--accent)' }}>Doma</span>
              </h3>
              <p>Spojujeme lidi s šikulami, kteří jim pomohou doma. Montáž, opravy, úklid, čištění – a cokoliv dalšího.</p>
            </div>
            <div className="footer-col">
              <h4>Pro zákazníky</h4>
              <span className="footer-link" onClick={() => onNav('new-order')}>Zadat poptávku</span>
              <span className="footer-link">Jak to funguje</span>
              <span className="footer-link">Kategorie</span>
              <span className="footer-link">Bezpečnost</span>
            </div>
            <div className="footer-col">
              <h4>Pro šikuly</h4>
              <span className="footer-link" onClick={() => onNav('register-sikula')}>Zaregistrovat se</span>
              <span className="footer-link" onClick={() => onNav('pricing')}>Tarify a ceny</span>
              <span className="footer-link">Podmínky</span>
              <span className="footer-link">Podpora</span>
            </div>
            <div className="footer-col">
              <h4>Společnost</h4>
              <span className="footer-link">O nás</span>
              <span className="footer-link">Blog</span>
              <span className="footer-link">Kontakt</span>
              <span className="footer-link">GDPR</span>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2024 ŠikulaDoma s.r.o. | IČO 123 456 78</span>
            <span>Vyrobeno s péčí v Praze 🇨🇿</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

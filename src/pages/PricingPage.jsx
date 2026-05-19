const plans = [
  {
    tier: 'Start', name: 'Základní', price: 0, period: 'zdarma navždy',
    features: ['Vytvoření profilu', '5 reakcí na poptávky/měsíc', 'Základní zobrazení v katalogu', 'Recenze a hodnocení'],
    no: ['Přednostní zobrazení', 'Fakturační modul', 'Statistiky profilu', 'Notifikace na zakázky', 'Ověřený štítek'],
  },
  {
    tier: 'Plus', name: 'Šikula Plus', price: 299, period: 'měsíčně',
    features: ['30 reakcí na poptávky/měsíc', 'Lepší pozice ve výsledcích', 'Fakturační modul', 'Statistiky profilu', 'Notifikace na nové zakázky', 'Portfolio fotek'],
    no: ['Přednostní zobrazení', 'Ověřený štítek Premium'],
  },
  {
    tier: 'Profi', name: 'Šikula Profi', price: 599, period: 'měsíčně', featured: true, popular: true,
    features: ['Neomezené reakce', 'Přednostní zobrazení', 'Ověřený štítek ✓', 'Plný fakturační modul', 'PDF faktury + odeslání', 'Rozšířené statistiky', 'Urgentní notifikace', 'Boost profilu 1× měsíčně'],
    no: [],
  },
  {
    tier: 'Premium', name: 'Šikula Premium', price: 999, period: 'měsíčně',
    features: ['Vše z Profi tarifu', 'Topování v kategorii', 'Prémiové odznaky', 'Prioritní podpora', 'API přístup', 'Roční exporty', 'Brandovaný profil', 'Dedikovaný account manager'],
    no: [],
  },
]

export default function PricingPage({ onNav, inDash }) {
  return (
    <div className="page-enter" style={{ padding: inDash ? 0 : '60px 24px', background: inDash ? 'transparent' : 'var(--bg)' }}>
      {!inDash && (
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="section-label">CENÍK PRO ŠIKULY</div>
          <h2 style={{ fontSize: 'clamp(28px,3vw,40px)', marginBottom: 12 }}>Vyberte si tarif</h2>
          <p style={{ color: 'var(--text2)', fontSize: 17, maxWidth: 480, margin: '0 auto' }}>
            Zákazníci mají zadávání poptávek vždy zdarma. Šikulové platí za přístup k poptávkám a prémiové funkce.
          </p>
        </div>
      )}
      {inDash && <div className="dash-title" style={{ marginBottom: 24 }}>Moje členství &amp; Ceník</div>}

      <div className="pricing-grid" style={{ maxWidth: 1100, margin: '0 auto' }}>
        {plans.map(p => (
          <div key={p.tier} className={`pricing-card ${p.featured ? 'featured' : ''}`}>
            {p.popular && <div className="pricing-popular">Nejoblíbenější</div>}
            <div className="pricing-tier">{p.tier}</div>
            <div className="pricing-name">{p.name}</div>
            <div className="pricing-price">
              {p.price === 0 ? 'Zdarma' : `${p.price} Kč`}
              {p.price > 0 && <span>/měs</span>}
            </div>
            <div className="pricing-period">{p.period}</div>
            <div className="pricing-divider" />
            <div className="pricing-features">
              {p.features.map(f => <div key={f} className="pricing-feature">{f}</div>)}
              {p.no.map(f => <div key={f} className="pricing-feature no">{f}</div>)}
            </div>
            <button
              className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'}`}
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => onNav('register-sikula')}
            >
              {p.price === 0 ? 'Začít zdarma' : 'Vybrat tarif'}
            </button>
          </div>
        ))}
      </div>

      {!inDash && (
        <div style={{ textAlign: 'center', marginTop: 48, padding: '32px', background: 'white', borderRadius: 'var(--radius)', maxWidth: 600, margin: '48px auto 0', border: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: 8 }}>Platba za práci? Přímo mezi vámi.</h3>
          <p style={{ color: 'var(--text2)', fontSize: 15 }}>
            ŠikulaDoma <strong>nebere žádnou provizi</strong> z vaší zakázky. Platba probíhá přímo mezi zákazníkem a šikulou. Portál vydělává jen na členských poplatcích.
          </p>
        </div>
      )}
    </div>
  )
}

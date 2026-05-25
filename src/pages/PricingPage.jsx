import { useState } from 'react'
import { stripeApi } from '../lib/api'

// Mapování tier → Stripe plan ID (musí odpovídat STRIPE_PRICE_* env vars)
const TIER_TO_PLAN = { Plus: 'plus', Profi: 'profi', Premium: 'top' }

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

export default function PricingPage({ onNav, inDash, currentUser }) {
  const [loading, setLoading] = useState(null)  // tier který se právě načítá
  const [error,   setError]   = useState(null)

  const currentPlan = currentUser?.plan || 'start'

  async function handleUpgrade(tier) {
    const planId = TIER_TO_PLAN[tier]
    if (!planId) return
    setLoading(tier)
    setError(null)
    try {
      const { url } = await stripeApi.checkout(planId)
      window.location.href = url
    } catch (err) {
      setError(err.message || 'Nepodařilo se otevřít platební bránu.')
      setLoading(null)
    }
  }

  function getButtonLabel(p) {
    if (p.price === 0) return 'Začít zdarma'
    const planId = TIER_TO_PLAN[p.tier]
    if (currentPlan === planId) return '✓ Váš aktuální plán'
    return loading === p.tier ? 'Přesměrovávám…' : 'Vybrat tarif'
  }

  function isCurrentPlan(p) {
    return currentPlan === TIER_TO_PLAN[p.tier] || (p.tier === 'Start' && currentPlan === 'start')
  }

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

      {error && (
        <div style={{ background: 'var(--red-pale, #fee2e2)', color: 'var(--red, #B91C1C)', border: '1px solid var(--red, #B91C1C)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      <div className="pricing-grid" style={{ maxWidth: 1100, margin: '0 auto' }}>
        {plans.map(p => (
          <div key={p.tier} className={`pricing-card ${p.featured ? 'featured' : ''} ${isCurrentPlan(p) ? 'current-plan' : ''}`}>
            {p.popular && <div className="pricing-popular">Nejoblíbenější</div>}
            {isCurrentPlan(p) && <div className="pricing-popular" style={{ background: 'var(--green, #16a34a)' }}>Váš plán</div>}
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
              disabled={loading === p.tier || isCurrentPlan(p)}
              onClick={() => {
                if (p.price === 0) return
                if (inDash && currentUser) {
                  handleUpgrade(p.tier)
                } else {
                  onNav?.('register-sikula')
                }
              }}
            >
              {getButtonLabel(p)}
            </button>
          </div>
        ))}
      </div>

      {/* Správa předplatného přes Stripe Customer Portal */}
      {inDash && currentUser && currentPlan !== 'start' && (
        <ManageSubscription />
      )}

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

function ManageSubscription() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function openPortal() {
    setLoading(true)
    setError(null)
    try {
      const { url } = await stripeApi.portal()
      window.location.href = url
    } catch (err) {
      setError(err.message || 'Nepodařilo se otevřít správu předplatného.')
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: 32, padding: '20px 24px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Správa předplatného</div>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>Změnit plán, stáhnout faktury nebo zrušit předplatné přes Stripe.</div>
      </div>
      {error && <div style={{ color: 'var(--red, #B91C1C)', fontSize: 13 }}>{error}</div>}
      <button className="btn btn-outline" onClick={openPortal} disabled={loading}>
        {loading ? 'Přesměrovávám…' : 'Spravovat předplatné →'}
      </button>
    </div>
  )
}

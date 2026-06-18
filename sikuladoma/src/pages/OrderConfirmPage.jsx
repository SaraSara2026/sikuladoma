import Icon from '../components/Icon'

export default function OrderConfirmPage({ onNav }) {
  return (
    <div className="page-enter" style={{ minHeight: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 32 }}>
          ✓
        </div>
        <h2 style={{ fontSize: 26, marginBottom: 10 }}>Poptávka odeslána!</h2>
        <p style={{ color: 'var(--text2)', fontSize: 16, lineHeight: 1.7, marginBottom: 28 }}>
          Šikulové z vašeho okolí se brzy ozvou s nabídkami.<br />
          Nabídky najdete na svém e-mailu i ve svém účtu.
        </p>
        <div className="card card-pad" style={{ textAlign: 'left', marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['📧', 'Potvrzení poptávky přijde na váš e-mail'],
              ['🔔', 'Jakmile šikula pošle nabídku, dostanete upozornění'],
              ['💬', 'S vybranými šikuly si pak můžete napsat přes chat'],
            ].map(([ic, txt]) => (
              <div key={txt} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{ic}</span>
                <span style={{ fontSize: 14, color: 'var(--text2)' }}>{txt}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => onNav('dash-customer')}>
            <Icon name="orders" size={16} /> Přejít do svého účtu
          </button>
          <button className="btn btn-ghost" onClick={() => onNav('home')}>
            Zpět na úvod
          </button>
        </div>
      </div>
    </div>
  )
}

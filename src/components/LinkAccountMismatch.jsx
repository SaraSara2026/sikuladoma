// Sdílená hláška pro e-mailové odkazy (poptávka/konverzace), které patří
// jinému účtu, než jaký je zrovna přihlášený v prohlížeči. Nikdy neukazuje
// cizí data — jen jasnou zprávu + možnost přihlásit se pod správným účtem.
export default function LinkAccountMismatch({ onNav, text }) {
  return (
    <div className="page-enter" style={{ padding: '32px 24px', maxWidth: 640, margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={() => onNav('back')} style={{ marginBottom: 16 }}>← Zpět</button>
      <div className="card card-pad" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h2 style={{ marginBottom: 8 }}>Tento odkaz patří jinému účtu</h2>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 22 }}>
          {text || 'Přihlaste se prosím správným e-mailem.'}
        </p>
        <button className="btn btn-primary" onClick={() => onNav('wrong-account')}>Přihlásit se správným účtem</button>
      </div>
    </div>
  );
}

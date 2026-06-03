// 404 stránka pro neznámé page= hodnoty.

import { T } from '../ui/theme';
import PageMeta from '../components/PageMeta';

export default function NotFoundPage({ onHome }) {
  return (
    <>
      <PageMeta title="Stránka nenalezena" noindex />
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 96, fontWeight: 800, color: T.orange, lineHeight: 1, letterSpacing: '-.05em', marginBottom: 12 }}>404</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: T.ink, marginBottom: 10 }}>Tady šikula nikoho nenašel</h1>
          <p style={{ fontSize: 15, color: T.ink3, lineHeight: 1.6, marginBottom: 28 }}>
            Stránka kterou hledáš neexistuje, nebo byla přesunuta. Zkus se vrátit na úvod.
          </p>
          <button onClick={onHome}
            style={{ height: 46, padding: '0 28px', borderRadius: 10, border: 'none', background: T.orange, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
            Zpět na úvod
          </button>
        </div>
      </div>
    </>
  );
}

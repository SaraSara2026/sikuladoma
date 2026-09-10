// Štítek "Pojištěný šikula" — čistě informativní, sebedeklarovaný údaj (viz
// has_liability_insurance v DB). ŠikulaDoma platnost ani rozsah pojištění
// nijak neověřuje — tenhle text se NESMÍ nikde měnit na tvrzení o ověření.
//
// Rozkliknutí/tap musí fungovat i na mobilu (ne jen hover title), proto je
// vysvětlení implementované jako vlastní popover na klik, s title atributem
// navíc pro myš. Klik se nešíří výš (stopPropagation), aby fungoval i uvnitř
// klikatelných karet (např. SikuloveListPage).

import { useEffect, useRef, useState } from 'react';

const DISCLAIMER = 'Údaj o pojištění uvedl šikula. ŠikulaDoma jeho platnost ani rozsah neověřuje.';

export default function InsuranceBadge({ style } = {}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const closeIfOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', closeIfOutside);
    document.addEventListener('touchstart', closeIfOutside);
    return () => {
      document.removeEventListener('mousedown', closeIfOutside);
      document.removeEventListener('touchstart', closeIfOutside);
    };
  }, [open]);

  return (
    <span ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>
      <span
        role="button"
        tabIndex={0}
        title={DISCLAIMER}
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            setOpen(o => !o);
          }
        }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
          background: '#EFF6FF', color: '#1D4ED8', cursor: 'pointer',
          border: 'none', fontFamily: 'inherit', whiteSpace: 'nowrap',
          ...style,
        }}>
        🛡️ Pojištěný šikula
      </span>
      {open && (
        <span
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
            width: 230, padding: '10px 12px', borderRadius: 10,
            background: '#111827', color: '#fff', fontSize: 12, lineHeight: 1.5,
            fontWeight: 400, boxShadow: '0 8px 24px rgba(0,0,0,.2)',
          }}>
          {DISCLAIMER}
        </span>
      )}
    </span>
  );
}

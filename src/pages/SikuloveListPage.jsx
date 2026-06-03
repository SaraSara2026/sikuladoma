// Veřejný katalog šikulů s filtry (kategorie, město, hledat).
// Karty kliknutelné → veřejný profil přes onProfile(id).

import { useEffect, useState } from 'react';
import { T } from '../ui/theme';
import { CATEGORIES } from '../lib/categories';
import { usersApi } from '../lib/api';
import { BtnPrimary } from '../ui/Button';

const PLAN_BADGE = {
  top:   { label: '👑 Top',   bg: '#FEF3C7', fg: '#92400E' },
  profi: { label: '⭐ Profi', bg: '#FAF5FF', fg: '#7C3AED' },
  plus:  { label: 'Plus',     bg: '#EFF6FF', fg: '#2563EB' },
  start: { label: 'Start',    bg: '#F3F4F6', fg: '#6B7280' },
};

export default function SikuloveListPage({ onBack, onProfile, onReg, onOrder }) {
  const [sikulove, setSikulove] = useState([]);
  const [loading, setLoading] = useState(true);
  const initial = { category: '', city: '', verified: false, profiPlus: false, minRating: 0 };
  const [filters, setFilters] = useState(initial);            // co uživatel vyplňuje
  const [appliedFilters, setApplied] = useState(initial);      // co je aplikováno (po kliku Hledej)

  useEffect(() => {
    let alive = true;
    setLoading(true);
    usersApi.listSikulove({
      category: appliedFilters.category,
      city: appliedFilters.city,
      verified: appliedFilters.verified,
      profiPlus: appliedFilters.profiPlus,
      minRating: appliedFilters.minRating || undefined,
    })
      .then(data => { if (alive) setSikulove(data.sikulove || []); })
      .catch(() => { if (alive) setSikulove([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [appliedFilters]);

  const search = () => setApplied(filters);
  const reset = () => { setFilters(initial); setApplied(initial); };

  return (
    <div style={{ minHeight: '100vh', background: T.bg }}>
      {/* HERO */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${T.border}`, padding: '32px 24px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {onBack && (
            <button onClick={onBack}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: T.ink3, fontFamily: 'inherit', padding: 0, marginBottom: 16 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Zpět na úvod
            </button>
          )}
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, color: T.ink, letterSpacing: '-.03em', marginBottom: 8 }}>
            Šikulové, kterým můžeš věřit
          </h1>
          <p style={{ fontSize: 15, color: T.ink3, marginBottom: 24, maxWidth: 620, lineHeight: 1.6 }}>
            Procházej ověřené šikuly podle kategorie a oblasti — uvidíš jejich recenze, hodnocení a co nabízejí. Zaujal tě někdo? <strong>Zadej poptávku</strong> a šikulové z okolí (včetně toho vybraného) ti pošlou nabídky.
          </p>

          {/* FILTERS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) auto', gap: 10, marginTop: 8, alignItems: 'stretch' }}>
            <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && search()}
              style={selStyle}>
              <option value="">Všechny kategorie</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <input placeholder="Město (např. Praha)" value={filters.city} onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && search()}
              style={inpStyle} />
            <button onClick={search}
              style={{ height: 42, padding: '0 28px', borderRadius: 10, border: 'none', background: T.orange, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(249,115,22,.3)' }}>
              🔍 Hledej
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12, alignItems: 'center', fontSize: 13, color: T.ink3 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={filters.verified} onChange={e => setFilters(f => ({ ...f, verified: e.target.checked }))} />
              ✓ Jen s ověřeným e-mailem
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={filters.profiPlus} onChange={e => setFilters(f => ({ ...f, profiPlus: e.target.checked }))} />
              👑 Jen Profi a Top
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              Min. hodnocení:
              <select value={filters.minRating} onChange={e => setFilters(f => ({ ...f, minRating: Number(e.target.value) }))}
                style={{ height: 32, padding: '0 8px', borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 13, fontFamily: 'inherit' }}>
                <option value="0">vše</option>
                <option value="3">3⭐+</option>
                <option value="4">4⭐+</option>
                <option value="5">jen 5⭐</option>
              </select>
            </label>
          </div>

          {/* CTA: rovnou zadat poptávku s pre-fillem kategorie + města */}
          {(filters.category || filters.city) && onOrder && (
            <div style={{ marginTop: 18, padding: '16px 20px', background: 'linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)', border: '1px solid #FDBA74', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#9A3412', marginBottom: 2 }}>
                  Nechceš si vybírat? Pošli poptávku všem najednou.
                </div>
                <div style={{ fontSize: 13, color: '#7C2D12', lineHeight: 1.5 }}>
                  {filters.category && <>Kategorie: <strong>{CATEGORIES.find(c => c.id === filters.category)?.label}</strong></>}
                  {filters.category && filters.city && ' · '}
                  {filters.city && <>Místo: <strong>{filters.city}</strong></>}
                  {' '} — šikulové z okolí ti pošlou nabídky do 48 hodin.
                </div>
              </div>
              <BtnPrimary size="md" onClick={() => onOrder({ category: filters.category, city: filters.city })}>
                Zadat poptávku zdarma →
              </BtnPrimary>
            </div>
          )}
        </div>
      </div>

      {/* GRID */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 80px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: T.ink3 }}>Načítám…</div>
        ) : sikulove.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: T.ink3 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.ink, marginBottom: 6 }}>Žádní šikulové se neshodují</div>
            <div style={{ fontSize: 13 }}>Zkus změnit filtry nebo zadej rovnou poptávku — šikulové se ti ozvou sami.</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: T.ink3, marginBottom: 14 }}>
              <strong style={{ color: T.ink }}>{sikulove.length}</strong> {sikulove.length === 1 ? 'šikula' : sikulove.length < 5 ? 'šikulové' : 'šikulů'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {sikulove.map(s => <SikulaCard key={s.id} s={s} onClick={() => onProfile?.(s.id)} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SikulaCard({ s, onClick }) {
  const plan = PLAN_BADGE[s.plan || 'start'];
  const initials = (s.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <button onClick={onClick}
      style={{
        background: '#fff', border: `1px solid ${T.border}`, borderRadius: 16, padding: 20,
        textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: '0 1px 3px rgba(0,0,0,.04)', transition: 'all .15s',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.08)'; e.currentTarget.style.borderColor = T.orange; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.04)'; e.currentTarget.style.borderColor = T.border; }}>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {s.avatar ? (
          <img src={s.avatar} alt={s.name} style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,.12)' }} />
        ) : (
          <div style={{ width: 52, height: 52, borderRadius: 14, background: T.orange, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, flexShrink: 0, boxShadow: '0 2px 8px rgba(249,115,22,.25)' }}>
            {initials}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
          <div style={{ fontSize: 12, color: T.ink3 }}>📍 {s.city || 'celá ČR'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: plan.bg, color: plan.fg }}>
          {plan.label}
        </span>
        {s.verified && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: '#DCFCE7', color: '#15803D' }}>
            ✓ Ověřený
          </span>
        )}
        {s.rating && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: '#FEF3C7', color: '#92400E' }}>
            ⭐ {Number(s.rating).toFixed(1)}
          </span>
        )}
      </div>

      {s.bio && (
        <div style={{ fontSize: 13, color: T.ink3, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {s.bio}
        </div>
      )}

      {(s.services || []).length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(s.services || []).slice(0, 4).map(svcId => {
            const cat = CATEGORIES.find(c => c.id === svcId);
            return (
              <span key={svcId} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#F3F4F6', color: T.ink3 }}>
                {cat?.label || svcId}
              </span>
            );
          })}
          {(s.services || []).length > 4 && (
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#F3F4F6', color: T.ink3 }}>
              +{s.services.length - 4}
            </span>
          )}
        </div>
      )}

      <div style={{ fontSize: 12, color: T.ink4, marginTop: 'auto', paddingTop: 4 }}>
        {s.jobs_count || 0} dokončených zakázek
      </div>
    </button>
  );
}

const inpStyle = {
  width: '100%', height: 42, padding: '0 14px', borderRadius: 10,
  border: `1.5px solid ${T.border}`, fontSize: 14, fontFamily: 'inherit',
  color: T.ink, outline: 'none',
};

const selStyle = { ...inpStyle, cursor: 'pointer', background: '#fff' };

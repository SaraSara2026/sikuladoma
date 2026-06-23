// Veřejný profil šikuly — pro Google + pro lidi co chtějí vidět recenze
// před zadáním poptávky. URL: /?sikula=<id>

import { useEffect, useState } from 'react';
import { usersApi } from '../lib/api';
import { CATEGORIES } from '../lib/categories';

const SVC_LABEL = Object.fromEntries(CATEGORIES.map(c => [c.id, c.label]));

function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const months = Math.max(0, Math.floor((Date.now() - d.getTime()) / (30 * 24 * 3600 * 1000)));
  if (months < 1) return 'tento měsíc';
  if (months < 12) return `před ${months} měs.`;
  const years = Math.floor(months / 12);
  return `před ${years} ${years === 1 ? 'rokem' : 'lety'}`;
}

export default function SikulaProfilePage({ id, onBack, onOrder }) {
  const [data, setData]   = useState(null);
  const [err, setErr]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    usersApi.publicProfile(id)
      .then(d => { if (alive) setData(d); })
      .catch(e => { if (alive) setErr(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Načítám profil…</div>;
  if (err)     return <div style={{ padding: 60, textAlign: 'center', color: '#B91C1C' }}>Chyba: {err}</div>;
  if (!data?.user) return null;

  const { user, reviews, summary } = data;
  const initials = (user.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const avatar = user.avatar || initials;

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '10px 24px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <button onClick={onBack}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6B7280', fontFamily: 'inherit', padding: 0 }}>
            ← Zpět
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* HEAD */}
        <div style={{ background: '#fff', borderRadius: 18, padding: '32px', border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,.04)', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,.12)' }} />
            ) : (
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg,#F97316,#EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 32, fontWeight: 700, flexShrink: 0 }}>
                {initials}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 220 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1A1F2E', letterSpacing: '-.02em', marginBottom: 6 }}>{user.name}</h1>
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>📍 {user.city || 'Česká republika'}</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {user.verified && <span style={{ background: '#F0FDF4', color: '#16A34A', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>✓ Ověřený šikula</span>}
                {user.plan && user.plan !== 'start' && (
                  <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                    👑 {{ 'aktiv': 'Aktivní šikula', 'aktiv-plus': 'Aktivní šikula Plus', profi: 'Profi', top: 'Top Šikula', plus: 'Plus' }[user.plan] || user.plan}
                  </span>
                )}
                {summary?.total > 0 && (
                  <span style={{ background: '#FFF7ED', color: '#C2410C', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                    ⭐ {summary.avg_stars} ({summary.total} recenzí)
                  </span>
                )}
                {user.jobs_count > 0 && (
                  <span style={{ background: '#F8FAFC', color: '#475569', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                    {user.jobs_count} dokončených zakázek
                  </span>
                )}
              </div>

              {onOrder && (
                <button onClick={() => onOrder(user)}
                  style={{ height: 44, padding: '0 22px', borderRadius: 10, border: 'none', background: '#F97316', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Poptat tohoto šikulu →
                </button>
              )}
            </div>
          </div>

          {user.bio && (
            <div style={{ marginTop: 24, padding: '16px 20px', background: '#F9FAFB', borderRadius: 12, border: '1px solid #F3F4F6' }}>
              <p style={{ fontSize: 14, color: '#3D4554', lineHeight: 1.7 }}>{user.bio}</p>
            </div>
          )}
        </div>

        {/* SERVICES */}
        {user.services?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,.04)', marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1F2E', marginBottom: 14 }}>Nabízené služby</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {user.services.map(s => (
                <span key={s} style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>
                  {SVC_LABEL[s] || s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* REVIEWS */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1F2E' }}>Recenze</h2>
            <span style={{ fontSize: 13, color: '#6B7280' }}>{summary?.total || 0} celkem</span>
          </div>

          {reviews?.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
              <p style={{ fontSize: 14 }}>Tento šikula zatím nemá recenze.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reviews.map(r => (
                <div key={r.id} style={{ padding: '14px 16px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #F3F4F6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {r.reviewer_avatar && r.reviewer_avatar.startsWith('data:') ? (
                        <img src={r.reviewer_avatar} alt={r.reviewer_name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#475569' }}>
                          {(r.reviewer_name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1F2E' }}>{r.reviewer_name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#F97316', fontSize: 14 }}>{'★'.repeat(r.stars)}<span style={{ color: '#E5E7EB' }}>{'★'.repeat(5 - r.stars)}</span></span>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>{timeAgo(r.created_at)}</span>
                    </div>
                  </div>
                  {r.comment && (
                    <p style={{ fontSize: 13, color: '#3D4554', lineHeight: 1.6, marginTop: 6 }}>{r.comment}</p>
                  )}
                  {r.recommend === false && (
                    <p style={{ fontSize: 12, color: '#B91C1C', marginTop: 4 }}>❌ Nedoporučuje</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

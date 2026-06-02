// Admin dashboard — KPI, moderace uživatelů, neřešené kontakty.
// Vyžaduje role='admin'.

import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';
import VerificationBanner from '../../components/VerificationBanner';

const TABS = [
  { id: 'stats',    label: '📊 Přehled' },
  { id: 'users',    label: '👥 Uživatelé' },
  { id: 'orders',   label: '📋 Poptávky' },
  { id: 'contacts', label: '📨 Kontakty' },
];

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
      <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: '-.02em', marginBottom: 4 }}>{value ?? '—'}</div>
      <div style={{ fontSize: 12, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

export default function AdminDashboard({ currentUser, onLogout }) {
  const [tab, setTab] = useState('stats');
  const [stats, setStats]       = useState(null);
  const [users, setUsers]       = useState([]);
  const [orders, setOrders]     = useState([]);
  const [contacts, setContacts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState(null);

  const load = async (which) => {
    setErr(null);
    setBusy(true);
    try {
      if (which === 'stats')    setStats((await adminApi.stats()));
      if (which === 'users')    setUsers((await adminApi.users()).users);
      if (which === 'orders')   setOrders((await adminApi.orders()).orders);
      if (which === 'contacts') setContacts((await adminApi.contacts()).contacts);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(tab); /* eslint-disable-next-line */ }, [tab]);

  const verify = async (id) => {
    try {
      await adminApi.verifySikula(id);
      load('users');
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>

        <VerificationBanner user={currentUser} />

        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #F3F4F6', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#A855F7', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 2 }}>Admin</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1F2E' }}>{currentUser?.name || 'Administrátor'}</div>
          </div>
          {onLogout && (
            <button onClick={onLogout}
              style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid #E5E7EB', background: 'none', fontSize: 13, color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit' }}>
              Odhlásit
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? '#1A1F2E' : '#6B7280', fontWeight: tab === t.id ? 600 : 400, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        {busy && <div style={{ color: '#6B7280', padding: 12 }}>Načítám…</div>}
        {err && <div style={{ color: '#B91C1C', padding: 12 }}>Chyba: {err}</div>}

        {tab === 'stats' && stats && (
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.05em' }}>Uživatelé</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 28 }}>
              <StatCard label="Zákazníci"        value={stats.users?.customers}        color="#3B82F6" />
              <StatCard label="Šikulové"         value={stats.users?.sikulas}          color="#F97316" />
              <StatCard label="Ověření šikulové" value={stats.users?.verified_sikulas} color="#22C55E" />
            </div>

            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.05em' }}>Poptávky</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginBottom: 28 }}>
              <StatCard label="Celkem"      value={stats.orders?.total}       color="#1A1F2E" />
              <StatCard label="Nové"        value={stats.orders?.new_orders}  color="#3B82F6" />
              <StatCard label="Probíhající" value={stats.orders?.in_progress} color="#F97316" />
              <StatCard label="Přijato"     value={stats.orders?.accepted}    color="#A855F7" />
              <StatCard label="Dokončeno"   value={stats.orders?.completed}   color="#22C55E" />
              <StatCard label="Zrušeno"     value={stats.orders?.cancelled}   color="#9CA3AF" />
            </div>

            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.05em' }}>Aktivita</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
              <StatCard label="Recenze celkem"     value={stats.reviews?.total}      color="#F97316" />
              <StatCard label="Průměrné hodnocení" value={stats.reviews?.avg_stars}  color="#F97316" />
              <StatCard label="Neřešené kontakty"  value={stats.contacts?.unhandled} color="#EF4444" />
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #F3F4F6', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 720 }}>
              <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>Jméno</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>E-mail</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>Role</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>Město</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>Plan</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#6B7280' }}>Verified</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>Akce</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: '10px 16px', color: '#6B7280' }}>{u.email}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 999, background: u.role === 'admin' ? '#FAF5FF' : u.role === 'sikula' ? '#FFF7ED' : '#EFF6FF', color: u.role === 'admin' ? '#A855F7' : u.role === 'sikula' ? '#C2410C' : '#1D4ED8', fontSize: 11, fontWeight: 600 }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', color: '#6B7280' }}>{u.city || '—'}</td>
                    <td style={{ padding: '10px 16px', color: '#6B7280' }}>{u.plan || '—'}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>{u.verified ? '✓' : '—'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      {u.role === 'sikula' && !u.verified && (
                        <button onClick={() => verify(u.id)}
                          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #22C55E', background: '#F0FDF4', color: '#16A34A', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Ověřit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'orders' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #F3F4F6', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 720 }}>
              <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>ID</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>Titulek</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>Zákazník</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>Město</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>Stav</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>Vytvořeno</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 16px', color: '#9CA3AF' }}>#{o.id}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 600 }}>{o.title}</td>
                    <td style={{ padding: '10px 16px', color: '#6B7280' }}>{o.customer_name}</td>
                    <td style={{ padding: '10px 16px', color: '#6B7280' }}>{o.city}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 999, background: '#F3F4F6', fontSize: 11, fontWeight: 600 }}>{o.status}</span>
                    </td>
                    <td style={{ padding: '10px 16px', color: '#9CA3AF', fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString('cs-CZ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'contacts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {contacts.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Žádné zprávy.</div>
            ) : contacts.map(c => (
              <div key={c.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #F3F4F6', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <strong style={{ fontSize: 14 }}>{c.name}</strong>
                    <span style={{ color: '#6B7280', fontSize: 13, marginLeft: 8 }}>{c.email}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(c.created_at).toLocaleString('cs-CZ')}</span>
                </div>
                {c.subject && <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}><strong>Předmět:</strong> {c.subject}</div>}
                <p style={{ fontSize: 14, color: '#3D4554', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

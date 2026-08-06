// Sdílená logika "má šikula právě teď aktivní placený tarif" — zrcadlí
// api/_plan.js. Používá SikulaDashboard.jsx, SendOfferPage.jsx, OrderDetailPage.jsx.
//
// subscription_status: 'active' | 'cancelled' | 'payment_failed' | 'inactive'
// 'cancelled' = šikula tarif zrušil, ale zaplacené období ještě neskončilo —
// profil zůstává plně funkční až do plan_expires_at.

export function isSikulaPlanActive(user) {
  if (!user) return false;
  if (user.plan !== 'aktiv' && user.plan !== 'aktiv-plus') return false;
  if (user.subscription_status === 'active') return true;
  if (user.subscription_status === 'cancelled' && user.plan_expires_at) {
    return new Date(user.plan_expires_at).getTime() > Date.now();
  }
  return false;
}

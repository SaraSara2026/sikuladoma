// Sdílená logika "má šikula právě teď aktivní placený tarif" — používá
// api/offers.js a api/orders.js (gate na reakce/detail poptávky).
//
// subscription_status: 'active' | 'cancelled' | 'payment_failed' | 'inactive'
// 'cancelled' = zákazník tarif zrušil, ale zaplacené období ještě neskončilo
// (Stripe cancel_at_period_end nebo subscription.deleted s current_period_end
// v budoucnu) — profil zůstává plně funkční až do plan_expires_at.

export function isSikulaPlanActive(user) {
  if (!user) return false;
  if (user.plan !== 'aktiv' && user.plan !== 'aktiv-plus') return false;
  if (user.subscription_status === 'active') return true;
  if (user.subscription_status === 'cancelled' && user.plan_expires_at) {
    return new Date(user.plan_expires_at).getTime() > Date.now();
  }
  return false;
}

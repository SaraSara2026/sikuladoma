// Sdílená logika "má šikula právě teď aktivní placený tarif" — používá
// api/offers.js a api/orders.js (gate na reakce/detail poptávky).
//
// subscription_status: 'active' | 'cancelled' | 'payment_failed' | 'inactive'
// 'cancelled' = zákazník tarif zrušil, ale zaplacené období ještě neskončilo
// (Stripe cancel_at_period_end nebo subscription.deleted s current_period_end
// v budoucnu) — profil zůstává plně funkční až do plan_expires_at.

// Samotné "active nebo v doběhu" bez závislosti na plan/user objektu — používá
// i api/stripe.js (webhook), kde v okamžiku zápisu ještě nemáme plný uživatelský
// řádek z DB, jen čerstvě spočítaný status/expiraci ze Stripe eventu.
export function isStatusActiveOrGrace(subscriptionStatus, planExpiresAt) {
  if (subscriptionStatus === 'active') return true;
  if (subscriptionStatus === 'cancelled' && planExpiresAt) {
    return new Date(planExpiresAt).getTime() > Date.now();
  }
  return false;
}

export function isSikulaPlanActive(user) {
  if (!user) return false;
  if (user.plan !== 'aktiv' && user.plan !== 'aktiv-plus') return false;
  return isStatusActiveOrGrace(user.subscription_status, user.plan_expires_at);
}

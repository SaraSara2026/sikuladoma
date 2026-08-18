// Zásady ochrany osobních údajů existují jen na jednom místě
// (OchranaSoukromiPage.jsx), ať nikdy nevzniknou dvě rozdílné verze
// stejného právního textu. Tahle stránka jen znovu vykresluje stejný obsah
// pod druhým názvem/URL.
import OchranaSoukromiPage from './OchranaSoukromiPage.jsx'

export default function GDPRPage(props) {
  return <OchranaSoukromiPage {...props} />
}

// Per-route SEO — updatuje document.title + meta description.
// Google bot dnes JS dobře renderuje, takže to stačí bez SSR.
// Použití: <PageMeta title="..." description="..." /> kdekoliv ve stránce.

import { useEffect } from 'react';

const DEFAULT_TITLE = 'ŠikulaDoma — najdeme šikulu na cokoliv';
const DEFAULT_DESC  = 'Marketplace šikulů v ČR. Vyber službu, napiš detaily a šikulové z okolí ti mohou poslat nabídky zdarma.';

export default function PageMeta({ title, description, noindex }) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ŠikulaDoma` : DEFAULT_TITLE;
    document.title = fullTitle;

    setMeta('description', description || DEFAULT_DESC);
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', description || DEFAULT_DESC, 'property');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description || DEFAULT_DESC);

    // robots noindex pro privátní stránky (dashboard apod.)
    if (noindex) setMeta('robots', 'noindex, nofollow');

    return () => {
      // Při unmount nereset — další PageMeta to přebije, nebo zůstane defaultní.
      // (Pokud user opustí stránku bez PageMeta, fallback je default v index.html.)
    };
  }, [title, description, noindex]);

  return null;
}

function setMeta(name, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

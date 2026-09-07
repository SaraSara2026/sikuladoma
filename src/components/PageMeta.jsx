// Per-route SEO — updatuje document.title + meta description + canonical/og:url.
// Google bot dnes JS dobře renderuje, takže to stačí bez SSR.
// Použití: <PageMeta title="..." description="..." path="/?page=faq" /> kdekoliv ve stránce.
// `path` = cesta od kořene domény (bez domény), použije se pro canonical + og:url.
// Bez path se použije "/" (homepage) — vždy ho předávej, pokud stránka není homepage.

import { useEffect } from 'react';

const DEFAULT_TITLE = 'ŠikulaDoma — najdeme šikulu na cokoliv';
const DEFAULT_DESC  = 'Marketplace šikulů v ČR. Vyberte službu, napište detaily a šikulové z okolí vám mohou poslat nabídky zdarma.';
const SITE_URL = 'https://sikuladoma.cz';

export default function PageMeta({ title, description, noindex, path }) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ŠikulaDoma` : DEFAULT_TITLE;
    document.title = fullTitle;

    setMeta('description', description || DEFAULT_DESC);
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', description || DEFAULT_DESC, 'property');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description || DEFAULT_DESC);

    const canonicalUrl = `${SITE_URL}${path || '/'}`;
    setCanonical(canonicalUrl);
    setMeta('og:url', canonicalUrl, 'property');

    // robots se MUSÍ vždy explicitně nastavit (index i noindex) — jinak by
    // noindex z předchozí stránky (např. dashboard) zůstal viset i na téhle,
    // protože se dřív mazal jen implicitně tím, že se nikdy nenastavil zpátky.
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');
  }, [title, description, noindex, path]);

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

function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

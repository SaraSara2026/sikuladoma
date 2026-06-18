// FAQ stránka — accordion s 12 nejčastějšími otázkami.
// Rozděleno na 2 sekce: pro zákazníky / pro šikuly.

import { useState } from 'react';
import { T } from '../ui/theme';
import PageMeta from '../components/PageMeta';

const FAQ_CUSTOMERS = [
  {
    q: 'Kolik mě stojí zadání poptávky?',
    a: 'Pro zákazníky je ŠikulaDoma <strong>úplně zdarma</strong>. Zadáš poptávku, šikulové z okolí ti pošlou nabídky a ty si vybereš. Platíš až za samotnou práci přímo šikulovi, ne nám.',
  },
  {
    q: 'Musím se registrovat abych zadala poptávku?',
    a: 'Ne, registrace není nutná. Stačí vyplnit e-mail a telefon ve formuláři. Pokud se ale zaregistruješ, uvidíš všechny své poptávky a chat s šikuly na jednom místě.',
  },
  {
    q: 'Jak rychle se mi šikulové ozvou?',
    a: 'Průměrná první reakce je <strong>do 2 hodin</strong>. U urgentních poptávek (do 48 hodin) to bývá ještě rychleji — šikulové mají notifikace v aplikaci.',
  },
  {
    q: 'Jak vím, že je šikula ověřený a důvěryhodný?',
    a: 'U každého profilu vidíš zelený štítek "Ověřený", recenze od minulých zákazníků (hvězdičky 1-5), kolik zakázek už dokončil a u placených tarifů (Profi, Top) jsme navíc ručně prověřili IČO a totožnost.',
  },
  {
    q: 'Co když s prací nejsem spokojený?',
    a: 'Domlouvej se vždy přes náš chat — ten slouží jako důkaz dohody. Pokud nastane spor, kontaktuj nás na <a href="mailto:info@sikuladoma.cz" style="color:#F97316">info@sikuladoma.cz</a> a pomůžeme vyřešit. Můžeš také dát šikulovi nízké hodnocení, které ostatní zákazníky varuje.',
  },
  {
    q: 'Platím šikulovi předem?',
    a: 'Doporučujeme platit <strong>až po dokončení práce</strong>. U větších zakázek si můžete domluvit zálohu, ale o tom rozhoduješ ty. ŠikulaDoma platby nezprostředkovává — peníze jdou přímo šikulovi (hotově, na účet, podle dohody).',
  },
];

const FAQ_SIKULOVE = [
  {
    q: 'Kolik mě stojí registrace jako šikula?',
    a: 'Aktivní šikula stojí <strong>399 Kč / měsíc</strong>. Platba probíhá kartou přes Stripe. Po úspěšné platbě se profil aktivuje a můžete přijímat poptávky. Tarif se obnovuje měsíčně a lze ho kdykoliv zrušit.',
  },
  {
    q: 'Jak funguje 5 reakcí měsíčně v tarifu Start?',
    a: 'S tarifem Aktivní šikula (399 Kč/měs) můžete reagovat na poptávky bez omezení. Tarif se obnovuje každý měsíc a zrušit ho lze kdykoliv přímo v profilu.',
  },
  {
    q: 'Můžu kdykoliv změnit nebo zrušit tarif?',
    a: 'Ano. V dashboardu → Členství můžeš kdykoliv upgradovat nebo přes Stripe portál zrušit. Zrušení se aktivuje po skončení aktuálního období — do té doby máš výhody zaplaceného tarifu.',
  },
  {
    q: 'Jak získám hodnocení a recenze?',
    a: 'Po každé dokončené zakázce dostane zákazník výzvu k hodnocení. Hvězdičky 1-5 + komentář + možnost doporučit. Recenze se zobrazí na tvém veřejném profilu a počítají se do tvého ratingu.',
  },
  {
    q: 'Musím odvádět z výdělků daně?',
    a: 'Ano, jako samostatně výdělečně činná osoba (OSVČ) odvádíš daně sama. Pomůže ti naše <strong>fakturační modul</strong> (Plus a vyšší) — vystavíš fakturu, stáhneš PDF, pošleš zákazníkovi.',
  },
  {
    q: 'Co když mi zákazník nezaplatí?',
    a: 'Vždy si dohodu dokumentuj v chatu. Pokud nezaplatí, máš důkaz. Kontaktuj nás, pomůžeme s mediací. V krajním případě se obrať na advokáta — ŠikulaDoma platby nezprostředkovává, ale dohoda v chatu je platná.',
  },
];

export default function FAQPage({ onBack, onReg, onOrder }) {
  return (
    <>
      <PageMeta title="Často kladené dotazy" description="Odpovědi na nejčastější otázky o ŠikulaDoma — pro zákazníky i šikuly." />
      <div style={{ minHeight: '100vh', background: T.bg }}>
        {/* Hero */}
        <div style={{ background: '#fff', borderBottom: `1px solid ${T.border}`, padding: '32px 24px 32px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {onBack && (
              <button onClick={onBack}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: T.ink3, fontFamily: 'inherit', padding: 0, marginBottom: 16 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                Zpět na úvod
              </button>
            )}
            <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, color: T.ink, letterSpacing: '-.03em', marginBottom: 8 }}>
              Často kladené dotazy
            </h1>
            <p style={{ fontSize: 15, color: T.ink3, lineHeight: 1.6 }}>
              Najdi rychle odpověď na to, co tě zajímá. Pokud něco chybí, napiš nám na <a href="mailto:info@sikuladoma.cz" style={{ color: T.orange, fontWeight: 600 }}>info@sikuladoma.cz</a>.
            </p>
          </div>
        </div>

        {/* Sekce zákazníci */}
        <Section title="Pro zákazníky" subtitle="Chceš poptávat službu" items={FAQ_CUSTOMERS} cta={{ label: 'Zadat poptávku zdarma', onClick: onOrder, color: T.orange }} />

        {/* Sekce šikulové */}
        <Section title="Pro šikuly" subtitle="Chceš nabízet své služby" items={FAQ_SIKULOVE} cta={{ label: 'Registrovat se jako šikula', onClick: onReg, color: '#2563EB' }} />

        <div style={{ height: 60 }} />
      </div>
    </>
  );
}

function Section({ title, subtitle, items, cta }) {
  return (
    <section style={{ padding: '40px 24px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: cta.color, marginBottom: 6 }}>{subtitle}</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: T.ink, letterSpacing: '-.02em' }}>{title}</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it, i) => <AccordionItem key={i} q={it.q} a={it.a} />)}
      </div>
      {cta?.onClick && (
        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <button onClick={cta.onClick}
            style={{ height: 46, padding: '0 28px', borderRadius: 10, border: 'none', background: cta.color, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            {cta.label}
          </button>
        </div>
      )}
    </section>
  );
}

function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          width: '100%', padding: '18px 20px', background: 'transparent', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          fontSize: 15, fontWeight: 600, color: T.ink,
        }}>
        <span>{q}</span>
        <span style={{ flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none', color: T.ink3 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 20px 20px', fontSize: 14, color: T.ink3, lineHeight: 1.7 }}
          dangerouslySetInnerHTML={{ __html: a }} />
      )}
    </div>
  );
}

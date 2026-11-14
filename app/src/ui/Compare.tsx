import { useMemo } from 'react';
import { goHome } from './nav';
import { eur } from '../engine/analytics';
import { personaOf, STAGE_INFO, STYLE_INFO } from '../engine/personas';
import { Icon } from './Icon';
import { PreviewPhone } from './PreviewPhone';
import { useCustomer, type Person } from './data';
import './landing.css';

/** What a judge should notice on each phone, per life stage. */
export const STAGE_LOOK: Record<string, string> = {
  starter: 'Playful look, daily amount as a sticker, guessing game near the top',
  builder: 'A goal card with a slider right under the coach card',
  established: 'Squarer and denser, upcoming bills near the top',
  golden: 'Larger text, light high-contrast hero, fewer cards',
};
export const STYLE_LOOK: Record<string, string> = {
  pass_through: 'Hero strip shows what stays here and what moves on',
  tightrope: 'Hero strip counts the days to payday',
  saver: 'Hero strip shows what is put aside first',
  steady: 'Hero strip shows what is left over',
};

export function CompareCol({ id, name }: { id: string; name: string }) {
  const c = useCustomer(id);
  const p = useMemo(() => (c ? personaOf(c, (x) => eur(x)) : null), [c]);
  return (
    <div className="compare-col">
      <div className="compare-label">
        <b>{name}{c ? `, ${c.age}` : ''}</b>
        <span>{p ? p.name : ' '}</span>
      </div>
      <PreviewPhone id={id} name={name} />
      {p && (
        <ul className={`compare-diff sy-${p.style}`}>
          <li><Icon name={STAGE_INFO[p.stage].icon} size={15} /><span><b>{STAGE_INFO[p.stage].label}.</b> {STAGE_LOOK[p.stage]}.</span></li>
          <li className="acc"><Icon name={STYLE_INFO[p.style].icon} size={15} /><span><b>{STYLE_INFO[p.style].label}.</b> {STYLE_LOOK[p.style]}.</span></li>
        </ul>
      )}
      <a className="lp-btn ghost" href={`#c=${id}`}>Open {name} in the app <Icon name="ArrowRight" size={16} /></a>
    </div>
  );
}

/** Three customers, one app: what changes and what stays the same. */
export function Compare({ personas }: { personas: Person[] }) {
  const ids = (new URLSearchParams(location.search).get('compare') || '').split(',').filter(Boolean);
  const pick = ids.length ? ids : personas.filter((p) => p.compare).map((p) => p.id).slice(0, 3);
  return (
    <div className="lp compare-page">
      <header className="lp-nav">
        <a className="lp-logo" href="#top" onClick={(e) => { e.preventDefault(); goHome(); }}><img src="favicon.svg" alt="" width="30" height="30" /> Kori</a>
        <nav aria-label="Compare"><a href="#top" onClick={(e) => { e.preventDefault(); goHome('map'); }}>Persona map</a></nav>
        <a className="lp-btn" href="#app">Open the app</a>
      </header>
      <div className="compare-title">
        <h1>One app. Three people. Three homes.</h1>
        <p>Kori places each customer in one of 16 personas, life stage by money style, and sets up the home for it: the order of the cards, the hero, the wording, the coach’s tone. No screen is generated per person.</p>
      </div>
      <div className="compare">
        {pick.map((id) => <CompareCol key={id} id={id} name={personas.find((x) => x.id === id)?.name ?? 'there'} />)}
      </div>
    </div>
  );
}

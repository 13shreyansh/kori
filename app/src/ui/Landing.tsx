// The judge-first landing page. Everything on it is live: the phones are the real app on S-Pankki's challenge data.
import { useEffect, useMemo, useRef, useState } from 'react';
import { eur } from '../engine/analytics';
import { personaOf, STAGES, STAGE_INFO, STYLES, STYLE_INFO, TRAITS, TRAIT_INFO, type Stage, type Style, type Trait } from '../engine/personas';
import type { Basket } from '../engine/taxonomy';
import { CompareCol, STAGE_LOOK, STYLE_LOOK } from './Compare';
import { CustomisePanel } from './Customise';
import { Icon } from './Icon';
import { STAGE_VOICE } from './Me';
import { PhoneApp, type PhoneApi } from './PhoneApp';
import { LazyMount, PreviewPhone } from './PreviewPhone';
import { DEFAULT_PREFS, MODULE_LABEL, type Prefs } from './prefs';
import { themeClass } from './Today';
import { useCustomer, type Directory, type MapCell } from './data';
import './landing.css';

// One demo customer per life stage, covering all four money styles between them.
const CAST = ['CUST00306', 'CUST01090', 'CUST00394', 'CUST00229'];
const ASKS: { q: string; ask: string; how: string; icon: string }[] = [
  { q: 'Where did my money go?', ask: 'Where did my money go?', how: 'Your biggest categories and the three baskets, with the payments behind each.', icon: 'ChartPie' },
  { q: 'What kind of spender am I?', ask: 'What kind of spender am I?', how: 'A plain read of your habits from the last three months. No labels to feel bad about.', icon: 'ScanEye' },
  { q: 'What can I safely spend this week?', ask: 'What is safe to spend this week?', how: 'Income, minus bills that are coming, a share for surprises and savings, spread to payday.', icon: 'ShieldCheck' },
  { q: 'How could I save more?', ask: 'How could I save more?', how: 'Your own biggest levers, and what each one is worth in a year.', icon: 'PiggyBank' },
];
const BASKETS: { b: Basket; theirs: string; ours: string; eg: string }[] = [
  { b: 'fixed', theirs: 'Regular essentials', ours: 'Fixed bills', eg: 'Rent, loans, electricity, insurance' },
  { b: 'surprise', theirs: 'Unexpected necessities', ours: 'Surprise costs', eg: 'Dentist, car repair, a broken phone' },
  { b: 'everyday', theirs: 'Everyday spending', ours: 'Everyday', eg: 'Groceries, cafés, the small taps' },
];
const NAV: [string, string][] = [['asks', 'The four asks'], ['how', 'Personalisation'], ['map', 'Persona map'], ['yours', 'Make it yours'], ['trust', 'Trust'], ['evals', 'Evals']];

export function Landing({ dir, anchor }: { dir: Directory; anchor: string }) {
  const [cid, setCid] = useState(CAST[0]);
  const phone = useRef<PhoneApi>(null);
  const phoneBox = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!anchor || anchor === 'top') return;
    const t = setTimeout(() => document.getElementById(anchor)?.scrollIntoView(), 60);
    return () => clearTimeout(t);
  }, [anchor]);
  /** Run something in the live phone; on narrow screens bring the phone into view first. */
  const inPhone = (fn: (p: PhoneApi) => void) => {
    const el = phoneBox.current;
    if (el) { const r = el.getBoundingClientRect(); if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    if (phone.current) fn(phone.current);
  };
  const cast = CAST.map((id) => dir.demo.find((d) => d.id === id)).filter((x) => !!x);
  const map = dir.map;

  return (
    <div className="lp" id="top">
      <a className="lp-skip" href="#asks">Skip to content</a>
      <header className="lp-nav">
        <a className="lp-logo" href="#top"><img src="favicon.svg" alt="" width="30" height="30" /> Kori</a>
        <nav aria-label="Sections">{NAV.map(([id, l]) => <a key={id} href={'#' + id}>{l}</a>)}</nav>
        <a className="lp-btn" href="#app">Open the app <Icon name="ArrowRight" size={16} /></a>
      </header>

      {/* ---------- hero + the four asks, next to one live phone ---------- */}
      <div className="lp-wrap lp-demo">
        <div className="lp-demo-text">
          <section className="lp-hero">
            <p className="lp-eyebrow"><span className="dot" /> S-Pankki challenge · Personal Economic Trainer · Junction 2026</p>
            <h1>Talk with your own money.</h1>
            <p className="lp-lede">Kori is a money coach for S-mobiili. Ask it anything about your spending and it answers from your own transactions, with the payments behind every number. It also sets itself up differently for a student, a household and a pensioner.</p>
            <div className="lp-ctas">
              <a className="lp-btn big" href="#app">Open the app <Icon name="ArrowRight" size={18} /></a>
              <a className="lp-btn big ghost" href="#how">See how it personalises</a>
            </div>
            <dl className="lp-facts">
              <div><dt>{map?.total ?? 393}</dt><dd>real customers from S-Pankki’s challenge data</dd></div>
              <div><dt>16</dt><dd>personas, and no screen generated per person</dd></div>
              <div><dt>99.5%</dt><dd>coach score on held-out customers</dd></div>
            </dl>
          </section>

          <section className="lp-asks" id="asks">
            <p className="lp-kicker">S-Bank asked for four answers</p>
            <h2>Ask your money. <span>Tap a question and watch the phone answer.</span></h2>
            <div className="lp-asklist">
              {ASKS.map((a) => (
                <button key={a.q} className="lp-ask" onClick={() => inPhone((p) => p.ask(a.ask))}>
                  <span className="lp-ask-ico"><Icon name={a.icon} size={20} /></span>
                  <span><b>{a.q}</b><small>{a.how}</small></span>
                  <Icon name="ArrowUpRight" size={18} className="go" />
                </button>
              ))}
            </div>

            <p className="lp-kicker" style={{ marginTop: 44 }}>Make spending easy to understand</p>
            <h3 className="lp-h3">Three baskets, in S-Bank’s own words.</h3>
            <div className="lp-baskets">
              {BASKETS.map((x) => (
                <button key={x.b} className="lp-basket" style={{ ['--tone' as string]: `var(--${x.b})`, ['--soft' as string]: `var(--${x.b}-soft)` }} onClick={() => inPhone((p) => p.basket(x.b))}>
                  <i aria-hidden />
                  <small>{x.theirs}</small>
                  <b>{x.ours}</b>
                  <span>{x.eg}</span>
                </button>
              ))}
            </div>

            <p className="lp-kicker" style={{ marginTop: 44 }}>Think your own data</p>
            <h3 className="lp-h3">Free exploration, real benchmarks, and a guess before the reveal.</h3>
            <div className="lp-tries">
              <button onClick={() => inPhone((p) => p.go('explore'))}><Icon name="ChartNoAxesColumn" size={18} /><span><b>Explore freely</b>Any period, basket and grouping. Tap a bar for its payments.</span></button>
              <button onClick={() => inPhone((p) => p.ask('How do I compare to similar households?'))}><Icon name="Scale" size={18} /><span><b>Open-data benchmark</b>Your spending next to Statistics Finland’s household figures.</span></button>
              <button onClick={() => inPhone((p) => p.go('today'))}><Icon name="Dices" size={18} /><span><b>Guess first</b>Guess what you spent on cafés, then see it. On the home screen.</span></button>
              <button onClick={() => inPhone((p) => p.go('explore'))}><Icon name="SlidersHorizontal" size={18} /><span><b>What-if sliders</b>Picked for the persona, at the bottom of Explore.</span></button>
            </div>
          </section>
        </div>

        <aside className="lp-demo-phone" aria-label="Live demo of the app">
          <div className="lp-cast" role="group" aria-label="Choose a demo customer">
            {cast.map((d) => (
              <button key={d.id} className={d.id === cid ? 'on' : ''} aria-pressed={d.id === cid} onClick={() => setCid(d.id)}>
                <b>{d.name}, {d.age}</b><small>{d.type.replace(/^The /, '')}</small>
              </button>
            ))}
          </div>
          <div ref={phoneBox} className="lp-phonebox">
            <PhoneApp embed cid={cid} name={dir.nameOf(cid)} people={dir.demo} onPick={setCid} api={phone} />
          </div>
          <p className="lp-live"><span className="pulse" /> Live app on real challenge data. Tap anything.</p>
        </aside>
      </div>

      {/* ---------- how it personalises ---------- */}
      <section className="lp-sec" id="how">
        <div className="lp-wrap">
          <p className="lp-kicker">How Kori personalises</p>
          <h2 className="lp-h2">Personal for 1.7 million people, without generating 1.7 million screens.</h2>
          <p className="lp-sub">Generating an interface per person is too costly and too hard to check. Kori uses two things the bank already knows, layers habits on top, and gives the person the last word.</p>
          <ol className="lp-steps">
            <li><span className="n">1</span><h3>Life stage</h3><p>From age: Starter 18–25, Builder 26–39, Established 40–64, Golden 65+.</p><em>Sets the shape: what sits near the top, text size, density.</em></li>
            <li><span className="n">2</span><h3>Money style</h3><p>From six months of behaviour: Pass-through, Tightrope, Saver or Steady.</p><em>Sets the accent, the hero strip, the advice and the what-if sliders.</em></li>
            <li><span className="n">3</span><h3>Habits</h3><p>Many small taps, a quiet account, bill-heavy, irregular income.</p><em>Each one that fits adds its own card.</em></li>
            <li><span className="n">4</span><h3>The person</h3><p>Make it yours: reorder or hide cards, pick the coach’s tone and the text size.</p><em>Their choice always wins over Kori’s pick.</em></li>
          </ol>
        </div>
        <LazyMount minHeight={700} className="lp-strip-wrap">
          <div className="lp-strip">
            {cast.map((d) => <CompareCol key={d.id} id={d.id} name={d.name} />)}
          </div>
        </LazyMount>
        <div className="lp-wrap" style={{ textAlign: 'center' }}>
          <a className="lp-btn ghost" href="#compare"><Icon name="Columns3" size={16} /> Open three of them side by side, full size</a>
        </div>
      </section>

      {/* ---------- persona map ---------- */}
      <section className="lp-sec alt" id="map">
        <div className="lp-wrap">
          <p className="lp-kicker">The persona map</p>
          <h2 className="lp-h2">{map?.total ?? 393} real customers, 16 personas.</h2>
          <p className="lp-sub">Every customer in S-Pankki’s challenge sample, placed by the same rules the app uses. Pick a cell to open a real customer of that persona.</p>
          {map && <PersonaMapView dir={dir} />}
        </div>
      </section>

      {/* ---------- make it yours ---------- */}
      <section className="lp-sec" id="yours">
        <div className="lp-wrap">
          <p className="lp-kicker">Make it yours</p>
          <h2 className="lp-h2">The persona is a starting point. The person decides.</h2>
          <p className="lp-sub">Try it: move a card, hide one, change the text size. The phone next to it is the real home screen and follows along.</p>
          <LazyMount minHeight={720}><YoursDemo id={CAST[0]} name={dir.nameOf(CAST[0])} /></LazyMount>
        </div>
      </section>

      {/* ---------- trust ---------- */}
      <section className="lp-sec dark" id="trust">
        <div className="lp-wrap">
          <p className="lp-kicker">Why you can trust the numbers</p>
          <h2 className="lp-h2">The AI writes the sentence. It never does the maths.</h2>
          <div className="lp-flow" role="img" aria-label="Transactions stay on the device. An on-device engine computes totals. The AI only sees totals and writes the answer. A guard checks every number before it is shown with a receipt.">
            <div><Icon name="Smartphone" size={20} /><b>Transactions</b><small>stay on the device</small></div>
            <Icon name="ArrowRight" size={18} className="arr" />
            <div><Icon name="Calculator" size={20} /><b>Kori engine</b><small>plain code, same answer every time</small></div>
            <Icon name="ArrowRight" size={18} className="arr" />
            <div className="ai"><Icon name="Sparkles" size={20} /><b>Gemini</b><small>sees totals only, writes the words</small></div>
            <Icon name="ArrowRight" size={18} className="arr" />
            <div><Icon name="BadgeCheck" size={20} /><b>Number guard</b><small>rejects any figure that is not a computed total</small></div>
            <Icon name="ArrowRight" size={18} className="arr" />
            <div><Icon name="ReceiptText" size={20} /><b>Answer</b><small>every number is a receipt</small></div>
          </div>
          <div className="lp-trust">
            <div><Icon name="Cpu" size={22} /><h3>Numbers are computed on the device</h3><p>A deterministic engine does every sum. The coach still works with the AI switched off.</p></div>
            <div><Icon name="ReceiptText" size={22} /><h3>Every number is a receipt</h3><p>Tap any amount in an answer to see the formula and the exact payments behind it.</p></div>
            <div><Icon name="EyeOff" size={22} /><h3>The AI sees totals only</h3><p>Never raw payments, merchants or balances. If it writes a number the engine did not produce, the answer is thrown away.</p></div>
            <div><Icon name="Ban" size={22} /><h3>Gender is never used</h3><p>It is not in the data and no rule depends on it. Personas come from age and behaviour only, and the app says so on screen.</p></div>
          </div>
        </div>
      </section>

      {/* ---------- evals ---------- */}
      <section className="lp-sec" id="evals">
        <div className="lp-wrap">
          <p className="lp-kicker">Measured, not claimed</p>
          <h2 className="lp-h2">Checked against an answer key we did not write in the app.</h2>
          <div className="lp-evals">
            <div><b>99.5%</b><h3>Coach score, held-out customers</h3><p>Macro score across the rubric: the right number, every figure backed by a receipt, a next step, short and kind. Run on customers the coach was never tuned on.</p></div>
            <div><b>100%</b><h3>Persona assignment agreement</h3><p>Life stage, money style and habits match an independent Python answer key for every held-out customer.</p></div>
            <div><b>{map ? Math.round((map.moves30 / map.total) * 100) : 19}%</b><h3>Move their pay to another bank</h3><p>{map ? `${map.moves30} of ${map.total}` : '73 of 393'} customers send 30% or more of their income on soon after payday. Kori spots them and shows what it could do if their bills lived here.</p></div>
          </div>
          <ul className="lp-method">
            <li><Icon name="Check" size={16} /> The answer key is separate Python code that shares nothing with the app.</li>
            <li><Icon name="Check" size={16} /> Dev and held-out customers are split by a hash of the customer id.</li>
            <li><Icon name="Check" size={16} /> Every held-out run is logged, including the first one at 72.3%.</li>
          </ul>
        </div>
      </section>

      <section className="lp-end">
        <div className="lp-wrap">
          <h2>See it on a real customer.</h2>
          <div className="lp-ctas" style={{ justifyContent: 'center' }}>
            <a className="lp-btn big" href="#app">Open the app <Icon name="ArrowRight" size={18} /></a>
            <a className="lp-btn big ghost" href="#compare">Three people side by side</a>
          </div>
          <p className="lp-foot">Kori is a Junction 2026 prototype built on S-Pankki’s challenge dataset. Names are invented; the transactions are from the dataset. Not an S-Pankki product.</p>
        </div>
      </section>
    </div>
  );
}

/** The 4x4 grid with real head-counts. Picking a cell loads a real customer of that persona into the phone beside it. */
function PersonaMapView({ dir }: { dir: Directory }) {
  const map = dir.map!;
  const [sel, setSel] = useState('established.pass_through');
  const [trait, setTrait] = useState<Trait | null>(null);
  const cell = map.cells[sel];
  const countOf = (c: MapCell) => (trait ? c.traits[trait] : c.count);
  const exOf = (c: MapCell) => (trait ? c.byTrait[trait] : c.example);
  const max = Math.max(1, ...Object.values(map.cells).map(countOf));
  const ex = exOf(cell);
  const [shown, setShown] = useState(ex);
  useEffect(() => { if (ex) setShown(ex); }, [ex]);
  const shownTotal = trait ? map.traits[trait] : map.total;
  return (
    <div className="pm">
      <div className="pm-main">
        <div className="pm-traits" role="group" aria-label="Filter by habit">
          <button className={!trait ? 'on' : ''} aria-pressed={!trait} onClick={() => setTrait(null)}>Everyone <b>{map.total}</b></button>
          {TRAITS.map((t) => (
            <button key={t} className={trait === t ? 'on' : ''} aria-pressed={trait === t} onClick={() => setTrait(trait === t ? null : t)} title={TRAIT_INFO[t].what}>
              <Icon name={TRAIT_INFO[t].icon} size={15} /> {TRAIT_INFO[t].label} <b>{map.traits[t]}</b>
            </button>
          ))}
        </div>
        <div className="pm-grid" role="grid" aria-label="Personas by life stage and money style">
          <div className="pm-corner" aria-hidden><span>Money style</span><span>Life stage</span></div>
          {STYLES.map((y) => (
            <div key={y} className={`pm-col sy-${y}`} role="columnheader">
              <span className="pm-ico"><Icon name={STYLE_INFO[y].icon} size={16} /></span>
              <b>{STYLE_INFO[y].label}</b>
              <small>{STYLE_INFO[y].what}</small>
            </div>
          ))}
          {STAGES.map((s) => (
            <RowOf key={s} s={s}>
              {STYLES.map((y) => {
                const c = map.cells[`${s}.${y}`]; const n = countOf(c); const on = sel === `${s}.${y}`;
                return (
                  <button key={y} role="gridcell" className={`pm-cell sy-${y}` + (on ? ' on' : '') + (n === 0 ? ' zero' : '')} aria-pressed={on}
                    style={{ ['--heat' as string]: n === 0 ? 0 : 0.1 + 0.5 * (n / max) }} onClick={() => setSel(`${s}.${y}`)}
                    aria-label={`${c.name}: ${n} customers`}>
                    <b>{n}</b>
                    <span>{c.name.replace(/^The /, '')}</span>
                  </button>
                );
              })}
            </RowOf>
          ))}
        </div>
        <p className="pm-note">{trait ? `${shownTotal} customers have the habit “${TRAIT_INFO[trait].label.toLowerCase()}” (${TRAIT_INFO[trait].what.toLowerCase()}). ` : `${map.noTrait} customers have no habit flagged. `}Darker cells hold more customers.</p>

        <div className={`pm-detail sy-${cell.style}`}>
          <div className="pm-detail-head">
            <span className="pm-ico big"><Icon name={STYLE_INFO[cell.style].icon} size={22} /></span>
            <div><h3>{cell.name}</h3><p>{cell.line}</p></div>
            <div className="pm-count"><b>{countOf(cell)}</b><small>{trait ? 'with this habit' : `of ${map.total} · ${Math.round((cell.count / map.total) * 100)}%`}</small></div>
          </div>
          <dl>
            <div><dt>Rule</dt><dd>Age {STAGE_INFO[cell.stage].ages}, and {ruleText(cell.style)}.</dd></div>
            <div><dt>Home order</dt><dd className="order">{STAGE_INFO[cell.stage].layout.map((m) => <span key={m}>{MODULE_LABEL[m]}</span>)}</dd></div>
            <div><dt>Look</dt><dd>{STAGE_LOOK[cell.stage]}. {STYLE_LOOK[cell.style]}.</dd></div>
            <div><dt>Coach voice</dt><dd>{STAGE_VOICE[cell.stage]}</dd></div>
            <div><dt>Habits here</dt><dd className="pm-mini">{TRAITS.map((t) => <span key={t}><Icon name={TRAIT_INFO[t].icon} size={13} /> {TRAIT_INFO[t].label} <b>{cell.traits[t]}</b></span>)}</dd></div>
          </dl>
          {ex
            ? <a className="lp-btn" href={`#c=${ex.id}`}>Open {ex.name}, {ex.age}, full screen <Icon name="ArrowRight" size={16} /></a>
            : <p className="pm-none"><Icon name="Info" size={16} /> No customer in this sample {trait ? 'has this habit in this persona' : 'fits this persona'}. The persona still exists, so the first one who does gets this home.</p>}
        </div>
      </div>

      <aside className="pm-phone" aria-label="Example customer of the selected persona">
        {shown && (
          <LazyMount minHeight={700}>
            <p className="pm-phone-cap"><b>{shown.name}, {shown.age}</b> · a real customer from the sample{ex ? '' : ' (previous pick)'}</p>
            <PhoneApp embed cid={shown.id} name={shown.name} people={dir.demo} onPick={(id) => { location.hash = '#c=' + id; }} />
          </LazyMount>
        )}
      </aside>
    </div>
  );
}
function RowOf({ s, children }: { s: Stage; children: React.ReactNode }) {
  return (
    <>
      <div className="pm-row" role="rowheader"><Icon name={STAGE_INFO[s].icon} size={16} /><b>{STAGE_INFO[s].label}</b><small>{STAGE_INFO[s].ages}</small></div>
      {children}
    </>
  );
}
const ruleText = (y: Style) => ({
  pass_through: '30% or more of income moves on to another bank',
  tightrope: 'spends all that comes in, or ends 1 day in 4 under €100',
  saver: 'moves 5% or more of income to savings',
  steady: 'none of the other three styles fit',
}[y]);

/** The real "Make it yours" controls next to a real home screen that follows them. */
function YoursDemo({ id, name }: { id: string; name: string }) {
  const c = useCustomer(id);
  const p = useMemo(() => (c ? personaOf(c, (x) => eur(x)) : null), [c]);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  if (!c || !p) return <div style={{ minHeight: 720 }} />;
  return (
    <div className="yours">
      <div className={`yours-panel ${themeClass(p)}`}>
        <CustomisePanel p={p} prefs={prefs} update={(x) => setPrefs((o) => ({ ...o, ...x }))} reset={() => setPrefs(DEFAULT_PREFS)} />
      </div>
      <div className="yours-phone">
        <PreviewPhone id={id} name={name} prefs={prefs} still className="mini" />
        <p className="pm-phone-cap" style={{ textAlign: 'center' }}><b>{name}, {c.age}</b> · {p.name}</p>
      </div>
    </div>
  );
}

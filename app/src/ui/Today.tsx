import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import * as A from '../engine/analytics';
import { eur } from '../engine/analytics';
import type { Customer } from '../engine/model';
import type { Basket } from '../engine/taxonomy';
import { Icon } from './Icon';
import { PersonaCardView, TraitCards } from './PersonaCard';
import { leftOver, personaOf, STAGE_INFO, STYLE_INFO, TRAIT_INFO, type Persona } from '../engine/personas';
import { effectiveLayout, type Prefs } from './prefs';
import type { ReactNode } from 'react';
import type { Open } from './types';

const TONE: Record<Basket, string> = { fixed: 'fixed', surprise: 'surprise', everyday: 'everyday' };

export const themeClass = (p: Persona) => `st-${p.stage} sy-${p.style}`;

export function Today({ c, name, open, ask, prefs, customise, why }: { c: Customer; name: string; open: Open; ask: (q: string) => void; prefs: Prefs; customise?: () => void; why?: () => void }) {
  const s = useMemo(() => A.safeToSpend(c), [c]);
  const b = useMemo(() => A.baskets(c, 'last_3_months'), [c]);
  const notes = useMemo(() => A.insights(c), [c]);
  const p = useMemo(() => personaOf(c, (x) => eur(x)), [c]);
  const bills = useMemo(() => A.upcomingBills(c, addDays(c.today, 14)).slice(0, p.stage === 'golden' ? 3 : 4), [c, p.stage]);
  const billsAll = useMemo(() => A.upcomingBills(c, addDays(c.today, 14)), [c]);
  const greeting = p.stage === 'starter' ? 'Hey' : 'Good morning';
  const [whole, cents] = s.week.toFixed(2).split('.');
  const setAside = s.steps.some((x) => x.label === 'Pay yourself first');
  const blocks: Record<string, ReactNode> = {
    safe: (
      <motion.button className="card hero" style={{ width: '100%', textAlign: 'left' }} whileTap={{ scale: 0.985 }}
        onClick={() => open({ kind: 'safe', safe: s })} aria-label={`Safe to spend this week: ${eur(s.week, 2)}. See how it is worked out`}>
        <HeroMotif stage={p.stage} />
        <div className="hero-top">
          <span className="hero-label"><Icon name="ShieldCheck" size={16} /> Safe to spend this week</span>
          <span className="hero-how">How? <Icon name="ChevronRight" size={14} /></span>
        </div>
        <div className="hero-amount">€{Number(whole).toLocaleString('en-GB')}<small>.{cents}</small></div>
        <div className="hero-sub">{s.week > 0
          ? (p.stage === 'starter' ? <>Yours to spend, after bills and a buffer for surprises.</> : <>About <b>{eur(s.perDay, 2)} a day</b>, after bills, surprises and savings.</>)
          : <>Your everyday budget is used up until payday. Needs only.</>}</div>
        {p.stage === 'starter' && s.week > 0 && <div className="sticker" aria-hidden><span><b>{eur(s.perDay)}</b>a day</span></div>}
        <StyleStrip p={p} s={s} />
        <div className="hero-row">
          {p.style !== 'tightrope' && <span className="pill"><Icon name="CalendarClock" size={14} /> Payday in {s.horizonDays} days</span>}
          {p.stage === 'established' || p.stage === 'golden'
            ? (billsAll.length > 0 && <span className="pill"><Icon name="Repeat" size={14} /> {billsAll.length} {billsAll.length === 1 ? 'bill' : 'bills'} due, set aside</span>)
            : <span className="pill"><Icon name={setAside ? 'PiggyBank' : 'Umbrella'} size={14} /> {setAside ? 'Savings set aside' : 'Buffer included'}</span>}
        </div>
      </motion.button>
    ),
    persona: <PersonaCardView p={p} ask={ask} customise={customise} />,
    goal: <GoalCard c={c} p={p} ask={ask} />,
    traits: <TraitCards p={p} ask={ask} />,
    baskets: (<>
      <div className="section-title">Your three baskets <button onClick={() => ask('Explain my three baskets')}>Why three?</button></div>
      <div className="baskets">
        {b.rows.map((r, i) => (
          <motion.button key={r.basket} className="basket" whileTap={{ scale: 0.97 }} onClick={() => open({ kind: 'basket', basket: r.basket })}
            style={{ ['--tone' as string]: `var(--${TONE[r.basket]})`, ['--soft' as string]: `var(--${TONE[r.basket]}-soft)` }}>
            <div className="jar">
              <motion.div className="jar-fill" initial={{ height: 0 }} animate={{ height: `${Math.max(8, r.share * 100)}%` }} transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.2, 0.8, 0.2, 1] }} />
              <span className="jar-pct">{Math.round(r.share * 100)}%</span>
            </div>
            <div className="basket-name">{r.name}</div>
            <div className="basket-amt"><b>{eur(r.perMonth)}</b>/mo</div>
          </motion.button>
        ))}
      </div>
      <p style={{ fontSize: 12.5, margin: '10px 4px 0', lineHeight: 1.45, color: 'var(--ink-2)' }}>
        Average of your last 3 full months. <b style={{ color: 'var(--ink)' }}>{b.slips.count} small {b.slips.count === 1 ? 'tap' : 'taps'}</b> under €20 made up {eur(b.slips.total)} of everyday spending.
      </p>
    </>),
    notes: (<>
      <div className="section-title">Coach notes</div>
      <div className="notes">
        {notes.map((n) => (
          <motion.button key={n.id} className="note" whileTap={{ scale: 0.98 }} onClick={() => ask(n.ask)}>
            <span className="note-tag" style={{ color: n.tone === 'win' ? 'var(--good)' : n.tone === 'heads-up' ? 'var(--warn)' : 'var(--fixed)' }}>
              <Icon name={n.tone === 'win' ? 'PartyPopper' : n.tone === 'heads-up' ? 'TriangleAlert' : 'Lightbulb'} size={14} />
              {n.tone === 'win' ? 'Nice' : n.tone === 'heads-up' ? 'Heads-up' : 'Tip'}
            </span>
            <h4>{n.title}</h4>
            <p>{n.body}</p>
            <span className="ask">Ask the coach <Icon name="ArrowRight" size={14} /></span>
          </motion.button>
        ))}
      </div>
    </>),
    guess: <GuessGame c={c} open={open} />,
    bills: bills.length > 0 ? (<>
      <div className="section-title">Coming up <button onClick={() => ask('What bills are coming up?')}>All bills</button></div>
      <div className="card" style={{ padding: '6px 16px' }}>
        <div className="bills-total"><span>Next 14 days · already set aside</span><b>{eur(billsAll.reduce((a, x) => a + x.amount, 0))}</b></div>
        {bills.map((x, i) => (
          <div className="tx" key={x.seriesId + x.date} style={{ ['--tone' as string]: 'var(--fixed)', ['--soft' as string]: 'var(--fixed-soft)', borderBottom: i === bills.length - 1 ? 0 : undefined }}>
            <div className="tx-ico"><Icon name="Repeat" size={16} /></div>
            <div><div className="tx-name">{x.label}</div><div className="tx-sub">{fmt(x.date)}</div></div>
            <div className="tx-amt">{eur(x.amount, 2)}</div>
          </div>
        ))}
      </div>
    </>) : null,
  };
  const layout = effectiveLayout(p, prefs);

  return (
    <div className="screen fade-in">
      <div className="topbar">
        <div className="hello">{greeting}<b>{name}</b></div>
        <div className="avatar">{name[0]}</div>
      </div>
      <WhoChips p={p} why={why} />
      {layout.map((m) => blocks[m] ? <div key={m} className={`mod mod-${m}`}>{blocks[m]}</div> : null)}
    </div>
  );
}

/** Life stage, money style and traits, under the greeting. Tapping it opens the explanation on the Me tab. */
export function WhoChips({ p, why }: { p: Persona; why?: () => void }) {
  const chips = (
    <>
      <span className="who-chip"><Icon name={STAGE_INFO[p.stage].icon} size={13} /> {STAGE_INFO[p.stage].label}</span>
      <span className="who-chip style"><Icon name={STYLE_INFO[p.style].icon} size={13} /> {STYLE_INFO[p.style].label}</span>
      {p.traits.map((t) => <span className="who-chip" key={t}><Icon name={TRAIT_INFO[t].icon} size={13} /> {TRAIT_INFO[t].label}</span>)}
    </>
  );
  return why
    ? <button className="whorow" onClick={why} aria-label={`This home is set up for ${p.name}. See why`}><span className="who-chips">{chips}</span><span className="who-why">Why? <Icon name="ChevronRight" size={13} /></span></button>
    : <div className="whorow"><span className="who-chips">{chips}</span></div>;
}

/** One decorative shape per life stage, drawn in the money-style accent. Golden has none on purpose. */
function HeroMotif({ stage }: { stage: Persona['stage'] }) {
  if (stage === 'golden' || stage === 'starter') return null;
  if (stage === 'builder') return (
    <svg className="hero-motif" width="112" height="112" viewBox="0 0 170 170" aria-hidden style={{ right: 6, top: 30 }}>
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={22 + i * 30} y={104 - i * 21} width="20" height={40 + i * 21} rx="6" fill="currentColor" />)}
    </svg>
  );
  return (
    <svg className="hero-motif" width="190" height="190" viewBox="0 0 190 190" aria-hidden>
      <circle cx="95" cy="95" r="80" fill="none" stroke="currentColor" strokeWidth="18" />
      <circle cx="95" cy="95" r="45" fill="none" stroke="currentColor" strokeWidth="10" />
    </svg>
  );
}

/** The strip inside the hero changes with the money style, and always shows the person's own numbers. */
function StyleStrip({ p, s }: { p: Persona; s: A.SafeToSpend }) {
  const f = p.f;
  const pct = (x: number) => Math.round(x * 100) + '%';
  let left = '', right = '', segs: { w: number; on: boolean }[] = [];
  if (p.style === 'pass_through') {
    left = `Stays here ${pct(1 - f.sweepShare)}`; right = `Moves on ${pct(f.sweepShare)}`;
    segs = [{ w: Math.max(0.04, 1 - f.sweepShare), on: false }, { w: f.sweepShare, on: true }];
  } else if (p.style === 'tightrope') {
    const n = Math.max(1, Math.min(31, s.horizonDays));
    left = s.week > 0 ? `${eur(s.perDay, 2)} a day` : 'Needs only'; right = `${s.horizonDays} days to payday`;
    segs = Array.from({ length: n }, (_, i) => ({ w: 1, on: i === 0 }));
  } else if (p.style === 'saver') {
    left = 'Put aside first'; right = `${eur(f.savingsRate * f.incomePerMonth)} a month · ${pct(f.savingsRate)}`;
    segs = [{ w: Math.max(0.05, f.savingsRate), on: true }, { w: Math.max(0.05, 1 - f.savingsRate), on: false }];
  } else {
    const lo = leftOver(f); const share = f.incomePerMonth > 0 ? lo / f.incomePerMonth : 0;
    if (lo >= 20) { left = 'Left over in a typical month'; right = eur(lo); segs = [{ w: 1 - share, on: false }, { w: Math.max(0.05, share), on: true }]; }
    else { left = 'In and out are in balance'; right = `${eur(f.incomePerMonth)} a month in`; segs = [{ w: 1, on: false }]; }
  }
  return (
    <div className="strip">
      <div className="strip-cap"><span>{left}</span><b>{right}</b></div>
      <div className="strip-bar" aria-hidden>{segs.map((x, i) => <i key={i} className={x.on ? 'on' : ''} style={{ ['--w' as string]: x.w }} />)}</div>
    </div>
  );
}

/** Builder homes lead with a goal: pick a size, move the slider, see when you get there. */
function GoalCard({ c, p, ask }: { c: Customer; p: Persona; ask: (q: string) => void }) {
  const spec = STAGE_INFO[p.stage].slider;
  const f = p.f;
  const pace = p.style === 'saver' ? f.savingsRate * f.incomePerMonth : leftOver(f);
  const step = spec.kind === 'save' ? spec.step : 20, max = spec.kind === 'save' ? spec.max : 600, start = spec.kind === 'save' ? spec.start : 100;
  const clamp = (x: number) => Math.max(step, Math.min(max, Math.round(x / step) * step));
  const [goal, setGoal] = useState(spec.kind === 'save' ? spec.goal : 5000);
  const [m, setM] = useState(() => (p.style === 'saver' ? Math.max(step, Math.min(max, Math.round(pace))) : clamp(pace >= step ? Math.min(pace, start) : start)));
  const months = Math.ceil(goal / m);
  const when = new Date(c.today + 'T12:00:00Z'); when.setUTCMonth(when.getUTCMonth() + months);
  const yr = Math.min(1, (m * 12) / goal);
  return (
    <>
      <div className="section-title">Your next goal <button onClick={() => ask('How could I save more?')}>How to save more</button></div>
      <div className="card goal">
        <div className="goal-top">
          <h4>A {eur(goal)} goal</h4>
          <div className="goal-sizes" role="group" aria-label="Goal size">
            {[2000, 5000, 10000].map((g) => <button key={g} className={g === goal ? 'on' : ''} aria-pressed={g === goal} onClick={() => setGoal(g)}>{g / 1000}k</button>)}
          </div>
        </div>
        <div className="goal-big">{months < 36 ? `${months} months` : `${(months / 12).toFixed(1)} years`}<small>at {eur(m)} a month</small></div>
        <input type="range" min={step} max={max} step={step} value={m} onChange={(e) => setM(Number(e.target.value))} aria-label="Put aside each month" />
        <div className="goal-track" aria-hidden><i style={{ width: `${yr * 100}%` }} /></div>
        <p style={{ margin: 0 }}>
          {eur(Math.min(goal, m * 12))} after one year, done by {when.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}.
          {pace >= 20 && <> {p.style === 'saver' ? `You put aside about ${eur(pace)} a month now.` : `About ${eur(pace)} a month is left over now.`}</>}
        </p>
      </div>
    </>
  );
}

/** "Guess first": estimating before seeing the answer is how people notice their blind spots. */
function GuessGame({ c, open }: { c: Customer; open: Open }) {
  const q = useMemo(() => {
    const rows = A.breakdown(c, 'category', { period: 'last_month', basket: 'everyday' }).filter((r) => !['groceries', 'housing'].includes(r.key));
    const pick = rows.find((r) => ['restaurants_cafes', 'food_delivery', 'taxi', 'online_shopping', 'entertainment', 'alcohol_tobacco', 'clothing'].includes(r.key)) ?? rows[0];
    return pick;
  }, [c]);
  const [g, setG] = useState(50);
  const [revealed, setRevealed] = useState(false);
  if (!q) return null;
  const max = Math.max(100, Math.ceil((q.total * 2.2) / 50) * 50);
  const off = q.total ? Math.round(((g - q.total) / q.total) * 100) : 0;
  return (
    <>
      <div className="section-title">Guess first</div>
      <div className="card guess">
        <h4>How much went on {q.label.toLowerCase()} last month?</h4>
        <p>Make a guess before you look. Most of us underestimate small, frequent spending.</p>
        {!revealed ? (
          <>
            <div className="guess-val">{eur(g)}</div>
            <input type="range" min={0} max={max} step={5} value={g} onChange={(e) => setG(Number(e.target.value))} aria-label="Your guess" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn" onClick={() => setRevealed(true)}>Reveal <Icon name="Eye" size={16} /></button>
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <div><div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-2)' }}>YOU GUESSED</div><div className="guess-val" style={{ opacity: 0.5 }}>{eur(g)}</div></div>
              <div><div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-2)' }}>ACTUAL</div><div className="guess-val">{eur(q.total)}</div></div>
            </div>
            <p style={{ marginTop: 8 }}>
              {Math.abs(off) <= 15 ? 'Spot on. You know this habit well.' : off < 0 ? `You guessed ${Math.abs(off)}% low. Small, frequent buys are easy to forget: ${q.count} of them here.` : `You guessed ${off}% high. You’re more careful here than you think.`}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn ghost" onClick={() => open({ kind: 'receipt', receipt: A.receipt(`${q.label}, last month`, q.total, 'EUR', `${q.count} payments`, q.ids) })}>See the {q.count} payments</button>
              <button className="btn ghost" onClick={() => { setRevealed(false); setG(50); }} aria-label="Try again"><Icon name="RotateCcw" size={16} /></button>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}

const fmt = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const addDays = (d: string, n: number) => new Date(new Date(d + 'T12:00:00Z').getTime() + n * 864e5).toISOString().slice(0, 10);

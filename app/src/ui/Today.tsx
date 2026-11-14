import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import * as A from '../engine/analytics';
import { eur } from '../engine/analytics';
import type { Customer } from '../engine/model';
import type { Basket } from '../engine/taxonomy';
import { Icon } from './Icon';
import { PersonaCardView, TraitCards } from './PersonaCard';
import { personaOf } from '../engine/personas';
import { effectiveLayout, type Prefs } from './prefs';
import type { ReactNode } from 'react';
import type { Open } from './types';

const TONE: Record<Basket, string> = { fixed: 'fixed', surprise: 'surprise', everyday: 'everyday' };

export function Today({ c, name, open, ask, prefs, customise }: { c: Customer; name: string; open: Open; ask: (q: string) => void; prefs: Prefs; customise?: () => void }) {
  const s = useMemo(() => A.safeToSpend(c), [c]);
  const b = useMemo(() => A.baskets(c, 'last_3_months'), [c]);
  const notes = useMemo(() => A.insights(c), [c]);
  const p = useMemo(() => personaOf(c, (x) => eur(x)), [c]);
  const bills = useMemo(() => A.upcomingBills(c, addDays(c.today, 14)).slice(0, 4), [c]);
  const hour = 9;
  const greeting = hour < 12 ? 'Good morning' : 'Hello';
  const [whole, cents] = s.week.toFixed(2).split('.');
  const blocks: Record<string, ReactNode> = {
    safe: (<>
      <motion.button className="card hero" style={{ width: '100%', textAlign: 'left' }} whileTap={{ scale: 0.985 }}
        onClick={() => open({ kind: 'safe', safe: s })} aria-label="How safe to spend is calculated">
        <svg className="hero-ring" width="190" height="190" viewBox="0 0 190 190" aria-hidden>
          <circle cx="95" cy="95" r="80" fill="none" stroke="#fff" strokeWidth="18" />
          <circle cx="95" cy="95" r="45" fill="none" stroke="#fff" strokeWidth="10" />
        </svg>
        <div className="hero-label"><Icon name="ShieldCheck" size={16} /> Safe to spend this week</div>
        <div className="hero-amount">€{Number(whole).toLocaleString('en-GB')}<small>.{cents}</small></div>
        <div className="hero-sub">{s.week > 0 ? <>About <b>{eur(s.perDay, 2)} a day</b> after bills, surprises and savings.</> : <>Your everyday budget is used up until payday. Needs only.</>}</div>
        <div className="hero-row">
          <span className="pill"><Icon name="CalendarClock" size={14} /> Payday in {s.horizonDays} days</span>
          {s.steps.some((x) => x.label === 'Pay yourself first') ? <span className="pill"><Icon name="PiggyBank" size={14} /> Savings already set aside</span> : <span className="pill"><Icon name="Umbrella" size={14} /> Surprise buffer included</span>}
        </div>
        <div className="hero-cta">See how it’s worked out <Icon name="ChevronRight" size={15} /></div>
      </motion.button>

</>),
    persona: <PersonaCardView p={p} ask={ask} customise={customise} />,
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
      <p className="muted" style={{ fontSize: 12.5, margin: '10px 4px 0', lineHeight: 1.45 }}>
        Average of your last 3 full months. <b style={{ color: 'var(--everyday)' }}>{b.slips.count} small taps</b> under €20 made up {eur(b.slips.total)} of everyday spending.
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
    bills: (<>
      {bills.length > 0 && (
        <>
          <div className="section-title">Coming up <button onClick={() => ask('What bills are coming up?')}>All bills</button></div>
          <div className="card" style={{ padding: '6px 16px' }}>
            {bills.map((x) => (
              <div className="tx" key={x.seriesId + x.date} style={{ ['--tone' as string]: 'var(--fixed)', ['--soft' as string]: 'var(--fixed-soft)' }}>
                <div className="tx-ico"><Icon name="Repeat" size={16} /></div>
                <div><div className="tx-name">{x.label}</div><div className="tx-sub">{fmt(x.date)} · already set aside</div></div>
                <div className="tx-amt">{eur(x.amount, 2)}</div>
              </div>
            ))}
          </div>
        </>
      )}
</>),
  };
  const layout = effectiveLayout(p, prefs);

  return (
    <div className="screen fade-in" style={{ ['--ts' as string]: prefs.textScale ?? p.textScale }}>
      <div className="topbar">
        <div className="hello">{greeting}<b>{name}</b></div>
        <div className="avatar">{name[0]}</div>
      </div>
      {layout.map((m) => <div key={m} className={`mod mod-${m}`}>{blocks[m]}</div>)}
    </div>
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
              <div><div className="muted" style={{ fontSize: 12, fontWeight: 800 }}>YOU GUESSED</div><div className="guess-val" style={{ opacity: 0.5 }}>{eur(g)}</div></div>
              <div><div className="muted" style={{ fontSize: 12, fontWeight: 800 }}>ACTUAL</div><div className="guess-val">{eur(q.total)}</div></div>
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

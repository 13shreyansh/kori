import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import * as A from '../engine/analytics';
import { eur } from '../engine/analytics';
import { merchantName, type Customer } from '../engine/model';
import type { Basket } from '../engine/taxonomy';
import { Icon } from './Icon';
import type { Open } from './types';

const PERIODS: [string, string][] = [['this_month', 'This month'], ['last_month', 'Last month'], ['last_3_months', '3 months'], ['last_12_months', '12 months']];
const GROUPS: [string, string][] = [['category', 'Category'], ['merchant', 'Place'], ['weekday', 'Weekday'], ['hour', 'Time of day'], ['month', 'Month']];
const BASKETS: [Basket | 'all', string][] = [['all', 'All'], ['fixed', 'Fixed'], ['surprise', 'Surprise'], ['everyday', 'Everyday'], ];
const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** MyData spirit: the person picks the cut of their own data, not the bank. */
export function Explore({ c, open }: { c: Customer; open: Open }) {
  const [per, setPer] = useState('last_3_months');
  const [by, setBy] = useState('category');
  const [bk, setBk] = useState<Basket | 'all'>('everyday');
  const [slips, setSlips] = useState(false);
  const txs = useMemo(() => A.select(c, { period: per, basket: bk === 'all' ? undefined : bk, slipsOnly: slips }), [c, per, bk, slips]);
  const rows = useMemo(() => {
    const m = new Map<string, { label: string; total: number; ids: number[]; order: number }>();
    for (const t of txs) {
      let k = '', label = '', order = 0;
      if (by === 'category') { k = t.cat.key; label = t.cat.label; }
      else if (by === 'merchant') { k = t.merchant; label = merchantName(t.merchant); }
      else if (by === 'weekday') { const d = (new Date(t.date + 'T12:00:00Z').getUTCDay() + 6) % 7; k = String(d); label = WD[d]; order = d; }
      else if (by === 'hour') { const h = Number(t.time.slice(0, 2)); const b = h < 6 ? 0 : h < 11 ? 1 : h < 14 ? 2 : h < 18 ? 3 : h < 21 ? 4 : 5; k = String(b); label = ['Night 0–6', 'Morning 6–11', 'Lunch 11–14', 'Afternoon 14–18', 'Evening 18–21', 'Late 21–24'][b]; order = b; }
      else { k = t.date.slice(0, 7); label = A.monthLabel(k).replace(/ 20(\d\d)/, ' ’$1'); order = Number(k.replace('-', '')); }
      const e = m.get(k) ?? m.set(k, { label, total: 0, ids: [], order }).get(k)!;
      e.total -= t.amount; e.ids.push(t.i);
    }
    const out = [...m.values()];
    return ['weekday', 'hour', 'month'].includes(by) ? out.sort((a, b) => a.order - b.order) : out.sort((a, b) => b.total - a.total).slice(0, 12);
  }, [txs, by]);
  const total = txs.reduce((a, t) => a - t.amount, 0);
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <div className="screen fade-in">
      <div className="topbar"><div className="hello">Your data, your view<b>Explore</b></div><Icon name="SlidersHorizontal" /></div>
      <div className="label-sm">When</div>
      <div className="seg">{PERIODS.map(([k, l]) => <button key={k} className={per === k ? 'on' : ''} onClick={() => setPer(k)}>{l}</button>)}</div>
      <div className="label-sm">Which basket</div>
      <div className="seg">
        {BASKETS.map(([k, l]) => <button key={k} className={bk === k ? 'on' : ''} onClick={() => setBk(k)}>{l}</button>)}
        <button className={slips ? 'on' : ''} onClick={() => setSlips(!slips)}>Small taps only</button>
      </div>
      <div className="label-sm">Group by</div>
      <div className="seg">{GROUPS.map(([k, l]) => <button key={k} className={by === k ? 'on' : ''} onClick={() => setBy(k)}>{l}</button>)}</div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="total-line"><span className="muted" style={{ fontWeight: 700 }}>{txs.length} payments</span><b>{eur(total)}</b></div>
        {rows.map((r, i) => (
          <button className="bar-row" key={r.label} onClick={() => open({ kind: 'txs', ids: r.ids, label: r.label })} style={{ ['--tone' as string]: bk === 'all' ? 'var(--brand)' : `var(--${bk})` }}>
            <span>{r.label}</span><span className="v">{eur(r.total)}</span>
            <div className="track"><motion.div className="fill" initial={{ width: 0 }} animate={{ width: `${(r.total / max) * 100}%` }} transition={{ duration: 0.5, delay: i * 0.03 }} /></div>
          </button>
        ))}
        {!rows.length && <p className="muted">Nothing here for this view.</p>}
      </div>
      <WhatIfLab c={c} />
    </div>
  );
}

function WhatIfLab({ c }: { c: Customer }) {
  const cats = useMemo(() => A.breakdown(c, 'category', { period: 'last_3_months', basket: 'everyday' }).filter((r) => r.key !== 'groceries').slice(0, 4), [c]);
  const [cuts, setCuts] = useState<Record<string, number>>({});
  const monthly = cats.reduce((a, r) => a + (r.total / 3) * ((cuts[r.key] ?? 0) / 100), 0);
  const five = monthly * ((Math.pow(1.0025, 60) - 1) / 0.0025);
  const s = A.safeToSpend(c);
  return (
    <>
      <div className="section-title">What-if lab</div>
      <div className="card">
        <p className="muted" style={{ margin: '0 0 4px', fontSize: 13.5, fontWeight: 600 }}>Drag to imagine spending less on your biggest everyday habits.</p>
        {cats.map((r) => (
          <div className="slider-row" key={r.key}>
            <header>{r.label}<span>{eur(r.total / 3)}/mo · cut {cuts[r.key] ?? 0}%</span></header>
            <input type="range" min={0} max={100} step={5} value={cuts[r.key] ?? 0} onChange={(e) => setCuts({ ...cuts, [r.key]: Number(e.target.value) })} aria-label={`Cut ${r.label}`} />
          </div>
        ))}
        <div className="whatif-result">
          <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.85 }}>You’d free up</div>
          <div className="big">{eur(monthly * 12)}<span style={{ fontSize: 18, opacity: 0.8 }}> a year</span></div>
          <div style={{ fontSize: 13.5, opacity: 0.92, lineHeight: 1.5 }}>
            That’s {eur(monthly)} a month. Your safe-to-spend would rise to <b>{eur(s.week + (monthly * 7) / 30.44)}</b> this week, or saved at 3% it grows to <b>{eur(five)}</b> in five years.
          </div>
        </div>
      </div>
    </>
  );
}

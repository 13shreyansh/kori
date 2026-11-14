import { useMemo } from 'react';
import * as A from '../engine/analytics';
import type { Customer } from '../engine/model';
import { Icon } from './Icon';
import { segmentOf, T } from '../engine/segments';
import { eur } from '../engine/analytics';
import type { Open } from './types';
export interface Persona { id: string; name: string; age: number; type: string; segment?: string; compare?: boolean }
export function Me({ c, personas, current, pick, open, ask }: { c: Customer; personas: Persona[]; current: string; pick: (id: string) => void; open: Open; ask: (q: string) => void }) {
  const p = useMemo(() => A.spenderProfile(c), [c]);
  const seg = useMemo(() => segmentOf(c), [c]);
  const f = seg.f;
  const why: [string, string, boolean][] = [
    ['Salary moved to another bank', Math.round(f.sweepShare * 100) + '%', f.sweepShare >= T.sweepShare],
    ['Everyday payments a month', String(Math.round(f.everydayPerMonth)), f.everydayPerMonth < T.lightEverydayPerMonth],
    ['Income a month', eur(f.incomePerMonth), f.incomePerMonth < T.starterIncome],
    ['Spent of what came in', Number.isFinite(f.spendRatio) ? Math.round(f.spendRatio * 100) + '%' : '–', f.spendRatio >= T.stretchedSpendRatio],
    ['Small taps a week', f.slipsPerWeek.toFixed(1), f.slipsPerWeek >= T.grazerSlipsPerWeek],
    ['Saved of income', Math.round(f.savingsRate * 100) + '%', f.savingsRate >= T.saverRate],
  ];
  return (
    <div className="screen fade-in">
      <div className="topbar"><div className="hello">Patterns from your last 3 months<b>Your money type</b></div><Icon name="UserRound" /></div>
      <div className={`card seg-card seg-${seg.id}`}>
        <div className="seg-head"><span className="seg-ico"><Icon name={seg.play.icon} size={17} /></span><span className="seg-kicker">How Kori adapts to you</span></div>
        <h4>{seg.play.name}</h4>
        <p>Your home card, coach tone and what-if sliders are picked from how you use money over the last 6 months, not from your age alone.</p>
        {why.map(([k, v, hit]) => <div className="trait" key={k} style={{ padding: '7px 0' }}><span><b style={{ fontWeight: hit ? 800 : 600 }}>{k}</b></span><span className="tv" style={{ color: hit ? 'var(--seg)' : undefined }}>{v}</span></div>)}
      </div>
{p.type.name !== seg.play.name && (
            <div className="card type-card">
        <div className="type-emoji">{p.type.emoji}</div>
        <div className="type-name">{p.type.name}</div>
        <p style={{ margin: '0 0 14px', color: 'var(--ink-2)', lineHeight: 1.5 }}>{p.type.line}</p>
        <button className="btn brand" onClick={() => ask('What kind of spender am I?')}><Icon name="MessageCircle" size={16} /> Talk it through</button>
      </div>)}
      <div className="section-title">Spending style <span className="muted" style={{ textTransform: 'none', letterSpacing: 0 }}>last 3 months</span></div>
      <div className="card" style={{ padding: '4px 16px' }}>
        {p.traits.map((t) => (
          <button className="trait" key={t.key} onClick={() => t.ids.length && open({ kind: 'txs', ids: t.ids, label: t.label })}>
            <span><b>{t.label}</b><small>{t.note}</small></span><span className="tv">{t.display}</span>
          </button>
        ))}
      </div>
      <div className="section-title">Privacy</div>
      <div className="card" style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>
        <b style={{ color: 'var(--ink)', display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="Lock" size={15} /> Your transactions stay on your phone</b>
        Kori calculates every number on the device. When the AI writes an answer, it only sees the totals it asked for, never your raw payments, merchants or balance history.
      </div>
      <a className="btn ghost" href="#compare" style={{ width: '100%', margin: '4px 0 6px' }}><Icon name="Columns3" size={16} /> See three customers side by side</a>
      <div className="section-title">Demo customers <span className="muted" style={{ textTransform: 'none', letterSpacing: 0 }}>synthetic S-Pankki data</span></div>
      <div className="card" style={{ padding: 6 }}>
        {personas.map((x) => (
          <button key={x.id} className={'persona' + (x.id === current ? ' on' : '')} onClick={() => pick(x.id)}>
            <div className="avatar">{x.name[0]}</div>
            <div style={{ flex: 1 }}><b>{x.name}, {x.age}</b><div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>{x.type} · {x.id}</div></div>
            {x.id === current && <Icon name="Check" />}
          </button>
        ))}
      </div>
    </div>
  );
}

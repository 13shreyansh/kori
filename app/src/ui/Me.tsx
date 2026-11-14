import { useMemo } from 'react';
import * as A from '../engine/analytics';
import type { Customer } from '../engine/model';
import { Icon } from './Icon';
import type { Open } from './types';
export interface Persona { id: string; name: string; age: number; type: string }
export function Me({ c, personas, current, pick, open, ask }: { c: Customer; personas: Persona[]; current: string; pick: (id: string) => void; open: Open; ask: (q: string) => void }) {
  const p = useMemo(() => A.spenderProfile(c), [c]);
  return (
    <div className="screen fade-in">
      <div className="topbar"><div className="hello">Patterns from your last 3 months<b>Your money type</b></div><Icon name="UserRound" /></div>
      <div className="card type-card">
        <div className="type-emoji">{p.type.emoji}</div>
        <div className="type-name">{p.type.name}</div>
        <p style={{ margin: '0 0 14px', color: 'var(--ink-2)', lineHeight: 1.5 }}>{p.type.line}</p>
        <button className="btn brand" onClick={() => ask('What kind of spender am I?')}><Icon name="MessageCircle" size={16} /> Talk it through</button>
      </div>
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

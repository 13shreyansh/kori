import { motion } from 'framer-motion';
import { eur } from '../engine/analytics';
import type { Visual } from '../coach/coach';
export function VisualView({ v, onRow }: { v: Visual; onRow?: (ids: number[], label: string) => void }) {
  if (v.kind === 'waterfall')
    return (
      <div className="viz">
        <div className="viz-title">{v.title}</div>
        {v.rows.map((r, i) => (
          <div className="wf-row" key={i}>
            <span>{r.label}<small>{r.display}</small></span>
            <span className={i === v.rows.length - 1 ? (r.value < 0 ? 'neg-total' : 'pos') : r.value < 0 ? 'neg' : ''}>{r.value < 0 ? '−' : ''}{eur(r.value)}</span>
          </div>
        ))}
      </div>
    );
  if (v.kind === 'traits')
    return (
      <div className="viz">
        <div className="viz-title">{v.title}</div>
        {v.rows.map((r) => <div className="wf-row" key={r.label}><span>{r.label}</span><b>{r.display}</b></div>)}
      </div>
    );
  const max = Math.max(...v.rows.map((r) => r.value), 1);
  return (
    <div className="viz">
      <div className="viz-title">{v.title}</div>
      {v.rows.map((r, i) => (
        <button className="bar-row" key={r.label + i} onClick={() => r.ids?.length && onRow?.(r.ids, r.label)} style={{ ['--tone' as string]: r.tone ? `var(--${r.tone})` : v.kind === 'growth' ? 'var(--brand-2)' : 'var(--brand)' }}>
          <span>{r.label}</span>
          <span className="v">{r.display ?? eur(r.value)}</span>
          <div className="track"><motion.div className="fill" initial={{ width: 0 }} animate={{ width: `${(r.value / max) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.06 }} /></div>
        </button>
      ))}
    </div>
  );
}

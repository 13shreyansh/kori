import { eur } from '../engine/analytics';
import { merchantName, type Customer, type Tx } from '../engine/model';
import { Icon } from './Icon';
export const toneVar = (b: string | null) => (b === 'fixed' ? 'fixed' : b === 'surprise' ? 'surprise' : b === 'everyday' ? 'everyday' : 'brand');
const fmt = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
export function TxRow({ t }: { t: Tx }) {
  const tone = toneVar(t.basket);
  return (
    <div className="tx" style={{ ['--tone' as string]: `var(--${tone})`, ['--soft' as string]: tone === 'brand' ? 'var(--mint)' : `var(--${tone}-soft)` }}>
      <div className="tx-ico"><Icon name={t.cat.icon} size={17} /></div>
      <div style={{ minWidth: 0 }}>
        <div className="tx-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{merchantName(t.merchant) || t.cat.label}</div>
        <div className="tx-sub">{fmt(t.date)} · {t.time.slice(0, 5)} · {t.cat.label}{t.recurring ? ' · repeats' : ''}{t.slip ? ' · small tap' : ''}</div>
      </div>
      <div className="tx-amt" style={{ color: t.amount > 0 ? 'var(--good)' : undefined }}>{t.amount > 0 ? '+' : '−'}{eur(t.amount, 2)}</div>
    </div>
  );
}
export function TxList({ c, ids, limit = 40 }: { c: Customer; ids: number[]; limit?: number }) {
  const rows = ids.map((i) => c.tx[i]).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  return (
    <div>
      {rows.slice(0, limit).map((t) => <TxRow key={t.i} t={t} />)}
      {rows.length > limit && <p className="muted" style={{ fontSize: 13, textAlign: 'center' }}>+ {rows.length - limit} more payments</p>}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { buildCustomer, type Customer, type RawCustomer } from '../engine/model';
import { segmentOf } from '../engine/segments';
import { Icon } from './Icon';
import type { Persona } from './Me';
import { Today } from './Today';

/** Three customers, three behaviour segments, one app: what changes and what stays the same. */
export function Compare({ personas }: { personas: Persona[] }) {
  const ids = (new URLSearchParams(location.search).get('compare') || '').split(',').filter(Boolean);
  const pick = ids.length ? ids : personas.filter((p) => p.compare).map((p) => p.id).slice(0, 3);
  const [cs, setCs] = useState<Customer[]>([]);
  useEffect(() => {
    Promise.all(pick.map((id) => fetch(`data/customers/${id}.json`).then((r) => r.json()).then((raw: RawCustomer) => buildCustomer(raw)))).then(setCs);
  }, [pick.join(',')]);
  const noop = () => {};
  return (
    <div style={{ minHeight: '100%' }}>
      <div className="compare-title">
        <h1>Same app, three different coaches</h1>
        <p>Kori reads how each person uses money and picks a segment. The home card, coach tone, questions and what-if sliders change with it. Nothing is generated per person, so it scales to 1.7 million weekly users.</p>
      </div>
      <div className="compare">
        {cs.map((c) => {
          const p = personas.find((x) => x.id === c.id); const seg = segmentOf(c);
          return (
            <div className="compare-col" key={c.id}>
              <div className="compare-label"><b>{p?.name ?? c.id}, {c.age} · {seg.play.name}</b><span>{seg.play.questions[0]}</span></div>
              <div className="phone">
                <div className="statusbar"><span>9:41</span><span style={{ display: 'flex', gap: 6 }}><Icon name="Signal" size={15} /><Icon name="Wifi" size={15} /><Icon name="BatteryFull" size={17} /></span></div>
                <Today c={c} name={p?.name ?? 'there'} open={noop} ask={noop} />
              </div>
              <a className="btn ghost" href={`?c=${c.id}`}>Open {p?.name ?? 'this'} in the app</a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

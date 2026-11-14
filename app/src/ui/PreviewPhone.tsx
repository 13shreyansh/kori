// A phone showing one customer's real home screen. Used where several phones sit side by side.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { personaOf } from '../engine/personas';
import { eur } from '../engine/analytics';
import { DEFAULT_PREFS, type Prefs } from './prefs';
import { Icon } from './Icon';
import { Today, themeClass } from './Today';
import { useCustomer } from './data';

const noop = () => {};
export function PreviewPhone({ id, name, prefs = DEFAULT_PREFS, still, className = '' }: { id: string; name: string; prefs?: Prefs; still?: boolean; className?: string }) {
  const c = useCustomer(id);
  const p = useMemo(() => (c ? personaOf(c, (x) => eur(x)) : null), [c]);
  return (
    <div className={`phone ${className} ${p ? themeClass(p) : ''}`} style={{ ['--ts' as string]: prefs.textScale ?? p?.textScale ?? 1 }} inert={still || undefined} aria-hidden={still || undefined}>
      <div className="statusbar"><span>9:41</span><span style={{ display: 'flex', gap: 6 }}><Icon name="Signal" size={15} /><Icon name="Wifi" size={15} /><Icon name="BatteryFull" size={17} /></span></div>
      {c ? <Today c={c} name={name} open={noop} ask={noop} prefs={prefs} /> : <div className="screen" />}
    </div>
  );
}

/** Renders children only once the block is near the viewport, so the landing page opens fast. */
export function LazyMount({ children, minHeight, className }: { children: ReactNode; minHeight: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el || on) return;
    if (!('IntersectionObserver' in window)) { setOn(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setOn(true); io.disconnect(); } }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [on]);
  return <div ref={ref} className={className} style={on ? undefined : { minHeight }}>{on ? children : null}</div>;
}

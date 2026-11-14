import { STAGE_INFO, type ModuleId, type Persona } from '../engine/personas';
import { Icon } from './Icon';
import { MODULE_LABEL, effectiveLayout, type Prefs, type Tone } from './prefs';
import { Sheet } from './Sheet';

const TONES: [Tone, string][] = [['persona', 'Picked for you'], ['gentle', 'Gentle'], ['straight', 'Straight talk'], ['playful', 'Playful']];
const SIZES: [number | null, string][] = [[null, 'Picked for you'], [1, 'Normal'], [1.12, 'Large'], [1.25, 'Extra large']];

/** "Make it yours": reorder or hide home cards, pick the coach's tone and the text size. */
export function Customise({ open, onClose, p, prefs, update, reset }: { open: boolean; onClose: () => void; p: Persona; prefs: Prefs; update: (x: Partial<Prefs>) => void; reset: () => void }) {
  const shown = effectiveLayout(p, prefs);
  const all: ModuleId[] = [...shown, ...p.layout.filter((m) => !shown.includes(m))];
  const move = (m: ModuleId, d: -1 | 1) => {
    const order = [...all]; const i = order.indexOf(m); const j = i + d;
    if (j < 1 || j >= order.length) return; // 'safe' stays on top
    [order[i], order[j]] = [order[j], order[i]]; update({ order });
  };
  const toggle = (m: ModuleId) => update({ hidden: prefs.hidden.includes(m) ? prefs.hidden.filter((x) => x !== m) : [...prefs.hidden, m] });
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="muted" style={{ fontWeight: 800, fontSize: 12, letterSpacing: '0.05em' }}>MAKE IT YOURS</div>
      <h3 style={{ marginBottom: 4 }}>Your home, your way</h3>
      <p className="muted" style={{ marginTop: 0, lineHeight: 1.5 }}>Kori set this up for {STAGE_INFO[p.stage].label.toLowerCase()}s with a {p.style.replace('_', '-')} style. Change anything; it is saved on this phone.</p>
      <div className="cz-title">Home cards</div>
      <div className="cz-list">
        {all.map((m, i) => {
          const hidden = m !== 'safe' && prefs.hidden.includes(m);
          return (
            <div className={'cz-row' + (hidden ? ' off' : '')} key={m}>
              <span>{MODULE_LABEL[m]}</span>
              {m === 'safe' ? <span className="muted" style={{ fontSize: 12.5, fontWeight: 700 }}>Always on top</span> : (
                <span className="cz-actions">
                  <button onClick={() => move(m, -1)} disabled={i <= 1} aria-label={`Move ${MODULE_LABEL[m]} up`}><Icon name="ChevronUp" size={16} /></button>
                  <button onClick={() => move(m, 1)} disabled={i >= all.length - 1} aria-label={`Move ${MODULE_LABEL[m]} down`}><Icon name="ChevronDown" size={16} /></button>
                  <button onClick={() => toggle(m)} aria-label={hidden ? `Show ${MODULE_LABEL[m]}` : `Hide ${MODULE_LABEL[m]}`}><Icon name={hidden ? 'EyeOff' : 'Eye'} size={16} /></button>
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="cz-title">Coach tone</div>
      <div className="chips">{TONES.map(([t, l]) => <button key={t} className={'chip' + (prefs.tone === t ? ' on' : '')} onClick={() => update({ tone: t })}>{l}</button>)}</div>
      <div className="cz-title">Text size</div>
      <div className="chips">{SIZES.map(([v, l]) => <button key={l} className={'chip' + (prefs.textScale === v ? ' on' : '')} onClick={() => update({ textScale: v })}>{l}</button>)}</div>
      <button className="btn ghost" style={{ width: '100%', marginTop: 18 }} onClick={reset}><Icon name="RotateCcw" size={16} /> Back to Kori’s pick</button>
    </Sheet>
  );
}

import { STAGE_INFO, STYLE_INFO, type ModuleId, type Persona } from '../engine/personas';
import { Icon } from './Icon';
import { STAGE_VOICE } from './Me';
import { MODULE_INFO, MODULE_LABEL, effectiveLayout, isChanged, type Prefs, type Tone } from './prefs';
import { Sheet } from './Sheet';

const TONES: [Tone, string, string][] = [
  ['persona', 'Kori’s pick', ''],
  ['gentle', 'Gentle', 'Reassuring, one step at a time.'],
  ['straight', 'Straight talk', 'Numbers first. No pep talk.'],
  ['playful', 'Playful', 'Light, with a little humour.'],
];
const SIZES: [number | null, string, number][] = [[null, 'Kori’s pick', 0], [1, 'Normal', 15], [1.12, 'Large', 19], [1.25, 'Extra large', 23]];

interface Props { p: Persona; prefs: Prefs; update: (x: Partial<Prefs>) => void; reset: () => void }

/** The controls of "Make it yours": reorder or hide home cards, pick the coach's tone and the text size. */
export function CustomisePanel({ p, prefs, update, reset, onDone }: Props & { onDone?: () => void }) {
  const shown = effectiveLayout(p, prefs);
  const all: ModuleId[] = [...shown, ...p.layout.filter((m) => !shown.includes(m))];
  const move = (m: ModuleId, d: -1 | 1) => {
    const order = [...all]; const i = order.indexOf(m); const j = i + d;
    if (j < 1 || j >= order.length) return; // 'safe' stays on top
    [order[i], order[j]] = [order[j], order[i]]; update({ order });
  };
  const toggle = (m: ModuleId) => update({ hidden: prefs.hidden.includes(m) ? prefs.hidden.filter((x) => x !== m) : [...prefs.hidden, m] });
  const changed = isChanged(prefs);
  return (
    <>
      <div className="cz-persona">
        <span className="cz-persona-ico"><Icon name={STYLE_INFO[p.style].icon} size={20} /></span>
        <span><b>Set up for {p.name}</b>{STAGE_INFO[p.stage].label} life stage, {STYLE_INFO[p.style].label.toLowerCase()} money style. That was Kori’s starting point. Anything you change here wins.</span>
      </div>

      <div className="cz-title">Your home cards <small>{shown.length} shown{all.length > shown.length ? `, ${all.length - shown.length} hidden` : ''}</small></div>
      <div className="cz-list">
        {all.map((m, i) => {
          const hidden = m !== 'safe' && prefs.hidden.includes(m);
          return (
            <div className={'cz-row' + (hidden ? ' off' : '')} key={m}>
              <span className="cz-n" aria-hidden>{hidden ? <Icon name="EyeOff" size={12} /> : i + 1}</span>
              <span className="cz-name">{MODULE_LABEL[m]}<small>{m === 'safe' ? 'Always first' : MODULE_INFO[m].what}</small></span>
              {m !== 'safe' && (
                <span className="cz-actions">
                  <button onClick={() => move(m, -1)} disabled={i <= 1 || hidden} aria-label={`Move ${MODULE_LABEL[m]} up`}><Icon name="ChevronUp" size={18} /></button>
                  <button onClick={() => move(m, 1)} disabled={i >= shown.length - 1 || hidden} aria-label={`Move ${MODULE_LABEL[m]} down`}><Icon name="ChevronDown" size={18} /></button>
                  <button onClick={() => toggle(m)} aria-pressed={!hidden} aria-label={hidden ? `Show ${MODULE_LABEL[m]}` : `Hide ${MODULE_LABEL[m]}`}><Icon name={hidden ? 'EyeOff' : 'Eye'} size={18} /></button>
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="cz-title">How the coach talks</div>
      <div className="cz-opts" role="radiogroup" aria-label="Coach tone">
        {TONES.map(([t, l, d]) => (
          <button key={t} role="radio" aria-checked={prefs.tone === t} className={'cz-opt' + (prefs.tone === t ? ' on' : '')} onClick={() => update({ tone: t })}>
            {l}<small>{t === 'persona' ? STAGE_VOICE[p.stage] : d}</small>
          </button>
        ))}
      </div>

      <div className="cz-title">Text size</div>
      <div className="cz-sizes" role="radiogroup" aria-label="Text size">
        {SIZES.map(([v, l, px]) => (
          <button key={l} role="radio" aria-checked={prefs.textScale === v} className={'cz-size' + (prefs.textScale === v ? ' on' : '')} onClick={() => update({ textScale: v })}>
            <b style={{ fontSize: px || Math.round(15 * p.textScale * 1.1) }}>Aa</b>{l}
          </button>
        ))}
      </div>

      <div className="cz-foot">
        <button className="btn ghost" style={{ flex: 1, opacity: changed ? 1 : 0.5 }} onClick={reset} disabled={!changed}><Icon name="RotateCcw" size={16} /> Kori’s pick</button>
        {onDone && <button className="btn brand" style={{ flex: 1 }} onClick={onDone}>Done</button>}
      </div>
      <div className="cz-saved"><Icon name="Smartphone" size={14} /> Saved on this phone as you go.</div>
    </>
  );
}

/** "Make it yours" as a sheet inside the app. */
export function Customise({ open, onClose, ...rest }: Props & { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} label="Make it yours">
      <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: '0.05em', color: 'var(--ink-2)' }}>MAKE IT YOURS</div>
      <h3 style={{ marginBottom: 0 }}>Your home, your way</h3>
      <CustomisePanel {...rest} onDone={onClose} />
    </Sheet>
  );
}

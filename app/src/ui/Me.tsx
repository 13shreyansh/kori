import { useMemo } from 'react';
import * as A from '../engine/analytics';
import type { Customer } from '../engine/model';
import { Icon } from './Icon';
import { T } from '../engine/segments';
import { personaOf, STAGES, STAGE_INFO, STYLE_INFO, TRAITS, TRAIT_INFO, type Stage, type Style, type Trait } from '../engine/personas';
import { eur } from '../engine/analytics';
import { effectiveLayout, MODULE_LABEL, type Prefs } from './prefs';
import { WhoChips } from './Today';
import type { Open } from './types';
import type { Person } from './data';
export type Persona = Person;

/** How the coach talks, per life stage, in the person's words (the full instruction lives in STAGE_INFO.tone). */
export const STAGE_VOICE: Record<Stage, string> = {
  starter: 'Warm and encouraging. Explains money words simply.',
  builder: 'Short and goal-focused. Shows trade-offs in numbers.',
  established: 'Practical and calm. Bills and buffers first.',
  golden: 'Calm and respectful. Short sentences, no slang.',
};
const pct = (x: number) => (Number.isFinite(x) ? Math.round(x * 100) + '%' : 'all');

export function Me({ c, personas, current, pick, open, ask, customise, prefs }: { c: Customer; personas: Person[]; current: string; pick: (id: string) => void; open: Open; ask: (q: string) => void; customise: () => void; prefs: Prefs }) {
  const sp = useMemo(() => A.spenderProfile(c), [c]);
  const seg = useMemo(() => personaOf(c, (x) => eur(x)), [c]);
  const f = seg.f;
  const byPension = seg.stage === 'golden' && f.age < T.retireAge;
  const styleRules: { id: Style; q: string; sub: string; v: string }[] = [
    { id: 'pass_through', q: `Moves ${pct(T.sweepShare)} or more of income to another bank`, sub: 'Soon after it arrives', v: pct(f.sweepShare) },
    { id: 'tightrope', q: 'Spends all that comes in, or often runs low', sub: `Low: under €${T.lowBalanceEur} on 1 day in 4. Yours: ${pct(f.lowBalanceShare)} of days`, v: `${pct(f.spendRatio)} spent` },
    { id: 'saver', q: `Moves ${pct(T.saverRate)} or more of income to savings`, sub: 'Regular transfers to a savings account', v: pct(f.savingsRate) },
    { id: 'steady', q: 'None of the above', sub: 'Balanced, with some left over', v: 'Steady' },
  ];
  const hitAt = styleRules.findIndex((r) => r.id === seg.style);
  const traitVal: Record<Trait, string> = {
    taps: `${f.slipsPerWeek.toFixed(1)} a week`, quiet: `${Math.round(f.everydayPerMonth)} a month`,
    bills: pct(f.fixedShare), irregular: `±${Math.round(seg.incomeCv * 100)}%`,
  };
  const layout = effectiveLayout(seg, prefs);
  const changed = !!prefs.order || prefs.hidden.length > 0 || prefs.tone !== 'persona' || prefs.textScale != null;
  return (
    <div className="screen fade-in">
      <div className="topbar"><div className="hello">How Kori adapts to you<b>{seg.name}</b></div><div className="avatar" style={{ background: 'var(--acc)', color: 'var(--card)' }}><Icon name={STYLE_INFO[seg.style].icon} size={20} /></div></div>
      <WhoChips p={seg} />

      <div className="card seg-card">
        <div className="seg-head"><span className="seg-ico"><Icon name="Route" size={17} /></span><span className="seg-kicker">Why you see this home</span></div>
        <p style={{ marginBottom: 0 }}>{seg.line}. Kori does not build a screen for each person. It places you in one of 16 personas using two things, your life stage and your money style, and sets up the home for that persona.</p>

        <div className="why-step"><span className="why-n">1</span><span><b>Life stage: {STAGE_INFO[seg.stage].label}</b><small>{byPension ? `You are ${f.age}, and most of your income (${pct(f.pensionShare)}) is a pension.` : `From your age. You are ${f.age}.`}</small></span></div>
        <div className="age-scale" role="img" aria-label={`Four life stages by age. Yours: ${STAGE_INFO[seg.stage].label}`}>
          {STAGES.map((s) => <div key={s} className={'age-seg' + (s === seg.stage ? ' on' : '')}>{STAGE_INFO[s].label}<small>{STAGE_INFO[s].ages}</small></div>)}
        </div>

        <div className="why-step"><span className="why-n">2</span><span><b>Money style: {STYLE_INFO[seg.style].label}</b><small>From the last 6 months on this account. Kori checks these in order and stops at the first that fits.</small></span></div>
        <div>
          {styleRules.map((r, i) => (
            <div key={r.id} className={'rule' + (i === hitAt ? ' hit' : i > hitAt ? ' skip' : '')}>
              <span className="mark"><Icon name={i === hitAt ? 'Check' : i < hitAt ? 'XIcon' : 'Minus'} size={13} strokeWidth={3} /></span>
              <span className="rule-q">{r.q}<small>{i === hitAt ? `This is you: ${STYLE_INFO[r.id].label}` : i < hitAt ? r.sub : 'Not checked'}</small></span>
              <span className="rule-v">{i > hitAt ? '' : r.v}</span>
            </div>
          ))}
        </div>

        <div className="why-step"><span className="why-n">3</span><span><b>Habits: {seg.traits.length ? seg.traits.map((t) => TRAIT_INFO[t].label.toLowerCase()).join(', ') : 'none flagged'}</b><small>Each habit that fits adds its own card to your home.</small></span></div>
        <div>
          {TRAITS.map((t) => {
            const on = seg.traits.includes(t);
            return (
              <div key={t} className={'rule' + (on ? ' hit' : '')}>
                <span className="mark"><Icon name={on ? 'Check' : 'XIcon'} size={13} strokeWidth={3} /></span>
                <span className="rule-q">{TRAIT_INFO[t].label}<small>{TRAIT_INFO[t].what}</small></span>
                <span className="rule-v">{traitVal[t]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section-title">What this changes for you</div>
      <div className="card">
        <div className="changes">
          <div className="change"><span className="change-ico"><Icon name="LayoutList" size={16} /></span><span><b>The order of your home{prefs.order || prefs.hidden.length ? ' (you changed it)' : ''}</b><span className="order">{layout.map((m) => <span key={m}>{MODULE_LABEL[m]}</span>)}</span></span></div>
          <div className="change"><span className="change-ico"><Icon name="MessageCircle" size={16} /></span><span><b>How the coach talks</b>{prefs.tone === 'persona' ? STAGE_VOICE[seg.stage] : `You picked: ${prefs.tone === 'straight' ? 'straight talk' : prefs.tone}.`}</span></div>
          <div className="change"><span className="change-ico"><Icon name="CircleQuestionMark" size={16} /></span><span><b>The first questions it offers</b>{seg.questions.slice(0, 2).map((q) => `“${q}”`).join(' ')}</span></div>
          <div className="change"><span className="change-ico"><Icon name="SlidersHorizontal" size={16} /></span><span><b>Your what-if sliders</b>{seg.sliders.map((s) => s.title).join(' · ')}</span></div>
          <div className="change"><span className="change-ico"><Icon name="ALargeSmall" size={16} /></span><span><b>Text size and look</b>{seg.stage === 'golden' ? 'Larger text, stronger contrast and fewer cards.' : seg.stage === 'starter' ? 'A lighter, playful look with the guessing game near the top.' : seg.stage === 'builder' ? 'A goal card near the top.' : 'Upcoming bills near the top.'}</span></div>
        </div>
        <button className="btn brand" style={{ width: '100%', marginTop: 16 }} onClick={customise}><Icon name="SlidersHorizontal" size={16} /> Make it yours</button>
        {changed && <div className="cz-saved"><Icon name="Check" size={14} /> You have changed Kori’s pick. Your choices win.</div>}
      </div>

      <div className="card">
        <div className="never"><Icon name="ShieldCheck" size={18} /><span><b>Gender is never used.</b> It is not in the data Kori receives, and no advice depends on it. Your persona comes only from your age and how you use this account.</span></div>
      </div>

      <div className="section-title">Spending style <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 700 }}>last 3 months</span></div>
      <div className="card" style={{ padding: '4px 16px 14px' }}>
        {sp.traits.map((t) => (
          <button className="trait" key={t.key} onClick={() => t.ids.length && open({ kind: 'txs', ids: t.ids, label: t.label })}>
            <span><b>{t.label}</b><small>{t.note}</small></span><span className="tv">{t.display}</span>
          </button>
        ))}
        <button className="btn ghost" style={{ width: '100%', marginTop: 14 }} onClick={() => ask('What kind of spender am I?')}><Icon name="MessageCircle" size={16} /> Talk it through with the coach</button>
      </div>

      <div className="section-title">Privacy</div>
      <div className="card" style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>
        <b style={{ color: 'var(--ink)', display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="Lock" size={15} /> Your transactions stay on your phone</b>
        Kori calculates every number on the device. When the AI writes an answer, it only sees the totals it asked for, never your raw payments, merchants or balance history.
      </div>
      <a className="btn ghost" href="#compare" style={{ width: '100%', margin: '4px 0 6px', textDecoration: 'none' }}><Icon name="Columns3" size={16} /> See three customers side by side</a>
      <div className="section-title">Demo customers <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 700 }}>S-Pankki challenge data</span></div>
      <div className="card" style={{ padding: 6 }}>
        {personas.map((x) => (
          <button key={x.id} className={'persona' + (x.id === current ? ' on' : '')} onClick={() => pick(x.id)} aria-pressed={x.id === current}>
            <div className="avatar">{x.name[0]}</div>
            <div style={{ flex: 1 }}><b>{x.name}, {x.age}</b><div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)' }}>{x.type}</div></div>
            {x.id === current && <Icon name="Check" />}
          </button>
        ))}
      </div>
    </div>
  );
}

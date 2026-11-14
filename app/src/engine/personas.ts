// Kori's 16 personas: 4 life stages x 4 money styles, plus behaviour traits layered on top.
//
// Life stage comes from age (the one demographic the bank holds that changes what advice fits).
// Money style comes only from behaviour in the last 6 months. Gender is not used and is not in the data:
// steering financial advice by gender would be unfair and a regulatory risk.
// Traits (many small taps, quiet account, bill-heavy, irregular income) add or swap cards, so two people in
// the same persona can still see different homes. Then the person can change anything in "Make it yours".
//
// Written spec: eval/PERSONAS_SPEC.md. Independent Python key: eval/persona_key.py. Change all together.
import { type Customer } from './model';
import { PLAYBOOKS, segmentFeatures, T, type SegmentFeatures, type SliderSpec } from './segments';

export type Stage = 'starter' | 'builder' | 'established' | 'golden';
export type Style = 'pass_through' | 'tightrope' | 'saver' | 'steady';
export type Trait = 'taps' | 'quiet' | 'bills' | 'irregular';
export type ModuleId = 'safe' | 'persona' | 'baskets' | 'guess' | 'notes' | 'bills' | 'traits';

export const STAGES: Stage[] = ['starter', 'builder', 'established', 'golden'];
export const STYLES: Style[] = ['pass_through', 'tightrope', 'saver', 'steady'];
export const TRAITS: Trait[] = ['taps', 'quiet', 'bills', 'irregular'];

export const P = { starterMaxAge: 25, builderMaxAge: 39, establishedMaxAge: 64, irregularIncomeCv: 0.35 };

export function stageOf(f: SegmentFeatures): Stage {
  if (f.age >= T.retireAge || f.pensionShare >= T.pensionShare) return 'golden';
  if (f.age <= P.starterMaxAge) return 'starter';
  if (f.age <= P.builderMaxAge) return 'builder';
  return 'established';
}

export function styleOf(f: SegmentFeatures): Style {
  if (f.incomePerMonth > 0 && f.sweepShare >= T.sweepShare) return 'pass_through';
  if (f.spendRatio >= T.stretchedSpendRatio || f.lowBalanceShare >= T.stretchedLowBalance) return 'tightrope';
  if (f.savingsRate >= T.saverRate) return 'saver';
  return 'steady';
}

/** Coefficient of variation of income across the 6 whole calendar months before `today`'s month. */
export function incomeCv(c: Customer): number {
  const end = c.today.slice(0, 7);
  const months: string[] = [];
  const d = new Date(end + '-01T12:00:00Z');
  for (let i = 1; i <= 6; i++) { const x = new Date(d); x.setUTCMonth(d.getUTCMonth() - i); months.push(x.toISOString().slice(0, 7)); }
  const by = Object.fromEntries(months.map((m) => [m, 0]));
  for (const t of c.tx) if (t.amount > 0 && t.cat.kind === 'income' && t.date.slice(0, 7) in by) by[t.date.slice(0, 7)] += t.amount;
  const xs = Object.values(by);
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  if (mean <= 0) return 0;
  return Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length) / mean;
}

export function traitsOf(f: SegmentFeatures, cv: number): Trait[] {
  const t: Trait[] = [];
  if (f.slipsPerWeek >= T.grazerSlipsPerWeek) t.push('taps');
  if (f.everydayPerMonth < T.lightEverydayPerMonth) t.push('quiet');
  if (f.fixedShare >= T.fixedShare && Number.isFinite(f.fixedShare)) t.push('bills');
  if (cv > P.irregularIncomeCv) t.push('irregular');
  return t;
}

// ---------- names: one per cell of the 4x4 grid ----------
export const NAMES: Record<Stage, Record<Style, { name: string; line: string }>> = {
  starter: {
    pass_through: { name: 'The First-Paycheck Mover', line: 'Pay lands here, then moves on' },
    tightrope: { name: 'The Month-End Juggler', line: 'Young, and the money runs out first' },
    saver: { name: 'The Early Stasher', line: 'Saving before most people start' },
    steady: { name: 'The Finding-Feet', line: 'Learning the ropes, doing fine' },
  },
  builder: {
    pass_through: { name: 'The Two-Bank Builder', line: 'Building a life across two banks' },
    tightrope: { name: 'The Stretched Builder', line: 'Big plans, tight months' },
    saver: { name: 'The Goal Builder', line: 'Putting money to work for a goal' },
    steady: { name: 'The Busy Builder', line: 'Balanced, but busy' },
  },
  established: {
    pass_through: { name: 'The Split-Bank Household', line: 'Household money lives in two places' },
    tightrope: { name: 'The Household Juggler', line: 'Many bills, little slack' },
    saver: { name: 'The Cushioned Household', line: 'A buffer that lets you breathe' },
    steady: { name: 'The Steady Household', line: 'Running smoothly' },
  },
  golden: {
    pass_through: { name: 'The Pension Mover', line: 'Pension in, then on to another account' },
    tightrope: { name: 'The Careful Pensioner', line: 'Making a fixed income stretch' },
    saver: { name: 'The Comfortable Retiree', line: 'Calm, with something put aside' },
    steady: { name: 'The Easy-Going Retiree', line: 'Steady and unhurried' },
  },
};

export const STAGE_INFO: Record<Stage, { label: string; ages: string; icon: string; tone: string; layout: ModuleId[]; textScale: number; questions: string[]; slider: SliderSpec }> = {
  starter: {
    label: 'Starter', ages: '18–25', icon: 'Sprout', textScale: 1,
    tone: 'Young customer. Warm, encouraging, a little playful. Explain money words simply. Celebrate small wins.',
    layout: ['safe', 'persona', 'guess', 'traits', 'baskets', 'notes', 'bills'],
    questions: ['What is an emergency fund?', 'How much do I spend on food delivery?'],
    slider: { kind: 'save', title: 'Your first buffer', label: 'Save each month', max: 150, step: 5, start: 25, goal: 500, goalLabel: 'a €500 first buffer' },
  },
  builder: {
    label: 'Builder', ages: '26–39', icon: 'Hammer', textScale: 1,
    tone: 'Customer building a life: work, home, maybe kids. Be concise and goal-focused. Show trade-offs in numbers.',
    layout: ['safe', 'persona', 'traits', 'baskets', 'notes', 'guess', 'bills'],
    questions: ['How could I save more?', 'Where did my money go?'],
    slider: { kind: 'save', title: 'A bigger goal', label: 'Put towards it each month', max: 600, step: 20, start: 150, goal: 5000, goalLabel: 'a €5,000 goal' },
  },
  established: {
    label: 'Established', ages: '40–64', icon: 'Home', textScale: 1,
    tone: 'Customer running a household. Be practical and calm. Focus on bills, buffers and what can be renegotiated.',
    layout: ['safe', 'persona', 'bills', 'traits', 'baskets', 'notes', 'guess'],
    questions: ['What bills are coming up?', 'How do I compare to similar households?'],
    slider: { kind: 'save', title: 'A household buffer', label: 'Set aside each month', max: 600, step: 20, start: 100, goal: 3000, goalLabel: 'a €3,000 household buffer' },
  },
  golden: {
    label: 'Golden', ages: '65+', icon: 'Sun', textScale: 1.12,
    tone: 'Likely retired. Calm, respectful, no slang, short sentences. Focus on predictability, health and home costs, gifts and travel. Never talk down.',
    layout: ['safe', 'persona', 'bills', 'baskets', 'notes'],
    questions: ['What bills are coming up?', 'What were my surprise costs?'],
    slider: { kind: 'save', title: 'A pot for travel or gifts', label: 'Put aside each month', max: 300, step: 10, start: 50, goal: 1200, goalLabel: 'a €1,200 trip' },
  },
};

const STYLE_PLAY = { pass_through: PLAYBOOKS.pass_through, tightrope: PLAYBOOKS.stretched, saver: PLAYBOOKS.saver, steady: PLAYBOOKS.steady } as const;
export const STYLE_INFO: Record<Style, { label: string; icon: string; color: string; what: string }> = {
  pass_through: { label: 'Pass-through', icon: 'ArrowUpRight', color: '#7a5af5', what: '30%+ of income moves on to another bank' },
  tightrope: { label: 'Tightrope', icon: 'Activity', color: '#e2634a', what: 'Spends all that comes in, or runs low' },
  saver: { label: 'Saver', icon: 'PiggyBank', color: '#127a50', what: 'Saves 5%+ of income' },
  steady: { label: 'Steady', icon: 'Compass', color: '#0d5c3c', what: 'Balanced, with some left over' },
};
export const TRAIT_INFO: Record<Trait, { label: string; icon: string; what: string }> = {
  taps: { label: 'Many small taps', icon: 'Coffee', what: '2.5+ payments under €20 a week' },
  quiet: { label: 'Quiet account', icon: 'Feather', what: 'Under 10 everyday payments a month' },
  bills: { label: 'Bill-heavy', icon: 'Receipt', what: 'Fixed bills take 45%+ of income' },
  irregular: { label: 'Irregular income', icon: 'Waves', what: 'Monthly income swings by 35%+' },
};
const TRAIT_PLAY = { taps: PLAYBOOKS.grazer, quiet: PLAYBOOKS.light_user, bills: PLAYBOOKS.fixed_heavy } as const;

export interface PersonaCard { kind: 'style' | Trait; title: string; body: string; ask: string; icon: string }
export interface Persona {
  id: `${Stage}.${Style}`;
  stage: Stage; style: Style; traits: Trait[];
  name: string; line: string; color: string; icon: string;
  f: SegmentFeatures; incomeCv: number;
  tone: string; questions: string[]; sliders: SliderSpec[]; layout: ModuleId[]; textScale: number;
  cards: PersonaCard[]; nudge: string;
}

export function personaOf(c: Customer, e: (x: number) => string = (x) => '€' + Math.round(x).toLocaleString('en-GB')): Persona {
  const f = segmentFeatures(c);
  const cv = incomeCv(c);
  const stage = stageOf(f), style = styleOf(f), traits = traitsOf(f, cv);
  const sp = STYLE_PLAY[style], st = STAGE_INFO[stage];
  const main = sp.card(f, e);
  const cards: PersonaCard[] = [{ kind: 'style', ...main, icon: STYLE_INFO[style].icon }];
  for (const t of traits) {
    if (t === 'irregular') cards.push({ kind: t, icon: TRAIT_INFO[t].icon, title: 'Income that comes in waves', body: `Your monthly income has swung by about ${Math.round(cv * 100)}% over the last six months. Kori plans your safe-to-spend from a typical month, and a buffer smooths the dips.`, ask: 'Where did my money go?' });
    else { const c2 = TRAIT_PLAY[t].card(f, e); cards.push({ kind: t, ...c2, icon: TRAIT_INFO[t].icon }); }
  }
  // sliders: the style's own lever, then the stage's goal slider (never two 'keep' or duplicate goals)
  const sliders: SliderSpec[] = [...sp.sliders.filter((s) => s.kind !== 'save'), st.slider];
  if (traits.includes('taps') && !sliders.some((s) => s.kind === 'taps')) sliders.splice(1, 0, { kind: 'taps', title: 'Skip a few small taps' });
  const questions = [...new Set([sp.questions[0], ...st.questions, 'What kind of spender am I?'])].slice(0, 4);
  const layout = traits.length ? st.layout : st.layout.filter((m) => m !== 'traits');
  const tone = `${st.tone} ${sp.tone}${traits.length ? ' Traits: ' + traits.map((t) => TRAIT_INFO[t].label.toLowerCase()).join(', ') + '.' : ''}`;
  return {
    id: `${stage}.${style}`, stage, style, traits, ...NAMES[stage][style], color: STYLE_INFO[style].color, icon: st.icon,
    f, incomeCv: cv, tone, questions, sliders, layout, textScale: st.textScale, cards, nudge: sp.nudge(f, e),
  };
}

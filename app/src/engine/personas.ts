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
export type ModuleId = 'safe' | 'persona' | 'goal' | 'baskets' | 'guess' | 'notes' | 'bills' | 'traits';

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
    layout: ['safe', 'persona', 'goal', 'traits', 'baskets', 'notes', 'guess', 'bills'],
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

// ---------- the home card: one headline and body per cell of the grid (16 in all) ----------
// Every number comes from the person's own six-month features. Rules for the copy: own number, a next step,
// 45 words or fewer, plain English, no blame.
type CardFn = (f: SegmentFeatures, e: (x: number) => string) => { title: string; body: string; ask: string };
const pc = (x: number) => Math.round(x * 100) + '%';
const fin = (x: number) => (Number.isFinite(x) ? x : 0);
/** Euros a month that are neither spent, saved nor moved on. */
export const leftOver = (f: SegmentFeatures) => Math.max(0, (1 - fin(f.spendRatio) - f.savingsRate - f.sweepShare) * f.incomePerMonth);
const moved = (f: SegmentFeatures) => f.sweepShare * f.incomePerMonth;
const saved = (f: SegmentFeatures) => f.savingsRate * f.incomePerMonth;
const bills = (f: SegmentFeatures) => fin(f.fixedShare) * f.incomePerMonth;
const span = (months: number) => (months <= 36 ? `${months} months` : `${Math.round(months / 12)} years`);
const spentLine = (f: SegmentFeatures, e: (x: number) => string) =>
  (Number.isFinite(f.spendRatio) && f.incomePerMonth > 0
    ? `You spent about ${pc(Math.min(f.spendRatio, 9.99))} of the ${e(f.incomePerMonth)} that came in each month`
    : 'More went out than came in over the last six months')
  + (f.lowBalanceShare >= 0.1 ? `, and ${pc(f.lowBalanceShare)} of days ended under €100` : '');
const hasLeft = (f: SegmentFeatures) => leftOver(f) >= 20;

export const CARDS: Record<Stage, Record<Style, CardFn>> = {
  starter: {
    pass_through: (f, e) => ({ title: 'Payday is a stopover', body: `About ${pc(f.sweepShare)} of your pay, ${e(moved(f))} a month, moves to another bank soon after it lands. Kori only sees what stays. Keep your phone bill and subscriptions here and your weekly number gets sharper.`, ask: 'How much of my salary do I move out?' }),
    tightrope: (f, e) => ({ title: 'Stretching it to payday', body: `${spentLine(f, e)}. That is common when you are starting out. Check your daily number before the weekend and the last week gets easier.`, ask: 'What is safe to spend this week?' }),
    saver: (f, e) => ({ title: 'An early head start', body: `You put aside ${pc(f.savingsRate)} of your income, about ${e(saved(f))} a month. Starting this early matters more than the amount. Next step: a first €500 buffer for surprise bills.`, ask: 'What is an emergency fund?' }),
    steady: (f, e) => ({ title: 'Finding your feet, with room to spare', body: hasLeft(f) ? `About ${e(f.incomePerMonth)} comes in each month and ${e(leftOver(f))} is still there at the end. A first €500 buffer would mean one surprise bill does not shake your month.` : `About ${e(f.incomePerMonth)} comes in each month and you use nearly all of it without running low. A first €500 buffer would mean one surprise bill does not shake your month.`, ask: 'What is an emergency fund?' }),
  },
  builder: {
    pass_through: (f, e) => ({ title: 'Two banks, one plan', body: `About ${pc(f.sweepShare)} of your pay, ${e(moved(f))} a month, moves on to another bank. Kori sees the ${e(f.incomePerMonth - moved(f))} that stays. Pay your fixed bills from here and Kori can plan the whole month with you.`, ask: 'How much of my salary do I move out?' }),
    tightrope: (f, e) => ({ title: 'Room to breathe before payday', body: `${spentLine(f, e)}. Kori shows bills before they land, and the one or two places where a small cut frees the most.`, ask: 'Where can I cut back?' }),
    saver: (f, e) => ({ title: 'Your money already has a job', body: `You move ${pc(f.savingsRate)} of your income to savings, about ${e(saved(f))} a month. At that pace a €5,000 goal takes about ${span(Math.ceil(5000 / Math.max(1, saved(f))))}. Give the goal a name and Kori tracks it with you.`, ask: 'How much did I save this year?' }),
    steady: (f, e) => ({ title: 'Balanced, and ready for a goal', body: hasLeft(f) ? `After bills and everyday spending, about ${e(leftOver(f))} a month is left over. Put towards one named goal, that is ${e(leftOver(f) * 12)} in a year.` : `About ${e(f.incomePerMonth)} comes in each month and it covers your bills and everyday spending. A small named goal is a good next step, even at €20 a month.`, ask: 'How could I save more?' }),
  },
  established: {
    pass_through: (f, e) => ({ title: 'The household runs on two banks', body: `About ${pc(f.sweepShare)} of your pay, ${e(moved(f))} a month, moves to another bank. Kori sees the ${e(f.incomePerMonth - moved(f))} that stays here, so your safe-to-spend covers part of the picture.`, ask: 'How much of my salary do I move out?' }),
    tightrope: (f, e) => ({ title: 'Bills first, then the rest', body: `${spentLine(f, e)}. Fixed bills alone take ${pc(fin(f.fixedShare))}. Kori lines up what is due before payday so nothing arrives as a surprise.`, ask: 'What bills are coming up?' }),
    saver: (f, e) => ({ title: 'A cushion under the household', body: `You set aside ${pc(f.savingsRate)} of your income, about ${e(saved(f))} a month, while running a household. That habit is the hard part. Next step: check the cushion against your ${e(bills(f))} of monthly bills.`, ask: 'How big should my buffer be?' }),
    steady: (f, e) => ({ title: 'The household runs smoothly', body: hasLeft(f) ? `Fixed bills take ${pc(fin(f.fixedShare))} of your ${e(f.incomePerMonth)} a month, and about ${e(leftOver(f))} is left over. A yearly check of energy, phone and insurance contracts is the easiest way to widen that gap.` : `Fixed bills take ${pc(fin(f.fixedShare))} of your ${e(f.incomePerMonth)} a month and the rest is spoken for. A yearly check of energy, phone and insurance contracts is the easiest way to free some up.`, ask: 'How do I compare to similar households?' }),
  },
  golden: {
    pass_through: (f, e) => ({ title: 'Pension in, then onwards', body: `About ${pc(f.sweepShare)} of your income, ${e(moved(f))} a month, moves to another account. Kori only sees what stays here. Keeping your regular bills here makes each month easier to follow.`, ask: 'What bills are coming up?' }),
    tightrope: (f, e) => ({ title: 'Making a fixed income last', body: `${spentLine(f, e)}. Kori shows your bills before they are due, and what is safe to spend each day.`, ask: 'What is safe to spend this week?' }),
    saver: (f, e) => ({ title: 'Comfortable, with some put aside', body: `Your income is about ${e(f.incomePerMonth)} a month and you still put ${e(saved(f))} aside. Health and home costs can come unannounced. Your savings keep them small worries.`, ask: 'What were my surprise costs?' }),
    steady: (f, e) => ({ title: 'A steady month, every month', body: hasLeft(f) ? `About ${e(f.incomePerMonth)} comes in each month and about ${e(leftOver(f))} is left over. The costs worth planning for are health and home repairs. Kori keeps a small buffer for them.` : `About ${e(f.incomePerMonth)} comes in each month and it covers what goes out. The costs worth planning for are health and home repairs. Kori keeps a small buffer for them.`, ask: 'What were my surprise costs?' }),
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

/** `force` renders a decoy persona for the same customer (used only by the swap-test eval). */
export function personaOf(c: Customer, e: (x: number) => string = (x) => '€' + Math.round(x).toLocaleString('en-GB'), force?: { stage?: Stage; style?: Style }): Persona {
  const f = segmentFeatures(c);
  const cv = incomeCv(c);
  const stage = force?.stage ?? stageOf(f), style = force?.style ?? styleOf(f), traits = traitsOf(f, cv);
  const sp = STYLE_PLAY[style], st = STAGE_INFO[stage];
  const main = CARDS[stage][style](f, e);
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
    f, incomeCv: cv, tone, questions, sliders, layout, textScale: st.textScale, cards,
    // a pass-through customer with almost no bills here gets a nudge that does not quote "€0 of bills"
    nudge: style === 'pass_through' && bills(f) < 20 ? 'Paying one regular bill from here, like your phone, lets Kori warn you before it is due.' : sp.nudge(f, e),
  };
}

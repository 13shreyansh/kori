// Behaviour segments: Kori personalises by what people DO with money, not only by age.
// S-Pankki asked for this at the booth: spenders vs savers, more vs less active users, and people who
// receive their salary and immediately send it to another bank. Each segment carries its own
// home card, coach tone, what-if sliders and nudges, so personalisation needs no per-person UI generation.
//
// The rules are deliberately simple and written out in eval/SEGMENTS_SPEC.md, where an independent
// Python answer key re-implements them for the held-out eval. Change both together.
import { addDays, type Customer, type Tx } from './model';

export type SegmentId =
  | 'pass_through' | 'light_user' | 'golden_years' | 'starter' | 'stretched' | 'grazer' | 'saver' | 'fixed_heavy' | 'steady';

export interface SegmentFeatures {
  months: number;
  incomePerMonth: number;
  pensionShare: number;
  sweepShare: number; // share of income sent on to another bank
  savingsRate: number;
  spendRatio: number; // spending / income
  fixedShare: number; // fixed bills / income
  everydayPerMonth: number; // everyday card payments a month (activity)
  slipsPerWeek: number;
  lowBalanceShare: number; // share of active days ending under €100
  age: number;
  ids: { sweep: number[]; savings: number[]; slips: number[]; pension: number[] };
}

export const WINDOW_DAYS = 182;
export const T = {
  sweepShare: 0.3, lightEverydayPerMonth: 10, retireAge: 65, pensionShare: 0.5, starterAge: 25, starterIncome: 1300,
  stretchedSpendRatio: 1.0, stretchedLowBalance: 0.25, grazerSlipsPerWeek: 2.5, saverRate: 0.05, fixedShare: 0.45, lowBalanceEur: 100,
};

export function segmentFeatures(c: Customer): SegmentFeatures {
  const from = addDays(c.today, -(WINDOW_DAYS - 1));
  const w = c.tx.filter((t) => t.date >= from && t.date <= c.today);
  const months = WINDOW_DAYS / 30.44;
  const sum = (xs: Tx[]) => xs.reduce((a, t) => a + Math.abs(t.amount), 0);
  const inc = w.filter((t) => t.amount > 0 && t.cat.kind === 'income');
  const pension = inc.filter((t) => t.cat.key === 'income_pension');
  const sweep = w.filter((t) => t.amount < 0 && t.cat.key === 'salary_sweep');
  const saved = w.filter((t) => t.amount < 0 && t.cat.kind === 'savings');
  const spendTx = w.filter((t) => t.amount < 0 && t.basket !== null);
  const fixed = spendTx.filter((t) => t.basket === 'fixed');
  const everyday = spendTx.filter((t) => t.basket === 'everyday');
  const slips = spendTx.filter((t) => t.slip);
  const income = sum(inc);
  const endOfDay = new Map<string, number>();
  for (const t of w) if (t.balance != null) endOfDay.set(t.date, t.balance); // tx are in time order: last write wins
  const days = [...endOfDay.values()];
  const share = (x: number) => (income > 0 ? x / income : x > 0 ? Infinity : 0);
  return {
    months,
    incomePerMonth: income / months,
    pensionShare: income > 0 ? sum(pension) / income : 0,
    sweepShare: income > 0 ? sum(sweep) / income : 0,
    savingsRate: income > 0 ? sum(saved) / income : 0,
    spendRatio: share(sum(spendTx)),
    fixedShare: share(sum(fixed)),
    everydayPerMonth: everyday.length / months,
    slipsPerWeek: slips.length / (WINDOW_DAYS / 7),
    lowBalanceShare: days.length ? days.filter((b) => b < T.lowBalanceEur).length / days.length : 0,
    age: c.age,
    ids: { sweep: sweep.map((t) => t.i), savings: saved.map((t) => t.i), slips: slips.map((t) => t.i), pension: pension.map((t) => t.i) },
  };
}

/** First matching rule wins. The order puts behaviours S-Pankki can act on first. */
export function assignSegment(f: SegmentFeatures): SegmentId {
  if (f.incomePerMonth > 0 && f.sweepShare >= T.sweepShare) return 'pass_through';
  if (f.everydayPerMonth < T.lightEverydayPerMonth) return 'light_user';
  if (f.age >= T.retireAge || f.pensionShare >= T.pensionShare) return 'golden_years';
  if (f.age <= T.starterAge || f.incomePerMonth < T.starterIncome) return 'starter';
  if (f.spendRatio >= T.stretchedSpendRatio || f.lowBalanceShare >= T.stretchedLowBalance) return 'stretched';
  if (f.slipsPerWeek >= T.grazerSlipsPerWeek) return 'grazer';
  if (f.savingsRate >= T.saverRate) return 'saver';
  if (f.fixedShare >= T.fixedShare) return 'fixed_heavy';
  return 'steady';
}

export type SliderSpec =
  | { kind: 'cut'; title: string; basket: 'everyday' | 'fixed'; exclude: string[]; top: number }
  | { kind: 'taps'; title: string }
  | { kind: 'save'; title: string; label: string; max: number; step: number; start: number; goal: number; goalLabel: string }
  | { kind: 'keep'; title: string };

export interface Playbook {
  id: SegmentId;
  name: string;
  icon: string;
  tone: string; // added to the AI coach's system prompt
  questions: string[]; // coach starters for this person
  sliders: SliderSpec[];
  card: (f: SegmentFeatures, e: (x: number) => string) => { title: string; body: string; ask: string };
  nudge: (f: SegmentFeatures, e: (x: number) => string) => string;
}

const pct = (x: number) => Math.round(x * 100) + '%';

export const PLAYBOOKS: Record<SegmentId, Playbook> = {
  pass_through: {
    id: 'pass_through', name: 'The Pass-Through', icon: 'ArrowUpRight',
    tone: 'This customer moves most of their salary to another bank right after payday. Never guilt them. Show what Kori can do when bills and buffer live in one place, and be concrete about their own numbers.',
    questions: ['How much of my salary do I move out?', 'What bills are coming up?', 'What is safe to spend this week?'],
    sliders: [{ kind: 'keep', title: 'Keep enough here for your bills' }, { kind: 'cut', title: 'Everyday habits', basket: 'everyday', exclude: ['groceries'], top: 2 }],
    card: (f, e) => ({ title: 'Your salary passes through', body: `About ${pct(f.sweepShare)} of your pay moves to another bank soon after payday, ${e(f.sweepShare * f.incomePerMonth)} a month. Kori can only see what stays here, so your safe-to-spend covers part of the picture.`, ask: 'How much of my salary do I move out?' }),
    nudge: (f, e) => (1 - f.sweepShare) >= f.fixedShare ? `What stays here already covers your ${e(f.fixedShare * f.incomePerMonth)} of fixed bills a month. Paying them from here lets Kori warn you before one bounces.` : `Keeping ${e(f.fixedShare * f.incomePerMonth)} here each payday would cover your fixed bills, so Kori can warn you before a bill bounces.`,
  },
  light_user: {
    id: 'light_user', name: 'The Light Touch', icon: 'Feather',
    tone: 'This customer uses this account for few daily payments. Keep answers short, focus on bills and the big picture, and say plainly when the data is too thin to judge habits.',
    questions: ['What bills are coming up?', 'What did I spend last month?', 'How do I compare to similar households?'],
    sliders: [{ kind: 'save', title: 'Build a buffer', label: 'Set aside each month', max: 300, step: 10, start: 50, goal: 1000, goalLabel: 'a €1,000 buffer' }],
    card: (f) => ({ title: 'A quiet account', body: `Only about ${Math.round(f.everydayPerMonth)} everyday card payments a month go through here. Kori will focus on your bills and buffer rather than guessing habits from too little data.`, ask: 'What bills are coming up?' }),
    nudge: () => 'Pay a week of everyday shopping with this card and Kori can show you where small amounts add up.',
  },
  golden_years: {
    id: 'golden_years', name: 'Golden Years', icon: 'Sun',
    tone: 'This customer is likely retired, on a steady pension. Use a calm, respectful tone without slang. Focus on predictability, health and home costs, and gifts or travel they plan for. Never talk down.',
    questions: ['What bills are coming up?', 'What were my surprise costs?', 'How much do I spend on health?'],
    sliders: [{ kind: 'save', title: 'A pot for travel or gifts', label: 'Put aside each month', max: 300, step: 10, start: 50, goal: 1200, goalLabel: 'a €1,200 trip' }, { kind: 'cut', title: 'Everyday spending', basket: 'everyday', exclude: ['groceries', 'pharmacy'], top: 2 }],
    card: (f, e) => ({ title: 'Steady income, fewer surprises', body: `Your income is about ${e(f.incomePerMonth)} a month and arrives like clockwork. The thing to plan for is surprise costs like health and home repairs, so Kori keeps a buffer for them.`, ask: 'What were my surprise costs?' }),
    nudge: () => 'Health and home costs come unannounced. Putting a little aside each month keeps them from becoming a worry.',
  },
  starter: {
    id: 'starter', name: 'The Starter', icon: 'Sprout',
    tone: 'This customer is young or on a small income, maybe a student. Be warm and encouraging, explain money words simply, and celebrate small wins. Focus on a first buffer and everyday habits.',
    questions: ['What is safe to spend this week?', 'How much do I spend on food delivery?', 'What is an emergency fund?'],
    sliders: [{ kind: 'save', title: 'Your first buffer', label: 'Save each month', max: 150, step: 5, start: 25, goal: 500, goalLabel: 'a €500 first buffer' }, { kind: 'cut', title: 'Small habits', basket: 'everyday', exclude: ['groceries'], top: 3 }],
    card: (f, e) => ({ title: 'Building your first buffer', body: `${f.incomePerMonth < 1800 ? `With about ${e(f.incomePerMonth)} a month coming in, every euro counts.` : `You're early in your money life, with about ${e(f.incomePerMonth)} a month coming in.`} A first €500 buffer means one surprise bill doesn't wreck your month.`, ask: 'What is an emergency fund?' }),
    nudge: (_f, e) => `${e(25)} a month reaches €500 in about 20 months. Rounding up small taps gets you there faster.`,
  },
  stretched: {
    id: 'stretched', name: 'The Tightrope', icon: 'Activity',
    tone: 'This customer spends about everything that comes in, or runs low before payday. Be kind and practical, never judgemental. Focus on the next payday, the one or two biggest leaks and bills that are coming.',
    questions: ['What is safe to spend this week?', 'What bills are coming up?', 'Where can I cut back?'],
    sliders: [{ kind: 'cut', title: 'Where a little goes a long way', basket: 'everyday', exclude: ['groceries'], top: 3 }],
    card: (f) => ({ title: 'Making it to payday', body: `You spent about ${pct(Math.min(f.spendRatio, 9.99))} of what came in${f.lowBalanceShare >= 0.1 ? `, and ${pct(f.lowBalanceShare)} of days ended under €100` : ''}. Kori will flag bills before they land and show what's safe each day.`, ask: 'What is safe to spend this week?' }),
    nudge: () => 'The days right after payday decide the month. Try checking safe-to-spend before the first weekend.',
  },
  grazer: {
    id: 'grazer', name: 'The Tap-and-Go', icon: 'Coffee',
    tone: 'This customer makes many small card payments. Be playful and light, use the guessing game and small-taps framing, and turn taps into concrete yearly amounts.',
    questions: ['How much do my small taps add up to?', 'How much did I spend on cafés last month?', 'How much could I save if I cut eating out by 20%?'],
    sliders: [{ kind: 'taps', title: 'Skip a few small taps' }, { kind: 'cut', title: 'Your top habits', basket: 'everyday', exclude: ['groceries'], top: 2 }],
    card: (f) => ({ title: 'Small taps, big total', body: `You make about ${Math.round(f.slipsPerWeek)} small payments under €20 a week. Each one is easy to forget, but together they're one of your biggest costs.`, ask: 'How much do my small taps add up to?' }),
    nudge: () => 'Skipping two small taps a week is about a hundred a year without changing anything big.',
  },
  saver: {
    id: 'saver', name: 'The Quiet Saver', icon: 'PiggyBank',
    tone: 'This customer already saves regularly. Respect that, skip the basics, and talk about goals, buffer size and keeping the habit. Never push investment products.',
    questions: ['How much did I save this year?', 'How big should my buffer be?', 'What kind of spender am I?'],
    sliders: [{ kind: 'save', title: 'Turn it up a notch', label: 'Extra saving each month', max: 400, step: 10, start: 50, goal: 5000, goalLabel: 'a €5,000 goal' }],
    card: (f, e) => ({ title: 'Your saving habit works', body: `You move ${pct(f.savingsRate)} of your income to savings, about ${e(f.savingsRate * f.incomePerMonth)} a month. That habit is the hardest part, and you already have it.`, ask: 'How much did I save this year?' }),
    nudge: () => 'A buffer of three months of fixed bills is a common target. Ask Kori how close you are.',
  },
  fixed_heavy: {
    id: 'fixed_heavy', name: 'The Fixed-Cost Juggler', icon: 'Home',
    tone: 'Most of this customer\'s income goes to fixed bills like rent, loans and daycare. Be practical: help them see which bills are fixed and which can be renegotiated, and protect their buffer.',
    questions: ['What bills are coming up?', 'Explain my three baskets', 'How do I compare to similar households?'],
    sliders: [{ kind: 'cut', title: 'Bills you could renegotiate', basket: 'fixed', exclude: ['housing', 'loan_repayment', 'childcare'], top: 3 }, { kind: 'cut', title: 'Everyday spending', basket: 'everyday', exclude: ['groceries'], top: 1 }],
    card: (f) => ({ title: 'Bills take the first bite', body: `Fixed bills take ${pct(f.fixedShare)} of your income before you buy anything. Every euro you trim from a regular bill is saved again every month.`, ask: 'What bills are coming up?' }),
    nudge: () => 'Energy, phone and insurance contracts are worth a yearly check. One call can save every month after.',
  },
  steady: {
    id: 'steady', name: 'The Steady Planner', icon: 'Compass',
    tone: 'This customer is fairly balanced. Be friendly and curious, offer comparisons and what-ifs, and help them set a goal.',
    questions: ['How do I compare to similar households?', 'What kind of spender am I?', 'How much could I save if I cut eating out by 20%?'],
    sliders: [{ kind: 'cut', title: 'Your biggest everyday habits', basket: 'everyday', exclude: ['groceries'], top: 4 }],
    card: (f, e) => ({ title: 'Balanced, with room to aim', body: `Bills, surprises and everyday spending are in proportion, and ${e(Math.max(0, (1 - f.spendRatio - f.savingsRate) * f.incomePerMonth))} a month is left over on average. A goal gives that money a job.`, ask: 'How do I compare to similar households?' }),
    nudge: () => 'Pick one goal and give it a name. People save more for a named goal than for "savings".',
  },
};

export function segmentOf(c: Customer) {
  const f = segmentFeatures(c);
  const id = assignSegment(f);
  return { id, f, play: PLAYBOOKS[id] };
}

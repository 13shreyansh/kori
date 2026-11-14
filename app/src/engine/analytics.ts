import { addDays, daysBetween, merchantName, toDate, type Customer, type Tx } from './model';
import { CATEGORIES, type Basket } from './taxonomy';

/** Every number the coach shows comes with a receipt: which transactions, and how it was computed. */
export interface Receipt {
  id: string;
  label: string;
  value: number;
  unit: 'EUR' | 'count' | '%' | 'days';
  formula: string;
  txIds: number[];
}

let rc = 0;
export const receipt = (label: string, value: number, unit: Receipt['unit'], formula: string, txIds: number[] = []): Receipt => ({
  id: 'r' + ++rc,
  label,
  value: Math.round(value * 100) / 100,
  unit,
  formula,
  txIds,
});

export const r2 = (x: number) => Math.round(x * 100) / 100;
export const eur = (x: number, dp = Math.abs(x) >= 100 || Number.isInteger(x) ? 0 : 2) =>
  '€' + Math.abs(x).toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });

// ---------- periods ----------
export interface Period { from: string; to: string; label: string; inLabel: string }
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const monthLabel = (ym: string) => MONTHS[Number(ym.slice(5, 7)) - 1] + ' ' + ym.slice(0, 4);
const monthStart = (d: string) => d.slice(0, 8) + '01';
const monthEnd = (d: string) => {
  const x = toDate(monthStart(d));
  x.setUTCMonth(x.getUTCMonth() + 1);
  x.setUTCDate(0);
  return x.toISOString().slice(0, 10);
};
const shiftMonth = (d: string, n: number) => {
  const x = toDate(monthStart(d));
  x.setUTCMonth(x.getUTCMonth() + n);
  return x.toISOString().slice(0, 10);
};

export function period(c: Customer, key: string): Period {
  const t = c.today;
  switch (key) {
    case 'this_month': return { from: monthStart(t), to: t, label: 'this month', inLabel: 'so far this month' };
    case 'last_month': { const s = shiftMonth(t, -1); return { from: s, to: monthEnd(s), label: 'last month (' + monthLabel(s) + ')', inLabel: 'last month (' + monthLabel(s) + ')' }; }
    case 'this_week': { const dow = (toDate(t).getUTCDay() + 6) % 7; return { from: addDays(t, -dow), to: t, label: 'this week', inLabel: 'so far this week' }; }
    case 'last_week': { const dow = (toDate(t).getUTCDay() + 6) % 7; return { from: addDays(t, -dow - 7), to: addDays(t, -dow - 1), label: 'last week', inLabel: 'last week' }; }
    case 'last_30': return { from: addDays(t, -29), to: t, label: 'the last 30 days', inLabel: 'in the last 30 days' };
    case 'last_3_months': return { from: shiftMonth(t, -3), to: monthEnd(shiftMonth(t, -1)), label: 'the last 3 full months', inLabel: 'in the last 3 full months' };
    case 'last_12_months': case 'year': return { from: addDays(t, -364), to: t, label: 'the last 12 months', inLabel: 'in the last 12 months' };
    default:
      if (/^\d{4}-\d{2}$/.test(key)) return { from: key + '-01', to: monthEnd(key + '-01'), label: monthLabel(key), inLabel: 'in ' + monthLabel(key) };
      return { from: addDays(t, -364), to: t, label: 'the last 12 months', inLabel: 'in the last 12 months' };
  }
}
export const monthsIn = (p: Period) => Math.max(1, daysBetween(p.from, p.to) + 1) / 30.44;

// ---------- queries ----------
export interface Filter {
  period?: string;
  category?: string[]; // dataset category keys
  merchant?: string; // substring, case-insensitive
  basket?: Basket;
  slipsOnly?: boolean;
  weekend?: boolean;
  lateNight?: boolean; // 21:00-04:59
}

export const isSpend = (t: Tx) => t.basket !== null;

export function select(c: Customer, f: Filter): Tx[] {
  const p = period(c, f.period ?? 'last_12_months');
  const m = f.merchant?.toLowerCase().replace(/\s+/g, '');
  return c.tx.filter((t) => {
    if (!isSpend(t) || t.date < p.from || t.date > p.to) return false;
    if (f.category?.length && !f.category.includes(t.category) && !f.category.includes(t.cat.key)) return false;
    if (m && !t.merchant.toLowerCase().replace(/[_\s]/g, '').includes(m)) return false;
    if (f.basket && t.basket !== f.basket) return false;
    if (f.slipsOnly && !t.slip) return false;
    if (f.weekend !== undefined) { const d = toDate(t.date).getUTCDay(); if ((d === 0 || d === 6 || d === 5) !== f.weekend) return false; }
    if (f.lateNight) { const h = Number(t.time.slice(0, 2)); if (!(h >= 21 || h < 5)) return false; }
    return true;
  });
}

export function spend(c: Customer, f: Filter) {
  const p = period(c, f.period ?? 'last_12_months');
  const txs = select(c, f);
  const total = txs.reduce((a, t) => a - t.amount, 0);
  const what = f.slipsOnly && !f.category ? 'small taps under €20' : f.category?.length ? f.category.map((k) => CATEGORIES[k]?.label ?? k).join(', ') : f.merchant ? merchantName('M_' + f.merchant.toUpperCase()) : f.basket ? basketName[f.basket] : 'everything';
  return {
    period: p,
    total: r2(total),
    count: txs.length,
    average: txs.length ? r2(total / txs.length) : 0,
    perMonth: r2(total / monthsIn(p)),
    txs,
    receipt: receipt(`${what.replace(/^./, (x) => x.toUpperCase())}, ${p.label}`, total, 'EUR', `sum of ${txs.length} payments between ${p.from} and ${p.to}`, txs.map((t) => t.i)),
  };
}

export function breakdown(c: Customer, by: 'category' | 'merchant' | 'basket', f: Filter = {}) {
  const txs = select(c, f);
  const m = new Map<string, { key: string; label: string; total: number; count: number; ids: number[] }>();
  for (const t of txs) {
    const key = by === 'category' ? t.cat.key : by === 'merchant' ? t.merchant : (t.basket as string);
    const label = by === 'category' ? t.cat.label : by === 'merchant' ? merchantName(t.merchant) : basketName[t.basket!];
    const e = m.get(key) ?? m.set(key, { key, label, total: 0, count: 0, ids: [] }).get(key)!;
    e.total -= t.amount; e.count++; e.ids.push(t.i);
  }
  return [...m.values()].map((e) => ({ ...e, total: r2(e.total) })).sort((a, b) => b.total - a.total);
}

export function monthly(c: Customer, f: Filter = {}) {
  const out = new Map<string, number>();
  for (const t of select(c, { ...f, period: f.period ?? 'last_12_months' })) out.set(t.date.slice(0, 7), (out.get(t.date.slice(0, 7)) ?? 0) - t.amount);
  return [...out.entries()].sort().map(([m, v]) => ({ month: m, total: r2(v) }));
}

// ---------- the three baskets ----------
export const basketName: Record<Basket, string> = { fixed: 'Fixed bills', surprise: 'Surprise costs', everyday: 'Everyday spending' };
export const basketBlurb: Record<Basket, string> = {
  fixed: 'Must-pays that come every month: rent, electricity, phone, insurance.',
  surprise: 'Must-pays you can’t schedule: the dentist, a car repair, a broken washing machine.',
  everyday: 'Choices you make every day: groceries, coffee, takeaway, taxis.',
};

export function income(c: Customer, periodKey = 'last_3_months') {
  const p = period(c, periodKey);
  const txs = c.tx.filter((t) => t.amount > 0 && t.cat.kind === 'income' && t.date >= p.from && t.date <= p.to);
  const total = txs.reduce((a, t) => a + t.amount, 0);
  return { total: r2(total), perMonth: r2(total / monthsIn(p)), txs, period: p };
}

export function savings(c: Customer, periodKey = 'last_12_months') {
  const p = period(c, periodKey);
  const txs = c.tx.filter((t) => t.cat.kind === 'savings' && t.date >= p.from && t.date <= p.to);
  const total = -txs.reduce((a, t) => a + t.amount, 0);
  return { total: r2(total), perMonth: r2(total / monthsIn(p)), txs };
}

export function baskets(c: Customer, periodKey = 'last_3_months') {
  const p = period(c, periodKey);
  const rows = (['fixed', 'surprise', 'everyday'] as Basket[]).map((b) => {
    const s = spend(c, { period: periodKey, basket: b });
    return { basket: b, name: basketName[b], total: s.total, perMonth: s.perMonth, count: s.count, receipt: s.receipt };
  });
  const all = rows.reduce((a, r) => a + r.total, 0);
  const slips = spend(c, { period: periodKey, slipsOnly: true });
  return { period: p, rows: rows.map((r) => ({ ...r, share: all ? r.total / all : 0 })), total: r2(all), slips };
}

/** Surprise costs are irregular month to month but predictable over a year. */
export function surpriseFund(c: Customer) {
  const s = spend(c, { period: 'last_12_months', basket: 'surprise' });
  const perMonth = s.total / 12;
  const biggest = [...s.txs].sort((a, b) => a.amount - b.amount).slice(0, 3);
  return {
    yearTotal: s.total,
    perMonth: r2(perMonth),
    biggest,
    receipt: receipt('Monthly surprise buffer', perMonth, 'EUR', `last 12 months of surprise costs ${eur(s.total)} ÷ 12`, s.txs.map((t) => t.i)),
  };
}

// ---------- safe to spend ----------
export function upcomingBills(c: Customer, until: string) {
  const out: { label: string; date: string; amount: number; seriesId: string }[] = [];
  for (const s of c.series) {
    let d = s.next;
    let guard = 0;
    while (d <= until && guard++ < 6) {
      if (d > c.today) out.push({ label: s.label, date: d, amount: s.typicalAmount, seriesId: s.id });
      d = addDays(d, s.cadenceDays);
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export interface SafeToSpend {
  week: number; // EUR safe for the rest of this week (7 days from today)
  perDay: number;
  balance: number;
  steps: { label: string; amount: number; note: string }[];
  receipts: Receipt[];
  horizonDays: number;
  nextPayday: string | null;
  cappedByCash: boolean;
  left: number;
}

function lastBalance(c: Customer) {
  // sum the latest balance per account
  const byAcc = new Map<string, number>();
  for (const t of c.tx) if (t.balance != null) byAcc.set(t.account, t.balance);
  return [...byAcc.values()].reduce((a, b) => a + b, 0);
}

export function nextPayday(c: Customer): string | null {
  const inc = c.tx.filter((t) => t.amount > 0 && t.cat.kind === 'income' && t.amount > 150);
  if (inc.length < 2) return null;
  const big = inc.sort((a, b) => b.amount - a.amount)[0];
  const same = inc.filter((t) => t.merchant === big.merchant).map((t) => t.date).sort();
  const last = same[same.length - 1];
  const d = toDate(last);
  d.setUTCMonth(d.getUTCMonth() + 1);
  let n = d.toISOString().slice(0, 10);
  while (n <= c.today) { const x = toDate(n); x.setUTCMonth(x.getUTCMonth() + 1); n = x.toISOString().slice(0, 10); }
  return n;
}

export function lastPayday(c: Customer): string | null {
  const inc = c.tx.filter((t) => t.amount > 0 && t.cat.kind === 'income' && t.amount > 150);
  if (!inc.length) return null;
  const main = [...inc].sort((a, b) => b.amount - a.amount)[0].merchant;
  return inc.filter((t) => t.merchant === main).map((t) => t.date).sort().pop() ?? null;
}

/** Monthly cost of the regular bills (quarterly bills spread over 3 months). */
export function fixedPerMonth(c: Customer) {
  return r2(c.series.reduce((a, s) => a + (s.typicalAmount * 30.44) / s.cadenceDays, 0));
}

/**
 * Safe to spend = what's left of this pay period's everyday budget.
 * Everyday budget = income − fixed bills − surprise buffer − savings goal (all per month),
 * scaled to the pay period, minus everyday spending since payday. Capped by what's really in the account.
 */
export function safeToSpend(c: Customer, savingsGoalPerMonth?: number): SafeToSpend {
  const balance = r2(lastBalance(c));
  const pay = nextPayday(c);
  const last = lastPayday(c) ?? period(c, 'this_month').from;
  const cycleDays = Math.max(1, pay ? daysBetween(last, pay) : 30);
  const daysLeft = Math.max(1, pay ? daysBetween(c.today, pay) : 30 - daysBetween(last, c.today));
  const inc = income(c, 'last_3_months').perMonth;
  const fixed = fixedPerMonth(c);
  const fund = surpriseFund(c);
  const goal = savingsGoalPerMonth ?? savings(c, 'last_3_months').perMonth;
  const scale = cycleDays / 30.44;
  const budget = Math.max(0, (inc - fixed - fund.perMonth - goal) * scale);
  const spentTx = c.tx.filter((t) => t.basket === 'everyday' && t.date >= last && t.date <= c.today);
  const spent = spentTx.reduce((a, t) => a - t.amount, 0);
  const left = budget - spent;
  const bills = upcomingBills(c, addDays(c.today, daysLeft));
  const billsTotal = bills.reduce((a, b) => a + b.amount, 0);
  const cash = balance - billsTotal - (fund.perMonth * daysLeft) / 30.44;
  const cappedByCash = cash < left;
  const free = Math.max(0, Math.min(left, cash));
  const perDay = free / daysLeft;
  const week = perDay * Math.min(7, daysLeft);
  const rWeek = receipt('Safe to spend this week', week, 'EUR',
    `${eur(free)} left until payday ÷ ${daysLeft} days × ${Math.min(7, daysLeft)}` + (cappedByCash ? ' (limited by your balance after upcoming bills)' : ''),
    spentTx.map((t) => t.i));
  return {
    week: r2(week),
    perDay: r2(perDay),
    balance,
    horizonDays: daysLeft,
    nextPayday: pay,
    cappedByCash,
    left: r2(left),
    steps: [
      { label: 'Income', amount: r2(inc * scale), note: `${eur(inc)}/month, this pay period` },
      { label: 'Fixed bills', amount: -r2(fixed * scale), note: `${c.series.length} regular bills` },
      { label: 'Surprise buffer', amount: -r2(fund.perMonth * scale), note: `your ${eur(fund.yearTotal)} of surprises last year, spread out` },
      ...(goal > 0 ? [{ label: 'Pay yourself first', amount: -r2(goal * scale), note: 'savings goal' }] : []),
      { label: 'Spent since payday', amount: -r2(spent), note: `${spentTx.length} everyday purchases since payday, ${new Date(last + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` },
      ...(cappedByCash && left > 0 ? [{ label: 'Limited by your balance', amount: -r2(left - free), note: 'balance after upcoming bills is lower' }] : []),
      { label: left < 0 ? 'Over budget this pay period' : 'Left until payday', amount: r2(cappedByCash && left > 0 ? free : left), note: `${daysLeft} days to go` },
    ],
    receipts: [
      receipt('Income per month', inc, 'EUR', 'average of the last 3 full months'),
      receipt('Fixed bills per month', fixed, 'EUR', c.series.map((s) => `${s.label} ${eur(s.typicalAmount, 2)}${s.cadenceDays > 40 ? ' quarterly' : ''}`).join(', '), c.series.flatMap((s) => s.txIds)),
      fund.receipt,
      receipt('Everyday spent since payday', spent, 'EUR', `${spentTx.length} purchases since ${last}`, spentTx.map((t) => t.i)),
      rWeek,
    ],
  };
}

// ---------- what if ----------
export function whatIf(c: Customer, f: Filter, cutPct: number) {
  const base = spend(c, { ...f, period: f.period ?? 'last_3_months' });
  const perMonth = base.perMonth;
  const monthlySaving = (perMonth * cutPct) / 100;
  const yearSaving = monthlySaving * 12;
  // pedagogical: what it grows to if invested at a cautious 3% per year for 5 years (monthly compounding)
  const r = 0.03 / 12;
  const n = 60;
  const fiveYears = monthlySaving * ((Math.pow(1 + r, n) - 1) / r);
  return {
    perMonth: r2(perMonth),
    monthlySaving: r2(monthlySaving),
    yearSaving: r2(yearSaving),
    fiveYears: r2(fiveYears),
    base,
    receipts: [
      receipt('Current monthly spend', perMonth, 'EUR', `${eur(base.total)} over ${base.period.label} ÷ ${monthsIn(base.period).toFixed(1)} months`, base.txs.map((t) => t.i)),
      receipt(`Saved per year with a ${cutPct}% cut`, yearSaving, 'EUR', `${eur(perMonth)} × ${cutPct}% × 12`),
      receipt('Grows to in 5 years at 3%', fiveYears, 'EUR', `${eur(monthlySaving)} a month for 60 months at 3% a year, compounded monthly`),
    ],
  };
}

// ---------- spender profile ----------
export interface Trait { key: string; label: string; value: number; display: string; note: string; ids: number[] }
export function spenderProfile(c: Customer) {
  const p12 = 'last_3_months';
  const all = spend(c, { period: p12 });
  const slips = spend(c, { period: p12, slipsOnly: true });
  const weekend = spend(c, { period: p12, basket: 'everyday', weekend: true });
  const everyday = spend(c, { period: p12, basket: 'everyday' });
  const late = spend(c, { period: p12, lateNight: true, basket: 'everyday' });
  const subs = c.series.filter((s) => !s.essential);
  const inc = income(c, p12);
  const sav = savings(c, p12);
  const months = monthly(c, { basket: 'everyday' }).map((m) => m.total);
  const mean = months.reduce((a, b) => a + b, 0) / Math.max(1, months.length);
  const cv = months.length > 2 ? Math.sqrt(months.reduce((a, b) => a + (b - mean) ** 2, 0) / months.length) / mean : 0;
  const slipsPerWeek = slips.count / (monthsIn(slips.period) * 4.35);
  const weekendShare = everyday.total ? weekend.total / everyday.total : 0; // Fri-Sun is 3/7 = 43% of days
  const savingsRate = inc.total ? (sav.total + Math.max(0, inc.total - all.total - sav.total) * 0) / inc.total : 0;
  const leftover = inc.total - all.total - sav.total;
  const traits: Trait[] = [
    { key: 'slips', label: 'Small taps per week', value: slipsPerWeek, display: slipsPerWeek.toFixed(1), note: `${slips.count} purchases under €20, ${eur(slips.total)} in total`, ids: slips.txs.map((t) => t.i) },
    { key: 'weekend', label: 'Everyday spend on Fri–Sun', value: weekendShare, display: Math.round(weekendShare * 100) + '%', note: 'three days are 43% of the week', ids: weekend.txs.map((t) => t.i) },
    { key: 'late', label: 'Spent after 9 pm', value: late.total, display: eur(late.total), note: `${late.count} late-night payments`, ids: late.txs.map((t) => t.i) },
    { key: 'subs', label: 'Optional subscriptions', value: subs.reduce((a, s) => a + s.typicalAmount, 0), display: eur(subs.reduce((a, s) => a + s.typicalAmount, 0), 2) + '/mo', note: subs.map((s) => s.label).join(', ') || 'none', ids: subs.flatMap((s) => s.txIds) },
    { key: 'steady', label: 'Month-to-month swing', value: cv, display: '±' + Math.round(cv * 100) + '%', note: 'how much your everyday spending changes', ids: [] },
    { key: 'saving', label: 'Moved to savings', value: savingsRate, display: Math.round(savingsRate * 100) + '% of income', note: `${eur(sav.total)} in the last 3 months`, ids: sav.txs.map((t) => t.i) },
  ];
  // archetype: the most pronounced trait wins, with plain-language evidence
  let type = { name: 'The Steady Planner', emoji: '🧭', line: 'Your spending is predictable and mostly goes to needs.' };
  if (slipsPerWeek >= 9) type = { name: 'The Tap-and-Go Grazer', emoji: '☕', line: `Lots of small purchases: ${slipsPerWeek.toFixed(0)} a week under €20. Each feels like nothing; together they add up.` };
  else if (weekendShare > 0.62) type = { name: 'The Weekend Splurger', emoji: '🎉', line: `${Math.round(weekendShare * 100)}% of your everyday money goes Friday to Sunday.` };
  else if (subs.length >= 4 || subs.reduce((a, s) => a + s.typicalAmount, 0) > 0.06 * Math.max(1, inc.perMonth)) type = { name: 'The Subscription Collector', emoji: '📺', line: `${subs.length} optional subscriptions quietly renew every month.` };
  else if (cv > 0.3) type = { name: 'The Rollercoaster', emoji: '🎢', line: 'Some months are calm, some are big. A buffer smooths the ride.' };
  else if (savingsRate >= 0.08) type = { name: 'The Quiet Saver', emoji: '🌱', line: `You move ${Math.round(savingsRate * 100)}% of your income to savings. That habit is the hardest part.` };
  return { type, traits, leftover: r2(leftover), incomePerMonth: inc.perMonth };
}

// ---------- benchmarks: Statistics Finland, Household Budget Survey 2022 ----------
// Source: Statistics Finland, Households' consumption 2022 (released 28 Dec 2023 / 11 Apr 2024).
// Average consumption EUR 27,800 per consumption unit per year (≈ €2,317/month). Housing, transport and food
// were ~59% of spending. Food share: 18% in the lowest income fifth, 12% in the highest.
export const BENCH = {
  source: 'Statistics Finland, Household Budget Survey 2022',
  perConsumptionUnitMonth: 27800 / 12,
  necessitiesShare: 0.59,
  foodShareLow: 0.18,
  foodShareHigh: 0.12,
};

export function benchmark(c: Customer) {
  const b = baskets(c, 'last_3_months');
  const food = spend(c, { period: 'last_3_months', category: ['groceries'] });
  const foodShare = b.total ? food.total / b.total : 0;
  const perMonth = b.total / 3;
  return {
    perMonth: r2(perMonth),
    vsFinland: r2(perMonth / BENCH.perConsumptionUnitMonth),
    foodShare,
    receipts: [
      receipt('Your monthly spending', perMonth, 'EUR', 'last 3 full months ÷ 3', b.rows.flatMap((r) => r.receipt.txIds)),
      receipt('Average Finn (per consumption unit)', BENCH.perConsumptionUnitMonth, 'EUR', `${BENCH.source}: €27,800 a year ÷ 12`),
      receipt('Groceries share of your spending', foodShare * 100, '%', `${eur(food.total)} ÷ ${eur(b.total)}`, food.txs.map((t) => t.i)),
    ],
  };
}

// ---------- proactive coach notes ----------
export interface Insight { id: string; tone: 'tip' | 'win' | 'heads-up'; title: string; body: string; ask: string; receipt?: Receipt }
export function insights(c: Customer): Insight[] {
  const out: Insight[] = [];
  const thisM = period(c, 'this_month');
  const day = daysBetween(thisM.from, thisM.to) + 1;
  const now = spend(c, { period: 'this_month', basket: 'everyday' });
  const avg = spend(c, { period: 'last_3_months', basket: 'everyday' });
  const pace = (avg.perMonth * day) / 30.44;
  if (now.total > pace * 1.15)
    out.push({ id: 'pace', tone: 'heads-up', title: `Everyday spending is ${Math.round((now.total / pace - 1) * 100)}% ahead of your usual pace`, body: `${eur(now.total)} so far this month vs about ${eur(pace)} by day ${day} normally.`, ask: 'Where is my money going this month?', receipt: now.receipt });
  else if (now.total < pace * 0.9)
    out.push({ id: 'pace', tone: 'win', title: `You’re ${Math.round((1 - now.total / pace) * 100)}% under your usual everyday pace`, body: `${eur(now.total)} so far vs about ${eur(pace)} by day ${day} normally. Nice.`, ask: 'How much could I save this month?', receipt: now.receipt });
  const slips = spend(c, { period: 'last_3_months', slipsOnly: true });
  if (slips.count > 10) {
    const top = breakdown(c, 'category', { period: 'last_3_months', slipsOnly: true })[0];
    out.push({ id: 'slips', tone: 'tip', title: `${slips.count} small taps added up to ${eur(slips.total)}`, body: `In 3 months, mostly ${top?.label.toLowerCase()}. That’s ${eur(slips.perMonth * 12)} a year.`, ask: `How much could I save if I cut ${top?.label.toLowerCase()} by 20%?`, receipt: slips.receipt });
  }
  const fund = surpriseFund(c);
  if (fund.yearTotal > 100)
    out.push({ id: 'surprise', tone: 'tip', title: `Surprises cost you ${eur(fund.yearTotal)} last year`, body: `They feel random, but that’s ${eur(fund.perMonth)} a month on average. Setting it aside turns a shock into a plan.`, ask: 'What were my surprise costs?', receipt: fund.receipt });
  const subs = c.series.filter((s) => !s.essential);
  if (subs.length)
    out.push({ id: 'subs', tone: 'tip', title: `${subs.length} subscription${subs.length > 1 ? 's' : ''}: ${eur(subs.reduce((a, s) => a + s.typicalAmount, 0) * 12)} a year`, body: subs.map((s) => `${s.label} ${eur(s.typicalAmount, 2)}`).join(' · '), ask: 'Which subscriptions do I have?' });
  return out;
}

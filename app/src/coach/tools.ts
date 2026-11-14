// Tools the LLM can call. They return small JSON summaries (never raw transactions) plus receipts for the UI.
import * as A from '../engine/analytics';
import type { Receipt } from '../engine/analytics';
import type { Customer } from '../engine/model';
import { CATEGORIES } from '../engine/taxonomy';


const CAT_ENUM = Object.values(CATEGORIES).filter((c) => c.kind === 'spend').map((c) => c.key);
const filterProps = {
  period: { type: 'string', description: 'Time window. Or a month as YYYY-MM.', enum: undefined as unknown as string[] },
  categories: { type: 'array', items: { type: 'string', enum: CAT_ENUM }, description: 'Spending categories. Eating out = restaurants_cafes + food_delivery.' },
  merchant: { type: 'string', description: 'Part of a merchant name, e.g. wolt' },
  basket: { type: 'string', enum: ['fixed', 'surprise', 'everyday'] },
  small_taps_only: { type: 'boolean', description: 'Only discretionary purchases under 20 EUR' },
};
delete (filterProps.period as { enum?: unknown }).enum;

export const TOOL_DECLS = [
  { name: 'spend_query', description: 'Total, count and average spending for a filter.', parameters: { type: 'object', properties: filterProps } },
  { name: 'breakdown', description: 'Spending split by category, merchant or basket, biggest first.', parameters: { type: 'object', properties: { by: { type: 'string', enum: ['category', 'merchant', 'basket'] }, ...filterProps }, required: ['by'] } },
  { name: 'three_baskets', description: 'Monthly spending in the three baskets: fixed bills, surprise costs, everyday spending, plus small taps.', parameters: { type: 'object', properties: { period: { type: 'string' } } } },
  { name: 'safe_to_spend', description: 'How much is safe to spend this week and per day until payday, with the calculation steps.', parameters: { type: 'object', properties: { savings_goal_per_month: { type: 'number' } } } },
  { name: 'what_if', description: 'Savings from cutting spending in a filter by a percentage.', parameters: { type: 'object', properties: { ...filterProps, cut_percent: { type: 'number' } }, required: ['cut_percent'] } },
  { name: 'spender_profile', description: 'The user’s spender type and the patterns behind it.', parameters: { type: 'object', properties: {} } },
  { name: 'surprise_costs', description: 'Irregular must-pay costs over the last 12 months and the monthly buffer they imply.', parameters: { type: 'object', properties: {} } },
  { name: 'recurring_bills', description: 'Regular bills and subscriptions, with next due dates.', parameters: { type: 'object', properties: {} } },
  { name: 'benchmark', description: 'Compare monthly spending to Statistics Finland averages.', parameters: { type: 'object', properties: {} } },
  { name: 'income_and_savings', description: 'Income per month and money moved to savings.', parameters: { type: 'object', properties: {} } },
];

type Args = Record<string, unknown>;
const toFilter = (a: Args): A.Filter => ({
  period: (a.period as string) || undefined,
  category: (a.categories as string[]) || undefined,
  merchant: (a.merchant as string) || undefined,
  basket: (a.basket as A.Filter['basket']) || undefined,
  slipsOnly: (a.small_taps_only as boolean) || undefined,
});

export function runTool(c: Customer, name: string, args: Args): { result: unknown; receipts: Receipt[] } {
  switch (name) {
    case 'spend_query': {
      const f = { period: 'last_month', ...toFilter(args) };
      if (!args.period) f.period = 'last_month';
      const s = A.spend(c, f);
      return { result: { period: s.period.label, from: s.period.from, to: s.period.to, total_eur: s.total, payments: s.count, average_eur: s.average, per_month_eur: s.perMonth }, receipts: [s.receipt] };
    }
    case 'breakdown': {
      const f = { period: 'last_month', ...toFilter(args) };
      if (!args.period) f.period = 'last_month';
      const rows = A.breakdown(c, (args.by as 'category') ?? 'category', f).slice(0, 8);
      return { result: { period: A.period(c, f.period!).label, rows: rows.map((r) => ({ name: r.label, total_eur: r.total, payments: r.count })) }, receipts: rows.map((r) => A.receipt(r.label, r.total, 'EUR', `${r.count} payments`, r.ids)) };
    }
    case 'three_baskets': {
      const b = A.baskets(c, (args.period as string) || 'last_3_months');
      return { result: { period: b.period.label, baskets: b.rows.map((r) => ({ basket: r.name, per_month_eur: r.perMonth, share_pct: Math.round(r.share * 100), total_eur: r.total })), small_taps: { count: b.slips.count, total_eur: b.slips.total } }, receipts: [...b.rows.map((r) => r.receipt), b.slips.receipt] };
    }
    case 'safe_to_spend': {
      const s = A.safeToSpend(c, args.savings_goal_per_month as number | undefined);
      return { result: { safe_this_week_eur: s.week, per_day_eur: s.perDay, days_to_payday: s.horizonDays, left_until_payday_eur: s.left, limited_by_balance: s.cappedByCash, steps: s.steps.map((x) => ({ step: x.label, eur: x.amount, note: x.note })) }, receipts: s.receipts };
    }
    case 'what_if': {
      const f = toFilter(args);
      const w = A.whatIf(c, { ...f, period: f.period ?? 'last_3_months' }, Number(args.cut_percent ?? 20));
      return { result: { current_per_month_eur: w.perMonth, cut_percent: Number(args.cut_percent ?? 20), saved_per_month_eur: w.monthlySaving, saved_per_year_eur: w.yearSaving, value_after_5_years_at_3pct_eur: w.fiveYears }, receipts: w.receipts };
    }
    case 'spender_profile': {
      const p = A.spenderProfile(c);
      return { result: { type: p.type.name, summary: p.type.line, traits: p.traits.map((t) => ({ trait: t.label, value: t.display, note: t.note })) }, receipts: p.traits.filter((t) => t.ids.length).map((t) => A.receipt(t.label, t.value, 'EUR', t.note, t.ids)) };
    }
    case 'surprise_costs': {
      const f = A.surpriseFund(c);
      const by = A.breakdown(c, 'category', { basket: 'surprise' });
      return { result: { last_12_months_eur: f.yearTotal, buffer_per_month_eur: f.perMonth, by_type: by.map((r) => ({ name: r.label, total_eur: r.total })) }, receipts: [f.receipt, ...by.map((r) => A.receipt(r.label, r.total, 'EUR', `${r.count} payments`, r.ids))] };
    }
    case 'recurring_bills': {
      return { result: { bills: c.series.map((s) => ({ name: s.label, eur: s.typicalAmount, every_days: s.cadenceDays, next_due: s.next, optional: !s.essential })), fixed_per_month_eur: A.fixedPerMonth(c) }, receipts: [A.receipt('Fixed bills per month', A.fixedPerMonth(c), 'EUR', 'sum of regular bills', c.series.flatMap((s) => s.txIds)), ...c.series.map((s) => A.receipt(s.label, s.typicalAmount, 'EUR', `${s.occurrences} payments`, s.txIds))] };
    }
    case 'benchmark': {
      const b = A.benchmark(c);
      return { result: { your_spending_per_month_eur: b.perMonth, finland_average_per_consumption_unit_month_eur: Math.round(A.BENCH.perConsumptionUnitMonth), ratio: b.vsFinland, your_grocery_share_pct: Math.round(b.foodShare * 100), finland_food_share_pct_range: '12-18', source: A.BENCH.source }, receipts: b.receipts };
    }
    case 'income_and_savings': {
      const i = A.income(c, 'last_3_months'); const s = A.savings(c, 'last_12_months');
      return { result: { income_per_month_eur: i.perMonth, saved_last_12_months_eur: s.total, saved_per_month_eur: s.perMonth }, receipts: [A.receipt('Income per month', i.perMonth, 'EUR', 'last 3 full months', i.txs.map((t) => t.i)), A.receipt('Saved in 12 months', s.total, 'EUR', `${s.txs.length} transfers`, s.txs.map((t) => t.i))] };
    }
  }
  return { result: { error: 'unknown tool ' + name }, receipts: [] };
}

/** Grounding guard: every euro amount and percentage in the answer must come from a tool result. */
export function ungroundedNumbers(text: string, results: unknown[]): string[] {
  const nums: number[] = [];
  const walk = (v: unknown) => { if (typeof v === 'number') nums.push(v); else if (typeof v === 'string') (v.match(/\d[\d,]*(\.\d+)?/g) ?? []).forEach((x) => nums.push(Number(x.replace(/,/g, '')))); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
  results.forEach(walk);
  const found = text.match(/€\s?\d[\d,]*(\.\d+)?|\d[\d,]*(\.\d+)?\s?(€|eur|euros?|%)/gi) ?? [];
  const bad: string[] = [];
  for (const f of found) {
    const v = Number(f.replace(/[^\d.]/g, ''));
    const ok = nums.some((n) => Math.abs(Math.abs(n) - v) <= Math.max(0.6, Math.abs(n) * 0.006) || Math.abs(Math.abs(n) * 100 - v) < 0.6 || Math.abs(Math.round(Math.abs(n)) - v) < 0.6);
    if (!ok) bad.push(f);
  }
  return bad;
}

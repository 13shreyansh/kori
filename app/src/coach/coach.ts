// The coach. Numbers ALWAYS come from the engine (tools); language comes from templates (offline) or Gemini.
import * as A from '../engine/analytics';
import { eur, type Receipt } from '../engine/analytics';
import type { Customer } from '../engine/model';
import { merchantName } from '../engine/model';
import { CATEGORIES } from '../engine/taxonomy';
import { classify, CONCEPTS, parsePeriod, type Intent } from './nlu';

export interface Visual {
  kind: 'bars' | 'waterfall' | 'baskets' | 'growth' | 'traits';
  title: string;
  rows: { label: string; value: number; display?: string; tone?: string; ids?: number[] }[];
}
export interface Lesson { title: string; body: string }
export interface CoachAnswer {
  text: string;
  receipts: Receipt[];
  visual?: Visual;
  lesson?: Lesson;
  followups: string[];
  intent: Intent;
  provider: 'offline' | 'gemini';
  toolCalls: { name: string; args: unknown }[];
}

export const LESSONS: Record<string, Lesson> = {
  baskets: { title: 'Why three baskets?', body: 'Fixed bills are known in advance, so plan them once. Surprise costs feel random but add up to a predictable yearly sum, so save for them monthly. Everyday spending is where your choices live, so that is the basket to steer.' },
  emergency: { title: 'A buffer for surprises', body: 'A surprise is only a crisis if there is no money set aside for it. Putting a small amount aside every month, about what surprises cost you on average, turns a broken washing machine into a plan instead of a panic.' },
  compound: { title: 'Compound growth', body: 'Money you save can earn returns, and those returns earn returns too. Small monthly amounts grow faster than you expect over years. Time matters more than the size of each deposit.' },
  inflation: { title: 'Inflation', body: 'Inflation means prices rise over time, so the same euro buys a little less each year. Money sitting still slowly loses value, which is why a buffer is for safety and long-term savings are for growth.' },
  budget: { title: 'Budgeting in one line', body: 'Income minus fixed bills minus a surprise buffer minus savings is what you can freely spend. Kori does that maths for you every day: that is your safe-to-spend.' },
  payyourself: { title: 'Pay yourself first', body: 'Move savings out on payday, before you start spending, rather than saving what is left at the end of the month. What you do not see in your account, you rarely miss.' },
  interest: { title: 'Interest rates', body: 'Interest is the price of money. When you borrow, you pay it; when you save, you earn it. A loan’s cost is the interest plus fees over its whole life, not just the monthly payment.' },
  credit: { title: 'Buy now, pay later', body: 'Splitting a payment feels painless because the cost moves to the future. Late fees and interest can make it expensive, and several small plans add up. If it is not in this month’s safe-to-spend, it is a loan.' },
  slips: { title: 'Small taps add up', body: 'Small purchases rarely feel like decisions, so they escape our mental budget. Multiplying one habit by a year makes it visible. The goal is not zero coffee; it is choosing the ones you really enjoy.' },
  safe: { title: 'How safe-to-spend works', body: 'Start with income, take out bills you know are coming, a monthly share of surprise costs, and your savings goal. What is left, divided by the days until payday, is what you can spend without borrowing from future you.' },
  profile: { title: 'Patterns, not labels', body: 'Your spender type is just your strongest pattern from the last three months. Patterns are useful because they are easier to change than single purchases: a rule like “taxi only after midnight” beats willpower.' },
  benchmark: { title: 'Comparing fairly', body: 'National averages are per consumption unit, so a household’s size matters. Use the comparison as a mirror, not a target: the right amount depends on your income and goals.' },
};

const catLabel = (keys?: string[]) => (keys?.length ? keys.map((k) => CATEGORIES[k]?.label.toLowerCase() ?? k).join(' and ') : 'everything');

export function answerOffline(c: Customer, question: string): CoachAnswer {
  const { intent, filter, pct, concept } = classify(question);
  const p = parsePeriod(question, c.today);
  const calls: CoachAnswer['toolCalls'] = [];
  const base = { intent, provider: 'offline' as const, toolCalls: calls };

  switch (intent) {
    case 'spend': {
      const f = { ...filter, period: p ?? 'last_month' };
      calls.push({ name: 'spend_query', args: f });
      const s = A.spend(c, f);
      const what = filter.slipsOnly ? 'coffee and small café visits' : catLabel(filter.category);
      if (!s.count)
        return { ...base, text: `You didn’t spend anything on ${what} ${s.period.inLabel}. Nothing to fix here.`, receipts: [s.receipt], followups: ['Where does my money go?', 'What is safe to spend this week?'] };
      const yearly = A.spend(c, { ...f, period: 'last_12_months' });
      const top = A.breakdown(c, 'merchant', f).slice(0, 3);
      const b = s.txs[0]?.basket;
      const basketLine = b ? ` This sits in your ${A.basketName[b].toLowerCase()} basket.` : '';
      return {
        ...base,
        text: `You spent ${eur(s.total)} on ${what} ${s.period.inLabel}, across ${s.count} payment${s.count > 1 ? 's' : ''} (about ${eur(s.average)} each).${basketLine} Over the last 12 months that’s ${eur(yearly.total)}.`,
        receipts: [s.receipt, yearly.receipt],
        visual: { kind: 'bars', title: 'Where it went', rows: top.map((m) => ({ label: m.label, value: m.total, ids: m.ids })) },
        lesson: b === 'everyday' && !filter.category?.includes('groceries') ? LESSONS.slips : undefined,
        followups: [`How much could I save if I cut ${what} by 20%?`, 'What kind of spender am I?'],
      };
    }
    case 'breakdown': case 'top_merchants': {
      const f = { ...filter, period: p ?? 'last_month' };
      calls.push({ name: 'breakdown', args: { by: intent === 'top_merchants' ? 'merchant' : 'category', ...f } });
      const rows = A.breakdown(c, intent === 'top_merchants' ? 'merchant' : 'category', f);
      const total = rows.reduce((a, r) => a + r.total, 0);
      const top = rows.slice(0, 5);
      const share = total ? Math.round((top[0]?.total / total) * 100) : 0;
      const bs = A.baskets(c, f.period);
      return {
        ...base,
        text: `${cap(A.period(c, f.period).inLabel)} you spent ${eur(total)}. The biggest slice was ${top[0]?.label.toLowerCase()} at ${eur(top[0]?.total ?? 0)} (${share}%), then ${top[1]?.label.toLowerCase()} and ${top[2]?.label.toLowerCase()}.`,
        receipts: [A.receipt('Total spending', total, 'EUR', `${rows.reduce((a, r) => a + r.count, 0)} payments`, rows.flatMap((r) => r.ids)), ...bs.rows.map((r) => r.receipt)],
        visual: { kind: 'bars', title: intent === 'top_merchants' ? 'Top places' : 'Top categories', rows: top.map((r) => ({ label: r.label, value: r.total, ids: r.ids })) },
        lesson: LESSONS.baskets,
        followups: ['What is safe to spend this week?', 'What were my surprise costs?'],
      };
    }
    case 'baskets': {
      calls.push({ name: 'baskets', args: { period: p ?? 'last_3_months' } });
      const b = A.baskets(c, p ?? 'last_3_months');
      const [fx, su, ev] = b.rows;
      return {
        ...base,
        text: `Over ${b.period.label}, ${Math.round(fx.share * 100)}% went to fixed bills (${eur(fx.perMonth)}/month), ${Math.round(su.share * 100)}% to surprises and ${Math.round(ev.share * 100)}% to everyday spending (${eur(ev.perMonth)}/month). ${b.slips.count} of those everyday payments were small taps under €20, worth ${eur(b.slips.total)}.`,
        receipts: [...b.rows.map((r) => r.receipt), b.slips.receipt],
        visual: { kind: 'baskets', title: 'Your three baskets, per month', rows: b.rows.map((r) => ({ label: r.name, value: r.perMonth, tone: r.basket, ids: r.receipt.txIds })) },
        lesson: LESSONS.baskets,
        followups: ['What were my surprise costs?', 'What is safe to spend this week?'],
      };
    }
    case 'safe_to_spend': {
      calls.push({ name: 'safe_to_spend', args: {} });
      const s = A.safeToSpend(c);
      const text = s.week <= 0
        ? `This week is tight: your everyday budget until payday is already used up. Payday is in ${s.horizonDays} days. Sticking to needs until then keeps next month clean.`
        : `You can spend about ${eur(s.week)} this week, or ${eur(s.perDay)} a day, and still cover your bills, a buffer for surprises and your savings. Payday is in ${s.horizonDays} days.${s.cappedByCash ? ' Your balance after upcoming bills is the limit this time.' : ''}`;
      return {
        ...base, text, receipts: s.receipts,
        visual: { kind: 'waterfall', title: 'How we got there', rows: s.steps.map((x) => ({ label: x.label, value: x.amount, display: x.note })) },
        lesson: LESSONS.safe,
        followups: ['What were my surprise costs?', 'How much could I save if I cut eating out by 20%?'],
      };
    }
    case 'what_if': {
      const f = { ...filter, category: filter.category ?? ['restaurants_cafes', 'food_delivery'], period: 'last_3_months' };
      const cut = pct ?? 20;
      calls.push({ name: 'what_if', args: { ...f, cut_percent: cut } });
      const w = A.whatIf(c, f, cut);
      const what = filter.slipsOnly ? 'coffee' : catLabel(f.category);
      if (w.perMonth < 1) return { ...base, text: `You barely spend on ${what}, so cutting it won’t move the needle. Your biggest everyday category is a better place to look.`, receipts: w.receipts, followups: ['Where does my money go?'] };
      return {
        ...base,
        text: `You spend about ${eur(w.perMonth)} a month on ${what}. Cutting that by ${cut}% frees ${eur(w.monthlySaving)} a month, which is ${eur(w.yearSaving)} a year. Saved at a cautious 3%, it would grow to about ${eur(w.fiveYears)} in five years.`,
        receipts: w.receipts,
        visual: { kind: 'growth', title: `Saving ${eur(w.monthlySaving)} a month`, rows: [1, 2, 3, 4, 5].map((y) => ({ label: `Year ${y}`, value: Math.round(w.monthlySaving * ((Math.pow(1 + 0.0025, 12 * y) - 1) / 0.0025)) })) },
        lesson: LESSONS.compound,
        followups: ['What is safe to spend this week?', 'What is pay yourself first?'],
      };
    }
    case 'spender_type': {
      calls.push({ name: 'spender_profile', args: {} });
      const sp = A.spenderProfile(c);
      const t = sp.traits;
      return {
        ...base,
        text: `${sp.type.emoji} ${sp.type.name}. ${sp.type.line} Based on your last 3 months: ${t[0].display} small taps a week, ${t[1].display} of everyday spending on Fri–Sun, and ${t[5].display} moved to savings.`,
        receipts: t.filter((x) => x.ids.length).map((x) => A.receipt(x.label, x.value, x.key === 'weekend' || x.key === 'saving' ? '%' : x.key === 'slips' ? 'count' : 'EUR', x.note, x.ids)),
        visual: { kind: 'traits', title: 'Your patterns', rows: t.map((x) => ({ label: x.label, value: x.value, display: x.display })) },
        lesson: LESSONS.profile,
        followups: ['How much could I save if I cut taxis by 50%?', 'Which subscriptions do I have?'],
      };
    }
    case 'surprise': {
      calls.push({ name: 'surprise_costs', args: {} });
      const f = A.surpriseFund(c);
      const big = A.breakdown(c, 'category', { basket: 'surprise' }).slice(0, 3).map((r) => `${r.label.toLowerCase()} ${eur(r.total)}`).join(', ');
      return {
        ...base,
        text: f.yearTotal
          ? `Surprise costs came to ${eur(f.yearTotal)} over the last 12 months${big ? `, mostly ${big}` : ''}. Spread out, that’s ${eur(f.perMonth)} a month. Setting that aside each payday means the next one won’t hurt.`
          : 'You had no surprise costs in the last 12 months. Lucky! A small buffer is still wise.',
        receipts: [f.receipt],
        visual: { kind: 'bars', title: 'Surprises by type', rows: A.breakdown(c, 'category', { basket: 'surprise' }).slice(0, 5).map((r) => ({ label: r.label, value: r.total, ids: r.ids, tone: 'surprise' })) },
        lesson: LESSONS.emergency,
        followups: ['What is safe to spend this week?', 'What is an emergency fund?'],
      };
    }
    case 'subscriptions': case 'upcoming': {
      calls.push({ name: 'recurring_bills', args: {} });
      const subs = intent === 'subscriptions' ? c.series.filter((s) => !s.essential) : A.upcomingBills(c, A.period(c, 'this_month').to > c.today ? A.period(c, 'this_month').to : addMonth(c.today)).map((u) => ({ ...c.series.find((s) => s.id === u.seriesId)!, next: u.date }));
      const total = subs.reduce((a, s) => a + s.typicalAmount, 0);
      if (!subs.length) return { ...base, text: intent === 'subscriptions' ? 'I don’t see any optional subscriptions renewing. Nice and lean.' : 'No regular bills are due in the next month.', receipts: [], followups: ['What is safe to spend this week?'] };
      return {
        ...base,
        text: intent === 'subscriptions'
          ? `You have ${subs.length} optional subscription${subs.length > 1 ? 's' : ''}: ${subs.map((s) => `${s.label} (${eur(s.typicalAmount, 2)})`).join(', ')}. Together that’s ${eur(total, 2)} a month, or ${eur(total * 12)} a year. Is each one still worth it?`
          : `Coming up in the next month: ${subs.slice(0, 5).map((s) => `${s.label} ${eur(s.typicalAmount)} on ${fmtDate(s.next)}`).join(', ')}. That’s ${eur(total)} in total, already set aside in your safe-to-spend.`,
        receipts: [A.receipt(intent === 'subscriptions' ? 'Subscriptions per month' : 'Bills coming up', total, 'EUR', subs.map((s) => `${s.label} ${eur(s.typicalAmount, 2)}`).join(' + '), subs.flatMap((s) => s.txIds))],
        visual: { kind: 'bars', title: intent === 'subscriptions' ? 'Per month' : 'Due soon', rows: subs.map((s) => ({ label: s.label, value: s.typicalAmount, display: intent === 'upcoming' ? fmtDate(s.next) : undefined, ids: s.txIds, tone: 'fixed' })) },
        lesson: intent === 'subscriptions' ? LESSONS.slips : LESSONS.baskets,
        followups: ['How much could I save if I stopped subscriptions?', 'What is safe to spend this week?'],
      };
    }
    case 'benchmark': {
      calls.push({ name: 'benchmark', args: {} });
      const b = A.benchmark(c);
      const diff = Math.round((b.vsFinland - 1) * 100);
      return {
        ...base,
        text: `You spend about ${eur(b.perMonth)} a month. The average Finn spends about ${eur(A.BENCH.perConsumptionUnitMonth)} per person-equivalent (Statistics Finland, 2022), so you’re ${Math.abs(diff)}% ${diff >= 0 ? 'above' : 'below'} that. Groceries are ${Math.round(b.foodShare * 100)}% of your spending; nationally it’s 12–18%.`,
        receipts: b.receipts,
        visual: { kind: 'bars', title: 'Per month', rows: [{ label: 'You', value: b.perMonth, tone: 'everyday' }, { label: 'Average Finn', value: Math.round(A.BENCH.perConsumptionUnitMonth), tone: 'fixed' }] },
        lesson: LESSONS.benchmark,
        followups: ['Where does my money go?', 'What kind of spender am I?'],
      };
    }
    case 'income': {
      calls.push({ name: 'income', args: { period: p ?? 'last_3_months' } });
      const i = A.income(c, p ?? 'last_3_months');
      return { ...base, text: `Money in over ${i.period.label}: ${eur(i.total)}, about ${eur(i.perMonth)} a month. Next payday looks like ${fmtDate(A.nextPayday(c) ?? c.today)}.`, receipts: [A.receipt('Income', i.total, 'EUR', `${i.txs.length} incoming payments`, i.txs.map((t) => t.i))], followups: ['What is safe to spend this week?'] };
    }
    case 'savings': {
      calls.push({ name: 'savings', args: {} });
      const s = A.savings(c, 'last_12_months');
      const inc = A.income(c, 'last_12_months');
      const rate = inc.total ? Math.round((s.total / inc.total) * 100) : 0;
      return { ...base, text: s.total > 0 ? `You moved ${eur(s.total)} to savings in the last 12 months, about ${eur(s.perMonth)} a month or ${rate}% of your income. Automating it on payday makes it effortless.` : 'I don’t see regular transfers to savings yet. Even €20 on payday builds the habit.', receipts: [A.receipt('Saved in 12 months', s.total, 'EUR', `${s.txs.length} transfers`, s.txs.map((t) => t.i))], lesson: LESSONS.payyourself, followups: ['How much could I save if I cut eating out by 20%?'] };
    }
    case 'explain': {
      const l = LESSONS[concept === 'baskets' ? 'baskets' : concept ?? 'budget'] ?? LESSONS.budget;
      const personal = personalExample(c, concept ?? '');
      return { ...base, text: `${l.body}${personal.text ? ' ' + personal.text : ''}`, receipts: personal.receipts, lesson: { title: CONCEPTS[concept ?? 'budget']?.title ?? l.title, body: '' }, followups: ['What is safe to spend this week?', 'What kind of spender am I?'] };
    }
    case 'advice':
      return { ...base, text: 'I can’t pick investments or loans for you: that needs a licensed adviser who knows your whole situation, and S-Bank’s advisers can help. What I can do is show what you could set aside each month without touching your bills.', receipts: [], followups: ['What is safe to spend this week?', 'What is compound growth?'] };
    case 'help':
      return { ...base, text: 'Hi! Ask me anything about your own money, like “How much did I spend on taxis last month?”, “What is safe to spend this week?” or “What kind of spender am I?”.', receipts: [], followups: ['What is safe to spend this week?', 'Where does my money go?', 'What kind of spender am I?'] };
    default:
      return { ...base, text: 'I’m not sure I got that. I can answer questions about your spending, bills, savings and what-ifs, using your own transactions.', receipts: [], followups: ['Where does my money go?', 'What is safe to spend this week?', 'How much could I save if I cut eating out by 20%?'] };
  }
}

function personalExample(c: Customer, concept: string): { text: string; receipts: Receipt[] } {
  if (concept === 'emergency' || concept === 'baskets') {
    const f = A.surpriseFund(c);
    return { text: `For you, surprises cost ${eur(f.yearTotal)} last year, so about ${eur(f.perMonth)} a month is a good buffer to build.`, receipts: [f.receipt] };
  }
  if (concept === 'compound' || concept === 'payyourself') {
    const w = A.whatIf(c, { slipsOnly: true }, 30);
    return { text: `Your example: trimming small taps by 30% saves ${eur(w.monthlySaving)} a month, about ${eur(w.fiveYears)} after five years at 3%.`, receipts: w.receipts };
  }
  if (concept === 'budget') {
    const s = A.safeToSpend(c);
    return { text: `Right now that’s ${eur(s.week)} for this week.`, receipts: s.receipts.slice(-1) };
  }
  return { text: '', receipts: [] };
}

const cap = (x: string) => x[0].toUpperCase() + x.slice(1);
const fmtDate = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const addMonth = (d: string) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCMonth(x.getUTCMonth() + 1); return x.toISOString().slice(0, 10); };
export { merchantName };

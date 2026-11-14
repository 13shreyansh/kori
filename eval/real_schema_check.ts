// Sanity check: a hand-built customer in the REAL S-Pankki schema (capitalised categories, MRC ids,
// blank merchants on bill payments) goes through the engine with sensible baskets and income/savings.
import { buildCustomer } from '../app/src/engine/model';
import * as A from '../app/src/engine/analytics';
const columns = ['date', 'time', 'amount', 'balance', 'category', 'type', 'merchant', 'mcc', 'account'];
const tx: unknown[][] = [];
let bal = 1500;
const push = (date: string, amount: number, category: string, type: string, merchant = '', mcc = '') => { bal += amount; tx.push([date, '09:00:00', amount, Math.round(bal * 100) / 100, category, type, merchant, mcc, 'ACC000001']); };
for (let m = 1; m <= 9; m++) {
  const mm = String(m).padStart(2, '0');
  push(`2026-${mm}-01`, 2650, 'Salary', 'salary');
  push(`2026-${mm}-02`, -850, 'Housing', 'housing_payment');
  push(`2026-${mm}-05`, -62.4 - m, 'Utilities', 'utilities_payment');
  push(`2026-${mm}-18`, -24.9, 'Utilities', 'utilities_payment');
  push(`2026-${mm}-03`, -150, 'Salary Sweep', 'salary_sweep');
  push(`2026-${mm}-04`, -50, 'Invest Deposit', 'investment_deposit');
  for (let d = 6; d <= 27; d += 3) {
    const dd = String(d).padStart(2, '0');
    push(`2026-${mm}-${dd}`, -48.2, 'Groceries', 'purchase', 'MRC-GRO-0035', '5411');
    push(`2026-${mm}-${dd}`, -6.5, 'Restaurants', 'purchase', 'MRC-RES-0102', '5814');
  }
  push(`2026-${mm}-15`, -23, 'Transportation', 'purchase', 'MRC-TRA-0007', '4121');
  if (m % 4 === 0) push(`2026-${mm}-20`, -180, 'Health', 'purchase', 'MRC-HEA-0011', '8021');
}
const c = buildCustomer({ id: 'TEST', columns, tx } as any);
const cats = new Map<string, string>();
for (const t of c.tx) cats.set(`${t.category}|${t.mcc}`, `${t.cat.key} kind=${t.cat.kind} basket=${t.basket} merchant=${t.merchant}`);
console.log([...cats].map(([k, v]) => k.padEnd(28) + v).join('\n'));
console.log('baskets', JSON.stringify(A.baskets(c, 'last_3_months')).slice(0, 300));
console.log('income', A.income(c).perMonth, 'savings', A.savings(c).total);
console.log('bills', A.upcomingBills(c, '2026-10-31').map((b: any) => b.label ?? b.name));
console.log('safe', A.safeToSpend(c).left);
console.log('top merchants', A.breakdown(c, 'merchant').slice(0, 4).map((r) => r.label));
console.log('series', c.series.map((s) => `${s.label} every ${s.cadenceDays}d €${s.typicalAmount} next ${s.next}`));

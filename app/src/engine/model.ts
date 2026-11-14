import { categoryInfo, type Basket, type CatInfo } from './taxonomy';

export interface RawCustomer {
  id: string;
  age: number;
  postal_code: string;
  has_mortgage_application?: boolean;
  columns: string[];
  tx: (string | number | null)[][];
}

export interface Tx {
  i: number; // index, used as a receipt id
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  amount: number; // negative = money out
  balance: number | null;
  category: string;
  type: string;
  merchant: string;
  mcc: string;
  account: string;
  cat: CatInfo;
  basket: Basket | null; // null for income / transfers / savings
  recurring: string | null; // recurring series id
  slip: boolean; // small, frequent, discretionary
}

export interface Series {
  id: string;
  merchant: string;
  category: string;
  label: string;
  cadenceDays: number; // ~30 monthly, ~91 quarterly
  typicalAmount: number; // positive EUR
  occurrences: number;
  last: string;
  next: string;
  essential: boolean;
  txIds: number[];
}

export interface Customer {
  id: string;
  age: number;
  postalCode: string;
  mortgage: boolean;
  tx: Tx[];
  today: string; // last date in data, the app's "now"
  series: Series[];
}

export const SLIP_MAX_EUR = 20; // a "slip" is a discretionary purchase under this amount

export function merchantName(id: string): string {
  return id
    .replace(/^M_/, '')
    .split('_')
    .map((w) => (w.length <= 3 && w !== 'OY' ? w : w[0] + w.slice(1).toLowerCase()))
    .join(' ')
    .replace(/\bOy\b/i, 'Oy');
}

const DAY = 86400000;
export const toDate = (s: string) => new Date(s + 'T12:00:00Z');
export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (s: string, n: number) => iso(new Date(toDate(s).getTime() + n * DAY));
export const daysBetween = (a: string, b: string) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY);
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0;
};

export interface ModelConfig {
  slipMax: number;
  recurringMinCount: number;
  recurringMaxCv: number; // amount variation allowed for a recurring bill
}
export const DEFAULT_CONFIG: ModelConfig = { slipMax: SLIP_MAX_EUR, recurringMinCount: 3, recurringMaxCv: 0.35 };

export function buildCustomer(raw: RawCustomer, cfg: ModelConfig = DEFAULT_CONFIG): Customer {
  const col = Object.fromEntries(raw.columns.map((c, i) => [c, i]));
  const tx: Tx[] = raw.tx.map((r, i) => {
    const amount = Number(r[col.amount]);
    const category = String(r[col.category] ?? '');
    const mcc = String(r[col.mcc] ?? '');
    const cat = categoryInfo(category, mcc, amount);
    const isSpend = amount < 0 && cat.kind === 'spend';
    return {
      i,
      date: String(r[col.date]),
      time: String(r[col.time] ?? ''),
      amount,
      balance: r[col.balance] == null ? null : Number(r[col.balance]),
      category,
      type: String(r[col.type] ?? ''),
      merchant: String(r[col.merchant] ?? ''),
      mcc,
      account: String(r[col.account] ?? ''),
      cat,
      basket: isSpend ? cat.basket : null,
      recurring: null,
      slip: false,
    };
  });
  const today = tx.length ? tx[tx.length - 1].date : iso(new Date());
  const series = detectRecurring(tx, today, cfg);
  for (const t of tx) {
    if (t.basket === null) continue;
    if (t.recurring) t.basket = 'fixed';
    else if (t.basket === 'fixed') t.basket = t.cat.essential ? 'fixed' : 'everyday'; // a one-off "subscription" is not regular
    t.slip = t.basket === 'everyday' && !t.cat.essential && -t.amount < cfg.slipMax;
  }
  return { id: raw.id, age: raw.age, postalCode: raw.postal_code, mortgage: !!raw.has_mortgage_application, tx, today, series };
}

/** Recurring bills: same merchant, regular gap, similar amount. */
export function detectRecurring(tx: Tx[], today: string, cfg: ModelConfig): Series[] {
  const groups = new Map<string, Tx[]>();
  for (const t of tx) {
    if (!(t.amount < 0 && t.cat.kind === 'spend')) continue;
    const k = t.merchant || t.category;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(t);
  }
  const out: Series[] = [];
  for (const [merchant, ts] of groups) {
    if (ts.length < cfg.recurringMinCount) continue;
    const months = new Set(ts.map((t) => t.date.slice(0, 7)));
    // a recurring bill shows up about once per period, not many times a month (that's a shop)
    if (ts.length > months.size * 1.3) continue;
    const gaps = ts.slice(1).map((t, i) => daysBetween(ts[i].date, t.date));
    const g = median(gaps);
    const cadence = g >= 25 && g <= 35 ? 30 : g >= 80 && g <= 100 ? 91 : g >= 6 && g <= 8 ? 7 : 0;
    if (!cadence) continue;
    // regular means regular: gaps must cluster tightly around the cadence (shops visited by chance don't)
    const gapDev = median(gaps.map((x) => Math.abs(x - g)));
    if (gapDev > (cadence === 7 ? 1 : cadence === 30 ? 3 : 7)) continue;
    // irregular-category merchants (dentist, car repair) are never 'bills', and shopping needs a near-fixed price
    if (ts[0].cat.basket === 'surprise') continue;
    const amts = ts.map((t) => -t.amount);
    const mean = amts.reduce((a, b) => a + b, 0) / amts.length;
    const sd = Math.sqrt(amts.reduce((a, b) => a + (b - mean) ** 2, 0) / amts.length);
    if (mean <= 0 || sd / mean > (ts[0].cat.basket === 'fixed' ? cfg.recurringMaxCv : 0.05)) continue;
    const last = ts[ts.length - 1].date;
    if (daysBetween(last, today) > cadence * 1.8) continue; // stopped
    const id = 'S:' + merchant;
    for (const t of ts) t.recurring = id;
    let next = addDays(last, cadence === 30 ? 0 : cadence);
    if (cadence === 30) {
      const d = toDate(last);
      d.setUTCMonth(d.getUTCMonth() + 1);
      next = iso(d);
    }
    out.push({
      id,
      merchant,
      category: ts[0].category,
      label: merchantName(merchant),
      cadenceDays: cadence,
      typicalAmount: Math.round(median(amts) * 100) / 100,
      occurrences: ts.length,
      last,
      next,
      essential: ts[0].cat.essential,
      txIds: ts.map((t) => t.i),
    });
  }
  return out.sort((a, b) => b.typicalAmount - a.typicalAmount);
}

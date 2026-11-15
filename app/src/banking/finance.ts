import {
  buildCustomer,
  addDays,
  daysBetween,
  toDate,
  type RawCustomer,
  type Tx,
} from "../engine/model";
import { r2 } from "../engine/analytics";
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Helsinki",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
let clockSecond = NaN,
  clockDate = "";
export function getToday() {
  const now = Date.now(),
    second = Math.floor(now / 1000);
  if (second !== clockSecond) {
    clockDate = dateFormatter.format(new Date(now));
    clockSecond = second;
  }
  return clockDate;
}
// Original design example is a reference for relative story intervals, never the app clock.
export const refDate = (date: string, today = getToday()) =>
  addDays(date, daysBetween("2026-11-14", today));
export const periodLabel = () =>
  refDate("2026-10-01").endsWith("-01")
    ? dateLabel(refDate("2026-10-01"), { month: "long" })
    : dateLabel(refDate("2026-10-01")) +
      " to " +
      dateLabel(refDate("2026-10-31"));
export type Layout = "Play" | "Plan" | "Month";
export type Preset = "Compact" | "Regular" | "Roomy" | "Large";
export interface Invoice {
  date: string;
  amount: number;
  merchant: string;
  category: string;
  approved: boolean;
}
export interface Profile extends RawCustomer {
  name: string;
  since: number;
  account: string;
  suffix: string;
  savings: string;
  goals: [string, number][];
  openingBalances: Record<string, number>;
  invoices: Invoice[];
  anchorDate?: string;
  referenceDates?: string[];
  transactionIds?: number[];
}
export interface AccountData {
  profile: Profile;
  tx: Tx[];
}
export interface Proof {
  title: string;
  value: number;
  unit?: string;
  shownAs?: string;
  rule: string;
  tx: Tx[];
  steps?: [string, string][];
}
export interface Upcoming extends Invoice {
  tx: Tx[];
}
export const money = (v: number, dp = 0) =>
  (v < 0 ? "−" : "") +
  "€" +
  Math.abs(v).toLocaleString("en-GB", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
export const dateLabel = (
  d: string,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" },
) => toDate(d).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });
export const sum = (xs: Tx[]) => r2(xs.reduce((a, t) => a - t.amount, 0));
export const isSGroup = (t: Tx) =>
  /^(Prisma|S-market|S-Market|Alepa|Sale|ABC|Sokos)/i.test(t.merchant);
export const isSavings = (t: Tx) =>
  t.type === "investment_deposit" &&
  t.amount < 0 &&
  t.account.endsWith("-current");
export const isIncome = (t: Tx) =>
  t.amount > 0 && ["salary", "other_income"].includes(t.type);
export const isCard = (t: Tx) => t.type === "purchase" && t.amount < 0;
export function adapt(profile: Profile): AccountData {
  const sourceDelta = daysBetween(
    "2026-11-14",
    profile.anchorDate ?? "2026-11-14",
  );
  const dow = toDate(getToday()).getUTCDay(),
    lastSaturday = addDays(getToday(), -((dow + 1) % 7 || 7));
  const saturdayDelta = daysBetween("2026-11-07", lastSaturday);
  const rows = profile.tx
    .map((row, index) => {
      const copy = [...row];
      const source =
        profile.referenceDates?.[index] ??
        addDays(String(row[0]), -sourceDelta);
      const hour = Number(String(row[1]).slice(0, 2));
      const night =
        ["5813", "5812", "4121"].includes(String(row[7])) &&
        toDate(source).getUTCDay() === 6 &&
        hour >= 18;
      copy[0] = night ? addDays(source, saturdayDelta) : refDate(source);
      return { row: copy, id: profile.transactionIds?.[index] ?? index };
    })
    .sort(
      (a, b) =>
        String(a.row[0]).localeCompare(String(b.row[0])) ||
        String(a.row[1]).localeCompare(String(b.row[1])) ||
        String(a.row[8]).localeCompare(String(b.row[8])),
    );
  const balances = { ...profile.openingBalances };
  for (const entry of rows) {
    const account = String(entry.row[8]);
    balances[account] = r2((balances[account] ?? 0) + Number(entry.row[2]));
    entry.row[3] = balances[account];
  }
  const shifted = {
    ...profile,
    anchorDate: getToday(),
    tx: rows.map((x) => x.row),
    invoices: profile.invoices.map((i) => ({
      ...i,
      date: addDays(
        i.date,
        daysBetween(profile.anchorDate ?? "2026-11-14", getToday()),
      ),
    })),
  };
  const c = buildCustomer(shifted);
  c.tx.forEach((t, index) => (t.i = rows[index].id));
  return { profile: shifted, tx: c.tx };
}
export const payments = (
  d: AccountData,
  from = refDate("2026-10-01"),
  to = refDate("2026-10-31"),
  pred: (t: Tx) => boolean = () => true,
) =>
  d.tx.filter((t) => t.date >= from && t.date <= to && t.amount < 0 && pred(t));
export const currentBalance = (d: AccountData, which = "current") =>
  d.tx.filter((t) => t.account === d.profile.id + "-" + which).at(-1)
    ?.balance ??
  d.profile.openingBalances[d.profile.id + "-" + which] ??
  0;
export const proof = (
  title: string,
  tx: Tx[],
  value = sum(tx),
  rule = "Sum of the payments below.",
  steps?: [string, string][],
  unit?: string,
): Proof => ({ title, tx, value, rule, steps, unit });
export const cafe = (t: Tx) => t.mcc === "5814";
export const wolt = (t: Tx) => t.merchant === "Wolt";
export const grocery = (t: Tx) => t.mcc === "5411";
export const subscriptions = (t: Tx) =>
  /^(Spotify|Netflix|iCloud|HBO Max)$/.test(t.merchant);
export function recurring(d: AccountData) {
  const groups = new Map<string, Tx[]>();
  for (const t of d.tx)
    if (
      t.date >= refDate("2025-11-15") &&
      t.amount < 0 &&
      t.type !== "purchase" &&
      !isSavings(t)
    )
      groups.set(t.merchant, [...(groups.get(t.merchant) || []), t]);
  return [...groups.values()]
    .filter(
      (ts) =>
        new Set(
          ts.map((t) =>
            addDays(t.date, -daysBetween("2026-11-14", getToday())).slice(0, 7),
          ),
        ).size >= 3,
    )
    .map((ts) => ({
      merchant: ts[0].merchant,
      tx: ts,
      amount: ts.at(-1)!.amount,
      day: Number(ts.at(-1)!.date.slice(-2)),
      category: ts[0].category,
    }));
}
export function upcoming(d: AccountData): Upcoming[] {
  const rows: Upcoming[] = [];
  const advanceMonth = (date: string) => {
    const x = toDate(date),
      day = x.getUTCDate();
    x.setUTCDate(1);
    x.setUTCMonth(x.getUTCMonth() + 1);
    const last = new Date(
      Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0),
    ).getUTCDate();
    x.setUTCDate(Math.min(day, last));
    return x.toISOString().slice(0, 10);
  };
  const addSeries = (merchant: string, ts: Tx[], category: string) => {
    const last = ts.at(-1)!;
    const sourceLast = addDays(
      last.date,
      -daysBetween("2026-11-14", getToday()),
    );
    let sourceNext = advanceMonth(sourceLast);
    while (sourceNext <= "2026-11-14") sourceNext = advanceMonth(sourceNext);
    const next = refDate(sourceNext);
    if (next <= addDays(getToday(), 28))
      rows.push({
        date: next,
        amount: last.amount,
        merchant,
        category,
        approved: true,
        tx: ts,
      });
  };
  for (const series of recurring(d))
    addSeries(series.merchant, series.tx, series.category);
  const income = new Map<string, Tx[]>();
  for (const t of d.tx.filter(isIncome))
    income.set(t.merchant, [...(income.get(t.merchant) ?? []), t]);
  for (const [merchant, ts] of income)
    if (
      new Set(
        ts.map((t) =>
          addDays(t.date, -daysBetween("2026-11-14", getToday())).slice(0, 7),
        ),
      ).size >= 3
    )
      addSeries(merchant, ts, ts[0].category);
  for (const i of d.profile.invoices)
    if (i.date > getToday() && i.date <= addDays(getToday(), 28))
      rows.push({ ...i, tx: [] });
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}
export function everyday(d: AccountData) {
  const tx = payments(
    d,
    addDays(getToday(), -89),
    getToday(),
    (t) => isCard(t) && ["5411", "5541", "5912"].includes(t.mcc),
  );
  return proof(
    "Everyday spending per day",
    tx,
    r2(sum(tx) / 90),
    "Groceries, fuel, pharmacy and small essential purchases over 90 days ÷ 90.",
    [
      ["Everyday purchases", money(sum(tx), 2)],
      ["Days", "90"],
      ["Per day", money(sum(tx) / 90, 2)],
    ],
  );
}
export function projection(d: AccountData, moved = 0) {
  const daily = everyday(d).value;
  const known = upcoming(d);
  return Array.from({ length: 29 }, (_, n) => {
    const date = addDays(getToday(), n);
    return {
      date,
      value: r2(
        currentBalance(d) +
          moved +
          known
            .filter((k) => k.date <= date)
            .reduce((a, k) => a + k.amount, 0) -
          n * daily,
      ),
    };
  });
}
export function shortfall(d: AccountData, moved = 0) {
  return projection(d, moved).reduce((a, b) => (b.value < a.value ? b : a));
}
export function forecastProof(d: AccountData, moved = 0): Proof {
  const low = shortfall(d, moved),
    n = daysBetween(getToday(), low.date),
    items = upcoming(d).filter((x) => x.date <= low.date);
  return proof(
    "Balance on " + dateLabel(low.date),
    items.flatMap((x) => x.tx),
    low.value,
    "Current balance + known payments − everyday spending after today.",
    [
      ["In your account today", money(currentBalance(d) + moved, 2)],
      ...items.map(
        (x) =>
          [x.merchant + ", " + dateLabel(x.date), money(x.amount, 2)] as [
            string,
            string,
          ],
      ),
      [n + " days of everyday spending", money(-n * everyday(d).value, 2)],
      ["Balance ahead", money(low.value, 2)],
    ],
  );
}
export function salaryStreak(d: AccountData) {
  const groups = new Map<string, Tx[]>();
  for (const t of d.tx.filter((t) => t.type === "salary"))
    groups.set(t.merchant, [...(groups.get(t.merchant) || []), t]);
  let best: Tx[] = [];
  for (const ts of groups.values()) {
    let streak: Tx[] = [];
    for (const t of ts) {
      const prev = streak.at(-1);
      const prevMonth = prev
        ? Number(
            addDays(prev.date, -daysBetween("2026-11-14", getToday())).slice(
              0,
              4,
            ),
          ) *
            12 +
          Number(
            addDays(prev.date, -daysBetween("2026-11-14", getToday())).slice(
              5,
              7,
            ),
          )
        : 0;
      const month =
        Number(
          addDays(t.date, -daysBetween("2026-11-14", getToday())).slice(0, 4),
        ) *
          12 +
        Number(
          addDays(t.date, -daysBetween("2026-11-14", getToday())).slice(5, 7),
        );
      if (
        prev &&
        (month - prevMonth !== 1 || Math.abs(t.amount / prev.amount - 1) > 0.1)
      )
        streak = [];
      streak.push(t);
    }
    if (streak.length > best.length) best = streak;
  }
  return best.length && daysBetween(best.at(-1)!.date, getToday()) <= 45
    ? best
    : [];
}
export function signals(d: AccountData) {
  const tx = d.tx.filter((t) => t.date >= refDate("2025-11-15"));
  const inc = tx.filter(
    (t) =>
      t.date >= refDate("2026-05-01") &&
      t.date < refDate("2026-11-01") &&
      isIncome(t),
  );
  const saved = tx.filter(
    (t) =>
      t.date >= refDate("2026-05-01") &&
      t.date < refDate("2026-11-01") &&
      isSavings(t),
  );
  const bills = recurring(d).filter((s) => !s.tx.some(subscriptions));
  const children = bills.filter((s) =>
    /school|juniors|club|daycare/i.test(s.merchant),
  );
  const cards = tx.filter(isCard);
  const small = cards.filter((t) => -t.amount < 10);
  const streak = salaryStreak(d);
  return {
    band:
      d.profile.age < 25
        ? "18–24"
        : d.profile.age < 40
          ? "25–39"
          : d.profile.age < 65
            ? "40–64"
            : "65+",
    steady: streak.length >= 6,
    streak,
    inc,
    saved,
    savingRate: sum(saved) / (inc.reduce((a, t) => a + t.amount, 0) || 1),
    bills,
    children,
    household: children.length >= 2,
    smallShare: small.length / (cards.length || 1),
    cards,
    small,
    goal: d.profile.goals.length > 0 || currentBalance(d, "savings") > 0,
    shortfall: shortfall(d).value < 0,
    forwarded: tx.some((t) => t.category === "Salary Sweep"),
  };
}
export interface Block {
  id: string;
  name: string;
  size: "lead" | "full" | "row";
}
const names: Record<string, string> = {
  "account-line": "Account line",
  guess: "Guess game",
  "what-if": "What-if",
  "payday-runway": "Payday runway",
  "where-it-went": "Where it went",
  "plan-timeline": "Plan timeline",
  "loan-readiness": "Home loan readiness",
  "month-calendar": "Month calendar",
  "shortfall-fix": "Shortfall fix",
  "balance-ahead": "Balance ahead",
  "coming-up": "Coming up",
  bonus: "Grocery progress",
  "why-link": "Why link",
};
export function assignHome(d: AccountData, override?: Layout) {
  const s = signals(d);
  const chosen: Layout =
    s.household || s.bills.length >= 6
      ? "Month"
      : s.steady && s.savingRate >= 0.1 && s.goal
        ? "Plan"
        : d.profile.age < 25 || s.smallShare >= 0.5
          ? "Play"
          : "Month";
  const layout = override ?? chosen;
  const preset: Preset =
    d.profile.age < 25
      ? "Roomy"
      : d.profile.age < 40
        ? "Regular"
        : d.profile.age < 65
          ? "Compact"
          : "Large";
  const tone: "casual" | "plain" | "brisk" | "calm" =
    d.profile.age < 25
      ? "casual"
      : d.profile.age < 40
        ? "plain"
        : d.profile.age < 65
          ? "brisk"
          : "calm";
  const categoryCount = Math.max(
    ...["5411", "5814", "5812"].map(
      (m) => payments(d, undefined, undefined, (t) => t.mcc === m).length,
    ),
  );
  let ids =
    layout === "Play"
      ? ["account-line", "guess", "baskets", "what-if"]
      : layout === "Plan"
        ? [
            "account-line",
            "plan-timeline",
            "loan-readiness",
            "where-it-went",
            "guess",
            "bonus",
          ]
        : [
            "account-line",
            "month-calendar",
            "balance-ahead",
            "baskets",
            "coming-up",
            "bonus",
            "guess",
          ];
  ids = ids
    .filter((id) => id !== "guess" || categoryCount >= 10)
    .filter(
      (id) =>
        id !== "what-if" ||
        (s.goal && sum(payments(d, undefined, undefined, wolt)) > 100),
    )
    .filter(
      (id) =>
        id !== "loan-readiness" ||
        d.profile.goals.some((g) => g[0] === "Own home") ||
        /ASP/.test(d.profile.savings),
    )
    .filter((id) => id !== "coming-up" || s.bills.length >= 3)
    .filter(
      (id) =>
        id !== "bonus" ||
        sum(payments(d, refDate("2026-11-01"), getToday(), isSGroup)) > 50,
    );
  if (s.shortfall && layout !== "Month") ids.splice(1, 0, "shortfall-fix");
  ids.push("why-link");
  const lead =
    layout === "Play"
      ? "guess"
      : layout === "Plan"
        ? "plan-timeline"
        : "month-calendar";
  return {
    layout,
    chosen,
    preset,
    tone,
    signals: s,
    blocks: ids.map(
      (id) =>
        ({
          id,
          name: names[id],
          size:
            id === lead
              ? "lead"
              : id === "guess" || (id === "bonus" && layout === "Plan")
                ? "row"
                : "full",
        }) as Block,
    ),
  };
}
export function baseline(d: AccountData) {
  const ts = payments(
    d,
    refDate("2026-05-01"),
    refDate("2026-10-31"),
    isSavings,
  );
  return proof(
    "Monthly saving pace",
    ts,
    r2(sum(ts) / 6),
    "Transfers to own savings, May to October ÷ 6.",
    [
      ["Six monthly transfers", money(sum(ts), 2)],
      ["Months", "6"],
      ["Monthly pace", money(sum(ts) / 6, 2)],
    ],
  );
}
export function goalDates(d: AccountData, monthly: number) {
  let cumulative = 0;
  return d.profile.goals.map(([name, target]) => {
    const asp = name === "Own home" ? currentBalance(d, "savings") : 0;
    cumulative += Math.max(0, target - asp);
    const months = monthly > 0 ? Math.ceil(cumulative / monthly) : Infinity;
    const now = toDate(getToday());
    const date = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() + months,
        now.getUTCDate(),
        12,
      ),
    );
    return {
      name,
      target,
      need: target - asp,
      cumulative,
      months,
      date: Number.isFinite(months) ? date.toISOString().slice(0, 10) : "",
      label: Number.isFinite(months)
        ? date.toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          })
        : "Not funded",
    };
  });
}
export function saturday(d: AccountData) {
  const dow = toDate(getToday()).getUTCDay(),
    last = addDays(getToday(), -((dow + 1) % 7 || 7));
  const start = addDays(last, -11 * 7);
  const nights = Array.from({ length: 12 }, (_, i) => addDays(start, i * 7));
  const tx = payments(d, start, addDays(last, 1), (t) => {
    const dow = toDate(t.date).getUTCDay(),
      hour = Number(t.time.slice(0, 2));
    return (
      isCard(t) &&
      ["5813", "5812", "4121"].includes(t.mcc) &&
      ((dow === 6 && hour >= 18) || (dow === 0 && hour < 5))
    );
  });
  const total = sum(tx),
    monthly = ((total / 12) * 52) / 12;
  return {
    tx,
    total,
    monthly,
    chip: Math.round(monthly / 2 / 10) * 10,
    nights: nights.map((date) => ({
      date,
      tx: tx.filter((t) => t.date === date || t.date === addDays(date, 1)),
    })),
  };
}
export function woltStats(d: AccountData) {
  const ts = payments(d, refDate("2026-09-19"), refDate("2026-11-13"), wolt);
  return {
    tx: ts,
    count: ts.length,
    weekly: ts.length / 8,
    average: ts.length ? sum(ts) / ts.length : 0,
  };
}
export function runway(d: AccountData) {
  const payday =
    upcoming(d).find((x) => x.amount > 0)?.date ?? addDays(getToday(), 30);
  const bills = upcoming(d).filter((x) => x.date < payday && x.amount < 0);
  const free = r2(currentBalance(d) + bills.reduce((a, b) => a + b.amount, 0));
  const days = daysBetween(getToday(), payday);
  return {
    payday,
    bills,
    free,
    days,
    proof: proof(
      "Free to spend per day",
      bills.flatMap((x) => x.tx),
      free / days,
      "Balance minus known bills before payday, divided by days until payday.",
      [
        ["In your account today", money(currentBalance(d), 2)],
        ...bills.map(
          (x) => [x.merchant, money(x.amount, 2)] as [string, string],
        ),
        ["Free until payday", money(free, 2)],
        ["Days", String(days)],
        ["Per day", money(free / days, 2)],
      ],
    ),
  };
}

export { addDays, daysBetween, r2 };

export function savingsStreak(d: AccountData) {
  const months = [
    ...new Set(
      d.tx
        .filter(isSavings)
        .map((t) =>
          addDays(t.date, -daysBetween("2026-11-14", getToday())).slice(0, 7),
        ),
    ),
  ].sort();
  let count = 0,
    prior = 0;
  for (const ym of months) {
    const serial = Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5));
    count = prior && serial === prior + 1 ? count + 1 : 1;
    prior = serial;
  }
  return count;
}
export function nextMonthStart() {
  const now = toDate(getToday());
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 12))
    .toISOString()
    .slice(0, 10);
}
export function nextMonday() {
  let date = addDays(getToday(), 1);
  while (toDate(date).getUTCDay() !== 1) date = addDays(date, 1);
  return date;
}

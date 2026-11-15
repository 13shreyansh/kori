import { useState, useEffect, useRef } from "react";
import {
  Plane,
  Car,
  House,
  Check,
  TriangleAlert,
  ChevronRight,
  ArrowUp,
  Undo2,
} from "lucide-react";
import * as F from "./finance";
import { Module, ProofNumber, Slider, PaymentRows } from "./components";

export interface Session {
  layout?: F.Layout;
  preset?: F.Preset;
  round?: number;
  guesses?: Record<number, number>;
  fewer?: number;
  autoWolt?: boolean;
  monthly?: number;
  planSaved?: number;
  chips?: string[];
  moved?: number;
  approved?: boolean;
  pinned?: { question: string; route: import("./router").Route };
  labels?: Record<number, string>;
  guessDone?: boolean;
  customGoals?: [string, number][];
}
export interface BlockProps {
  d: F.AccountData;
  s: Session;
  patch: (v: Partial<Session>) => void;
  open: (p: F.Proof) => void;
  modal: (title: string, body: React.ReactNode) => void;
  why: () => void;
  bank: () => void;
}
const reduce = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export function useTween() {
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  return (
    from: number,
    to: number,
    ms: number,
    step: (v: number) => void,
    done?: () => void,
  ) => {
    cancelAnimationFrame(frame.current);
    const start = performance.now();
    function tick(now: number) {
      const t = reduce() ? 1 : Math.min(1, (now - start) / ms);
      step(from + (to - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame.current = requestAnimationFrame(tick);
      else done?.();
    }
    frame.current = requestAnimationFrame(tick);
  };
}
function useAmount(target: number, ms: number) {
  const [value, setValue] = useState(target);
  const live = useRef(target);
  useEffect(() => {
    let frame = 0;
    const from = live.current,
      start = performance.now();
    function tick(now: number) {
      const t = reduce() ? 1 : Math.min(1, (now - start) / ms);
      const n = from + (target - from) * (1 - Math.pow(1 - t, 3));
      live.current = n;
      setValue(n);
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, ms]);
  return value;
}
export function AccountLine({ d, s, bank, open }: BlockProps) {
  const movedDisplay = useAmount(s.moved ?? 0, 600);
  const r = F.runway(d);
  const usual = F.everyday(d);
  const name = d.profile.name.split(" ")[0];
  const hour = new Date().getHours();
  const greet =
    d.profile.age < 25
      ? `Hi ${name}. ${r.days} days to payday.`
      : d.profile.age < 40
        ? `Good ${hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"}, ${name}.`
        : `${name} · ${F.dateLabel(F.getToday(), { weekday: "long", day: "numeric", month: "long" })}`;
  return (
    <Module id="account-line" className="account-line">
      <p className="greeting">{greet}</p>
      <button className="account-hero" onClick={bank}>
        <span className="account-name">
          {d.profile.account} · FI·· {d.profile.suffix}
        </span>
        <span className="account-balance">
          {F.money(F.currentBalance(d) + movedDisplay, 2)}
        </span>
      </button>
      <div className="safe-line">
        <span>Safe to spend</span>
        <b>
          <ProofNumber p={r.proof} open={open} /> a day
        </b>
        <small>
          until payday,{" "}
          {F.dateLabel(r.payday, { weekday: "short", day: "numeric", month: "short" })}
          {usual.value > r.proof.value + 1 && (
            <>
              . You usually spend <ProofNumber p={usual} open={open} /> a day
            </>
          )}
        </small>
      </div>
      {d.profile.age >= 25 && (
        <button className="account-row" onClick={bank}>
          <span>{d.profile.savings}</span>
          <b>{F.money(F.currentBalance(d, "savings") - movedDisplay, 2)}</b>
        </button>
      )}
    </Module>
  );
}
export function Guess(p: BlockProps & { row?: boolean }) {
  const { d, s, patch, open, row } = p;
  const [expanded, setExpanded] = useState(!row);
  const round = s.round ?? 0;
  const [guess, setGuess] = useState(0);
  const [landing, setLanding] = useState(false);
  const [live, setLive] = useState(0);
  const tween = useTween();
  const pred =
    d.profile.age < 25
      ? [F.cafe, F.wolt, F.subscriptions][Math.min(round, 2)]
      : d.profile.age < 40
        ? (t: F.Proof["tx"][number]) => t.merchant === "Sodexo"
        : F.grocery;
  const category =
    d.profile.age < 25
      ? ["cafés", "food delivery", "subscriptions"][Math.min(round, 2)]
      : d.profile.age < 40
        ? "lunches out"
        : "groceries";
  const tx = F.payments(d, undefined, undefined, pred),
    actual = F.sum(tx),
    max = d.profile.age < 25 ? [200, 400, 100][Math.min(round, 2)] : 600;
  const previous = s.guesses?.[round];
  const locked = previous !== undefined;
  const used = locked ? previous : guess;
  const diff = Math.round(actual) - used;
  const title =
    category[0].toUpperCase() + category.slice(1) + ", " + F.periodLabel();
  const pr = F.proof(
    title,
    tx,
    actual,
    `${tx.length} payments, ${F.periodLabel()}. Change a label to correct the count.`,
  );
  if (row && !expanded)
    return (
      <Module id="guess" className="quick-row">
        <button className="action-row" onClick={() => setExpanded(true)}>
          <span>
            Guess: {category}, {F.periodLabel()}
          </span>
          <ChevronRight />
        </button>
      </Module>
    );
  if ((round >= 3 || s.guessDone) && d.profile.age < 25)
    return (
      <Module className="game" id="guess">
        <h2>
          {Object.keys(s.guesses ?? {}).length === 3
            ? "Three guesses in."
            : `${Object.keys(s.guesses ?? {}).length} guess saved.`}
        </h2>
        <p>
          You were closest on{" "}
          {
            ["cafés", "food delivery", "subscriptions"][
              Object.entries(s.guesses ?? {}).reduce(
                (a, [k, v]) => {
                  const totals = [
                    F.sum(F.payments(d, undefined, undefined, F.cafe)),
                    F.sum(F.payments(d, undefined, undefined, F.wolt)),
                    F.sum(F.payments(d, undefined, undefined, F.subscriptions)),
                  ];
                  return Math.abs(v - totals[Number(k)]) < a[1]
                    ? [Number(k), Math.abs(v - totals[Number(k)])]
                    : a;
                },
                [0, Infinity],
              )[0]
            ]
          }
          .
        </p>
        {[F.cafe, F.wolt, F.subscriptions].map((f, i) => {
          if (s.guesses?.[i] === undefined) return null;
          const ts = F.payments(d, undefined, undefined, f);
          return (
            <div className="row" key={i}>
              <span>{["Cafés", "Food delivery", "Subscriptions"][i]}</span>
              <span>
                You {F.money(s.guesses?.[i] ?? 0)} · Real{" "}
                <ProofNumber p={F.proof("October payments", ts)} open={open} />
              </span>
            </div>
          );
        })}
        <button
          className="text-button"
          disabled={Object.keys(s.guesses ?? {}).length === 3}
          onClick={() =>
            patch({
              guessDone: false,
              round: Object.keys(s.guesses ?? {}).length,
            })
          }
        >
          {Object.keys(s.guesses ?? {}).length === 3
            ? "Play again next month"
            : "Continue guessing"}
        </button>
        <small>
          New guesses on{" "}
          {F.dateLabel(F.nextMonthStart(), { day: "numeric", month: "long" })}.
        </small>
      </Module>
    );
  return (
    <Module id="guess" className={row ? "game-row" : "game"}>
      <h1>
        {locked && !landing ? (
          <>
            <ProofNumber p={pr} open={open} />.{" "}
            {Math.abs(diff) <= actual * 0.1
              ? `You guessed ${F.money(used)}. Your gut was right, and the data agrees.`
              : `That's ${F.money(Math.abs(diff))} ${diff > 0 ? "more than it felt like" : "less than you feared"}.`}
          </>
        ) : (
          <>
            What did you spend on {category} from {F.periodLabel()}?
          </>
        )}
      </h1>
      {!locked || landing ? (
        <>
          <div className="guess-live">
            {F.money(landing ? Math.round(live) : guess)}
          </div>
          <p className="small secondary">Drag to guess. No peeking.</p>
        </>
      ) : null}
      {!locked ? (
        <>
          <Slider
            label="Your spending guess"
            value={guess}
            min={0}
            max={max}
            step={5}
            onChange={setGuess}
          />
          <div className="row micro secondary">
            <span>{F.money(0)}</span>
            <span>{F.money(max)}</span>
          </div>
          <button
            className="primary full"
            disabled={!guess}
            onClick={() => {
              setLanding(true);
              setLive(guess);
              patch({ guesses: { ...s.guesses, [round]: guess } });
              if (reduce()) {
                setLive(actual);
                setLanding(false);
              } else
                setTimeout(
                  () =>
                    tween(guess, actual, 900, setLive, () =>
                      setTimeout(() => setLanding(false), 150),
                    ),
                  200,
                );
            }}
          >
            {guess ? `Lock in ${F.money(guess)}` : "Make a guess"}
          </button>
        </>
      ) : (
        <>
          <div className="guess-result-track">
            <div
              className="gap-band"
              style={{
                left: `${(Math.min(used, actual) / max) * 100}%`,
                width: `${(Math.abs(actual - used) / max) * 100}%`,
              }}
            />
            <span
              className="guess-ring"
              style={{ left: `${(used / max) * 100}%` }}
            />
            <span
              className="actual-dot"
              style={{ left: `${((landing ? live : actual) / max) * 100}%` }}
            />
            <span
              className="guess-label"
              style={{ left: `${(used / max) * 100}%` }}
            >
              You: {F.money(used)}
            </span>
            <span
              className="actual-label"
              style={{ left: `${(actual / max) * 100}%` }}
            >
              Real: {F.money(actual)}
            </span>
            <b
              className="difference"
              style={{ left: `${((actual + used) / 2 / max) * 100}%` }}
            >
              {diff >= 0 ? "+" : "−"}
              {F.money(Math.abs(diff))}
            </b>
          </div>
          {!landing && (
            <div className="guess-reveal">
              {category === "cafés" ? (
                <p className="secondary">
                  <ProofNumber
                    p={F.proof(
                      "Café payments under €6",
                      tx.filter((t) => -t.amount < 6),
                      tx.filter((t) => -t.amount < 6).length,
                      "Count of café payments under €6.",
                      undefined,
                      "count",
                    )}
                    open={open}
                  >
                    {String(tx.filter((t) => -t.amount < 6).length)}
                  </ProofNumber>{" "}
                  of your{" "}
                  <ProofNumber
                    p={F.proof(
                      "Café payment count",
                      tx,
                      tx.length,
                      "Count of café payments in October.",
                      undefined,
                      "count",
                    )}
                    open={open}
                  >
                    {String(tx.length)}
                  </ProofNumber>{" "}
                  café payments were under €6. Small ones are the ones memory
                  drops.
                </p>
              ) : (
                <p className="secondary">
                  The payments show what memory can miss.
                </p>
              )}
              <PaymentRows tx={tx} limit={5} />
              <button className="text-button" onClick={() => open(pr)}>
                See all {tx.length} payments
              </button>
              <div className="button-pair">
                {d.profile.age < 25 && (
                  <button
                    className="primary"
                    onClick={() => {
                      patch({ round: round + 1 });
                      setGuess(0);
                    }}
                  >
                    Next guess:{" "}
                    {round === 0
                      ? "food delivery"
                      : round === 1
                        ? "subscriptions"
                        : "results"}
                  </button>
                )}
                <button
                  className="quiet"
                  onClick={() =>
                    row ? setExpanded(false) : patch({ guessDone: true })
                  }
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Module>
  );
}
export function WhatIf({ d, s, patch, open }: BlockProps) {
  const w = F.woltStats(d),
    n = s.fewer ?? 0,
    weekly = Math.round(n * w.average),
    goal =
      d.profile.goals.find((g) => g[0] === "Interrail") ?? d.profile.goals[0];
  if (!goal) return null;
  const pot = F.currentBalance(d, "savings"),
    weeks = weekly ? Math.ceil((goal[1] - pot) / weekly) : 0,
    date = F.addDays(F.getToday(), weeks * 7),
    position =
      (F.daysBetween(F.getToday(), date) /
        F.daysBetween(F.getToday(), F.refDate("2028-01-31"))) *
      100;
  const weeklyProof = F.proof(
    "Fewer Wolt orders per week",
    w.tx,
    weekly,
    "Fewer orders × average order cost, rounded to whole euros.",
    [
      ["Payments over 8 weeks", F.money(F.sum(w.tx), 2)],
      ["Orders", String(w.count)],
      ["Average order", F.money(w.average, 2)],
      ["Fewer orders", String(n)],
      ["Weekly saving", F.money(weekly, 2)],
    ],
  );
  return (
    <Module id="what-if" title="What if you ordered Wolt a bit less?">
      <p className="small secondary">
        You order about{" "}
        <ProofNumber
          p={F.proof(
            "Wolt orders a week",
            w.tx,
            w.weekly,
            "Order count over 8 full weeks ÷ 8.",
            undefined,
            "orders/week",
          )}
          open={open}
        >
          {String(w.weekly)}
        </ProofNumber>{" "}
        times a week,{" "}
        <ProofNumber
          p={F.proof(
            "Average Wolt order",
            w.tx,
            w.average,
            "Total Wolt spend over 8 weeks ÷ number of orders.",
          )}
          open={open}
        >
          {F.money(w.average, 2)}
        </ProofNumber>{" "}
        a time.
      </p>
      <div className="row">
        <label htmlFor="wolt">Fewer orders a week</label>
        <b>{n}</b>
      </div>
      <Slider
        label="Fewer orders a week"
        value={n}
        min={0}
        max={3}
        onChange={(v) => patch({ fewer: v, autoWolt: false })}
        ticks
      />
      <div className="date-track">
        <span className="date-line" />
        {n > 0 && (
          <span
            className="date-funded"
            style={{ width: `${Math.min(100, position)}%` }}
          />
        )}
        {n > 0 && (
          <span
            className="date-dot"
            style={{ left: `${Math.min(100, position)}%` }}
          />
        )}
        <span className="today-label">Today</span>
        <span className="june-label">
          <Plane size={18} />
          June 2027
        </span>
      </div>
      <p>
        {!n ? (
          <>
            Your {goal[0]} pot has{" "}
            <ProofNumber
              p={F.proof(
                "Interrail balance",
                d.tx.filter((t) => t.account.endsWith("-savings")),
                pot,
                "Latest savings account balance, including its opening balance.",
              )}
              open={open}
            />{" "}
            of {F.money(goal[1])}. At this pace it stays there.
          </>
        ) : (
          <>
            {n} fewer a week is <ProofNumber p={weeklyProof} open={open} /> a
            week. The pot is full on{" "}
            <ProofNumber
              p={F.proof(
                "Pot full date",
                w.tx,
                weeks,
                "Weeks = ceil((target − pot) ÷ weekly saving). Date = today + weeks × 7.",
                [
                  ["Target", F.money(goal[1], 2)],
                  ["In the pot", F.money(pot, 2)],
                  ["Weekly saving", F.money(weekly, 2)],
                  ["Weeks", String(weeks)],
                  [
                    "Pot full",
                    F.dateLabel(date, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }),
                  ],
                ],
                "weeks",
              )}
              open={open}
            >
              {F.dateLabel(date, {
                day: "numeric",
                month: "long",
                ...(date > "2027-06-01" ? { year: "numeric" } : {}),
              })}
            </ProofNumber>
            .{" "}
            {n === 1
              ? "Too late for June."
              : n === 2
                ? "Interrail in June works."
                : "With spring to spare."}
          </>
        )}
      </p>
      {n > 0 &&
        (s.autoWolt ? (
          <div className="confirmation">
            <Check />
            <span>
              Every Monday, {F.money(weekly)} goes to Interrail. First one on 16
              Nov.
              <button
                className="text-button"
                onClick={() => patch({ autoWolt: false })}
              >
                Undo
              </button>
            </span>
          </div>
        ) : (
          <button
            className="primary full"
            onClick={() => patch({ autoWolt: true })}
          >
            Move {F.money(weekly)} every Monday
          </button>
        ))}
    </Module>
  );
}
export function Payday({ d, open }: BlockProps) {
  const r = F.runway(d);
  return (
    <Module
      id="payday-runway"
      title={
        <>
          <ProofNumber p={r.proof} open={open} /> a day until payday
        </>
      }
    >
      <p className="small secondary">
        <ProofNumber
          p={{ ...r.proof, title: "Free until payday", value: r.free }}
          open={open}
        >
          {F.money(r.free, 2)}
        </ProofNumber>{" "}
        is free until{" "}
        {F.dateLabel(r.payday, {
          weekday: "short",
          day: "numeric",
          month: "short",
        })}
        , after your known bills.
      </p>
      <div className="runway-days">
        {Array.from({ length: Math.min(31, r.days) }, (_, i) => (
          <span key={i}>
            {r.bills.some((b) => b.date === F.addDays(F.getToday(), i + 1)) && (
              <i />
            )}
          </span>
        ))}
      </div>
    </Module>
  );
}
export function Timeline(p: BlockProps & { initial?: number }) {
  const { d, s, patch, open, initial } = p;
  const base = F.baseline(d),
    original = base.value || 400,
    saved = s.planSaved ?? original;
  const minimum = Math.min(400, saved);
  const [answerMonthly, setAnswerMonthly] = useState(initial);
  const monthly =
    initial !== undefined ? (answerMonthly ?? initial) : (s.monthly ?? saved);
  const goals = F.goalDates(d, monthly),
    baselines = F.goalDates(d, saved),
    home = goals.at(-1),
    baselineHome = baselines.at(-1);
  const sat = F.saturday(d),
    lunches = F.payments(
      d,
      F.refDate("2026-08-22"),
      F.refDate("2026-11-13"),
      (t) => t.merchant === "Sodexo",
    ),
    lunchAverage = lunches.length ? F.sum(lunches) / lunches.length : 0,
    lunchChip = Math.round((2 * lunchAverage * 52) / 12 / 10) * 10;
  const tween = useTween();
  const [answerChips, setAnswerChips] = useState<string[]>([]);
  const chips = initial !== undefined ? answerChips : (s.chips ?? []);
  if (!home)
    return (
      <Module title="Plan your next goal">
        <p>Choose what you want to save for.</p>
        <GoalForm
          onSave={(name, target) => patch({ customGoals: [[name, target]] })}
        />
      </Module>
    );
  const diff = (baselineHome?.months ?? 0) - home.months;
  let lastLabel = -100;
  function setMonth(v: number) {
    if (initial !== undefined) {
      setAnswerMonthly(v);
      setAnswerChips([]);
    }
    patch({ monthly: Math.round(v), chips: [] });
  }
  function chip(name: string) {
    const next = chips.includes(name)
      ? chips.filter((x) => x !== name)
      : [...chips, name];
    const value =
      saved +
      (next.includes("saturday") ? sat.chip : 0) +
      (next.includes("lunch") ? lunchChip : 0);
    if (initial !== undefined) setAnswerChips(next);
    patch({ chips: next });
    tween(monthly, value, 700, (v) => {
      if (initial !== undefined) setAnswerMonthly(Math.round(v));
      patch({ monthly: Math.round(v), chips: next });
    });
  }
  const satProof = F.proof(
    "Saturday nights out, last 12 weeks",
    sat.tx,
    sat.chip,
    "Half the Saturday-night monthly equivalent, rounded to the nearest €10.",
    [
      [F.money(sat.total, 2) + " over 12 Saturdays", ""],
      ["A Saturday", F.money(sat.total / 12, 2)],
      ["A month", F.money(sat.monthly, 2)],
      ["Half of that", F.money(sat.monthly / 2, 2)],
      ["Rounded saving", F.money(sat.chip, 2)],
    ],
  );
  return (
    <Module id="plan-timeline" className="timeline-module">
      <h1 data-testid="home-date">
        {home.name} in {home.label}.
      </h1>
      <p className={`small ${monthly !== saved ? "positive" : "secondary"}`}>
        {chips.includes("saturday") ? (
          <>
            Halving Saturday nights out frees about{" "}
            <ProofNumber p={satProof} open={open} /> a month. Your own home
            arrives {diff === 12 ? "a year" : Math.abs(diff) + " months"}{" "}
            earlier.
          </>
        ) : monthly === saved ? (
          <>
            At{" "}
            <ProofNumber
              p={
                s.planSaved
                  ? {
                      ...base,
                      value: saved,
                      rule: "Your saved monthly transfer instruction.",
                    }
                  : base
              }
              open={open}
            />{" "}
            a month, the pace of your last 6 months.
          </>
        ) : (
          <>
            {Math.abs(diff)} {Math.abs(diff) === 1 ? "month" : "months"} {diff >= 0 ? "sooner" : "later"} than at{" "}
            {F.money(saved)}.
          </>
        )}
      </p>
      <div className="saving-control">
        <div className="row">
          <span>I put aside each month</span>
          <b>{F.money(monthly)}</b>
        </div>
        <div className="baseline-slider">
          <Slider
            label="Monthly saving"
            min={minimum}
            max={1200}
            step={10}
            value={monthly}
            onChange={setMonth}
          />
          <i
            style={{ left: `${((saved - minimum) / (1200 - minimum)) * 100}%` }}
          />
        </div>
        <div className="chips">
          <button
            className={`chip ${chips.includes("saturday") ? "selected" : ""}`}
            onClick={() => chip("saturday")}
          >
            {chips.includes("saturday") && <Check size={16} />}Halve Saturday
            nights out · +{F.money(sat.chip)}
          </button>
          <button
            className={`chip ${chips.includes("lunch") ? "selected" : ""}`}
            onClick={() => chip("lunch")}
          >
            {chips.includes("lunch") && <Check size={16} />}Two fewer lunches
            out a week · +{F.money(lunchChip)}
          </button>
        </div>
      </div>
      <div className="timeline-rail">
        <span className="rail-line" />
        <span
          className="funded-line"
          style={{ height: `${home.months * 4.8}px` }}
        />
        <span className="rail-today">Today</span>
        <i className="today-dot" />
        {[2027, 2028, 2029, 2030, 2031, 2032].map((year, i) => (
          <span
            className="year"
            key={year}
            style={{ top: 16 + (2 + i * 12) * 4.8 }}
          >
            {year}
          </span>
        ))}
        {goals.map((g, i) => {
          const y = 16 + g.months * 4.8,
            labelY = Math.max(y - 16, lastLabel + 52);
          lastLabel = labelY;
          const Icon = i === 0 ? Plane : i === 1 ? Car : House;
          return (
            <div key={g.name}>
              {monthly !== saved && (
                <>
                  <i
                    className="ghost-marker"
                    style={{ top: 16 + baselines[i].months * 4.8 }}
                  />
                  <span
                    className="ghost-line"
                    style={{
                      top: Math.min(y, 16 + baselines[i].months * 4.8),
                      height: Math.abs(g.months - baselines[i].months) * 4.8,
                    }}
                  />
                </>
              )}
              <span
                className={`goal-marker ${i === goals.length - 1 ? "home-marker" : ""}`}
                style={{ top: y - 16 }}
              >
                <Icon size={18} />
              </span>
              <button
                className="goal-label"
                style={{ top: labelY }}
                onClick={() =>
                  open(
                    F.proof(
                      g.name,
                      d.tx.filter(F.isSavings),
                      g.target,
                      "Goals fill one after another; ASP balance counts only toward Own home.",
                      [
                        ["Goal target", F.money(g.target, 2)],
                        ["Need after existing savings", F.money(g.need, 2)],
                        ["Cumulative need", F.money(g.cumulative, 2)],
                        ["Monthly saving", F.money(monthly, 2)],
                        ["Months", String(g.months)],
                        ["Reached", g.label],
                      ],
                    ),
                  )
                }
              >
                <b>{g.name}</b>
                <small>
                  {g.label} · {F.money(g.target)}
                </small>
              </button>
            </div>
          );
        })}
      </div>
      {monthly !== saved ? (
        <button
          className="primary full"
          onClick={() => patch({ planSaved: monthly, chips: [] })}
        >
          Save {F.money(monthly)} a month from{" "}
          {F.dateLabel(F.nextMonthStart(), { month: "long" })}
        </button>
      ) : s.planSaved ? (
        <div className="confirmation">
          <Check />
          <span>
            From{" "}
            {F.dateLabel(F.nextMonthStart(), { day: "numeric", month: "long" })}
            , {F.money(monthly)} moves to savings on each payday. Your plan now
            shows {home.label}.
            <button
              className="text-button"
              onClick={() => patch({ planSaved: undefined, monthly: original })}
            >
              Undo
            </button>
          </span>
        </div>
      ) : null}
    </Module>
  );
}
function GoalForm({
  onSave,
}: {
  onSave: (name: string, target: number) => void;
}) {
  const [name, setName] = useState(""),
    [amount, setAmount] = useState(0);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(name, amount);
      }}
    >
      <label>
        Goal name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>
      <label>
        Target amount
        <input
          type="number"
          min="1"
          value={amount || ""}
          onChange={(e) => setAmount(Number(e.target.value))}
          required
        />
      </label>
      <button className="primary full" disabled={!name || amount <= 0}>
        Create goal
      </button>
    </form>
  );
}
export function Loan({ d, open, modal }: BlockProps) {
  const streak = F.salaryStreak(d),
    saving = d.tx.filter(F.isSavings),
    months = F.savingsStreak(d),
    pot = F.currentBalance(d, "savings"),
    goal = d.profile.goals.find((g) => g[0] === "Own home")?.[1] ?? 0;
  const ready = streak.length >= 6 && months >= 6;
  return (
    <Module
      id="loan-readiness"
      title={
        ready
          ? "You're ready to talk about a home loan"
          : "Getting ready for a home loan talk"
      }
    >
      <div className="check-row">
        <Check className={streak.length < 6 ? "failed-check" : ""} />
        <span>
          Steady salary for{" "}
          <ProofNumber
            p={F.proof(
              "Steady salary",
              streak,
              streak.length,
              "Consecutive calendar months from the same employer; amounts within 10%.",
              undefined,
              "months",
            )}
            open={open}
          >
            {streak.length} months
          </ProofNumber>
        </span>
      </div>
      <div className="check-row">
        <Check className={months < 6 ? "failed-check" : ""} />
        <span>
          Saved every month for{" "}
          <ProofNumber
            p={F.proof(
              "Monthly savings",
              saving,
              months,
              "Distinct months with a transfer to own savings.",
              undefined,
              "months",
            )}
            open={open}
          >
            {months} months
          </ProofNumber>
        </span>
      </div>
      <div className="check-row">
        <Check />
        <span>
          <ProofNumber
            p={F.proof(
              "ASP account balance",
              d.tx.filter((t) => t.account.endsWith("-savings")),
              pot,
              "Opening ASP balance plus deposits.",
            )}
            open={open}
          />{" "}
          of the {F.money(goal)} you need is already in your ASP account
        </span>
      </div>
      <p className="small secondary">
        A loan talk now tells you what price range fits you, before the deposit
        is finished. It commits you to nothing.
      </p>
      {ready && (
        <button
          className="primary full"
          onClick={() => {
            const dates: string[] = [];
            let date = F.getToday();
            while (dates.length < 3) {
              date = F.addDays(date, 1);
              if (![0, 6].includes(new Date(date + "T12:00Z").getUTCDay()))
                dates.push(date);
            }
            modal(
              "Home loan talk with S-Bank",
              <>
                <p className="secondary">
                  In this test build no booking is sent.
                </p>
                {dates.map((date) => (
                  <button
                    className="action-row"
                    key={date}
                    onClick={() =>
                      modal(
                        "Your selected time",
                        <p>
                          {F.dateLabel(date, {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                          , 16.30. We'd confirm this by message in S-mobiili.
                        </p>,
                      )
                    }
                  >
                    {F.dateLabel(date, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                    , 16.30
                    <ChevronRight />
                  </button>
                ))}
              </>,
            );
          }}
        >
          Book a home loan talk
        </button>
      )}
      <button
        className="text-button"
        onClick={() =>
          modal(
            "What the bank looks at",
            <>
              <p>
                Salary from the same employer for at least six consecutive
                months, with amounts within ten percent.
              </p>
              <p>Transfers to savings in at least six months.</p>
              <p>
                Your deposit is compared with your own home goal. This is
                preparation for a conversation, not a credit decision.
              </p>
            </>,
          )
        }
      >
        What the bank looks at
      </button>
    </Module>
  );
}
export function Where({ d, open }: BlockProps) {
  if (F.assignHome(d).layout === "Plan") {
    const s = F.saturday(d);
    const biggest = [...s.nights].sort((a, b) => F.sum(b.tx) - F.sum(a.tx))[0];
    return (
      <Module
        id="where-it-went"
        title={
          <>
            Saturday nights cost you about{" "}
            <ProofNumber
              p={F.proof(
                "Saturday nights per month",
                s.tx,
                s.monthly,
                "Total over 12 Saturdays ÷ 12 × 52 ÷ 12.",
              )}
              open={open}
            >
              {F.money(Math.round(s.monthly / 10) * 10)}
            </ProofNumber>{" "}
            a month
          </>
        }
      >
        <div className="saturday-bars">
          {s.nights.map((n) => (
            <button
              key={n.date}
              aria-label={"Saturday " + F.dateLabel(n.date)}
              onClick={() =>
                open(F.proof("Saturday " + F.dateLabel(n.date), n.tx))
              }
            >
              <i
                style={{
                  height: Math.max(2, (F.sum(n.tx) / F.sum(biggest.tx)) * 64),
                }}
              />
              <small>
                {F.dateLabel(n.date, {
                  day: "numeric",
                  month: "numeric",
                }).replace("/", ".")}
              </small>
            </button>
          ))}
        </div>
        <p className="small secondary">
          The biggest was{" "}
          {F.dateLabel(biggest.date, { day: "numeric", month: "long" })}:{" "}
          <ProofNumber
            p={F.proof("Biggest Saturday night", biggest.tx)}
            open={open}
          />
          .
        </p>
      </Module>
    );
  }
  const categories = [
    ["Food delivery", F.wolt],
    ["Groceries", F.grocery],
    ["Cafés", F.cafe],
  ] as const;
  const largest = Math.max(
    ...categories.map(([, fn]) =>
      F.sum(F.payments(d, undefined, undefined, fn)),
    ),
  );
  return (
    <Module id="where-it-went" title={F.periodLabel() + " in three lines"}>
      {categories.map(([name, fn]) => {
        const tx = F.payments(d, undefined, undefined, fn);
        return (
          <div className="category-row" key={name}>
            <span>
              {name}
              <span
                className="category-bar"
                style={{ width: (F.sum(tx) / (largest || 1)) * 100 + "%" }}
              />
            </span>
            <ProofNumber
              p={F.proof(name + ", " + F.periodLabel(), tx)}
              open={open}
            />
          </div>
        );
      })}
    </Module>
  );
}
export function Shortfall({ d, s, patch, open, modal }: BlockProps) {
  const low = F.shortfall(d),
    moved = s.moved ?? 0,
    gap = Math.max(0, -low.value),
    [loading, setLoading] = useState(false);
  if (!gap)
    return (
      <div className="nothing-short">
        Nothing falls short in the next four weeks.
      </div>
    );
  const transfer = (amount: number) => {
    setLoading(true);
    setTimeout(() => {
      patch({ moved: F.r2(moved + amount) });
      setLoading(false);
    }, 600);
  };
  return (
    <div
      className={`shortfall-band ${moved >= gap ? "covered" : ""}`}
      data-testid="shortfall-band"
    >
      {moved >= gap ? (
        <>
          <div className="confirmation">
            <Check />
            <b>Moved. The {Number(low.date.slice(-2))}th is covered.</b>
          </div>
          <p className="small">
            {F.money(moved)} from {d.profile.savings} to your{" "}
            {d.profile.account}, just now.
          </p>
          <button className="text-button" onClick={() => patch({ moved: 0 })}>
            <Undo2 size={16} />
            Undo
          </button>
        </>
      ) : (
        <>
          <div className="confirmation">
            <TriangleAlert />
            <b>
              On {F.dateLabel(low.date, { weekday: "short", day: "numeric" })}th
              you'll be{" "}
              <ProofNumber
                p={{
                  ...F.forecastProof(d, moved),
                  title: "Shortfall to cover",
                  value: gap - moved,
                }}
                open={open}
              >
                {F.money(gap - moved)}
              </ProofNumber>{" "}
              short.
            </b>
          </div>
          <p className="small">
            Car insurance goes out the day before your salary comes in.
          </p>
          <button
            className="primary full"
            disabled={loading}
            onClick={() => transfer(gap - moved)}
          >
            {loading && <span className="spinner" />}Move {F.money(gap - moved)}{" "}
            from {d.profile.savings}
          </button>
          <button
            className="text-button"
            onClick={() =>
              modal(
                "Choose amount",
                <ChooseTransfer
                  max={F.currentBalance(d, "savings") - moved}
                  initial={gap - moved}
                  onMove={transfer}
                />,
              )
            }
          >
            Choose amount
          </button>
        </>
      )}
    </div>
  );
}
function ChooseTransfer({
  max,
  initial,
  onMove,
}: {
  max: number;
  initial: number;
  onMove: (v: number) => void;
}) {
  const [amount, setAmount] = useState(initial);
  return (
    <>
      <label>
        Amount
        <input
          aria-label="Transfer amount"
          type="number"
          value={amount}
          min={0}
          max={max}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </label>
      <Slider
        label="Amount from savings"
        min={0}
        max={max}
        value={amount}
        onChange={setAmount}
      />
      <button
        className="primary full"
        disabled={amount <= 0 || amount > max}
        onClick={() => onMove(amount)}
      >
        Move {F.money(amount)}
      </button>
      <p className="small secondary">
        Close this sheet to see your updated month.
      </p>
    </>
  );
}
export function Calendar(p: BlockProps) {
  const { d, s } = p;
  const low = F.shortfall(d, s.moved ?? 0);
  const items = F.upcoming(d);
  const [selected, setSelected] = useState("");
  return (
    <Module
      id="month-calendar"
      title="The next four weeks"
      className="calendar-module"
    >
      <div className="calendar weekdays">
        {["M", "T", "W", "T", "F", "S", "S"].map((x, i) => (
          <span key={i}>{x}</span>
        ))}
      </div>
      <div className="calendar">
        {Array.from({ length: 28 }, (_, i) => {
          const date = F.addDays(
              F.getToday(),
              -((new Date(F.getToday() + "T12:00Z").getUTCDay() + 6) % 7) + i,
            ),
            out = items.filter((t) => t.date === date && t.amount < 0),
            incoming = items.filter((t) => t.date === date && t.amount > 0);
          return (
            <button
              aria-label={F.dateLabel(date, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              className={`day ${date < F.getToday() ? "past" : ""} ${date === F.getToday() ? "today" : ""} ${date === low.date && low.value < 0 ? "short-day" : ""} ${date === selected ? "selected" : ""}`}
              key={date}
              onClick={() => {
                setSelected(date);
                document
                  .querySelector(`[data-date="${date}"]`)
                  ?.scrollIntoView({
                    block: "center",
                    behavior: reduce() ? "instant" : "smooth",
                  });
              }}
            >
              <span>
                {Number(date.slice(-2))}
                {date.endsWith("12-01") && <small> Dec</small>}
              </span>
              {date === low.date && low.value < 0 && (
                <TriangleAlert size={12} />
              )}
              <span className="day-marks">
                {out.slice(0, 2).map((_, i) => (
                  <i key={i} />
                ))}
                {incoming.length > 0 && <i className="incoming" />}
              </span>
            </button>
          );
        })}
      </div>
      <div className="legend micro secondary">
        <i />
        going out <i className="incoming" />
        coming in
      </div>
      <Shortfall {...p} />
    </Module>
  );
}
export function Balance({ d, s, open }: BlockProps) {
  const movedDisplay = useAmount(s.moved ?? 0, 700);
  const values = F.projection(d, movedDisplay),
    low = F.shortfall(d, s.moved ?? 0);
  const [hover, setHover] = useState<number | null>(null);
  const min = Math.min(0, ...values.map((x) => x.value)),
    max = Math.max(...values.map((x) => x.value));
  const y = (v: number) => 62 - ((v - min) / (max - min || 1)) * 54;
  const path = values
    .map((p, i) => (i ? "H" + (i / 28) * 334 + "V" : "M0 ") + y(p.value))
    .join(" ");
  return (
    <Module id="balance-ahead" title="Balance ahead">
      <div
        className="balance-chart"
        onPointerMove={(e) =>
          setHover(
            Math.max(
              0,
              Math.min(
                28,
                Math.round(
                  ((e.clientX - e.currentTarget.getBoundingClientRect().left) /
                    e.currentTarget.getBoundingClientRect().width) *
                    28,
                ),
              ),
            ),
          )
        }
        onPointerLeave={() => setHover(null)}
      >
        <svg
          viewBox="0 0 334 84"
          role="img"
          aria-label="Projected daily account balance"
        >
          <defs>
            <clipPath id={"below-" + d.profile.id}>
              <rect x="0" y={y(0)} width="334" height="84" />
            </clipPath>
          </defs>
          <line
            x1="0"
            x2="334"
            y1={y(0)}
            y2={y(0)}
            stroke="#5F7067"
            strokeDasharray="4 3"
          />
          <path
            d={path + ` L334 ${y(0)} L0 ${y(0)} Z`}
            fill="#FCE9E7"
            clipPath={`url(#below-${d.profile.id})`}
          />
          <path d={path} fill="none" stroke="#10241B" strokeWidth="2" />
          <path
            d={path}
            fill="none"
            stroke="#B3261E"
            strokeWidth="2"
            clipPath={`url(#below-${d.profile.id})`}
          />
          <text x="314" y={y(0) - 4}>
            €0
          </text>
          {F.upcoming(d)
            .filter((item) => item.amount > 0)
            .map((item) => {
              const n = F.daysBetween(F.getToday(), item.date);
              return (
                <g key={item.merchant}>
                  <circle
                    cx={(n / 28) * 334}
                    cy={y(values[n].value)}
                    r="3"
                    fill="#00A651"
                  />
                  <text
                    x={Math.max(0, Math.min(264, (n / 28) * 334 - 28))}
                    y={Math.max(9, y(values[n].value) - 7)}
                  >
                    +{F.money(item.amount)}
                  </text>
                </g>
              );
            })}
          <circle
            cx={(F.daysBetween(F.getToday(), low.date) / 28) * 334}
            cy={y(
              F.projection(d, movedDisplay).find((v) => v.date === low.date)!
                .value,
            )}
            r="4"
            fill={low.value < 0 ? "#B3261E" : "#10241B"}
          />
          <text x="0" y="81">
            Today
          </text>
          {hover !== null && (
            <line
              x1={(hover / 28) * 334}
              x2={(hover / 28) * 334}
              y1="0"
              y2="72"
              stroke="#007A3D"
            />
          )}
        </svg>
        {hover !== null && (
          <span className="chart-tip">
            {F.dateLabel(values[hover].date)} ·{" "}
            {F.money(values[hover].value, 2)}
          </span>
        )}
      </div>
      <p className={low.value < 0 ? "negative small" : "small"}>
        <ProofNumber p={F.forecastProof(d, s.moved ?? 0)} open={open}>
          {F.money(low.value)}
        </ProofNumber>{" "}
        on {F.dateLabel(low.date, { weekday: "short", day: "numeric" })}
      </p>
      <p className="micro secondary">
        Known payments plus <ProofNumber p={F.everyday(d)} open={open} /> a day
        of everyday spending, your 90-day average.
      </p>
    </Module>
  );
}
export function Coming({ d, s, patch, open }: BlockProps) {
  const [dec, setDec] = useState(false);
  const items = F.upcoming(d),
    salary = items.find((t) => t.amount > 0),
    before = items.filter(
      (t) => t.amount < 0 && t.date < (salary?.date ?? F.refDate("2026-12-01")),
    );
  const total = F.r2(-before.reduce((a, t) => a + t.amount, 0));
  return (
    <Module id="coming-up" title="Coming up">
      <p className="small secondary">
        {before.length} payments before payday,{" "}
        <ProofNumber
          p={F.proof(
            "Payments before payday",
            before.flatMap((x) => x.tx),
            total,
            "Recurring payees seen in 3 or more months plus scheduled e-invoices.",
            before.map((x) => [
              x.merchant + ", " + F.dateLabel(x.date),
              F.money(-x.amount, 2),
            ]),
          )}
          open={open}
        >
          {F.money(total, 2)}
        </ProofNumber>
      </p>
      {items
        .filter((x) => dec || x.date < F.refDate("2026-12-01"))
        .map((x) => (
          <div
            data-date={x.date}
            className="upcoming-row"
            key={x.date + x.merchant}
          >
            <small>
              {F.dateLabel(x.date, {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </small>
            <div className="row">
              <span>{x.merchant}</span>
              <ProofNumber
                p={F.proof(
                  x.merchant,
                  x.tx,
                  Math.abs(x.amount),
                  "Scheduled amount based on recurring payments or the e-invoice.",
                  [
                    ["Scheduled date", F.dateLabel(x.date)],
                    ["Payment", F.money(x.amount, 2)],
                  ],
                )}
                open={open}
              >
                {x.amount > 0 ? "+" : ""}
                {F.money(Math.abs(x.amount), 2)}
              </ProofNumber>
            </div>
            {!x.approved &&
              (s.approved ? (
                <span className="positive small">
                  <Check size={14} />
                  Approved · Pays on{" "}
                  {F.dateLabel(x.date, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                  .
                </span>
              ) : (
                <button
                  className="quiet small-button"
                  onClick={() => patch({ approved: true })}
                >
                  Approve
                </button>
              ))}
          </div>
        ))}
      <button className="text-button" onClick={() => setDec(!dec)}>
        {dec ? "Hide December" : "Show December"}
      </button>
    </Module>
  );
}
export function GroceryProgress({ d, open }: BlockProps) {
  const thisTx = F.payments(
      d,
      F.refDate("2026-11-01"),
      F.getToday(),
      F.grocery,
    ),
    sGroup = thisTx.filter(F.isSGroup),
    elsewhere = thisTx.filter((t) => !F.isSGroup(t)),
    oct = F.payments(
      d,
      F.refDate("2026-10-01"),
      F.refDate("2026-10-14"),
      F.grocery,
    ),
    max = Math.max(F.sum(thisTx), F.sum(oct), 1);
  return (
    <Module id="bonus" title="Your grocery basket">
      <p>
        From {F.dateLabel(F.refDate("2026-11-01"))} to{" "}
        {F.dateLabel(F.getToday())},{" "}
        <ProofNumber
          p={F.proof(
            "S Group purchases, " +
              F.dateLabel(F.refDate("2026-11-01")) +
              " to " +
              F.dateLabel(F.getToday()),
            sGroup,
          )}
          open={open}
        />{" "}
        at S Group shops.
      </p>
      <div className="grocery-comparison">
        {[
          [
            F.dateLabel(F.refDate("2026-10-01")) +
              "–" +
              F.dateLabel(F.refDate("2026-10-14")),
            oct,
          ],
          [
            F.dateLabel(F.refDate("2026-11-01")) +
              "–" +
              F.dateLabel(F.getToday()),
            thisTx,
          ],
        ].map(([label, ts]) => (
          <div key={String(label)}>
            <div className="row small">
              <span>{String(label)}</span>
              <ProofNumber
                p={F.proof(String(label) + " groceries", ts as F.Proof["tx"])}
                open={open}
              />
            </div>
            <span className="grocery-bar">
              <i
                style={{
                  width: (F.sum(ts as F.Proof["tx"]) / max) * 100 + "%",
                }}
              />
            </span>
          </div>
        ))}
      </div>
      <p className="small secondary">
        You also bought{" "}
        <ProofNumber
          p={F.proof("Groceries elsewhere this month", elsewhere)}
          open={open}
        />{" "}
        of groceries elsewhere in the same period.
      </p>
      <p className="micro secondary">
        Bonus depends on your cooperative's published rules and eligible
        purchases. Kori shows your grocery trend until those are connected.
      </p>
    </Module>
  );
}

// The three baskets from S-Pankki's brief: fixed and regular, needed but irregular, and everyday spending
// that slips through your fingers. Groceries are essential and counted on their own line.
const isFood = (t: F.Proof["tx"][number]) => F.grocery(t);
const slips = (t: F.Proof["tx"][number]) =>
  t.type === "purchase" &&
  !isFood(t) &&
  /^(Restaurants|Entertainment|Shopping|Transportation)$/.test(t.category) &&
  Math.abs(t.amount) < 80;
export function Baskets({ d, open, verdict }: BlockProps & { verdict?: boolean }) {
  const all = F.payments(d).filter((t) => !F.isSavings(t));
  const regular = new Set(F.recurring(d).map((r) => r.merchant));
  const fixed = all.filter((t) => t.type !== "purchase" && regular.has(t.merchant));
  const surprise = all.filter(
    (t) =>
      !fixed.includes(t) &&
      !slips(t) &&
      !isFood(t) &&
      (t.type !== "purchase" || Math.abs(t.amount) >= 80),
  );
  const everyday = all.filter(slips);
  const food = all.filter(isFood);
  const rows = [
    { name: "Fixed", line: "Rent, bills, subscriptions", tx: fixed, tone: "fixed" },
    { name: "Surprises", line: "Needed, but not every month", tx: surprise, tone: "surprise" },
    { name: "Slips through your fingers", line: "Cafés, takeaway, nights out, small taps", tx: everyday, tone: "slips" },
  ];
  const total = rows.reduce((a, r) => a + F.sum(r.tx), 0) || 1;
  const slipShare = F.sum(everyday) / total,
    fixedShare = F.sum(fixed) / total;
  const kind =
    slipShare >= 0.35
      ? `An everyday spender. ${Math.round(slipShare * 100)}% of your spending went on small things that slip through your fingers.`
      : fixedShare >= 0.75
        ? `A bills-first household. ${Math.round(fixedShare * 100)}% of your spending is fixed, so the month is about timing.`
        : `A balanced spender. Fixed bills are ${Math.round(fixedShare * 100)}% of your spending, everyday extras ${Math.round(slipShare * 100)}%.`;
  return (
    <Module id="baskets" className="baskets" title={<>Where your money went, {F.periodLabel()}</>}>
      {verdict && <p className="basket-verdict">{kind}</p>}
      <div className="basket-bar" aria-hidden="true">
        {rows.map((r) => (
          <span key={r.name} className={"b-" + r.tone} style={{ flexGrow: F.sum(r.tx) / total }} />
        ))}
      </div>
      {rows.map((r) => (
        <div className="basket-row" key={r.name}>
          <i className={"b-" + r.tone} />
          <span>
            <b>{r.name}</b>
            <small className="secondary">
              {r.tx.length ? r.line : "None this month"}
            </small>
          </span>
          <ProofNumber p={F.proof(r.name + ", " + F.periodLabel(), r.tx)} open={open} />
        </div>
      ))}
      <p className="small secondary basket-note">
        Groceries,{" "}
        <ProofNumber p={F.proof("Groceries, " + F.periodLabel(), food)} open={open} />, are
        counted on their own.
      </p>
    </Module>
  );
}
export const blockComponents: Record<
  string,
  (p: BlockProps) => React.ReactNode
> = {
  "account-line": (p) => <AccountLine {...p} />,
  guess: (p) => (
    <Guess {...p} row={F.assignHome(p.d, p.s.layout).layout !== "Play"} />
  ),
  "what-if": (p) => <WhatIf {...p} />,
  "payday-runway": (p) => <Payday {...p} />,
  "where-it-went": (p) => <Where {...p} />,
  baskets: (p) => <Baskets {...p} />,
  "plan-timeline": (p) => <Timeline {...p} />,
  "loan-readiness": (p) => <Loan {...p} />,
  "month-calendar": (p) => <Calendar {...p} />,
  "shortfall-fix": (p) => (
    <Module>
      <Shortfall {...p} />
    </Module>
  ),
  "balance-ahead": (p) => <Balance {...p} />,
  "coming-up": (p) => <Coming {...p} />,
  bonus: (p) => <GroceryProgress {...p} />,
  "why-link": (p) => (
    <button className="text-button why-link" onClick={p.why}>
      Why does my Kori look like this?
    </button>
  ),
};
export function SendIcon() {
  return <ArrowUp size={20} />;
}

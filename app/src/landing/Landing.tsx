import { useEffect, useMemo, useRef, useState } from "react";
import "./landing.css";
import Sorting from "./Sorting";

type Dot = [number, string, string, number, string];
type Style = "steady" | "saver" | "tightrope" | "pass_through";

const STYLES: { id: Style; label: string; line: string }[] = [
  { id: "steady", label: "Steady", line: "Bills paid, a little left over" },
  { id: "saver", label: "Saver", line: "Money set aside every month" },
  { id: "tightrope", label: "Tight months", line: "Runs out before payday" },
  { id: "pass_through", label: "Pay moves on", line: "Salary lands, then leaves for another bank" },
];
const BANDS = [
  { from: 18, to: 25.5, label: "18–25" },
  { from: 25.5, to: 39.5, label: "26–39" },
  { from: 39.5, to: 64.5, label: "40–64" },
  { from: 64.5, to: 92, label: "65+" },
];

const W = 640,
  H = 470,
  LEFT = 118,
  TOP = 40,
  ROW = 104,
  R = 3.6;
const ageX = (age: number) => LEFT + 16 + ((Math.min(age, 90) - 18) / (90 - 18)) * (W - LEFT - 34);

function layout(dots: Dot[]) {
  // Sorted: one row per money style, x by age, stacked so no dot hides another.
  const stacks = new Map<string, number>();
  const sorted = dots.map(([age, , style]) => {
    const row = STYLES.findIndex((s) => s.id === style);
    const bucket = `${row}:${age}`;
    const k = stacks.get(bucket) ?? 0;
    stacks.set(bucket, k + 1);
    const level = k % 9,
      spill = Math.floor(k / 9);
    const off = level === 0 ? 0 : Math.ceil(level / 2) * (R * 2.15) * (level % 2 ? -1 : 1);
    const dx = spill * R * 2.15;
    return { x: ageX(age) + dx, y: TOP + 24 + row * ROW + ROW / 2 - 12 + off };
  });
  // Unsorted: the same 393 people as one uniform block, the way one app treats them.
  const cols = 31;
  const block = dots.map((_, i) => ({
    x: (W - (cols - 1) * 15) / 2 + (i % cols) * 15,
    y: TOP + 70 + Math.floor(i / cols) * 23,
  }));
  return { sorted, block };
}

// Invented demo customers, placed by hand for orientation (not part of the 393).
const RINGS: { name: string; age: number; style: Style }[] = [
  { name: "Aino 21", age: 21, style: "steady" },
  { name: "Mikko 31", age: 31, style: "saver" },
  { name: "Laura 44", age: 44, style: "tightrope" },
];

function DotField() {
  const [dots, setDots] = useState<Dot[] | null>(null);
  const [sorted, setSorted] = useState(false);
  const touched = useRef(false);
  useEffect(() => {
    fetch("/data/landing/dots.json")
      .then((r) => r.json())
      .then((d: Dot[]) => setDots(d))
      .catch(() => setDots([]));
  }, []);
  useEffect(() => {
    if (!dots?.length) return;
    const go = () => {
      if (!touched.current) setSorted(true);
    };
    const t = window.setTimeout(go, 3200);
    window.addEventListener("scroll", go, { once: true, passive: true });
    window.addEventListener("wheel", go, { once: true, passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", go);
      window.removeEventListener("wheel", go);
    };
  }, [dots]);
  const pos = useMemo(() => (dots ? layout(dots) : null), [dots]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of dots ?? []) c[d[2]] = (c[d[2]] ?? 0) + 1;
    return c;
  }, [dots]);
  return (
    <figure className="lp-field" data-sorted={sorted}>
      <div className="lp-field-head">
        <p className="lp-field-title">
          {sorted ? "The same 393, by how money moves" : "393 customers. One home screen."}
        </p>
        <div className="lp-switch" role="group" aria-label="Arrange customers">
          <button
            aria-pressed={!sorted}
            onClick={() => {
              touched.current = true;
              setSorted(false);
            }}
          >
            One app
          </button>
          <button
            aria-pressed={sorted}
            onClick={() => {
              touched.current = true;
              setSorted(true);
            }}
          >
            Their money
          </button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Dot chart of 393 customers by age and money style">
        <g className="lp-axes">
          {BANDS.map((b, i) => (
            <g key={b.label}>
              {i > 0 && <line x1={ageX(b.from)} x2={ageX(b.from)} y1={TOP} y2={TOP + 24 + ROW * 4} />}
              <text x={(ageX(Math.max(b.from, 18)) + ageX(Math.min(b.to, 90))) / 2} y={TOP - 10} textAnchor="middle">
                {b.label}
              </text>
            </g>
          ))}
          {STYLES.map((s, i) => (
            <g key={s.id}>
              <text className="lp-row-label" x={0} y={TOP + 24 + i * ROW + ROW / 2 - 16}>
                {s.label}
              </text>
              <text className="lp-row-count" x={0} y={TOP + 24 + i * ROW + ROW / 2 + 4}>
                {counts[s.id] ?? ""} people
              </text>
            </g>
          ))}
        </g>
        <g>
          {dots?.map((d, i) => {
            const p = sorted ? pos!.sorted[i] : pos!.block[i];
            return (
              <circle
                key={i}
                r={R}
                className={`lp-dot s-${d[2]}`}
                style={{
                  transform: `translate(${p.x}px, ${p.y}px)`,
                  transitionDelay: `${(i % 60) * 9}ms`,
                }}
              />
            );
          })}
        </g>
        <g className="lp-rings" aria-hidden="true">
          {RINGS.map((r) => {
            const row = STYLES.findIndex((x) => x.id === r.style);
            const x = ageX(r.age),
              y = TOP + 24 + row * ROW + ROW / 2 - 12;
            return (
              <g key={r.name}>
                <circle cx={x} cy={y} r={9} />
                <line x1={x} x2={x} y1={y - 9} y2={y - 38} />
                <text x={x + 5} y={y - 42}>
                  {r.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <figcaption>
        Each dot is one of 393 customers sampled from S-Pankki's synthetic dataset of 3.6 million payments. Age across,
        money style down. Age alone would put a saver and someone who runs out before payday in the same box. Rings mark
        where Kori's three invented demo customers sit.
      </figcaption>
    </figure>
  );
}

const PEOPLE = [
  {
    id: "aino",
    name: "Aino, 21",
    who: "Student, many small card payments",
    gets: "Her Kori opens with a game. She guesses what cafés cost her this month, then sees the real number and every payment behind it.",
  },
  {
    id: "mikko",
    name: "Mikko, 31",
    who: "Steady salary, saving for a home",
    gets: "His Kori is a timeline. Drag what he saves each month and his own home moves closer, until the bank says he's ready for a loan talk.",
  },
  {
    id: "laura",
    name: "Laura, 44",
    who: "Two kids, a household full of bills",
    gets: "Her Kori is a calendar of the next four weeks. It spots the day she'd run short before payday and fixes it in one tap.",
  },
];

function LivePhone({ id }: { id: string }) {
  return (
    <div className="lp-phone">
      <iframe title={`Kori home for ${id}`} src={`/embed?customer=${id}`} loading="lazy" />
    </div>
  );
}

export default function Landing() {
  useEffect(() => {
    document.title = "Kori: a money tab that fits your life";
  }, []);
  return (
    <div className="lp">
      <header className="lp-bar">
        <a className="lp-brand" href="/">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
            <path d="M5 10h14l-1.4 8.4a2 2 0 0 1-2 1.6H8.4a2 2 0 0 1-2-1.6Z" />
            <path d="M9 10V8a3 3 0 0 1 6 0v2" />
          </svg>
          Kori
        </a>
        <nav>
          <a href="#people">How it adapts</a>
          <a href="#sorting">How it sorts</a>
          <a href="#decides">How it decides</a>
          <a className="lp-bar-cta" href="/app">
            Open Kori
          </a>
        </nav>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-copy">
          <h1>Everyone gets the same bank app. Nobody lives the same month.</h1>
          <p className="lp-lede">
            Kori is a money tab for S‑mobiili. It reads how your money actually moves, then arranges itself around your
            life: a game for a student, a timeline for a saver, a calendar for a busy household.
          </p>
          <div className="lp-actions">
            <a className="lp-btn" href="/app">
              Open Kori
            </a>
            <a className="lp-link" href="#people">
              See three people's homes
            </a>
          </div>
        </div>
        <DotField />
      </section>

      <section className="lp-problem">
        <p>
          Today a statement tells you what happened, not what to do about it. S‑mobiili is opened every week by one in
          three Finnish adults, and each of them sees the same balance and the same list of payments.
        </p>
      </section>

      <section className="lp-people" id="people">
        <h2>Same bank. Three different apps.</h2>
        <p className="lp-section-lede">
          These are live homes, running in the page right now. The brand, the header, the tab bar and the receipts never
          change. What leads, what follows and how it talks do.
        </p>
        <div className="lp-people-grid">
          {PEOPLE.map((p) => (
            <article key={p.id} className="lp-person">
              <h3>{p.name}</h3>
              <p className="lp-who">{p.who}</p>
              <p className="lp-gets">{p.gets}</p>
              <LivePhone id={p.id} />
            </article>
          ))}
        </div>
        <p className="lp-try">
          Try it yourself: <a href="/app">log in</a> as <b>aino</b>, <b>mikko</b> or <b>laura</b> with PIN <b>1234</b>.
        </p>
      </section>

      <Sorting />

      <section className="lp-decides" id="decides">
        <h2>How Kori decides what you see</h2>
        <div className="lp-rules">
          <div>
            <h3>What it reads</h3>
            <ul>
              <li>Your age band</li>
              <li>When pay arrives, and whether it stays</li>
              <li>How much leaves in small everyday taps</li>
              <li>What you set aside each month</li>
              <li>Which bills are due before payday</li>
            </ul>
          </div>
          <div>
            <h3>What it changes</h3>
            <ul>
              <li>The tool that leads your home</li>
              <li>The order of everything below it</li>
              <li>The tone it talks in</li>
              <li>Text size and density</li>
            </ul>
          </div>
          <div>
            <h3>What never changes</h3>
            <ul>
              <li>Your bank's look and navigation</li>
              <li>A receipt behind every number</li>
              <li>Your final say: reorder, hide or switch</li>
              <li>Gender is never used</li>
            </ul>
          </div>
        </div>
        <div className="lp-receipt-note">
          <p className="lp-big">Every number opens its receipts.</p>
          <p>
            Tap any amount Kori shows and you see the payments behind it, ending in a total equal to the number you
            tapped. When you ask Kori a question, AI works out what you mean and picks the right tool. The arithmetic is
            ordinary code, so the answer is the same every time.
          </p>
        </div>
      </section>

      <section className="lp-scale">
        <h2>Built for 1.7 million weekly users</h2>
        <div className="lp-scale-grid">
          <div>
            <p className="lp-num">0</p>
            <p>AI calls needed to draw a home. Homes come from a fixed library of blocks, so cost doesn't grow per person.</p>
          </div>
          <div>
            <p className="lp-num">185 / 185</p>
            <p>
              held-out customers placed in the same persona by Kori and by an answer key written separately, in a
              different language, from the written rules.
            </p>
          </div>
          <div>
            <p className="lp-num">73 / 393</p>
            <p>
              sampled customers send at least 30% of their pay on to another bank soon after it lands: the "Pay moves
              on" row above. Kori spots them, which matters to a bank that wants to be the main one.
            </p>
          </div>
        </div>
      </section>

      <section className="lp-close">
        <h2>One bank. A different app for every life.</h2>
        <a className="lp-btn" href="/app">
          Open Kori
        </a>
      </section>

      <footer className="lp-foot">
        A Junction 2026 concept for S-Pankki's Personal Economic Trainer challenge. Aino, Mikko and Laura are invented
        demo customers; the 393 customers are S-Pankki's synthetic challenge data. Not an S-Bank service.
      </footer>
    </div>
  );
}

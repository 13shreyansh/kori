import { useEffect, useMemo, useState } from "react";

// [age, stageLetter, style, sweepPct, traits, spendPct, lowBalancePct, savePct]
type Dot = [number, string, string, number, string, number, number, number];

const STAGE: Record<string, string> = {
  s: "Starting out",
  b: "Building",
  e: "Established",
  g: "Golden years",
};
const STYLE_NAME: Record<string, string> = {
  pass_through: "Pay moves on",
  tightrope: "Tight months",
  saver: "Saver",
  steady: "Steady",
};
const TRAIT_NAME: Record<string, string> = {
  taps: "many small taps",
  quiet: "quiet account",
  bills: "bill-heavy",
  irregular: "irregular income",
};

const RULES = [
  {
    id: "pass_through",
    name: "Pay moves on",
    test: "30% or more of pay is sent on to another bank",
    why: "Checked first, because it is the signal a bank most needs to act on: this account is not the customer's main one yet.",
  },
  {
    id: "tightrope",
    name: "Tight months",
    test: "Spending reaches pay, or the balance sits under €100 on 1 day in 4",
    why: "Checked before saving: someone who saves but runs short before payday needs the runway first.",
  },
  {
    id: "saver",
    name: "Saver",
    test: "5% or more of pay goes to savings",
    why: "A habit worth building on, so the home leads with a goal.",
  },
  { id: "steady", name: "Steady", test: "Everyone else", why: "Bills paid, a little left over." },
];

function trace(d: Dot) {
  const [, , , sweep, , spend, low, save] = d;
  const spendText = spend >= 999 ? "no regular pay" : `${spend}% of pay`;
  return [
    { hit: sweep >= 30, said: `${sweep}% of pay sent on` },
    { hit: spend >= 100 || low >= 25, said: `spends ${spendText}, under €100 on ${low}% of days` },
    { hit: save >= 5, said: `${save}% of pay saved` },
    { hit: true, said: "nothing above matched" },
  ];
}

export default function Sorting() {
  const [dots, setDots] = useState<Dot[]>([]);
  const [pick, setPick] = useState(1);
  useEffect(() => {
    fetch("/data/landing/dots.json")
      .then((r) => r.json())
      .then((d: Dot[]) => setDots(d))
      .catch(() => setDots([]));
  }, []);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of dots) c[d[2]] = (c[d[2]] ?? 0) + 1;
    return c;
  }, [dots]);
  const est = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of dots) if (d[1] === "e") c[d[2]] = (c[d[2]] ?? 0) + 1;
    return c;
  }, [dots]);
  const d = dots[pick];
  const t = d ? trace(d) : [];
  const first = t.findIndex((x) => x.hit);
  const next = () => {
    if (!dots.length) return;
    let n = Math.floor(Math.random() * dots.length);
    if (n === pick) n = (n + 1) % dots.length;
    setPick(n);
  };

  return (
    <section className="lp-sort" id="sorting">
      <h2>How Kori sorts 393 people into 16 homes</h2>
      <p className="lp-section-lede">
        Two questions, answered from six months of a customer's own payments: where are you in life, and how does your
        money move? Gender is never used.
      </p>

      <div className="lp-sort-grid">
        <div className="lp-sort-steps">
          <div className="lp-step">
            <p className="lp-step-n">1</p>
            <div>
              <h3>Life stage, from age</h3>
              <p>
                Starting out to 25, Building 26 to 39, Established 40 to 64, Golden years from 65 or when a pension is
                most of the income. Age decides tone, text size and what advice fits.
              </p>
            </div>
          </div>
          <div className="lp-step">
            <p className="lp-step-n">2</p>
            <div>
              <h3>Money style, from behaviour</h3>
              <p>Four rules, checked top to bottom. The first one that matches wins.</p>
              <ol className="lp-rule-list">
                {RULES.map((r) => (
                  <li key={r.id} className={`lp-rule s-${r.id}`}>
                    <i aria-hidden="true" />
                    <div>
                      <b>{r.name}</b>
                      <span>{r.test}</span>
                      <small>{r.why}</small>
                    </div>
                    <em>{counts[r.id] ?? ""}</em>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="lp-step">
            <p className="lp-step-n">3</p>
            <div>
              <h3>Traits on top</h3>
              <p>
                Many small taps, a quiet account, bill-heavy months or irregular income add or swap one card, so two
                people in the same home can still see different things. Then the customer can reorder or hide anything.
              </p>
            </div>
          </div>
        </div>

        <div className="lp-trace" aria-live="polite">
          <div className="lp-trace-head">
            <p>Pick anyone from the sample</p>
            <button className="lp-chip" onClick={next}>
              Another person
            </button>
          </div>
          <div className="lp-mini" role="group" aria-label="393 sampled customers">
            {dots.map((x, i) => (
              <button
                key={i}
                className={`s-${x[2]} ${i === pick ? "on" : ""}`}
                aria-label={`Customer aged ${x[0]}, ${STYLE_NAME[x[2]]}`}
                onClick={() => setPick(i)}
              />
            ))}
          </div>
          {d && (
            <div className="lp-trace-card">
              <p className="lp-trace-who">
                Age {d[0]} · {STAGE[d[1]]}
              </p>
              <ol>
                {RULES.map((r, i) => (
                  <li key={r.id} className={i < first ? "miss" : i === first ? "hit" : "skip"}>
                    <span>{r.name}</span>
                    <small>{i <= first ? t[i].said : "not checked"}</small>
                  </li>
                ))}
              </ol>
              <p className="lp-trace-out">
                Home: {STAGE[d[1]]}, {STYLE_NAME[d[2]]}
                {d[4] ? `, ${d[4].split("|").map((x) => TRAIT_NAME[x]).join(", ")}` : ""}
              </p>
            </div>
          )}
        </div>
      </div>

      <h3 className="lp-sort-sub">Why rules, and not a black box</h3>
      <p className="lp-sort-note">
        Age alone hides the difference that matters. Among the {Object.values(est).reduce((a, b) => a + b, 0)}{" "}
        Established customers, {est.pass_through ?? 0} move their pay on, {est.saver ?? 0} save, {est.tightrope ?? 0}{" "}
        run tight and {est.steady ?? 0} are steady. One home for all of them fits nobody.
      </p>
      <div className="lp-compare" role="table" aria-label="Ways to sort customers">
        <div className="lp-cmp-row lp-cmp-head" role="row">
          <span role="columnheader" />
          <span role="columnheader">Reads behaviour</span>
          <span role="columnheader">Explains itself</span>
          <span role="columnheader">Same answer every time</span>
          <span role="columnheader">Cost per customer</span>
        </div>
        {[
          ["Age groups", "No", "Yes", "Yes", "None"],
          ["Clustering (k-means)", "Yes", "No, clusters have no meaning", "No, reshuffles on retrain", "Low"],
          ["An AI model per person", "Yes", "Partly", "No", "A model call each time"],
          ["Kori's rules", "Yes", "Yes, in one sentence with receipts", "Yes", "0 AI calls"],
        ].map((r) => (
          <div key={r[0]} className={`lp-cmp-row ${r[0] === "Kori's rules" ? "ours" : ""}`} role="row">
            {r.map((c, i) => (
              <span key={i} role={i === 0 ? "rowheader" : "cell"}>
                {c}
              </span>
            ))}
          </div>
        ))}
      </div>
      <p className="lp-sort-proof">
        Checked like a product: on 185 held-out customers, Kori's assignment matched an answer key written separately,
        in another language, from the written rules, 185 times out of 185. Thresholds were set on a separate dev split.
      </p>
    </section>
  );
}

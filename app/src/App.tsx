import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import {
  Home,
  Receipt,
  ShoppingBasket,
  Landmark,
  Percent,
  Bell,
  ChevronLeft,
  Info,
  Type,
  Globe,
  LifeBuoy,
  LogOut,
  Check,
  ChevronRight,
} from "lucide-react";
import * as F from "./banking/finance";
import {
  Mark,
  Sheet,
  ReceiptSheet,
  ProofNumber,
  Module,
  PaymentRows,
  ActionRow,
} from "./banking/components";
import {
  blockComponents,
  Timeline,
  Payday,
  Coming,
  GroceryProgress,
  type Session,
  type BlockProps,
} from "./banking/blocks";
import { explanations } from "./banking/copy";
import { routeQuestion, type Route } from "./banking/router";
const ids = ["aino", "mikko", "laura"];
function loadSession(id: string): Session {
  try {
    return JSON.parse(sessionStorage.getItem("kori:" + id) || "{}");
  } catch {
    return {};
  }
}
const saveSession = (id: string, s: Session) =>
  sessionStorage.setItem("kori:" + id, JSON.stringify(s));
function StatusBar({ login }: { login: boolean }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(i);
  }, []);
  return (
    <div className={`device-status ${login ? "light" : ""}`}>
      <span>
        {now.getHours()}.{String(now.getMinutes()).padStart(2, "0")}
      </span>
      <i className="camera-pill" />
      <svg
        viewBox="0 0 74 18"
        width="74"
        height="18"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M1 11h3v5H1zm5-3h3v8H6zm5-3h3v11h-3zm5-4h3v15h-3z" />
        <path d="M25 6q9-9 18 0l-2 2q-7-7-14 0zm4 5q5-5 10 0l-2 2q-3-3-6 0zm4 4a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0" />
        <rect
          x="49"
          y="3"
          width="22"
          height="12"
          rx="3"
          fill="none"
          stroke="currentColor"
        />
        <rect x="51" y="5" width="17" height="8" rx="1" />
        <path d="M72 7h2v4h-2z" />
      </svg>
    </div>
  );
}
function Login({
  onLogin,
  modal,
  last,
}: {
  onLogin: (id: string) => void;
  modal: (title: string, body: ReactNode) => void;
  last: string;
}) {
  const [user, setUser] = useState(last),
    [pin, setPin] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="login">
      <div className="login-brand">
        <Mark />
      </div>
      <p className="login-tagline">Your money, arranged for your life.</p>
      <form
        className={`login-panel ${error ? "has-error" : ""}`}
        onSubmit={(e) => {
          e.preventDefault();
          const id = user.trim().toLowerCase();
          if (!ids.includes(id)) {
            setError(
              "We don't know that user ID. The demo customers are aino, mikko and laura.",
            );
            return;
          }
          if (pin !== [1, 2, 3, 4].join("")) {
            setPin("");
            setError("That PIN doesn't match. Try again.");
            input.current?.focus();
            return;
          }
          setError("");
          setLoading(true);
          setTimeout(() => {
            localStorage.setItem("kori:last", id);
            onLogin(id);
          }, 500);
        }}
      >
        <label htmlFor="user">User ID</label>
        <input
          id="user"
          autoCapitalize="none"
          autoComplete="username"
          autoFocus
          value={user}
          onChange={(e) => {
            setUser(e.target.value);
            setError("");
          }}
        />
        <label htmlFor="pin">PIN</label>
        <div
          className={`pin-control ${error.startsWith("That PIN") ? "shake" : ""}`}
          onClick={() => input.current?.focus()}
        >
          <input
            ref={input}
            id="pin"
            aria-label="PIN"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ""));
              setError("");
            }}
          />
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={pin.length === i ? "active" : ""}>
              {pin.length > i && <i />}
            </span>
          ))}
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="primary full" disabled={loading} type="submit">
          {loading && <span className="spinner" />}Log in
        </button>
        <button
          className="text-button full"
          type="button"
          onClick={() =>
            modal(
              "Forgot your PIN?",
              <p>
                In S-mobiili you would reset your PIN with your bank codes. In
                this test environment the PIN is {[1, 2, 3, 4].join("")}.
              </p>,
            )
          }
        >
          Forgot your PIN?
        </button>
      </form>
      <p className="login-footer">
        Test environment
        <br />
        Demo customers: aino, mikko, laura · PIN {[1, 2, 3, 4].join("")}
      </p>
    </div>
  );
}
function Why(p: BlockProps) {
  const { d, s, patch, open } = p;
  const home = F.assignHome(d, s.layout),
    sig = home.signals;
  const proofRows: [string, ReactNode, F.Proof][] = [
    [
      "Age band",
      sig.band,
      F.proof(
        "Age band",
        [],
        d.profile.age,
        "Age from the invented customer record.",
        undefined,
        "years",
      ),
    ],
    [
      "Steady income",
      sig.steady
        ? sig.streak.length + " months from the same employer"
        : "Variable income",
      F.proof(
        "Steady income",
        sig.streak,
        sig.streak.length,
        "Consecutive months with the same payer, amounts within 10%.",
        undefined,
        "months",
      ),
    ],
    [
      "Fixed bills a month",
      String(sig.bills.length),
      F.proof(
        "Fixed bills",
        sig.bills.flatMap((x) => x.tx),
        sig.bills.length,
        "Recurring payees in at least 3 months, excluding optional subscriptions.",
        undefined,
        "payees",
      ),
    ],
    [
      "Children's fees and school payments",
      sig.children.length
        ? String(sig.children.length) + " payees"
        : "none found",
      F.proof(
        "Children's recurring payees",
        sig.children.flatMap((x) => x.tx),
        sig.children.length,
        "Recurring school, daycare, club and children’s sport payees.",
        undefined,
        "payees",
      ),
    ],
    [
      "Share of income you save",
      Math.round(sig.savingRate * 100) + "%",
      F.proof(
        "Share of income saved",
        [...sig.inc, ...sig.saved],
        sig.savingRate * 100,
        "Own savings transfers ÷ income in the last 6 full months.",
        [
          [
            "Income",
            F.money(
              sig.inc.reduce((a, t) => a + t.amount, 0),
              2,
            ),
          ],
          ["Transfers to savings", F.money(F.sum(sig.saved), 2)],
        ],
        "%",
      ),
    ],
    [
      "Savings or goal",
      d.profile.savings,
      F.proof(
        "Savings account",
        d.tx.filter((t) => t.account.endsWith("-savings")),
        F.currentBalance(d, "savings"),
        "Latest savings account balance.",
      ),
    ],
    [
      "Card payments under €10",
      Math.round(sig.smallShare * 100) + "%",
      F.proof(
        "Small card payment share",
        sig.cards,
        sig.smallShare * 100,
        "Card payments below €10 ÷ all card payments over 12 months.",
        [
          ["Small payments", String(sig.small.length)],
          ["All card payments", String(sig.cards.length)],
        ],
        "%",
      ),
    ],
  ];
  return (
    <div className="why-screen">
      <div className="why-intro">
        <h1>Your Kori is built from the same blocks as everyone's.</h1>
        <p className="secondary">
          Kori has {Object.keys(blockComponents).length} building blocks and{" "}
          {["Play", "Plan", "Month"].length} home layouts. Your age band and the
          way your money moves decide which blocks you get, in what order, and
          how they talk to you. Nothing on your home is written or drawn for you
          by AI.
        </p>
      </div>
      <Module title="What Kori looked at">
        {proofRows.map(([label, display, proof]) => (
          <div className="signal-row" key={label}>
            <span>{label}</span>
            <ProofNumber p={proof} open={open}>
              {display}
            </ProofNumber>
          </div>
        ))}
        <p className="small secondary">
          Kori does not look at gender, at who you pay as a person, or at
          anything outside your S-Bank accounts.
        </p>
      </Module>
      <Module title="What that chose">
        <p>
          {explanations[home.chosen]} {s.layout && "You chose an override."}{" "}
          Your home uses <b>{home.layout}</b>.
        </p>
        <div className="block-order">
          {home.blocks.map((b, i) => (
            <div className={b.size === "lead" ? "lead" : ""} key={b.id}>
              <span>{i + 1}</span>
              {b.name}
              {b.size === "lead"
                ? " · leads"
                : b.size === "row"
                  ? " · small"
                  : ""}
            </div>
          ))}
        </div>
        <div className="row">
          <span>Voice</span>
          <b className="capitalize">{home.tone}</b>
        </div>
        <div className="row">
          <span>Text size</span>
          <b>{s.preset ?? home.preset}</b>
        </div>
      </Module>
      <Module title="Change it">
        <p>Lead with</p>
        <div className="segmented">
          {(["Play", "Plan", "Month"] as F.Layout[]).map((v) => (
            <button
              key={v}
              aria-pressed={home.layout === v}
              onClick={() => patch({ layout: v })}
            >
              {v}
            </button>
          ))}
        </div>
        {s.layout && (
          <button
            className="text-button"
            onClick={() => patch({ layout: undefined })}
          >
            Back to Kori's choice
          </button>
        )}
        <p>Text size</p>
        <SizeControl
          value={s.preset ?? home.preset}
          onChange={(v) => patch({ preset: v })}
        />
      </Module>
      <Module title="Where AI is used, and where it is not">
        <h3>Reading your payments</h3>
        <p className="small secondary">
          This build labels merchants using category codes and explicit merchant
          rules. You can correct any label from a receipt. A language model
          could assist with ambiguous labels.
        </p>
        <h3>Ask Kori</h3>
        <p className="small secondary">
          The model turns your question into a lookup and picks a building
          block. It does no arithmetic and writes no numbers. If unavailable, a
          local keyword router does the same.
        </p>
        <h3>Never AI</h3>
        <p className="small secondary">
          Choosing your layout uses the fixed rules shown above. Every number is
          counted from your payments. Moving money takes your action.
        </p>
      </Module>
      <p className="small secondary centered">
        Building this home uses no AI calls. Ask Kori makes at most one per
        question, with a local fallback. Layout rules version 1.
      </p>
    </div>
  );
}
function SizeControl({
  value,
  onChange,
}: {
  value: F.Preset;
  onChange: (v: F.Preset) => void;
}) {
  return (
    <div className="segmented size-control">
      {(["Compact", "Regular", "Roomy", "Large"] as F.Preset[]).map((v) => (
        <button key={v} aria-pressed={v === value} onClick={() => onChange(v)}>
          {v}
        </button>
      ))}
    </div>
  );
}
function AskResult({
  route,
  p,
  question,
  onPin,
}: {
  route: Route;
  p: BlockProps;
  question: string;
  onPin: () => void;
}) {
  let content: ReactNode = null;
  const { d, open } = p;
  if (route.block === "receipt") {
    const cat = route.params.category;
    let tx: F.Proof["tx"] = [];
    if (cat === "saturday") tx = F.saturday(d).tx;
    else {
      const namedMonth = question
        .toLowerCase()
        .match(
          /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/,
        )?.[1];
      const monthIndex = namedMonth
        ? [
            "january",
            "february",
            "march",
            "april",
            "may",
            "june",
            "july",
            "august",
            "september",
            "october",
            "november",
            "december",
          ].indexOf(namedMonth)
        : -1;
      const year = Number(F.APP_TODAY.slice(0, 4));
      const namedStart =
        monthIndex >= 0
          ? `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`
          : undefined;
      const namedEnd =
        monthIndex >= 0
          ? new Date(Date.UTC(year, monthIndex + 1, 0, 12))
              .toISOString()
              .slice(0, 10)
          : undefined;
      tx = F.payments(
        d,
        route.params.year && cat !== "subscriptions"
          ? F.APP_TODAY.slice(0, 4) + "-01-01"
          : (namedStart ?? F.refDate("2026-10-01")),
        route.params.year && cat !== "subscriptions"
          ? F.APP_TODAY
          : (namedEnd ?? F.refDate("2026-10-31")),
        cat === "wolt"
          ? F.wolt
          : cat === "cafe"
            ? F.cafe
            : cat === "groceries"
              ? F.grocery
              : cat === "subscriptions"
                ? F.subscriptions
                : cat === "hockey"
                  ? (t) => /Kiekko|hockey/i.test(t.merchant)
                  : (t) => t.merchant === "Sodexo",
      );
    }
    const val =
        F.sum(tx) * (cat === "subscriptions" && route.params.year ? 12 : 1),
      pr = F.proof(
        question,
        tx,
        val,
        cat === "subscriptions" && route.params.year
          ? "October subscriptions × 12, assuming the same subscriptions continue."
          : "Sum of matching payments.",
      );
    content = (
      <>
        <p>
          Your payments come to{" "}
          <ProofNumber p={pr} open={open}>
            {F.money(val, 2)}
          </ProofNumber>
          .
        </p>
        <PaymentRows tx={tx} />
      </>
    );
  } else if (route.block === "plan-timeline")
    content = <Timeline {...p} initial={route.params.monthly ?? p.s.monthly} />;
  else if (route.block === "coming-up") content = <Coming {...p} />;
  else if (route.block === "payday-runway") {
    const r = F.runway(d),
      free = r.free - (route.params.ticket ?? 0);
    content = (
      <>
        <p>
          After the ticket,{" "}
          <ProofNumber
            p={{
              ...r.proof,
              title: "After your ticket",
              value: free,
              steps: [
                ...(r.proof.steps ?? []),
                ["Ticket", F.money(-(route.params.ticket ?? 0), 2)],
                ["Left", F.money(free, 2)],
              ],
            }}
            open={open}
          >
            {F.money(free, 2)}
          </ProofNumber>{" "}
          remains before payday.
        </p>
        <Payday {...p} />
      </>
    );
  } else
    return (
      <p>
        Kori can't answer that from your payments yet. It can count, compare and
        plan with what is in your accounts.
      </p>
    );
  return (
    <>
      {content}
      <button
        className="quiet full"
        disabled={p.s.pinned?.question === question}
        onClick={onPin}
      >
        {p.s.pinned?.question === question ? (
          <>
            <Check size={18} />
            On your Kori
          </>
        ) : (
          "Add to my Kori"
        )}
      </button>
    </>
  );
}
const suggestions: Record<string, string[]> = {
  aino: [
    "How much did I spend on Wolt in October?",
    "Can I afford a €79 festival ticket before payday?",
    "What do my subscriptions cost in a year?",
  ],
  mikko: [
    "What do my Saturday nights out cost?",
    "What if I save €900 a month?",
    "When could I buy the car?",
  ],
  laura: [
    "What goes out before payday?",
    "What has hockey cost us this year?",
    "What did we spend on groceries in October?",
  ],
};
function Phone({ embed }: { embed?: string }) {
  const [id, setId] = useState(
      embed ?? sessionStorage.getItem("kori:auth") ?? "",
    ),
    [raw, setRaw] = useState<F.Profile | null>(null),
    [s, setS] = useState<Session>(() => loadSession(id)),
    [tab, setTab] = useState("Kori"),
    [why, setWhy] = useState(false),
    [profile, setProfile] = useState(false),
    [receipt, setReceipt] = useState<F.Proof | null>(null),
    [modal, setModal] = useState<{ title: string; body: ReactNode } | null>(
      null,
    ),
    [ask, setAsk] = useState(false),
    [question, setQuestion] = useState(""),
    [route, setRoute] = useState<Route | null>(null),
    [asking, setAsking] = useState(false),
    [search, setSearch] = useState(""),
    [error, setError] = useState("");
  const [bankLimit, setBankLimit] = useState(100);
  const scroll = useRef<HTMLElement>(null);
  const closeReceipt = useCallback(() => setReceipt(null), []),
    closeModal = useCallback(() => setModal(null), []),
    closeProfile = useCallback(() => setProfile(false), []),
    closeAsk = useCallback(() => setAsk(false), []);
  const patch = useCallback(
    (value: Partial<Session>) =>
      setS((old) => {
        const next = { ...old, ...value };
        saveSession(id, next);
        return next;
      }),
    [id],
  );
  useEffect(() => {
    if (!id) {
      setRaw(null);
      return;
    }
    let active = true;
    setS(loadSession(id));
    fetch("/data/kori/" + id + ".json")
      .then((r) => {
        if (!r.ok) throw Error("Account unavailable");
        return r.json();
      })
      .then((r) => {
        if (active) setRaw(r);
      })
      .catch(() =>
        setError("Your account could not load. Please try logging in again."),
      );
    return () => {
      active = false;
    };
  }, [id]);
  useEffect(() => {
    scroll.current?.scrollTo(0, 0);
  }, [tab, why, id]);
  const modalOpen = (title: string, body: ReactNode) =>
    setModal({ title, body });
  const d = raw ? F.adapt(raw) : null;
  if (d && s.customGoals) d.profile = { ...d.profile, goals: s.customGoals };
  if (d)
    for (const [i, cat] of Object.entries(s.labels ?? {})) {
      const t = d.tx.find((t) => t.i === Number(i));
      if (t) t.mcc = cat;
    }
  const home = d ? F.assignHome(d, s.layout) : null;
  const preset = s.preset ?? home?.preset ?? "Regular";
  const p: BlockProps | null = d
    ? {
        d,
        s,
        patch,
        open: setReceipt,
        modal: modalOpen,
        why: () => {
          setProfile(false);
          setWhy(true);
        },
        bank: () => {
          setTab("Bank");
          setWhy(false);
        },
      }
    : null;
  const logout = () => {
    sessionStorage.removeItem("kori:auth");
    setId("");
    setRaw(null);
    setProfile(false);
    setWhy(false);
    setTab("Kori");
  };
  const doAsk = async (q = question) => {
    if (!q.trim()) return;
    setQuestion(q);
    setAsking(true);
    setRoute(null);
    const r = await routeQuestion(q);
    setRoute(r);
    setAsking(false);
  };
  const notify = d && F.shortfall(d, s.moved ?? 0).value < 0;
  return (
    <div className="device">
      <div
        className={`phone-screen preset-${preset.toLowerCase()} ${id ? "" : "is-login"}`}
      >
        <StatusBar login={!id} />
        {!id ? (
          <Login
            key="login"
            last={
              sessionStorage.getItem("kori:logged-out")
                ? ""
                : (localStorage.getItem("kori:last") ?? "")
            }
            onLogin={(id) => {
              setId(id);
              if (!embed) sessionStorage.setItem("kori:auth", id);
            }}
            modal={modalOpen}
          />
        ) : !d || !p || !home ? (
          <div className="loading-home">
            <Mark />
            {error ? (
              <p role="alert">
                {error}
                <button className="quiet" onClick={logout}>
                  Log out
                </button>
              </p>
            ) : (
              <>
                <div className="skeleton account-skeleton" />
                <div className="skeleton lead-skeleton" />
              </>
            )}
          </div>
        ) : (
          <>
            <header className="app-header">
              {why ? (
                <>
                  <button
                    className="icon-button"
                    aria-label="Back to Kori"
                    onClick={() => setWhy(false)}
                  >
                    <ChevronLeft />
                  </button>
                  <h2>Why this home?</h2>
                  <span className="header-spacer" />
                </>
              ) : (
                <>
                  <Mark />
                  <div className="header-actions">
                    <button
                      className="icon-button bell"
                      aria-label="Notifications"
                      onClick={() =>
                        modalOpen(
                          "Notifications",
                          notify ? (
                            <p>
                              On{" "}
                              {F.dateLabel(F.shortfall(d).date, {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}{" "}
                              you'll be{" "}
                              {F.money(-F.shortfall(d, s.moved ?? 0).value)}{" "}
                              short.
                            </p>
                          ) : (
                            <p>
                              Nothing needs you right now. Kori will tell you
                              here when a bill or a balance does.
                            </p>
                          ),
                        )
                      }
                    >
                      <Bell />
                      {notify && <i />}
                    </button>
                    <button
                      className="avatar"
                      aria-label="Profile and settings"
                      onClick={() => setProfile(true)}
                    >
                      {d.profile.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </button>
                  </div>
                </>
              )}
            </header>
            <main className="content" ref={scroll} data-testid="content">
              {why ? (
                <Why {...p} />
              ) : tab === "Kori" ? (
                <>
                  {home.blocks.map((b, i) => (
                    <div key={b.id}>
                      {blockComponents[b.id]?.(p)}
                      {i === 0 && s.pinned && (
                        <Module title={s.pinned.question}>
                          <AskResult
                            route={s.pinned.route}
                            p={p}
                            question={s.pinned.question}
                            onPin={() => {}}
                          />
                        </Module>
                      )}
                    </div>
                  ))}
                </>
              ) : tab === "Bank" ? (
                <>
                  <h1>Your accounts</h1>
                  <Module>
                    <div className="row">
                      <span>{d.profile.account}</span>
                      <b>{F.money(F.currentBalance(d) + (s.moved ?? 0), 2)}</b>
                    </div>
                    <div className="row">
                      <span>{d.profile.savings}</span>
                      <b>
                        {F.money(
                          F.currentBalance(d, "savings") - (s.moved ?? 0),
                          2,
                        )}
                      </b>
                    </div>
                  </Module>
                  <label className="search-label">
                    Search payments
                    <input
                      type="search"
                      placeholder="Merchant or category"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <Module>
                    <PaymentRows
                      tx={d.tx
                        .filter(
                          (t) =>
                            t.merchant
                              .toLowerCase()
                              .includes(search.toLowerCase()) ||
                            t.category
                              .toLowerCase()
                              .includes(search.toLowerCase()),
                        )
                        .slice(-bankLimit)}
                    />
                    {bankLimit < d.tx.length && (
                      <button
                        className="text-button full"
                        onClick={() => setBankLimit((v) => v + 100)}
                      >
                        Show older payments
                      </button>
                    )}
                  </Module>
                </>
              ) : tab === "Home" ? (
                <>
                  <h1>Your everyday bank</h1>
                  {blockComponents["account-line"](p)}
                  <Module title="Latest payments">
                    <PaymentRows
                      tx={d.tx.filter((t) => t.type === "purchase").slice(-5)}
                    />
                  </Module>
                  <GroceryProgress {...p} />
                </>
              ) : tab === "Purchases" ? (
                <>
                  <h1>S Group purchases</h1>
                  <Module>
                    {[
                      ...new Set(
                        F.payments(
                          d,
                          F.refDate("2026-11-01"),
                          F.APP_TODAY,
                          F.isSGroup,
                        ).map((t) => t.merchant),
                      ),
                    ].map((merchant) => {
                      const ts = F.payments(
                        d,
                        F.refDate("2026-11-01"),
                        F.APP_TODAY,
                        (t) => t.merchant === merchant,
                      );
                      return (
                        <div className="row" key={merchant}>
                          <span>{merchant}</span>
                          <ProofNumber
                            p={F.proof(merchant + " this month", ts)}
                            open={setReceipt}
                          />
                        </div>
                      );
                    })}
                  </Module>
                </>
              ) : (
                <>
                  <h1>Your benefits</h1>
                  <GroceryProgress {...p} />
                </>
              )}
            </main>
            {!why && tab === "Kori" && (
              <div className="ask-bar">
                <button
                  onClick={() => {
                    setAsk(true);
                    setRoute(null);
                  }}
                >
                  <span>Ask Kori about your money</span>
                  <span className="send-circle">
                    <ArrowIcon />
                  </span>
                </button>
              </div>
            )}
            <nav className="tab-bar" aria-label="Main navigation">
              {(
                [
                  [Home, "Home"],
                  [Receipt, "Purchases"],
                  [ShoppingBasket, "Kori"],
                  [Landmark, "Bank"],
                  [Percent, "Benefits"],
                ] as const
              ).map(([Icon, name]) => (
                <button
                  key={name}
                  aria-current={!why && tab === name ? "page" : undefined}
                  onClick={() => {
                    setWhy(false);
                    setTab(name);
                  }}
                >
                  <span>
                    <Icon size={24} />
                  </span>
                  <small>{name}</small>
                </button>
              ))}
            </nav>
          </>
        )}
        <div className="home-indicator" />
        {profile && p && d && (
          <Sheet
            title="Profile and settings"
            onClose={closeProfile}
            className="profile-sheet"
          >
            <div className="sheet-scroll">
              <div className="profile-person">
                <span className="avatar large-avatar">
                  {d.profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <div>
                  <h2>{d.profile.name}</h2>
                  <p className="small secondary">
                    Customer ID {id} · S-Bank customer since {d.profile.since}
                  </p>
                </div>
              </div>
              <ActionRow onClick={p.why}>
                <Info />
                Why this home?
              </ActionRow>
              <ActionRow
                onClick={() =>
                  modalOpen(
                    "Text size",
                    <SizeControl
                      value={preset}
                      onChange={(v) => patch({ preset: v })}
                    />,
                  )
                }
              >
                <Type />
                Text size
              </ActionRow>
              <ActionRow
                onClick={() =>
                  modalOpen(
                    "Language",
                    <>
                      <div className="row">
                        English
                        <Check />
                      </div>
                      <p className="secondary">
                        Suomi and Svenska are not available in this test build.
                      </p>
                    </>,
                  )
                }
              >
                <Globe />
                Language · English
              </ActionRow>
              <ActionRow
                onClick={() =>
                  modalOpen(
                    "Help and contact",
                    <p>
                      Chat and phone service are in S-mobiili under Help. This
                      test build has no live service.
                    </p>,
                  )
                }
              >
                <LifeBuoy />
                Help and contact
              </ActionRow>
              <button
                className="quiet full logout"
                onClick={() => {
                  sessionStorage.setItem("kori:logged-out", "yes");
                  logout();
                }}
              >
                <LogOut size={20} />
                Log out
              </button>
            </div>
          </Sheet>
        )}
        {ask && p && (
          <Sheet
            title={route ? question : "Ask Kori"}
            onClose={closeAsk}
            className="ask-sheet"
          >
            <div className="sheet-scroll">
              <form
                className="ask-input"
                onSubmit={(e) => {
                  e.preventDefault();
                  void doAsk();
                }}
              >
                <input
                  aria-label="Ask Kori about your money"
                  placeholder="Ask Kori about your money"
                  value={question}
                  autoFocus
                  onChange={(e) => setQuestion(e.target.value)}
                />
                <button
                  type="submit"
                  aria-label="Send question"
                  disabled={!question.trim() || asking}
                >
                  <ArrowIcon />
                </button>
              </form>
              {asking ? (
                <div aria-label="Loading answer" className="answer-skeleton">
                  <i />
                  <i />
                  <i />
                </div>
              ) : route ? (
                <AskResult
                  route={route}
                  p={p}
                  question={question}
                  onPin={() => patch({ pinned: { question, route } })}
                />
              ) : (
                suggestions[id].map((q) => (
                  <button
                    className="action-row"
                    key={q}
                    onClick={() => void doAsk(q)}
                  >
                    <span>{q}</span>
                    <ChevronRight />
                  </button>
                ))
              )}
            </div>
          </Sheet>
        )}
        {receipt && d && (
          <ReceiptSheet
            p={receipt}
            d={d}
            onClose={closeReceipt}
            onRelabel={(i, cat) => patch({ labels: { ...s.labels, [i]: cat } })}
          />
        )}{" "}
        {modal && (
          <Sheet title={modal.title} onClose={closeModal}>
            <div className="sheet-scroll modal-body">{modal.body}</div>
          </Sheet>
        )}
      </div>
    </div>
  );
}
function ArrowIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M12 19V5m-6 6 6-6 6 6" />
    </svg>
  );
}
export default function App() {
  if (location.pathname === "/reset") {
    const id = new URLSearchParams(location.search).get("customer");
    if (id === "all")
      for (const key of ids) sessionStorage.removeItem("kori:" + key);
    else if (id && ids.includes(id)) sessionStorage.removeItem("kori:" + id);
    sessionStorage.removeItem("kori:auth");
    sessionStorage.setItem("kori:logged-out", "yes");
    location.replace("/");
    return null;
  }
  if (location.pathname === "/three")
    return (
      <div className="three-stage">
        {ids.map((id) => (
          <iframe
            title={id + " Kori home"}
            key={id}
            src={"/embed?customer=" + id}
          />
        ))}
      </div>
    );
  const params = new URLSearchParams(location.search);
  const embed =
    location.pathname === "/embed" &&
    window.parent !== window &&
    ids.includes(params.get("customer") ?? "")
      ? params.get("customer")!
      : undefined;
  return (
    <div className={`stage ${embed ? "embedded" : ""}`}>
      <Phone embed={embed} />
    </div>
  );
}

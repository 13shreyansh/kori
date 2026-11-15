import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  X,
  ShoppingBasket,
  ChevronRight,
  Coffee,
  UtensilsCrossed,
  Zap,
  House,
  Shield,
  Bus,
  Car,
  Music,
  ShoppingBag,
  PiggyBank,
  ArrowDownLeft,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import {
  money,
  dateLabel,
  sum,
  isSGroup,
  type Proof,
  type AccountData,
} from "./finance";
export function Mark() {
  return (
    <span className="mark">
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path
          d="M4 12h20l-3 12H7L4 12Z M9 12V9a5 5 0 0 1 10 0v3"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <b>Kori</b>
    </span>
  );
}
export function ProofNumber({
  p,
  open,
  children,
}: {
  p: Proof;
  open: (p: Proof) => void;
  children?: ReactNode;
}) {
  return (
    <button
      className="proof"
      aria-label={`${typeof children === "string" ? children : money(p.value)}, show the payments behind this`}
      onClick={() =>
        open({
          ...p,
          shownAs:
            typeof children === "string"
              ? children
              : !p.unit || p.unit === "EUR"
                ? money(p.value)
                : String(p.value),
        })
      }
    >
      {children ?? money(p.value)}
    </button>
  );
}
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  ticks = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  ticks?: boolean;
}) {
  return (
    <div
      className={`slider-wrap ${ticks ? "ticks" : ""}`}
      style={
        {
          "--fill": `${((value - min) / (max - min)) * 100}%`,
        } as React.CSSProperties
      }
    >
      {ticks && (
        <span className="slider-ticks">
          {Array.from(
            { length: Math.min(16, Math.floor((max - min) / step) + 1) },
            (_, i) => (
              <i
                key={i}
                style={{ left: `${(i / ((max - min) / step)) * 100}%` }}
              />
            ),
          )}
        </span>
      )}
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onKeyDown={(e) => {
          if (e.shiftKey && ["ArrowLeft", "ArrowRight"].includes(e.key)) {
            e.preventDefault();
            onChange(
              Math.max(
                min,
                Math.min(
                  max,
                  value + (e.key === "ArrowRight" ? 1 : -1) * step * 10,
                ),
              ),
            );
          }
        }}
      />
    </div>
  );
}
export function Module({
  title,
  children,
  className = "",
  id,
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={`module ${className}`} data-block={id}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
// One tile per payment: the category reads before the name does. S Group shops carry their own mark.
const TILES: [RegExp, LucideIcon, string][] = [
  [/^groceries$/, ShoppingBasket, "grocery"],
  [/^(restaurants_cafes|food_delivery|alcohol_tobacco)$/, UtensilsCrossed, "food"],
  [/^(utilities|telecom)$/, Zap, "bill"],
  [/^(housing|loan_repayment)$/, House, "bill"],
  [/^insurance$/, Shield, "bill"],
  [/^(childcare|taxes)$/, Receipt, "bill"],
  [/^public_transport$/, Bus, "transport"],
  [/^(taxi|fuel|parking|vehicle_maintenance)$/, Car, "transport"],
  [/^(entertainment|subscriptions|hobbies|sports)$/, Music, "fun"],
  [/^(clothing|online_shopping|electronics|furniture|personal_care|household_appliances|home_improvement)$/, ShoppingBag, "shop"],
];
function CategoryTile({ t }: { t: Proof["tx"][number] }) {
  if (t.amount < 0 && isSGroup(t))
    return (
      <span className="merchant-initial tile-s" aria-hidden="true">
        S
      </span>
    );
  const key = t.cat?.key ?? "";
  let Icon: LucideIcon = Receipt,
    tone = "other";
  if (t.amount > 0 || t.cat?.kind === "income") [Icon, tone] = [ArrowDownLeft, "income"];
  else if (t.cat?.kind === "savings") [Icon, tone] = [PiggyBank, "income"];
  else if (t.mcc === "5814") [Icon, tone] = [Coffee, "food"];
  else if (t.mcc === "5411") [Icon, tone] = [ShoppingBasket, "grocery"];
  else {
    const hit = TILES.find(([re]) => re.test(key));
    if (hit) [, Icon, tone] = hit;
  }
  return (
    <span className={`merchant-initial tile-${tone}`} aria-hidden="true">
      <Icon size={20} strokeWidth={2} />
    </span>
  );
}
export function PaymentRows({
  tx,
  limit,
  onRelabel,
}: {
  tx: Proof["tx"];
  limit?: number;
  onRelabel?: (id: number, category: string) => void;
}) {
  return (
    <div className="payment-list">
      {[...tx]
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) || b.time.localeCompare(a.time),
        )
        .slice(0, limit)
        .map((t) => (
          <div className="payment" key={t.i}>
            <CategoryTile t={t} />
            <div className="payment-name">
              <span>{t.merchant}</span>
              <small>
                {dateLabel(t.date)} ·{" "}
                {onRelabel ? (
                  <select
                    aria-label={`Category for ${t.merchant} ${t.i}`}
                    value={t.mcc}
                    onChange={(e) => onRelabel(t.i, e.target.value)}
                  >
                    <option value="5814">Cafés</option>
                    <option value="5411">Groceries</option>
                    <option value="5812">Restaurants</option>
                    <option value="other">Other</option>
                  </select>
                ) : t.mcc === "5411" ? (
                  "Groceries"
                ) : t.mcc === "5814" ? (
                  "Cafés"
                ) : (
                  t.category
                )}
              </small>
            </div>
            <b className={t.amount > 0 ? "positive" : ""}>
              {t.amount > 0 ? "+" : ""}
              {money(t.amount < 0 ? -t.amount : t.amount, 2)}
            </b>
          </div>
        ))}
    </div>
  );
}
export function Sheet({
  title,
  children,
  onClose,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const touch = useRef<number>(0);
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    const box = ref.current;
    box?.querySelector<HTMLElement>("button,input")?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab" && box) {
        const all = [
          ...box.querySelectorAll<HTMLElement>(
            "button:not(:disabled),input:not(:disabled),select,a[href]",
          ),
        ].filter((x) => x.offsetParent !== null);
        const first = all[0],
          last = all.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      before?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`sheet ${className}`}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="grab-zone"
          onTouchStart={(e) => (touch.current = e.touches[0].clientY)}
          onTouchEnd={(e) => {
            if (e.changedTouches[0].clientY - touch.current > 60) onClose();
          }}
        >
          <span className="grabber" />
        </div>
        <header className="sheet-heading">
          <h1>{title}</h1>
          <button
            className="icon-button"
            aria-label="Close sheet"
            onClick={onClose}
          >
            <X />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
// A per-day figure that the band shows rounded down reads the same here: €17, not €17.00.
const perDayWhole = (p: Proof) =>
  Number.isInteger(p.value) &&
  !!p.steps?.some(([l]) => /rounded down/i.test(l));
export function ReceiptSheet({
  p,
  onClose,
  onRelabel,
}: {
  p: Proof;
  d: AccountData;
  onClose: () => void;
  onRelabel: (id: number, category: string) => void;
}) {
  const [edit, setEdit] = useState(false);
  return (
    <Sheet title={p.title} onClose={onClose} className="receipt-sheet">
      <div className="sheet-scroll">
        <p className="secondary small">{p.rule}</p>
        {p.steps && (
          <div className="calculation">
            <h2>How this is counted</h2>
            {p.steps.map(([l, v], i) => (
              <div className="calc-row" key={i}>
                <span>{l}</span>
                <b>{v}</b>
              </div>
            ))}
          </div>
        )}
        {p.tx.length ? (
          <PaymentRows
            tx={p.tx}
            onRelabel={
              edit
                ? (id, cat) => {
                    onRelabel(id, cat);
                    onClose();
                  }
                : undefined
            }
          />
        ) : (
          <p className="secondary">
            No payments match this yet. Account balances, goals and scheduled
            invoices come from your account records.
          </p>
        )}
      </div>
      <footer className="receipt-total">
        <div className="row">
          <b>
            {p.steps?.length && Math.abs(Math.abs(sum(p.tx)) - Math.abs(p.value)) > 0.01
              ? "Result"
              : "Total"}
            {p.unit ? " · " + p.unit : ""}
          </b>
          <strong data-testid="receipt-total">
            {p.unit && p.unit !== "EUR"
              ? p.value.toLocaleString("en-GB", { maximumFractionDigits: 2 }) +
                (p.unit === "%" ? "%" : "")
              : money(p.value, perDayWhole(p) ? 0 : 2)}
          </strong>
        </div>
        {!Number.isInteger(p.value) &&
          p.shownAs &&
          p.shownAs !==
            (!p.unit || p.unit === "EUR"
              ? money(p.value, 2)
              : p.value.toLocaleString("en-GB", { maximumFractionDigits: 2 }) +
                (p.unit === "%" ? "%" : "")) && (
            <small className="secondary">
              Shown on your Kori as {p.shownAs}
            </small>
          )}
        <button className="text-button" onClick={() => setEdit(!edit)}>
          {edit ? "Choose a category below" : "Wrong label? Fix it"}
        </button>
      </footer>
    </Sheet>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <ShoppingBasket />
      <p>{children}</p>
    </div>
  );
}
export function ActionRow({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="action-row" onClick={onClick}>
      <span>{children}</span>
      <ChevronRight />
    </button>
  );
}

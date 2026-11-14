import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import * as F from "../src/banking/finance";
import { localRoute } from "../src/banking/router";
const key = JSON.parse(
  readFileSync("../artifacts/independent-key.json", "utf8"),
);
const load = (id: string) =>
  F.adapt(JSON.parse(readFileSync(`public/data/kori/${id}.json`, "utf8")));
for (const id of ["aino", "mikko", "laura"])
  describe(id, () => {
    const d = load(id),
      k = key[id];
    it("matches independently recomputed transaction and signal values", () => {
      expect(F.currentBalance(d)).toBeCloseTo(k.balance, 2);
      expect(F.currentBalance(d, "savings")).toBeCloseTo(k.pot, 2);
      for (const [name, pred] of Object.entries({
        cafe: F.cafe,
        wolt: F.wolt,
        groceries: F.grocery,
        subscriptions: F.subscriptions,
      }))
        expect(F.sum(F.payments(d, undefined, undefined, pred))).toBeCloseTo(
          k.cats[name],
          2,
        );
      const sig = F.signals(d);
      expect(sig.savingRate).toBeCloseTo(k.savingRate, 8);
      expect(sig.smallShare).toBeCloseTo(k.smallShare, 8);
      expect(sig.bills.length).toBe(k.fixed);
      expect(F.baseline(d).value).toBeCloseTo(k.baseline, 2);
      expect(F.everyday(d).value).toBe(k.daily);
      expect(F.saturday(d).total).toBe(k.saturdayTotal);
      expect(F.woltStats(d).count).toBe(k.woltCount);
      expect(F.woltStats(d).average).toBeCloseTo(k.woltAverage, 2);
    });
    it("uses an unbroken ledger and exactly 24 calendar months", () => {
      expect(new Set(d.tx.map((t) => t.date.slice(0, 7))).size).toBe(24);
      for (const account of ["current", "savings"]) {
        let bal = d.profile.openingBalances[id + "-" + account];
        for (const t of d.tx.filter((t) => t.account === id + "-" + account)) {
          bal = F.r2(bal + t.amount);
          expect(t.balance).toBe(bal);
        }
      }
    });
    it("returns the prescribed modules from rules, never customer IDs", () => {
      const home = F.assignHome(d);
      expect(home.layout).toBe(
        ({ aino: "Play", mikko: "Plan", laura: "Month" } as const)[
          id as "aino"
        ],
      );
      const renamed = structuredClone(d);
      renamed.profile.id = "different";
      expect(F.assignHome(renamed).layout).toBe(home.layout);
      expect(home.blocks[0].id).toBe("account-line");
      expect(home.blocks.at(-1)?.id).toBe("why-link");
    });
  });
describe("regression and sensitivity", () => {
  it("changes the home when behaviour changes", () => {
    const d = load("mikko");
    d.tx = d.tx.filter((t) => !F.isSavings(t));
    expect(F.assignHome(d).layout).not.toBe("Plan");
  });
  it("changes layout and density when age changes", () => {
    const d = load("mikko");
    d.tx = d.tx.filter((t) => !F.isSavings(t));
    expect(F.assignHome(d).layout).toBe("Month");
    d.profile.age = 21;
    expect(F.assignHome(d).layout).toBe("Play");
    d.profile.age = 70;
    expect(F.assignHome(d).preset).toBe("Large");
  });
  it("honours household priority over savings", () => {
    const d = load("laura");
    expect(F.assignHome(d).signals.household).toBe(true);
    expect(F.assignHome(d).layout).toBe("Month");
  });
  it("computes the exact goal months from cumulative needs", () => {
    const d = load("mikko");
    expect(F.goalDates(d, 600).map((g) => g.months)).toEqual([6, 19, 48]);
    expect(F.goalDates(d, 800).map((g) => g.months)).toEqual([4, 14, 36]);
    expect(F.goalDates(d, 400).at(-1)?.months).toBe(72);
  });
  it("computes Laura shortfall and transfer using independent key", () => {
    const d = load("laura");
    expect(F.shortfall(d).date).toBe("2026-11-26");
    expect(F.shortfall(d).value).toBeCloseTo(key.laura.low, 2);
    expect(F.shortfall(d, 140).value).toBe(0);
    expect(F.everyday(d).value).toBe(34);
    expect(F.sum(F.payments(d, "2026-11-01", F.APP_TODAY, F.isSGroup))).toBe(
      262,
    );
  });
  it("computes Aino runway, order dates and café relabelling", () => {
    const d = load("aino");
    expect(F.runway(d).free).toBe(190.96);
    expect(F.runway(d).days).toBe(11);
    expect(F.sum(F.payments(d, undefined, undefined, F.cafe))).toBe(87.4);
    const ts = F.payments(d, undefined, undefined, F.cafe);
    ts[0].mcc = "other";
    expect(F.sum(F.payments(d, undefined, undefined, F.cafe))).toBeCloseTo(
      87.4 + ts[0].amount,
      2,
    );
    const w = F.woltStats(d);
    expect(w.weekly).toBe(3.5);
    expect(
      F.addDays(
        F.APP_TODAY,
        Math.ceil((900 - 60) / Math.round(2 * w.average)) * 7,
      ),
    ).toBe("2027-05-08");
  });
  it("has the requested loan evidence from settled payments", () => {
    const d = load("mikko");
    expect(F.salaryStreak(d)).toHaveLength(14);
    expect(
      new Set(d.tx.filter(F.isSavings).map((t) => t.date.slice(0, 7))).size,
    ).toBe(11);
    expect(F.saturday(d).tx).toHaveLength(31);
    expect(F.saturday(d).total).toBe(1104);
  });
  it("routes independently of invented names and rejects unsupported questions", () => {
    expect(localRoute("What if I save €900 a month?")).toEqual({
      block: "plan-timeline",
      params: { monthly: 900 },
    });
    expect(localRoute("What has hockey cost us this year?").params.year).toBe(
      true,
    );
    expect(localRoute("write a poem").block).toBe("unsupported");
  });
});

describe("review regressions", () => {
  it("includes Kela and keeps Aino game as first lead without suppressing warnings", () => {
    const d = load("aino");
    expect(
      F.upcoming(d).some((x) => x.merchant === "Kela" && x.amount === 279.38),
    ).toBe(true);
    expect(F.shortfall(d).value).toBeGreaterThanOrEqual(0);
    expect(F.assignHome(d).blocks[1].id).toBe("guess");
  });
  it("never forecasts an already settled salary month twice", () => {
    const d = load("mikko");
    expect(
      F.upcoming(d).filter(
        (x) => x.amount > 0 && x.date.slice(0, 7) === F.APP_TODAY.slice(0, 7),
      ),
    ).toEqual([]);
  });
  it("requires consecutive and current loan evidence", () => {
    const d = load("mikko");
    d.tx = d.tx.filter(
      (t) => !(F.isSavings(t) && t.date.startsWith("2026-08")),
    );
    expect(F.savingsStreak(d)).toBe(2);
    d.tx = d.tx.filter((t) => !(t.type === "salary" && t.date >= "2026-10-01"));
    expect(F.salaryStreak(d)).toHaveLength(0);
  });
  it("keeps partial transfers and remaining gaps arithmetically coherent", () => {
    const d = load("laura");
    expect(F.shortfall(d, 50).value).toBe(-90);
    expect(F.shortfall(d, 50 + 90).value).toBe(0);
    expect(F.currentBalance(d, "savings") - 140).toBe(2160);
  });
});

it('savings histories never rely on an overdrawn pot',()=>{for(const id of ['aino','mikko','laura'])expect(load(id).tx.filter(t=>t.account.endsWith('-savings')).every(t=>(t.balance??0)>=0)).toBe(true);});

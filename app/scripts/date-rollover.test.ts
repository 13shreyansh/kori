import { it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
afterEach(() => {
  vi.useRealTimers();
  vi.resetModules();
});
for (const today of ["2026-11-15", "2026-12-01"])
  it(
    "anchors all histories and forecasts to real Helsinki date " + today,
    async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(today + "T12:00:00+02:00"));
      vi.resetModules();
      const F = await import("../src/banking/finance");
      expect(F.APP_TODAY).toBe(today);
      const load = (id: string) =>
        F.adapt(
          JSON.parse(readFileSync(`public/data/kori/${id}.json`, "utf8")),
        );
      const a = load("aino"),
        m = load("mikko"),
        l = load("laura");
      expect(F.runway(a).days).toBe(11);
      expect(F.runway(a).free).toBe(190.96);
      expect(F.shortfall(a).value).toBeGreaterThanOrEqual(0);
      expect(F.assignHome(a).layout).toBe("Play");
      expect(F.assignHome(m).layout).toBe("Plan");
      expect(F.salaryStreak(m)).toHaveLength(14);
      expect(F.savingsStreak(m)).toBe(11);
      expect(F.assignHome(l).layout).toBe("Month");
      expect(F.shortfall(l).date).toBe(F.addDays(today, 12));
      expect(F.shortfall(l).value).toBe(-140);
      expect(F.shortfall(l, 140).value).toBe(0);
      expect(F.saturday(m).total).toBe(1104);
      expect(F.saturday(m).tx).toHaveLength(31);
      expect(F.saturday(m).chip).toBe(200);
      expect(
        F.saturday(m).nights.every(
          (n) => new Date(n.date + "T12:00Z").getUTCDay() === 6,
        ),
      ).toBe(true);
      expect(F.woltStats(a).count).toBe(28);
      expect(F.sum(F.payments(a, undefined, undefined, F.cafe))).toBe(87.4);
      expect(a.tx.every((t) => t.date <= today)).toBe(true);
    },
  );

import { test, expect } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
mkdirSync("../artifacts/job02", { recursive: true });
test("overview never exposes a text-free customer while a frame font is pending", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  let heldRequest = false;
  await context.route("**/*.woff2", async (route) => {
    if (route.request().frame().url().includes("customer=laura")) {
      heldRequest = true;
      await held;
    }
    await route.continue();
  });
  try {
    await page.goto("/three", { waitUntil: "domcontentloaded" });
    const laura = page.frameLocator('iframe[title="laura Kori home"]');
    await expect(laura.locator('[data-block="month-calendar"]')).toBeAttached();
    const frame = page
      .frames()
      .find((f) => f.url().includes("customer=laura"))!;
    const before = await frame.evaluate(() => ({
      fontReady: document.fonts.check('16px "Figtree Variable"'),
      text: document.querySelector('[data-block="account-line"]')?.textContent,
      calendar: !!document.querySelector('[data-block="month-calendar"]'),
    }));
    await page.screenshot({
      path: "../artifacts/job02/overview-held-font.png",
      animations: "disabled",
    });
    writeFileSync(
      "../artifacts/job02/overview-font-diagnosis.json",
      JSON.stringify({ heldRequest, ...before }, null, 2),
    );
    expect(heldRequest).toBe(true);
    expect(before.calendar).toBe(true);
    expect(before.text).toContain("Laura");
    // While any frame is not paint-ready, the overview must withhold the customer phones together.
    await expect(page.locator(".three-stage")).toHaveAttribute(
      "data-ready",
      "false",
    );
    await expect(page.locator('iframe[title="laura Kori home"]')).toBeHidden();
    release();
    await expect(page.locator(".three-stage")).toHaveAttribute(
      "data-ready",
      "true",
    );
    for (const id of ["aino", "mikko", "laura"])
      await expect(
        page
          .frameLocator(`iframe[title="${id} Kori home"]`)
          .locator('[data-block="account-line"]'),
      ).toBeVisible();
  } finally {
    release();
  }
});
for (const width of [1440, 390])
  test(`cafe result uses the module gap at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    await page.goto("/reset?customer=all");
    await page.getByRole("button", { name: /Log in as aino/i }).click();
    const slider = page.getByRole("slider", {
      name: "Your spending guess",
      exact: true,
    });
    await slider.fill("40");
    await page
      .getByRole("button", { name: "Lock in €40", exact: true })
      .click();
    await expect(page.locator(".guess-reveal")).toBeVisible();
    const space = await page.locator('[data-block="guess"]').evaluate((el) => {
      const labels = [...el.querySelectorAll(".guess-label,.actual-label")].map(
        (x) => x.getBoundingClientRect().bottom,
      );
      const text = el.querySelector(".guess-reveal>p")!.getBoundingClientRect();
      return {
        actualGap: text.top - Math.max(...labels),
        moduleGap: parseFloat(getComputedStyle(el).getPropertyValue("--gap")),
      };
    });
    writeFileSync(
      `../artifacts/job02/spacing-${width}.json`,
      JSON.stringify(space, null, 2),
    );
    // Current public Cloudflare build uses a 16px result gap, verified before release.
    expect(space.moduleGap).toBe(20);
    expect(space.actualGap).toBeCloseTo(16, 0);
  });

test("overview explains an account-load failure and can retry", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await context.route("**/data/kori/laura.json", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.goto("/three");
  await expect(page.getByRole("alert")).toContainText(
    "Couldn't load all homes.",
  );
  await expect(page.locator('iframe[title="laura Kori home"]')).toBeHidden();
  await context.unroute("**/data/kori/laura.json");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator(".three-stage")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(
    page
      .frameLocator('iframe[title="laura Kori home"]')
      .locator('[data-block="month-calendar"]'),
  ).toBeVisible();
});

test("an open home follows the real Helsinki day across midnight", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-14T23:59:40+02:00") });
  await page.goto("/reset?customer=all");
  await page.getByRole("button", { name: /Log in as laura/i }).click();
  await expect(page.locator('[data-block="month-calendar"]')).toBeVisible();
  await expect(page.locator(".phone-screen")).toHaveAttribute(
    "data-current-date",
    "2026-11-14",
  );
  await page.clock.runFor(21000);
  await expect(page.locator(".phone-screen")).toHaveAttribute(
    "data-current-date",
    "2026-11-15",
  );
  await expect(page.locator('[data-block="account-line"]')).toContainText(
    "Sunday 15 November",
  );
  await expect(page.locator(".short-day")).toContainText("27");
});

for (const width of [1440, 390])
  test(`login footer and hidden reset rules at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    await page.goto("/reset?customer=all");
    await expect(page.locator(".login-footer")).toHaveText("Demo only. Real customers would log in with S-mobiili as usual.");
    for (const person of ["Aino", "Mikko", "Laura"])
      await expect(page.getByRole("button", { name: new RegExp(`Log in as ${person}`) })).toBeVisible();
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await page.getByRole("button", { name: /Log in as aino/i }).click();
    await page
      .getByRole("button", { name: "Profile and settings", exact: true })
      .click();
    await expect(page.getByRole("button", { name: /reset/i })).toHaveCount(0);
    await expect(page.locator('a[href*="/reset"]')).toHaveCount(0);
  });

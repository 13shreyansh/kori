import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const root = "../screenshots/kori";
mkdirSync(root, { recursive: true });
mkdirSync("../artifacts/e2e", { recursive: true });
async function login(page: Page, id: string) {
  await page.getByLabel("User ID", { exact: true }).fill(id);
  await page.getByLabel("PIN", { exact: true }).fill("1234");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.locator('[data-block="account-line"]')).toBeVisible();
  const width = page.viewportSize()?.width;
  if (width === 1440 || width === 390) {
    const measures = await page.evaluate(() => {
      const dimension = (s: string) =>
        (document.querySelector(s) as HTMLElement).clientHeight;
      const root = document.querySelector(".phone-screen") as HTMLElement;
      return {
        screenWidth: root.clientWidth,
        screenHeight: root.clientHeight,
        header: dimension(".app-header"),
        ask: dimension(".ask-bar"),
        tabs: dimension(".tab-bar"),
        accountRow: dimension(".account-row"),
        font: getComputedStyle(root).fontFamily,
        numerals: getComputedStyle(root).fontVariantNumeric,
        loaded: document.fonts.check('16px "Figtree Variable"'),
        overflow: root.scrollWidth > root.clientWidth,
      };
    });
    expect(measures.header).toBe(55);
    expect(measures.ask).toBe(63);
    expect(measures.tabs).toBe(61);
    expect(measures.screenWidth).toBe(390);
    expect(measures.overflow).toBe(false);
    expect(measures.loaded).toBe(true);
    writeFileSync(
      `../artifacts/e2e/shell-${width}-${id}.json`,
      JSON.stringify(measures, null, 2),
    );
  }
}
async function logout(page: Page) {
  await page
    .getByRole("button", { name: "Profile and settings", exact: true })
    .click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page.getByLabel("User ID", { exact: true })).toHaveValue("");
}
async function range(page: Page, label: string, value: number) {
  const slider = page.getByRole("slider", { name: label, exact: true });
  await slider.scrollIntoViewIfNeeded();
  await slider.focus();
  await slider.press("Home");
  const min = Number(await slider.getAttribute("min")),
    step = Number((await slider.getAttribute("step")) || 1);
  for (let n = min; n < value; n += step) await slider.press("ArrowRight");
  await expect(slider).toHaveValue(String(value));
}
async function shot(page: Page, name: string, width: number) {
  await page.screenshot({
    animations: "disabled",
    path: `../artifacts/e2e/${width}-${name}.png`,
  });
  if (width === 1440)
    await page.screenshot({
      animations: "disabled",
      path: `${root}/${name}-desktop.png`,
    });
  if (width === 390) {
    const alias: Record<string, string> = {
      "04-aino-ask": "18-aino-phone",
      "08-mikko-baseline": "19-mikko-phone",
      "21-laura-large-text": "21-laura-large-text-phone",
    };
    if (alias[name])
      await page.screenshot({
        animations: "disabled",
        path: `${root}/${alias[name]}.png`,
      });
  }
}
for (const width of [1440, 390])
  test(`complete deployed user flow at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    for (const id of ["aino", "mikko", "laura"]) {
      const response = await page.request.get("/data/kori/" + id + ".json");
      expect(response.status()).toBe(200);
      expect((await response.json()).id).toBe(id);
    }
    await page.goto("/");
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
    await page.reload();
    await page.getByLabel("User ID", { exact: true }).fill("");
    await shot(page, "01-login", width);
    await page.getByLabel("User ID", { exact: true }).fill("aino");
    await page.getByLabel("PIN", { exact: true }).fill("0000");
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText(
      "That PIN doesn't match",
    );
    await shot(page, "02-login-error", width);
    await login(page, "aino");
    await range(page, "Your spending guess", 40);
    await shot(page, "04-aino-ask", width);
    await page
      .getByRole("button", { name: "Lock in €40", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "See all 16 payments", exact: true }),
    ).toBeVisible();
    await shot(page, "05-aino-landed", width);
    await page.locator('[data-block="guess"] h1 .proof').click();
    await expect(page.getByTestId("receipt-total")).toHaveText("€87.40");
    const layout = await page.locator(".receipt-total").evaluate((el) => {
      const rounding = el.querySelector("small")!.getBoundingClientRect();
      const correction = el.querySelector("button")!.getBoundingClientRect();
      return { roundingBottom: rounding.bottom, correctionTop: correction.top };
    });
    expect(layout.roundingBottom).toBeLessThanOrEqual(layout.correctionTop);
    await shot(page, "06-aino-receipt", width);
    await page.getByRole("button", { name: "Close sheet" }).click();
    await range(page, "Fewer orders a week", 2);
    await expect(page.locator('[data-block="what-if"]')).toContainText("8 May");
    await shot(page, "07-aino-whatif", width);
    await page.locator('[data-block="what-if"] p .proof').nth(1).click();
    await expect(page.getByTestId("receipt-total")).toHaveText("€16.80");
    await expect(page.locator(".receipt-total")).not.toContainText(
      "Shown on your Kori as",
    );
    await page.getByRole("button", { name: "Close sheet" }).click();
    await logout(page);
    await login(page, "mikko");
    await shot(page, "08-mikko-baseline", width);
    await expect(page.getByTestId("home-date")).toHaveText(
      "Own home in November 2030.",
    );
    // A real pointer drag, then keyboard adjustment to a known amount.
    const slider = page.getByRole("slider", {
      name: "Monthly saving",
      exact: true,
    });
    await slider.scrollIntoViewIfNeeded();
    const box = (await slider.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.25, box.y + 3);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.6, box.y + 3, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByTestId("home-date")).not.toHaveText(
      "Own home in November 2030.",
    );
    await range(page, "Monthly saving", 600);
    await page
      .getByRole("button", { name: "Halve Saturday nights out", exact: false })
      .click();
    await expect(slider).toHaveValue("800");
    await expect(page.getByTestId("home-date")).toHaveText(
      "Own home in November 2029.",
    );
    await page.locator(".timeline-rail").scrollIntoViewIfNeeded();
    await shot(page, "09-mikko-800", width);
    await page.locator('[data-block="plan-timeline"] p .proof').click();
    await expect(page.getByTestId("receipt-total")).toHaveText("€200.00");
    await page.getByRole("button", { name: "Close sheet" }).click();
    await page
      .locator('[data-block="loan-readiness"]')
      .scrollIntoViewIfNeeded();
    await expect(page.locator('[data-block="loan-readiness"]')).toContainText(
      "14 months",
    );
    await shot(page, "10-mikko-loan", width);
    await page.getByRole("button", { name: "Book a home loan talk" }).click();
    await expect(page.getByRole("dialog")).toContainText("Mon 16 Nov");
    await page.getByRole("button", { name: "Close sheet" }).click();
    await page
      .getByRole("button", { name: "Profile and settings", exact: true })
      .click();
    await shot(page, "16-profile", width);
    await page
      .getByRole("button", { name: "Why this home?", exact: true })
      .click();
    await shot(page, "14-why-mikko", width);
    await page
      .getByRole("button", { name: "Back to Kori", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Ask Kori about your money", exact: false })
      .click();
    await page
      .getByLabel("Ask Kori about your money", { exact: true })
      .fill("What if I save €900 a month?");
    await page.getByRole("button", { name: "Send question" }).click();
    await expect(
      page.getByRole("dialog").getByTestId("home-date"),
    ).toContainText("July 2029");
    await expect(page.getByRole("dialog")).not.toContainText(
      "Halving Saturday nights out frees",
    );
    await shot(page, "17-ask-answer", width);
    await page.getByRole("button", { name: "Close sheet" }).click();
    await logout(page);
    await login(page, "laura");
    if (width === 390)
      await page.screenshot({
        animations: "disabled",
        path: root + "/20-laura-phone.png",
      });
    await page.getByTestId("shortfall-band").scrollIntoViewIfNeeded();
    await shot(page, "11-laura-short", width);
    await page
      .getByRole("button", { name: "Move €140 from Savings", exact: true })
      .click();
    await expect(page.getByTestId("shortfall-band")).toContainText(
      "Moved. The 26th is covered.",
    );
    await expect(page.locator('[data-block="account-line"]')).toContainText(
      "€1,957.35",
    );
    await shot(page, "12-laura-fixed", width);
    await page.locator('[data-block="balance-ahead"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-block="balance-ahead"]')).toContainText(
      "€0",
    );
    await shot(page, "12b-laura-balance", width);
    await page.locator('[data-block="bonus"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-block="bonus"]')).toContainText("€262");
    await shot(page, "13-laura-bonus", width);
    await page.locator('[data-block="bonus"] .proof').first().click();
    await expect(page.getByTestId("receipt-total")).toHaveText("€262.00");
    await page.getByRole("button", { name: "Close sheet" }).click();
    await page
      .getByRole("button", {
        name: "Why does my Kori look like this?",
        exact: true,
      })
      .click();
    await shot(page, "15-why-laura", width);
    await page.getByRole("button", { name: "Plan", exact: true }).click();
    await expect(page.locator(".block-order")).toContainText("Plan timeline");
    await page.getByRole("button", { name: "Month", exact: true }).click();
    await page.getByRole("button", { name: "Large", exact: true }).click();
    await page
      .getByRole("button", { name: "Back to Kori", exact: true })
      .click();
    await page.getByTestId("content").evaluate((e) => e.scrollTo(0, 0));
    await shot(page, "21-laura-large-text", width);
    await expect(page.locator(".phone-screen")).toHaveJSProperty(
      "scrollWidth",
      390,
    );
    expect(errors).toEqual([]);
  });
test("three live independent homes and embed guard", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/three");
  for (const id of ["aino", "mikko", "laura"])
    await expect(
      page
        .frameLocator(`iframe[title="${id} Kori home"]`)
        .locator('[data-block="account-line"]'),
    ).toBeVisible();
  await shot(page, "03-three", 1440);
  await page.goto("/embed?customer=mikko");
  await expect(page.getByLabel("User ID")).toBeVisible();
  await page.goto("/");
  await page.evaluate(() => {
    const frame = document.createElement("iframe");
    frame.title = "Outside three";
    frame.src = "/embed?customer=mikko";
    document.body.append(frame);
  });
  await expect(
    page.frameLocator('iframe[title="Outside three"]').getByLabel("User ID"),
  ).toBeVisible();
  await expect(
    page
      .frameLocator('iframe[title="Outside three"]')
      .locator('[data-block="account-line"]'),
  ).toHaveCount(0);
});
test("receipt relabelling, restored sessions, reduced motion and tabs", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await login(page, "aino");
  await range(page, "Your spending guess", 40);
  await page.getByRole("button", { name: "Lock in €40" }).click();
  await page.locator('[data-block="guess"] h1 .proof').click();
  await page.getByRole("button", { name: "Wrong label? Fix it" }).click();
  const select = page.getByRole("combobox").first();
  const originalAmount = await page
    .getByRole("dialog")
    .locator(".payment")
    .first()
    .locator("b")
    .textContent();
  await select.selectOption("other");
  await expect(page.locator('[data-block="guess"] h1')).not.toContainText(
    "€87.",
  );
  expect(originalAmount).toBeTruthy();
  await logout(page);
  await login(page, "aino");
  await expect(page.locator('[data-block="guess"] h1')).not.toContainText(
    "€87.",
  );
  for (const name of ["Home", "Purchases", "Bank", "Benefits", "Kori"]) {
    await page
      .getByRole("navigation")
      .getByRole("button", { name, exact: true })
      .click();
    await expect(page.getByTestId("content")).not.toBeEmpty();
    if (name === "Bank") {
      const before = await page.locator(".payment").count();
      await page
        .getByRole("button", { name: "Show older payments", exact: true })
        .click();
      expect(await page.locator(".payment").count()).toBeGreaterThan(before);
      await page.getByRole("searchbox").fill("Kela");
      await expect(
        page.getByRole("button", { name: "Show older payments", exact: true }),
      ).toHaveCount(0);
      await page.getByRole("searchbox").fill("");
    }
  }
});

test("review regressions: one guess exits honestly and reset stays outside product", async ({
  page,
}) => {
  await page.goto("/");
  await login(page, "aino");
  await range(page, "Your spending guess", 40);
  await page.getByRole("button", { name: "Lock in €40" }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator('[data-block="guess"]')).toContainText(
    "1 guess saved.",
  );
  await expect(page.locator('[data-block="guess"]')).not.toContainText(
    "Three guesses in",
  );
  await page
    .getByRole("button", { name: "Profile and settings", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Reset this customer", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() =>
    sessionStorage.setItem("kori:mikko", JSON.stringify({ monthly: 900 })),
  );
  await page.goto("/reset?customer=aino");
  await expect(page.getByLabel("User ID")).toBeVisible();
  expect(
    await page.evaluate(() => sessionStorage.getItem("kori:aino")),
  ).toBeNull();
  expect(
    await page.evaluate(
      () => JSON.parse(sessionStorage.getItem("kori:mikko")!).monthly,
    ),
  ).toBe(900);
});
test("review regressions: Ask slider moves, annualization and pinning work", async ({
  page,
}) => {
  await page.goto("/");
  await login(page, "mikko");
  await page
    .getByRole("button", { name: "Ask Kori about your money", exact: false })
    .click();
  await page
    .getByLabel("Ask Kori about your money", { exact: true })
    .fill("What if I save €900 a month?");
  await page.getByRole("button", { name: "Send question" }).click();
  const slider = page
    .getByRole("dialog")
    .getByRole("slider", { name: "Monthly saving" });
  await expect(slider).toHaveValue("900");
  await slider.press("ArrowRight");
  await expect(slider).toHaveValue("910");
  await page
    .getByRole("button", { name: "Add to my Kori", exact: true })
    .click();
  await page.getByRole("button", { name: "Close sheet" }).click();
  const content = page.getByTestId("content");
  await content.evaluate((e) => e.scrollTo(0, 0));
  await expect(content.locator(".module").nth(1)).toContainText(
    "What if I save",
  );
  await logout(page);
  await login(page, "aino");
  await page
    .getByRole("button", { name: "Ask Kori about your money", exact: false })
    .click();
  await page
    .getByRole("button", {
      name: "What do my subscriptions cost in a year?",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText("€281.52");
});
test("review regressions: partial transfers, notifications and Undo reconcile", async ({
  page,
}) => {
  await page.goto("/");
  await login(page, "laura");
  await page
    .getByRole("button", { name: "Choose amount", exact: true })
    .click();
  await page.getByLabel("Transfer amount", { exact: true }).fill("50");
  await page.getByRole("button", { name: "Move €50", exact: true }).click();
  await page.getByRole("button", { name: "Close sheet" }).click();
  await expect(page.getByTestId("shortfall-band")).toContainText("€90");
  await page
    .getByRole("button", { name: "Notifications", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("€90 short");
  await page.getByRole("button", { name: "Close sheet" }).click();
  await page
    .getByRole("button", { name: "Move €90 from Savings", exact: true })
    .click();
  await expect(page.locator('[data-block="account-line"]')).toContainText(
    "€1,957.35",
  );
  await page
    .getByTestId("shortfall-band")
    .getByRole("button", { name: "Undo", exact: true })
    .click();
  await expect(page.locator('[data-block="account-line"]')).toContainText(
    "€1,817.35",
  );
  await expect(page.getByTestId("shortfall-band")).toContainText("€140");
});

test("recording day uses real Saturday nights, Monday calendar and dated grocery labels", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-15T12:00:00+02:00") });
  await page.goto("/");
  await login(page, "mikko");
  await expect(
    page.getByRole("button", {
      name: "Halve Saturday nights out · +€200",
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Halve Saturday nights out · +€200",
      exact: false,
    })
    .click();
  await expect(page.getByTestId("home-date")).toHaveText(
    "Own home in November 2029.",
  );
  await logout(page);
  await login(page, "laura");
  await expect(page.locator(".calendar .day").first()).toHaveAttribute(
    "aria-label",
    /^Monday/,
  );
  await expect(page.locator(".short-day")).toContainText("27");
  await page.locator('[data-block="bonus"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-block="bonus"]')).toContainText(
    "2 Nov–15 Nov",
  );
  await page.screenshot({
    animations: "disabled",
    path: "../artifacts/e2e/recording-day-rollover.png",
  });
});

test("keyboard-only login, game, proof, saving, transfer and logout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  async function reach(locator: import("@playwright/test").Locator) {
    for (let i = 0; i < 140; i++) {
      if (await locator.evaluate((e) => e === document.activeElement)) return;
      await page.keyboard.press("Tab");
    }
    throw new Error(
      "Keyboard could not reach " + (await locator.getAttribute("aria-label")),
    );
  }
  async function enter(id: string) {
    await expect(page.getByLabel("User ID", { exact: true })).toBeFocused();
    await page.keyboard.type(id);
    await page.keyboard.press("Tab");
    await page.keyboard.type("1234");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-block="account-line"]')).toBeVisible();
  }
  async function leave() {
    const profile = page.getByRole("button", {
      name: "Profile and settings",
      exact: true,
    });
    await reach(profile);
    await page.keyboard.press("Enter");
    await reach(page.getByRole("button", { name: "Log out", exact: true }));
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("User ID", { exact: true })).toBeFocused();
  }
  await enter("aino");
  await reach(
    page.getByRole("slider", { name: "Your spending guess", exact: true }),
  );
  for (let i = 0; i < 8; i++) await page.keyboard.press("ArrowRight");
  await reach(page.getByRole("button", { name: "Lock in €40", exact: true }));
  await page.keyboard.press("Enter");
  const actual = page.locator('[data-block="guess"] h1 .proof');
  await expect(actual).toBeVisible();
  await reach(actual);
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("receipt-total")).toHaveText("€87.40");
  await page.keyboard.press("Escape");
  await expect(actual).toBeFocused();
  await leave();
  await enter("mikko");
  await reach(
    page.getByRole("slider", { name: "Monthly saving", exact: true }),
  );
  await page.keyboard.press("Home");
  for (let i = 0; i < 40; i++) await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("home-date")).toContainText("November 2029");
  await leave();
  await enter("laura");
  await reach(
    page.getByRole("button", { name: "Move €140 from Savings", exact: true }),
  );
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("shortfall-band")).toContainText("Moved.");
  await leave();
});

test("all game rounds complete and runway and savings receipts reconcile", async ({
  page,
}) => {
  await page.goto("/");
  await login(page, "aino");
  await range(page, "Your spending guess", 40);
  await page.getByRole("button", { name: "Lock in €40", exact: true }).click();
  await page
    .getByRole("button", { name: "Next guess: food delivery", exact: true })
    .click();
  await range(page, "Your spending guess", 200);
  await page.getByRole("button", { name: "Lock in €200", exact: true }).click();
  await expect(page.locator('[data-block="guess"] h1')).toContainText("€252");
  await page
    .getByRole("button", { name: "Next guess: subscriptions", exact: true })
    .click();
  await range(page, "Your spending guess", 20);
  await page.getByRole("button", { name: "Lock in €20", exact: true }).click();
  await page
    .getByRole("button", { name: "Next guess: results", exact: true })
    .click();
  await expect(page.locator('[data-block="guess"]')).toContainText(
    "Three guesses in.",
  );
  await expect(page.locator('[data-block="guess"]')).toContainText(
    "closest on subscriptions",
  );
  await page.locator('[data-block="payday-runway"] h2 .proof').click();
  await expect(page.getByTestId("receipt-total")).toHaveText("€17.36");
  await page.getByRole("button", { name: "Close sheet" }).click();
  await logout(page);
  await login(page, "mikko");
  await page.locator('[data-block="plan-timeline"] p .proof').first().click();
  await expect(page.getByTestId("receipt-total")).toHaveText("€600.00");
});

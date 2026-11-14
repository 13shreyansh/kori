# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: job02.spec.ts >> overview never exposes a text-free customer while a frame font is pending
- Location: tests/job02.spec.ts:4:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('.three-stage')
Expected: "false"
Received: ""
Timeout:  10000ms

Call log:
  - Expect "toHaveAttribute" locator('.three-stage') with timeout 10000ms
  - waiting for locator('.three-stage')
    24 × locator resolved to <div class="three-stage">…</div>
       - unexpected value "null"

```

```yaml
- iframe
- iframe
- iframe
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | import {writeFileSync,mkdirSync} from 'node:fs';
  3  | mkdirSync('../artifacts/job02',{recursive:true});
  4  | test('overview never exposes a text-free customer while a frame font is pending',async({page,context})=>{
  5  |  await page.setViewportSize({width:1440,height:900});
  6  |  let release!:()=>void;const held=new Promise<void>(resolve=>release=resolve);let heldRequest=false;
  7  |  await context.route('**/*.woff2',async route=>{if(route.request().frame().url().includes('customer=laura')){heldRequest=true;await held;}await route.continue();});
  8  |  try{
  9  |  await page.goto('/three',{waitUntil:'domcontentloaded'});
  10 |  const laura=page.frameLocator('iframe[title="laura Kori home"]');
  11 |  await expect(laura.locator('[data-block="month-calendar"]')).toBeAttached();
  12 |  const frame=page.frames().find(f=>f.url().includes('customer=laura'))!;
  13 |  const before=await frame.evaluate(()=>({fontReady:document.fonts.check('16px "Figtree Variable"'),text:document.querySelector('[data-block="account-line"]')?.textContent,calendar:!!document.querySelector('[data-block="month-calendar"]')}));
  14 |  await page.screenshot({path:'../artifacts/job02/overview-held-font.png',animations:'disabled'});
  15 |  writeFileSync('../artifacts/job02/overview-font-diagnosis.json',JSON.stringify({heldRequest,...before},null,2));
  16 |  expect(heldRequest).toBe(true);expect(before.calendar).toBe(true);expect(before.text).toContain('Laura');
  17 |  // While any frame is not paint-ready, the overview must withhold the customer phones together.
> 18 |  await expect(page.locator('.three-stage')).toHaveAttribute('data-ready','false');
     |                                             ^ Error: expect(locator).toHaveAttribute(expected) failed
  19 |  await expect(page.locator('iframe[title="laura Kori home"]')).toBeHidden();
  20 |  release();await expect(page.locator('.three-stage')).toHaveAttribute('data-ready','true');
  21 |  for(const id of ['aino','mikko','laura'])await expect(page.frameLocator(`iframe[title="${id} Kori home"]`).locator('[data-block="account-line"]')).toBeVisible();
  22 |  }finally{release();}
  23 | });
  24 | for(const width of [1440,390])test(`cafe result uses the module gap at ${width}`,async({page})=>{
  25 |  await page.setViewportSize({width,height:width===1440?900:844});await page.goto('/reset?customer=all');
  26 |  await page.getByLabel('User ID',{exact:true}).fill('aino');await page.getByLabel('PIN',{exact:true}).fill('1234');await page.getByRole('button',{name:'Log in',exact:true}).click();const slider=page.getByRole('slider',{name:'Your spending guess',exact:true});await slider.fill('40');await page.getByRole('button',{name:'Lock in €40',exact:true}).click();await expect(page.locator('.guess-reveal')).toBeVisible();
  27 |  const space=await page.locator('[data-block="guess"]').evaluate(el=>{const labels=[...el.querySelectorAll('.guess-label,.actual-label')].map(x=>x.getBoundingClientRect().bottom);const text=el.querySelector('.guess-reveal>p')!.getBoundingClientRect();return {actualGap:text.top-Math.max(...labels),moduleGap:parseFloat(getComputedStyle(el).getPropertyValue('--gap'))};});
  28 |  writeFileSync(`../artifacts/job02/spacing-${width}.json`,JSON.stringify(space,null,2));expect(space.actualGap).toBeCloseTo(space.moduleGap,0);
  29 | });
  30 |
```

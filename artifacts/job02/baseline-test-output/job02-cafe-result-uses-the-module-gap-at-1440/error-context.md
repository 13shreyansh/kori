# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: job02.spec.ts >> cafe result uses the module gap at 1440
- Location: tests/job02.spec.ts:24:31

# Error details

```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 20
Received: 63

Expected precision:    0
Expected difference: < 0.5
Received difference:   43
```

# Page snapshot

```yaml
- generic [ref=f1e5]:
  - generic [ref=f1e6]: "23.32"
  - banner [ref=f1e15]:
    - generic [ref=f1e16]: Kori
    - generic [ref=f1e20]:
      - button "Notifications" [ref=f1e21] [cursor=pointer]
      - button "Profile and settings" [ref=f1e25] [cursor=pointer]: AK
  - main [ref=f1e26]:
    - generic [ref=f1e28]:
      - paragraph [ref=f1e29]: Hi Aino. 11 days to payday.
      - button "Käyttötili · FI·· 4471 €212.35" [ref=f1e30] [cursor=pointer]:
        - generic [ref=f1e31]: Käyttötili · FI·· 4471
        - generic [ref=f1e32]: €212.35
    - generic [ref=f1e34]:
      - heading [level=1] [ref=f1e35]:
        - button "€87, show the payments behind this" [ref=f1e36] [cursor=pointer]: €87
        - text: . That's €47 more than it felt like.
      - generic [ref=f1e37]:
        - generic [ref=f1e41]: "You: €40"
        - generic [ref=f1e42]: "Real: €87"
        - generic [ref=f1e43]: +€47
      - generic [ref=f1e44]:
        - paragraph [ref=f1e45]:
          - button "12, show the payments behind this" [ref=f1e46] [cursor=pointer]: "12"
          - text: of your
          - button "16, show the payments behind this" [ref=f1e47] [cursor=pointer]: "16"
          - text: café payments were under €6. Small ones are the ones memory drops.
        - generic [ref=f1e48]:
          - generic [ref=f1e49]:
            - generic [ref=f1e50]: K
            - generic [ref=f1e51]:
              - generic [ref=f1e52]: Kahvila Sävy
              - generic [ref=f1e53]: 31 Oct · Cafés
            - generic [ref=f1e54]: €4.20
          - generic [ref=f1e55]:
            - generic [ref=f1e56]: P
            - generic [ref=f1e57]:
              - generic [ref=f1e58]: Paulig Kulma
              - generic [ref=f1e59]: 29 Oct · Cafés
            - generic [ref=f1e60]: €4.50
          - generic [ref=f1e61]:
            - generic [ref=f1e62]: P
            - generic [ref=f1e63]:
              - generic [ref=f1e64]: Paulig Kulma
              - generic [ref=f1e65]: 27 Oct · Cafés
            - generic [ref=f1e66]: €4.50
          - generic [ref=f1e67]:
            - generic [ref=f1e68]: C
            - generic [ref=f1e69]:
              - generic [ref=f1e70]: Café Regatta
              - generic [ref=f1e71]: 25 Oct · Cafés
            - generic [ref=f1e72]: €5.50
          - generic [ref=f1e73]:
            - generic [ref=f1e74]: F
            - generic [ref=f1e75]:
              - generic [ref=f1e76]: Fazer Café
              - generic [ref=f1e77]: 23 Oct · Cafés
            - generic [ref=f1e78]: €6.20
        - button "See all 16 payments" [ref=f1e79] [cursor=pointer]
        - generic [ref=f1e80]:
          - 'button "Next guess: food delivery" [ref=f1e81] [cursor=pointer]'
          - button "Done" [ref=f1e82] [cursor=pointer]
    - generic [ref=f1e84]:
      - heading "What if you ordered Wolt a bit less?" [level=2] [ref=f1e85]
      - paragraph [ref=f1e86]:
        - text: You order about
        - button "3.5, show the payments behind this" [ref=f1e87] [cursor=pointer]: "3.5"
        - text: times a week,
        - button "€16.80, show the payments behind this" [ref=f1e88] [cursor=pointer]: €16.80
        - text: a time.
      - generic [ref=f1e89]:
        - generic [ref=f1e90]: Fewer orders a week
        - generic [ref=f1e91]: "0"
      - slider "Fewer orders a week" [ref=f1e93] [cursor=pointer]: "0"
      - generic [ref=f1e94]:
        - generic [ref=f1e96]: Today
        - generic [ref=f1e97]: June 2027
      - paragraph [ref=f1e100]:
        - text: Your Interrail pot has
        - button "€60, show the payments behind this" [ref=f1e101] [cursor=pointer]: €60
        - text: of €900. At this pace it stays there.
    - generic [ref=f1e103]:
      - heading [level=2] [ref=f1e104]:
        - button "€17, show the payments behind this" [ref=f1e105] [cursor=pointer]: €17
        - text: a day until payday
      - paragraph [ref=f1e106]:
        - button "€190.96, show the payments behind this" [ref=f1e107] [cursor=pointer]: €190.96
        - text: is free until Wed 25 Nov, after your known bills.
    - generic [ref=f1e123]:
      - heading "October in three lines" [level=2] [ref=f1e124]
      - generic [ref=f1e125]:
        - generic [ref=f1e126]: Food delivery
        - button "€252, show the payments behind this" [ref=f1e128] [cursor=pointer]: €252
      - generic [ref=f1e129]:
        - generic [ref=f1e130]: Groceries
        - button "€283, show the payments behind this" [ref=f1e132] [cursor=pointer]: €283
      - generic [ref=f1e133]:
        - generic [ref=f1e134]: Cafés
        - button "€87, show the payments behind this" [ref=f1e136] [cursor=pointer]: €87
    - button "Why does my Kori look like this?" [ref=f1e138] [cursor=pointer]
  - button "Ask Kori about your money" [ref=f1e140] [cursor=pointer]
  - navigation "Main navigation" [ref=f1e145]:
    - button "Home" [ref=f1e146] [cursor=pointer]
    - button "Purchases" [ref=f1e152] [cursor=pointer]
    - button "Kori" [ref=f1e158] [cursor=pointer]
    - button "Bank" [ref=f1e167] [cursor=pointer]
    - button "Benefits" [ref=f1e172] [cursor=pointer]
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
  18 |  await expect(page.locator('.three-stage')).toHaveAttribute('data-ready','false');
  19 |  await expect(page.locator('iframe[title="laura Kori home"]')).toBeHidden();
  20 |  release();await expect(page.locator('.three-stage')).toHaveAttribute('data-ready','true');
  21 |  for(const id of ['aino','mikko','laura'])await expect(page.frameLocator(`iframe[title="${id} Kori home"]`).locator('[data-block="account-line"]')).toBeVisible();
  22 |  }finally{release();}
  23 | });
  24 | for(const width of [1440,390])test(`cafe result uses the module gap at ${width}`,async({page})=>{
  25 |  await page.setViewportSize({width,height:width===1440?900:844});await page.goto('/reset?customer=all');
  26 |  await page.getByLabel('User ID',{exact:true}).fill('aino');await page.getByLabel('PIN',{exact:true}).fill('1234');await page.getByRole('button',{name:'Log in',exact:true}).click();const slider=page.getByRole('slider',{name:'Your spending guess',exact:true});await slider.fill('40');await page.getByRole('button',{name:'Lock in €40',exact:true}).click();await expect(page.locator('.guess-reveal')).toBeVisible();
  27 |  const space=await page.locator('[data-block="guess"]').evaluate(el=>{const labels=[...el.querySelectorAll('.guess-label,.actual-label')].map(x=>x.getBoundingClientRect().bottom);const text=el.querySelector('.guess-reveal>p')!.getBoundingClientRect();return {actualGap:text.top-Math.max(...labels),moduleGap:parseFloat(getComputedStyle(el).getPropertyValue('--gap'))};});
> 28 |  writeFileSync(`../artifacts/job02/spacing-${width}.json`,JSON.stringify(space,null,2));expect(space.actualGap).toBeCloseTo(space.moduleGap,0);
     |                                                                                                                 ^ Error: expect(received).toBeCloseTo(expected, precision)
  29 | });
  30 | 
```
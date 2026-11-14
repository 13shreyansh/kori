const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  const url = process.argv[2] || 'http://localhost:4173/';
  await p.goto(url); await p.waitForTimeout(1500);
  await p.screenshot({ path: '/home/user/kori/shots/1-today.png' });
  await p.evaluate(() => document.querySelector('.screen').scrollTo(0, 700)); await p.waitForTimeout(400);
  await p.screenshot({ path: '/home/user/kori/shots/2-today-scroll.png' });
  await p.click('.hero'); await p.waitForTimeout(700); await p.screenshot({ path: '/home/user/kori/shots/3-safe.png' });
  await p.mouse.click(200, 60); await p.waitForTimeout(500);
  await p.click('nav .tab-coach'); await p.waitForTimeout(300);
  await p.click('text=How much did I spend on taxis last month?'); await p.waitForTimeout(1200);
  await p.screenshot({ path: '/home/user/kori/shots/4-chat.png' });
  await p.fill('input[aria-label="Ask the coach"]', 'What kind of spender am I?'); await p.keyboard.press('Enter'); await p.waitForTimeout(1200);
  await p.screenshot({ path: '/home/user/kori/shots/5-chat2.png' });
  const num = await p.$('.num'); if (num) { await num.click(); await p.waitForTimeout(700); await p.screenshot({ path: '/home/user/kori/shots/6-receipt.png' }); await p.mouse.click(200, 60); await p.waitForTimeout(400); }
  await p.click('nav >> text=Explore'); await p.waitForTimeout(600); await p.screenshot({ path: '/home/user/kori/shots/7-explore.png' });
  await p.click('nav >> text=Me'); await p.waitForTimeout(600); await p.screenshot({ path: '/home/user/kori/shots/8-me.png' });
  console.log('errors:', errs);
  await b.close();
})();

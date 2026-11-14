// Screenshots of every route. Usage: node scripts/shots.cjs [baseUrl] [only]
// Needs a server: npm run build && npx vite preview --port 4173
const { chromium } = require('playwright');
const OUT = '/home/user/kori/shots/';
const base = process.argv[2] || 'http://localhost:4173/';
const only = process.argv[3];
const want = (n) => !only || only.split(',').some((o) => n.includes(o));
(async () => {
  const b = await chromium.launch();
  const errs = [];
  const page = async (w, h, scheme = 'light') => {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: scheme });
    p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    return p;
  };
  const settle = async (p) => { await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 200)); } window.scrollTo(0, 0); }); await p.waitForTimeout(1200); };
  const sec = async (p, id, file) => { await p.evaluate((i) => document.getElementById(i).scrollIntoView({ behavior: 'instant' }), id); await p.waitForTimeout(900); await p.screenshot({ path: OUT + file }); };

  if (want('landing')) {
    const d = await page(1440, 900);
    await d.goto(base); await d.waitForTimeout(1800);
    await d.screenshot({ path: OUT + 'landing-desktop.png' });
    await settle(d);
    await d.screenshot({ path: OUT + 'landing-desktop-full.png', fullPage: true });
    await sec(d, 'asks', 'landing-asks.png');
    await d.click('.lp-ask >> nth=2'); await d.waitForTimeout(1500); await d.screenshot({ path: OUT + 'landing-ask-answered.png' });
    await sec(d, 'how', 'landing-how.png');
    await d.evaluate(() => document.querySelector('.lp-strip').scrollIntoView({ behavior: 'instant', block: 'center' })); await d.waitForTimeout(900); await d.screenshot({ path: OUT + 'landing-strip.png' });
    await sec(d, 'map', 'persona-map.png');
    await d.click('.pm-cell >> nth=13'); await d.waitForTimeout(1500); await d.screenshot({ path: OUT + 'persona-map-golden.png' });
    await d.evaluate(() => document.querySelector('.pm-detail').scrollIntoView({ behavior: 'instant', block: 'center' })); await d.waitForTimeout(600); await d.screenshot({ path: OUT + 'persona-map-detail.png' });
    await sec(d, 'yours', 'landing-yours.png');
    await sec(d, 'trust', 'landing-trust.png');
    await sec(d, 'evals', 'landing-evals.png');
    const m = await page(390, 844);
    await m.goto(base); await m.waitForTimeout(1800);
    await m.screenshot({ path: OUT + 'landing-mobile.png' });
    await settle(m);
    await m.screenshot({ path: OUT + 'landing-mobile-full.png', fullPage: true });
    await sec(m, 'map', 'persona-map-mobile.png');
    for (const [id, f] of [['asks', 'landing-mobile-asks.png'], ['how', 'landing-mobile-how.png'], ['yours', 'landing-mobile-yours.png'], ['trust', 'landing-mobile-trust.png'], ['evals', 'landing-mobile-evals.png']]) await sec(m, id, f);
    await m.evaluate(() => document.querySelector('.lp-demo-phone').scrollIntoView({ behavior: 'instant' })); await m.waitForTimeout(500); await m.screenshot({ path: OUT + 'landing-mobile-phone.png' });
    await m.evaluate(() => document.querySelector('.lp-strip').scrollIntoView({ behavior: 'instant' })); await m.waitForTimeout(500); await m.screenshot({ path: OUT + 'landing-mobile-strip.png' });
    await m.evaluate(() => document.querySelector('.pm-detail').scrollIntoView({ behavior: 'instant' })); await m.waitForTimeout(500); await m.screenshot({ path: OUT + 'persona-map-mobile-detail.png' });
    const k = await page(1440, 900, 'dark');
    await k.goto(base); await k.waitForTimeout(1800); await k.screenshot({ path: OUT + 'landing-dark.png' });
    await settle(k); await sec(k, 'map', 'persona-map-dark.png');
    const w = await page(1920, 1080);
    await w.goto(base); await w.waitForTimeout(1800); await w.screenshot({ path: OUT + 'landing-projector.png' });
  }
  if (want('app')) {
    const people = { sanna: 'CUST00306', juho: 'CUST01090', eero: 'CUST00394', mikko: 'CUST00229', aino: 'CUST01567', leena: 'CUST00025', onni: 'CUST00854', helmi: 'CUST00171' };
    for (const [n, id] of Object.entries(people)) {
      const p = await page(390, 844);
      await p.goto(base + '#c=' + id); await p.waitForTimeout(1500);
      await p.screenshot({ path: OUT + `app-${n}.png` });
      if (['sanna', 'juho', 'aino', 'mikko'].includes(n)) { await p.evaluate(() => document.querySelector('.screen').scrollTo(0, 620)); await p.waitForTimeout(500); await p.screenshot({ path: OUT + `app-${n}-2.png` }); }
      if (['aino', 'mikko', 'eero'].includes(n)) {
        await p.click('nav >> text=Me'); await p.waitForTimeout(600); await p.screenshot({ path: OUT + `me-${n}.png` });
        await p.evaluate(() => document.querySelector('.screen').scrollTo(0, 640)); await p.waitForTimeout(400); await p.screenshot({ path: OUT + `me-${n}-2.png` });
      }
      await p.close();
    }
    const p = await page(390, 844);
    await p.goto(base + '?c=CUST01567'); await p.waitForTimeout(1500);
    await p.click('.seg-edit'); await p.waitForTimeout(900); await p.screenshot({ path: OUT + 'make-it-yours.png' });
    await p.evaluate(() => document.querySelector('.sheet-body').scrollTo(0, 2000)); await p.waitForTimeout(400); await p.screenshot({ path: OUT + 'make-it-yours-2.png' });
    await p.keyboard.press('Escape'); await p.waitForTimeout(500);
    await p.click('nav .tab-coach'); await p.waitForTimeout(300); await p.click('.chip'); await p.waitForTimeout(1300); await p.screenshot({ path: OUT + 'app-chat.png' });
    const num = await p.$('.num'); if (num) { await num.click(); await p.waitForTimeout(700); await p.screenshot({ path: OUT + 'app-receipt.png' }); }
    const dk = await page(390, 844, 'dark');
    for (const [n, id] of [['mikko', 'CUST00229'], ['eero', 'CUST00394']]) { await dk.goto(base + '#c=' + id); await dk.waitForTimeout(1500); await dk.screenshot({ path: OUT + `app-${n}-dark.png` }); }
    const desk = await page(1440, 900);
    await desk.goto(base + '#app'); await desk.waitForTimeout(1500); await desk.screenshot({ path: OUT + 'app-desktop.png' });
  }
  if (want('compare')) {
    const p = await page(1440, 1100);
    await p.goto(base + '#compare'); await p.waitForTimeout(2200);
    await p.screenshot({ path: OUT + 'compare.png' });
  }
  console.log('errors:', errs);
  await b.close();
})();

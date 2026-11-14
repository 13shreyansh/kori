// Picks demo customers with distinct stories: one per behaviour segment, plus a compare trio
// (student, family, retiree) for the side-by-side view (?compare).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { buildCustomer } from '../src/engine/model';
import * as A from '../src/engine/analytics';
import { segmentOf } from '../src/engine/segments';
const dir = 'public/data/customers/';
const rows = readdirSync(dir).filter((f) => f.startsWith('CUST')).map((f) => {
  const c = buildCustomer(JSON.parse(readFileSync(dir + f, 'utf8')));
  const s = segmentOf(c); const safe = A.safeToSpend(c).week;
  const kids = c.tx.some((t) => t.category === 'childcare' || t.merchant.includes('LAPSILISA'));
  return { id: c.id, age: c.age, seg: s.id, name: s.play.name, safe, kids, n: c.tx.length };
}).sort((a, b) => a.id.localeCompare(b.id));
const nice = (r: (typeof rows)[0]) => r.safe > 40 && r.safe < 700;
const used = new Set<string>();
const take = (ok: (r: (typeof rows)[0]) => boolean) => { const r = rows.find((x) => !used.has(x.id) && ok(x) && nice(x)) ?? rows.find((x) => !used.has(x.id) && ok(x)); if (r) used.add(r.id); return r; };
const trio = [take((r) => r.seg === 'starter' && r.age <= 24), take((r) => r.kids && r.age >= 30 && r.age <= 50 && ['steady', 'saver', 'fixed_heavy', 'stretched', 'grazer'].includes(r.seg)), take((r) => r.seg === 'golden_years')];
const others = ['pass_through', 'grazer', 'saver', 'stretched', 'light_user', 'steady'].map((s) => take((r) => r.seg === s));
const names = ['Aino', 'Eero', 'Sanna', 'Mikko', 'Leena', 'Juho', 'Helmi', 'Onni', 'Venla'];
const picks = [trio[1], others[0], trio[0], trio[2], ...others.slice(1)].filter(Boolean) as (typeof rows)[0][];
const demo = picks.map((r, i) => ({ id: r.id, name: names[i], age: r.age, type: r.name, segment: r.seg, compare: trio.includes(r) }));
console.log(demo);
writeFileSync('public/data/demo.json', JSON.stringify(demo, null, 1));

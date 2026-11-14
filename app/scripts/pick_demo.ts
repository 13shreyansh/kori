// Picks a handful of demo customers with distinct stories (one per spender type / life stage).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { buildCustomer } from '../src/engine/model';
import * as A from '../src/engine/analytics';
const dir = 'public/data/customers/';
const rows = readdirSync(dir).filter((f) => f.startsWith('CUST')).map((f) => {
  const c = buildCustomer(JSON.parse(readFileSync(dir + f, 'utf8')));
  const p = A.spenderProfile(c); const s = A.safeToSpend(c); const f12 = A.surpriseFund(c);
  return { id: c.id, age: c.age, type: p.type.name, safe: s.week, surprise: f12.yearTotal, n: c.tx.length, mortgage: c.mortgage, slips: p.traits[0].value };
});
const counts: Record<string, number> = {}; for (const r of rows) counts[r.type] = (counts[r.type] ?? 0) + 1; console.log(counts);
const names = ['Aino', 'Eero', 'Sanna', 'Mikko', 'Leena', 'Juho', 'Helmi', 'Onni'];
const want: [string, (r: any) => boolean][] = [
  ['The Tap-and-Go Grazer', (r) => r.age < 30], ['The Weekend Splurger', (r) => r.age < 40], ['The Subscription Collector', (r) => r.age < 35],
  ['The Rollercoaster', (r) => r.age >= 30], ['The Quiet Saver', (r) => r.age >= 35 && r.age < 60], ['The Steady Planner', (r) => r.age >= 65],
];
const picks: any[] = []; const used = new Set<string>();
for (const [t, ok] of want) {
  const r = rows.filter((x) => x.type === t && ok(x) && x.safe > 40 && !used.has(x.id)).sort((a, b) => b.surprise - a.surprise)[0] ?? rows.find((x) => x.type === t && !used.has(x.id));
  if (r) { used.add(r.id); picks.push(r); }
}
const mtg = rows.find((r) => r.mortgage && !used.has(r.id)); if (mtg) picks.push(mtg);
picks.sort((a, b) => (b.safe > 60 && b.safe < 600 ? 1 : 0) - (a.safe > 60 && a.safe < 600 ? 1 : 0));
const demo = picks.map((r, i) => ({ id: r.id, name: names[i], age: r.age, type: r.type }));
console.log(demo);
writeFileSync('public/data/demo.json', JSON.stringify(demo, null, 1));

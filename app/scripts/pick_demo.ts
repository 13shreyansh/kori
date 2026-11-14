// Picks demo customers that show the persona grid: different life stages, money styles and traits,
// plus a compare trio (Starter, Established, Golden) for the side-by-side view.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { buildCustomer } from '../src/engine/model';
import * as A from '../src/engine/analytics';
import { personaOf } from '../src/engine/personas';
const dir = 'public/data/customers/';
const rows = readdirSync(dir).filter((f) => f.startsWith('CUST')).sort().map((f) => {
  const c = buildCustomer(JSON.parse(readFileSync(dir + f, 'utf8')));
  const p = personaOf(c);
  return { id: c.id, age: c.age, stage: p.stage, style: p.style, traits: p.traits, name: p.name, safe: A.safeToSpend(c).week };
});
const nice = (r: (typeof rows)[0]) => r.safe > 40 && r.safe < 900;
const used = new Set<string>();
const take = (ok: (r: (typeof rows)[0]) => boolean) => { const r = rows.find((x) => !used.has(x.id) && ok(x) && nice(x)) ?? rows.find((x) => !used.has(x.id) && ok(x)); if (r) used.add(r.id); return r; };
const want: [string, string, string?][] = [
  ['established', 'steady', 'bills'], ['established', 'pass_through'], ['starter', 'steady', 'taps'], ['golden', 'saver'],
  ['builder', 'saver'], ['builder', 'tightrope'], ['starter', 'tightrope'], ['golden', 'tightrope'], ['established', 'saver', 'quiet'], ['builder', 'steady', 'irregular'],
];
const picks = want.map(([s, y, t]) => take((r) => r.stage === s && r.style === y && (!t || r.traits.includes(t as never))) ?? take((r) => r.stage === s && r.style === y)).filter(Boolean) as (typeof rows)[0][];
const trio = new Set([picks[2]?.id, picks[0]?.id, picks[3]?.id]);
const names = ['Aino', 'Eero', 'Sanna', 'Mikko', 'Leena', 'Juho', 'Helmi', 'Onni', 'Venla', 'Ilmari'];
const demo = picks.map((r, i) => ({ id: r.id, name: names[i], age: r.age, type: r.name, segment: `${r.stage}.${r.style}`, traits: r.traits, compare: trio.has(r.id) }));
console.log(demo.map((d) => `${d.name} ${d.age} ${d.type} [${d.traits}] ${d.compare ? '*' : ''}`).join('\n'));
writeFileSync('public/data/demo.json', JSON.stringify(demo, null, 1));

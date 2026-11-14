// Builds public/data/persona_map.json: the real head-count behind the 4x4 persona grid (life stage x money style),
// trait counts, and one example customer per cell (and per cell + trait) to open in the app.
// Run from app/: npx tsx scripts/persona_map.ts   (or: npm run data)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { buildCustomer } from '../src/engine/model';
import * as A from '../src/engine/analytics';
import { NAMES, personaOf, STAGES, STYLES, TRAITS, type Trait } from '../src/engine/personas';
const dir = 'public/data/customers/';
const demo: { id: string; name: string }[] = JSON.parse(readFileSync('public/data/demo.json', 'utf8'));
const demoName = new Map(demo.map((d) => [d.id, d.name]));
const rows = readdirSync(dir).filter((f) => f.startsWith('CUST')).sort().map((f) => {
  const c = buildCustomer(JSON.parse(readFileSync(dir + f, 'utf8')));
  const p = personaOf(c);
  return { id: c.id, age: c.age, stage: p.stage, style: p.style, traits: p.traits, sweep: p.f.sweepShare, safe: A.safeToSpend(c).week };
});
type Row = (typeof rows)[0];
// first names for example customers that are not in the demo list (invented, like the demo names)
const spare = ['Kaisa', 'Antti', 'Riikka', 'Tuomas', 'Outi', 'Lauri', 'Marja', 'Pekka', 'Tiina', 'Ville', 'Anneli', 'Heikki', 'Sari', 'Jari', 'Elina', 'Matti', 'Noora', 'Kalle', 'Liisa', 'Timo', 'Päivi', 'Aleksi', 'Ritva', 'Olli'];
const names = new Map<string, string>();
const nameOf = (id: string) => demoName.get(id) ?? names.get(id) ?? (names.set(id, spare[names.size % spare.length]), names.get(id)!);
const nice = (r: Row) => r.safe > 40 && r.safe < 900;
const best = (xs: Row[]) => xs.find((r) => demoName.has(r.id)) ?? xs.find(nice) ?? xs[0];
const ex = (r?: Row) => (r ? { id: r.id, name: nameOf(r.id), age: r.age, traits: r.traits } : null);

const cells: Record<string, unknown> = {};
for (const stage of STAGES) for (const style of STYLES) {
  const xs = rows.filter((r) => r.stage === stage && r.style === style);
  const traits = Object.fromEntries(TRAITS.map((t) => [t, xs.filter((r) => r.traits.includes(t)).length]));
  const byTrait = Object.fromEntries(TRAITS.map((t: Trait) => [t, ex(best(xs.filter((r) => r.traits.includes(t))))]));
  cells[`${stage}.${style}`] = { stage, style, ...NAMES[stage][style], count: xs.length, traits, example: ex(best(xs)), byTrait };
}
const out = {
  total: rows.length,
  stages: Object.fromEntries(STAGES.map((s) => [s, rows.filter((r) => r.stage === s).length])),
  styles: Object.fromEntries(STYLES.map((s) => [s, rows.filter((r) => r.style === s).length])),
  traits: Object.fromEntries(TRAITS.map((t) => [t, rows.filter((r) => r.traits.includes(t)).length])),
  noTrait: rows.filter((r) => r.traits.length === 0).length,
  moves30: rows.filter((r) => r.sweep >= 0.3).length,
  moves50: rows.filter((r) => r.sweep >= 0.5).length,
  cells,
};
writeFileSync('public/data/persona_map.json', JSON.stringify(out, null, 1));
console.log(`${out.total} customers`);
for (const s of STAGES) console.log(s.padEnd(12), STYLES.map((y) => String((cells[`${s}.${y}`] as { count: number }).count).padStart(4)).join(''));
console.log('traits', out.traits, 'none', out.noTrait, '| moves 30%+', out.moves30, '50%+', out.moves50);

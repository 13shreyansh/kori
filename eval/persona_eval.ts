// Persona eval (eval/PERSONAS_SPEC.md): assignment agreement with the Python key, plus code checks on the cards.
// Usage: npx --prefix app tsx eval/persona_eval.ts --split dev|heldout
import { readFileSync } from 'node:fs';
import { buildCustomer } from '../app/src/engine/model';
import { personaOf } from '../app/src/engine/personas';
import { eur } from '../app/src/engine/analytics';

const arg = (k: string, d = '') => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const split = arg('--split', 'dev');
const root = new URL('..', import.meta.url).pathname;
const items = readFileSync(`${root}eval/items/personas_${split}.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const BLAME = /\b(irresponsible|bad with money|wasteful|careless|lazy|you should be ashamed|too much on)\b/i;
let agreeStage = 0, agreeStyle = 0, agreeTraits = 0, agreeAll = 0;
const checks = { number: 0, ask: 0, brief: 0, kind: 0, distinctTitle: 0 };
const mism: string[] = []; const fails: string[] = [];
const titles = new Map<string, Set<string>>();
for (const it of items) {
  const c = buildCustomer(JSON.parse(readFileSync(`${root}app/public/data/customers/${it.customer}.json`, 'utf8')));
  const p = personaOf(c, (x) => eur(x));
  const st = p.stage === it.stage, sy = p.style === it.style, tr = [...p.traits].sort().join() === [...it.traits].sort().join();
  agreeStage += +st; agreeStyle += +sy; agreeTraits += +tr; agreeAll += +(st && sy && tr);
  if (!(st && sy && tr)) mism.push(`${it.customer}: app ${p.stage}.${p.style}[${p.traits}] key ${it.stage}.${it.style}[${it.traits}]`);
  const card = p.cards[0]; const words = card.body.split(/\s+/).length;
  const ok = { number: /\d/.test(card.body), ask: !!card.ask, brief: words <= 45, kind: !BLAME.test(card.title + ' ' + card.body) };
  for (const k of Object.keys(ok) as (keyof typeof ok)[]) { checks[k] += +ok[k]; if (!ok[k]) fails.push(`${it.customer} ${k}: ${card.title} | ${card.body}`); }
  (titles.get(p.id) ?? titles.set(p.id, new Set()).get(p.id)!).add(card.title);
}
const n = items.length; const pc = (x: number) => `${((x / n) * 100).toFixed(1)}%`;
console.log(`== personas / ${split}: ${n} customers`);
console.log(`agreement  stage ${pc(agreeStage)}  style ${pc(agreeStyle)}  traits ${pc(agreeTraits)}  all ${pc(agreeAll)}`);
mism.slice(0, 8).forEach((m) => console.log('  mismatch ' + m));
console.log(`card checks  has own number ${pc(checks.number)}  has next step ${pc(checks.ask)}  <=45 words ${pc(checks.brief)}  no blame ${pc(checks.kind)}`);
fails.slice(0, 6).forEach((m) => console.log('  fail ' + m));
// distinctness: personas in different cells should not share a headline
const byTitle = new Map<string, string[]>();
for (const [id, ts] of titles) for (const t of ts) (byTitle.get(t) ?? byTitle.set(t, []).get(t)!).push(id);
const shared = [...byTitle].filter(([, ids]) => ids.length > 1);
console.log(`distinct headlines  ${titles.size} personas seen, ${shared.length} headline(s) shared across personas` + (shared.length ? ': ' + shared.map(([t, ids]) => `"${t}" (${ids.join(', ')})`).join('; ') : ''));

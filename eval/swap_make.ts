// Swap test (eval/PERSONAS_SPEC.md §swap): can a judge who sees only a customer's facts pick that customer's own
// Kori home over a decoy home built for a different persona from the SAME customer's numbers?
// Floor is 50% (coin flip). Half the decoys swap the money style (same life stage), half swap the life stage (same style).
// Usage: npx --prefix app tsx eval/swap_make.ts [--n 40]   -> eval/swap/pairs.jsonl (judge view) + eval/swap/key.json
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildCustomer } from '../app/src/engine/model';
import { personaOf, STAGES, STYLES, STAGE_INFO, STYLE_INFO, type Persona } from '../app/src/engine/personas';
import { eur } from '../app/src/engine/analytics';

const arg = (k: string, d = '') => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const N = Number(arg('--n', '40'));
const root = new URL('..', import.meta.url).pathname;
const h = (s: string) => parseInt(createHash('sha1').update(s).digest('hex').slice(0, 8), 16);
const items = readFileSync(`${root}eval/items/personas_heldout.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l))
  .sort((a, b) => h('swap' + a.customer) - h('swap' + b.customer)).slice(0, N);

const pct = (x: number) => `${Math.round(x * 100)}%`;
function facts(p: Persona, age: number) {
  const f = p.f;
  return [
    `Age ${age}.`,
    `Income about ${eur(f.incomePerMonth)} a month; income swings by about ${pct(p.incomeCv)} month to month.`,
    `Moves ${pct(f.sweepShare)} of income on to an account at another bank, usually soon after payday.`,
    `Spends ${pct(f.spendRatio)} of what comes in; balance under €100 on ${pct(f.lowBalanceShare)} of days.`,
    `Puts ${pct(Math.max(0, f.savingsRate))} of income into savings or investments.`,
    `${f.slipsPerWeek.toFixed(1)} payments under €20 a week; ${Math.round(f.everydayPerMonth)} everyday payments a month.`,
    `Fixed bills take ${Number.isFinite(f.fixedShare) ? pct(f.fixedShare) : 'n/a'} of income. Pension is ${pct(f.pensionShare)} of income.`,
  ].join(' ');
}
function homeText(p: Persona) {
  return [
    `Persona shown: ${p.name} (${p.line}). Badges: ${STAGE_INFO[p.stage].label}, ${STYLE_INFO[p.style].label}.`,
    ...p.cards.map((c) => `Card: ${c.title}. ${c.body}`),
    `Nudge: ${p.nudge}`,
    `Suggested questions: ${p.questions.join(' | ')}`,
    `Planning slider: ${p.sliders.map((s) => ('title' in s ? s.title : s.kind)).join(', ')}`,
  ].join('\n');
}
const pairs: unknown[] = []; const key: Record<string, { own: 'A' | 'B'; decoy: string; swap: 'style' | 'stage'; own_id: string }> = {};
items.forEach((it, i) => {
  const c = buildCustomer(JSON.parse(readFileSync(`${root}app/public/data/customers/${it.customer}.json`, 'utf8')));
  const own = personaOf(c, (x) => eur(x));
  const swap: 'style' | 'stage' = i % 2 ? 'stage' : 'style';
  let force;
  if (swap === 'style') { const others = STYLES.filter((s) => s !== own.style); force = { style: others[h(it.customer) % others.length] }; }
  else { const k = STAGES.indexOf(own.stage); force = { stage: STAGES[k === 0 ? 1 : k === STAGES.length - 1 ? k - 1 : k + (h(it.customer) % 2 ? 1 : -1)] }; }
  const decoy = personaOf(c, (x) => eur(x), force);
  const ownFirst = h('ab' + it.customer) % 2 === 0;
  const id = `s${String(i + 1).padStart(2, '0')}`;
  pairs.push({ id, facts: facts(own, c.age ?? own.f.age), A: homeText(ownFirst ? own : decoy), B: homeText(ownFirst ? decoy : own) });
  key[id] = { own: ownFirst ? 'A' : 'B', decoy: decoy.id, swap, own_id: own.id };
});
writeFileSync(`${root}eval/swap/pairs.jsonl`, pairs.map((p) => JSON.stringify(p)).join('\n') + '\n');
writeFileSync(`${root}eval/swap/key.json`, JSON.stringify(key, null, 1));
console.log(`wrote ${pairs.length} pairs (${Object.values(key).filter((k) => k.swap === 'style').length} style swaps)`);

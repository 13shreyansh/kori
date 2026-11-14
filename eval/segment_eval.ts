// Behaviour-segment eval. See SEGMENTS_SPEC.md.
// Usage: npx --prefix app tsx eval/segment_eval.ts --split dev|heldout [--spot 10]
import { readFileSync, existsSync } from 'node:fs';
import { buildCustomer } from '../app/src/engine/model';
import { segmentOf, PLAYBOOKS } from '../app/src/engine/segments';
import { eur } from '../app/src/engine/analytics';

const arg = (k: string, d = '') => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const split = arg('--split', 'dev');
const spot = Number(arg('--spot', '0'));
const root = new URL('..', import.meta.url).pathname;
const items = readFileSync(`${root}eval/items/segments_${split}.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const truth = new Map<string, { persona: string; fwd: boolean; light: boolean }>();
const tp = `${root}data/synth_raw/truth.csv`;
if (existsSync(tp)) for (const l of readFileSync(tp, 'utf8').trim().split('\n').slice(1)) {
  const [id, persona, fwd, light] = l.trim().split(',');
  truth.set(id, { persona, fwd: fwd === '1', light: light === '1' });
}

const got: { id: string; seg: string; expect: string; c: ReturnType<typeof buildCustomer> }[] = [];
for (const it of items) {
  const c = buildCustomer(JSON.parse(readFileSync(`${root}app/public/data/customers/${it.customer}.json`, 'utf8')));
  got.push({ id: it.customer, seg: segmentOf(c).id, expect: it.expect, c });
}

// 1. spec agreement
const agree = got.filter((g) => g.seg === g.expect).length / got.length;
console.log(`== segments / ${split}: ${got.length} customers`);
console.log(`spec agreement  ${(agree * 100).toFixed(1)}%`);
for (const g of got.filter((g) => g.seg !== g.expect).slice(0, 8)) console.log(`  mismatch ${g.id}: app=${g.seg} key=${g.expect}`);

// 2. planted truth (synthetic stand-in only)
const rows: [string, string, (t: { persona: string; fwd: boolean; light: boolean }) => boolean][] = [
  ['salary forwarders', 'pass_through', (t) => t.fwd],
  ['light users', 'light_user', (t) => t.light && !t.fwd],
  ['retirees', 'golden_years', (t) => t.persona === 'retiree' && !t.fwd && !t.light],
  ['students', 'starter', (t) => t.persona === 'student' && !t.fwd && !t.light],
];
const planted: Record<string, { recall: number; precision: number; n: number }> = {};
if (truth.size) {
  console.log('planted truth   behaviour -> segment     recall  precision');
  for (const [label, seg, is] of rows) {
    const pos = got.filter((g) => truth.get(g.id) && is(truth.get(g.id)!));
    const pred = got.filter((g) => g.seg === seg);
    const tp = pos.filter((g) => g.seg === seg).length;
    const recall = pos.length ? tp / pos.length : NaN; const precision = pred.length ? pred.filter((g) => truth.get(g.id) && is(truth.get(g.id)!)).length / pred.length : NaN;
    planted[seg] = { recall, precision, n: pos.length };
    console.log(`  ${label.padEnd(18)} -> ${seg.padEnd(13)} ${(recall * 100).toFixed(0).padStart(5)}%  ${(precision * 100).toFixed(0).padStart(7)}%   (n=${pos.length})`);
  }
}

// 3. spread
const counts: Record<string, number> = {};
for (const g of got) counts[g.seg] = (counts[g.seg] ?? 0) + 1;
const maxShare = Math.max(...Object.values(counts)) / got.length;
console.log('spread          ' + Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));
console.log(`                ${Object.keys(counts).length} segments used, largest ${(maxShare * 100).toFixed(0)}%  ${Object.keys(counts).length >= 6 && maxShare <= 0.4 ? 'OK' : 'FAIL'}`);

// human spot check
if (spot) {
  console.log('\n== spot check: does the home card fit this person? (judge yes/no)');
  const pick = [...got].sort((a, b) => a.id.localeCompare(b.id)).filter((_, i) => i % Math.max(1, Math.floor(got.length / spot)) === 0).slice(0, spot);
  for (const g of pick) {
    const s = segmentOf(g.c); const card = PLAYBOOKS[s.id].card(s.f, (x) => eur(x));
    console.log(`\n${g.id} age ${g.c.age} -> ${s.play.name}\n  income ${eur(s.f.incomePerMonth)}/mo, spend ${(s.f.spendRatio * 100).toFixed(0)}%, saves ${(s.f.savingsRate * 100).toFixed(0)}%, sweep ${(s.f.sweepShare * 100).toFixed(0)}%, ${s.f.everydayPerMonth.toFixed(0)} everyday/mo, ${s.f.slipsPerWeek.toFixed(1)} taps/wk\n  "${card.title}": ${card.body}`);
  }
}

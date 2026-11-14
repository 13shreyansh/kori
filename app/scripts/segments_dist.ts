// Prints how demo customers spread over behaviour segments, with the planted truth when available.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { buildCustomer } from '../src/engine/model';
import { segmentOf } from '../src/engine/segments';
const dir = 'public/data/customers/';
const truth = new Map<string, string[]>();
const tp = '../data/synth_raw/truth.csv';
if (existsSync(tp)) for (const l of readFileSync(tp, 'utf8').trim().split('\n').slice(1)) { const [id, ...r] = l.trim().split(','); truth.set(id, r); }
const counts: Record<string, number> = {}; const cross: Record<string, Record<string, number>> = {};
for (const f of readdirSync(dir).filter((f) => f.startsWith('CUST'))) {
  const c = buildCustomer(JSON.parse(readFileSync(dir + f, 'utf8')));
  const s = segmentOf(c);
  counts[s.id] = (counts[s.id] ?? 0) + 1;
  const t = truth.get(c.id); const tk = t ? `${t[0]}${t[1] === '1' ? '+fwd' : ''}${t[2] === '1' ? '+light' : ''}` : '?';
  (cross[s.id] ??= {})[tk] = (cross[s.id][tk] ?? 0) + 1;
}
console.log(counts);
for (const [k, v] of Object.entries(cross)) console.log(k.padEnd(14), JSON.stringify(v));

// Hill climbing with guard rails.
//   npx tsx eval/hill_climb.ts [--limit 120] [--checkpoint]
// 1. Scores the current coach and every candidate in eval/variants/*.json on the DEV split (+ robustness, fixed set A).
// 2. A candidate wins only if: macro score beats the current one by >= MARGIN, and NO rubric group drops by more than 2 points.
//    (So we can't buy "brevity" by breaking correctness, or pedagogy by breaking safety.)
// 3. With --checkpoint, the winner is run ONCE on held-out and appended to HELDOUT_LEDGER.md. A dev gain that doesn't
//    show up on held-out is treated as overfitting and the candidate is not adopted.
// 4. Writes a spot-check sheet of the winner's answers for a human (eval/spotcheck/), because the metrics can be wrong.
import { appendFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { runSplit, summarize, GROUPS, type Scored, type Variant } from './run_eval';

const ROOT = new URL('..', import.meta.url).pathname;
const arg = (k: string, d: string) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const LIMIT = Number(arg('limit', '100000'));
const MARGIN = Number(arg('margin', '0.01'));
const pct = (x: number | null) => (x === null ? '–' : (x * 100).toFixed(1) + '%');

async function devScore(v: Variant) {
  const rows: Scored[] = [...(await runSplit('dev', 'offline', LIMIT, v)), ...(await runSplit('fixed-dev', 'offline', 1e9, v)), ...(await runSplit('robust', 'offline', 1e9, v))];
  return { rows, s: summarize(rows) };
}

const variants: Variant[] = [{ name: 'current' }, ...readdirSync(`${ROOT}eval/variants`).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(`${ROOT}eval/variants/${f}`, 'utf8')))];
const results: { v: Variant; s: ReturnType<typeof summarize>; rows: Scored[] }[] = [];
for (const v of variants) { const r = await devScore(v); results.push({ v, ...r }); console.log(`${v.name.padEnd(28)} macro ${pct(r.s.macro)}  ` + Object.entries(r.s.groups).map(([g, x]) => `${g.split(' ')[0]} ${pct(x)}`).join('  ')); }

const base = results[0];
let best = base; const verdicts: string[] = [];
for (const r of results.slice(1)) {
  const drops = Object.keys(GROUPS).filter((g) => (base.s.groups[g] ?? 0) - (r.s.groups[g] ?? 0) > 0.02);
  const gain = r.s.macro - base.s.macro;
  const ok = gain >= MARGIN && !drops.length;
  verdicts.push(`- **${r.v.name}**: macro ${pct(r.s.macro)} (${gain >= 0 ? '+' : ''}${(gain * 100).toFixed(1)} pts)${drops.length ? `, REJECTED: ${drops.join(', ')} dropped` : ok ? ', candidate' : ', not enough gain'}`);
  if (ok && r.s.macro > best.s.macro) best = r;
}
mkdirSync(`${ROOT}eval/spotcheck`, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
// spot-check sheet: 3 answers per kind, stratified, for a human to grade
const kinds = [...new Set(best.rows.map((r) => r.item.kind))];
const sample = kinds.flatMap((k) => best.rows.filter((r) => r.item.kind === k).slice(0, 3));
const esc = (x: string) => '"' + x.replace(/"/g, '""') + '"';
writeFileSync(`${ROOT}eval/spotcheck/${stamp}-${best.v.name}.csv`, ['id,kind,customer,question,answer,auto_fails,human_correct_0_1,human_helpful_1_5,human_tone_ok_0_1,notes', ...sample.map((r, i) => [i, r.item.kind, r.item.customer, esc(r.item.q), esc(r.text), esc(Object.entries(r.m).filter(([, v]) => v === 0).map(([k]) => k).join(' ')), '', '', '', ''].join(','))].join('\n'));

let ledger = '';
if (process.argv.includes('--checkpoint')) {
  const held = [...(await runSplit('heldout', 'offline', LIMIT, best.v)), ...(await runSplit('fixed-heldout', 'offline', 1e9, best.v))];
  const hs = summarize(held);
  ledger = `held-out macro ${pct(hs.macro)}`;
  appendFileSync(`${ROOT}eval/HELDOUT_LEDGER.md`, `| auto | ${new Date().toISOString().slice(0, 16)} | hill-climb winner: ${best.v.name} | ${pct(hs.macro)} (macro) | dev macro ${pct(best.s.macro)}; gap ${((best.s.macro - hs.macro) * 100).toFixed(1)} pts |\n`);
}
const report = `# Hill-climb run ${stamp}\n\nDev items per run: ${best.rows.length}. Winner: **${best.v.name}** (dev macro ${pct(best.s.macro)}). ${ledger}\n\n${verdicts.join('\n') || '- no candidates in eval/variants/'}\n\nSpot-check sheet: eval/spotcheck/${stamp}-${best.v.name}.csv (grade it, then run eval/agreement.ts)\n`;
writeFileSync(`${ROOT}eval/runs/hillclimb-${stamp}.md`, report);
console.log('\n' + report);

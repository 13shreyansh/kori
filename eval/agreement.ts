// Do the automatic metrics agree with a human? Run after filling in a spot-check CSV.
//   npx tsx eval/agreement.ts eval/spotcheck/<file>.csv
// If auto says "pass" but the human says "wrong" (or the reverse) more than ~10% of the time, fix the METRIC before climbing on it.
import { readFileSync } from 'node:fs';
const f = process.argv[2];
const rows = readFileSync(f, 'utf8').trim().split('\n').slice(1).map((l) => (l.match(/("([^"]|"")*"|[^,]*)(,|$)/g) ?? []).map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"')));
const graded = rows.filter((r) => r[6] !== '' && r[6] !== undefined);
if (!graded.length) { console.log('No graded rows yet. Fill human_correct_0_1 / human_helpful_1_5 / human_tone_ok_0_1.'); process.exit(0); }
let agree = 0, autoPassHumanFail = 0, autoFailHumanPass = 0; let helpful = 0;
for (const r of graded) {
  const autoPass = r[5].trim() === '';
  const human = r[6].trim() === '1';
  if (autoPass === human) agree++; else if (autoPass) autoPassHumanFail++; else autoFailHumanPass++;
  helpful += Number(r[7] || 0);
}
console.log(`graded ${graded.length}: agreement ${((agree / graded.length) * 100).toFixed(0)}%`);
console.log(`  auto PASS but human says wrong: ${autoPassHumanFail}  <- metric too lenient, add a check`);
console.log(`  auto FAIL but human says right: ${autoFailHumanPass}  <- metric too strict, log a fix in METRICS_LOG.md`);
console.log(`  mean human helpfulness: ${(helpful / graded.length).toFixed(2)} / 5`);

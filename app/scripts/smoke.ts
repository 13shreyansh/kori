import { readFileSync, readdirSync } from 'node:fs';
import { buildCustomer } from '../src/engine/model';
import * as A from '../src/engine/analytics';
const dir = 'public/data/customers/';
const files = readdirSync(dir).filter((f) => f.startsWith('CUST')).slice(0, 6);
for (const f of files) {
  const c = buildCustomer(JSON.parse(readFileSync(dir + f, 'utf8')));
  const b = A.baskets(c);
  const s = A.safeToSpend(c);
  const p = A.spenderProfile(c);
  console.log(c.id, c.age, c.tx.length, 'today', c.today, '| series', c.series.map((x) => x.label + ' ' + x.typicalAmount).join(', '));
  console.log('  baskets', b.rows.map((r) => `${r.basket} ${r.perMonth}`).join(' '), 'slips', b.slips.count, b.slips.total);
  console.log('  safe', s.week, s.steps.map((x) => x.label + ' ' + x.amount).join(' | '), 'payday', s.nextPayday);
  console.log('  profile', p.type.name, p.traits.map((t) => t.key + '=' + t.display).join(' '));
  console.log('  taxi last month', A.spend(c, { period: 'last_month', category: ['taxi'] }).total, '| insights', A.insights(c).map((i) => i.title).join(' / '));
}

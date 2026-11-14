import { readFileSync } from 'node:fs';
import { buildCustomer } from '../src/engine/model';
import { answerOffline } from '../src/coach/coach';
const c = buildCustomer(JSON.parse(readFileSync('public/data/customers/' + (process.argv[2] || 'CUST00050') + '.json', 'utf8')));
const qs = process.argv.slice(3).length ? process.argv.slice(3) : ['How much did I spend on taxis last month?', 'What kind of spender am I?', 'What is safe for me to spend this week?', 'How much could I save if I reduced dining out by 20%?', 'Where does my money go?', 'What were my surprise costs?', 'Which subscriptions do I have?', 'How do I compare to other Finns?', 'What is an emergency fund?', 'Should I buy Tesla stock?', 'Paljonko kulutin taksiin viime kuussa?', 'how much on coffee this month', 'upcoming bills', 'show my three baskets'];
for (const q of qs) { const a = answerOffline(c, q); console.log(`\nQ: ${q}\n[${a.intent}] ${a.text}\n  receipts: ${a.receipts.map((r) => r.label + '=' + r.value).join(' | ')}`); }

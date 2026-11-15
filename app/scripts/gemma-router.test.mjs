import test from 'node:test';
import assert from 'node:assert/strict';
import { routeRequest, validateRoute } from '../api/route.js';
import { onRequest } from '../functions/api/route.js';

test('Gemma selects an existing card without sending account data', async () => {
  let call;
  const fetcher = async (url, options) => {
    call = { url, ...options, body: JSON.parse(options.body) };
    return Response.json({ choices: [{ message: { content: JSON.stringify({ block: 'plan-timeline', params: { monthly: 900 } }) } }] });
  };
  const result = await routeRequest('POST', { question: 'What if I save 900 a month?', transactions: [{ secret: 'PRIVATE' }] }, { FEATHERLESS_API_KEY: 'test-only' }, fetcher);
  assert.equal(call.url, 'https://api.featherless.ai/v1/chat/completions');
  assert.match(call.body.model, /gemma/);
  assert.equal(JSON.stringify(call.body).includes('PRIVATE'), false);
  assert.equal(result.body.provider, 'featherless');
  assert.equal(result.body.params.monthly, 900);
  assert.equal(result.body.fallback, false);
});
test('invented numeric substrings and unused year flags are refused', () => {
  assert.deepEqual(validateRoute({ block: 'plan-timeline', params: { monthly: 9, year: true } }, 'Save 900 each month'), { block: 'plan-timeline', params: {} });
  assert.deepEqual(validateRoute({ block: 'payday-runway', params: { ticket: 1200 } }, 'Can I afford a 1,200 euro ticket?'), { block: 'payday-runway', params: {} });
});
test('unavailable, malformed and invented cards use the built-in fallback', async () => {
  for (const response of [Response.json({}, { status: 429 }), Response.json({ choices: [{ message: { content: 'not-json' } }] }), Response.json({ choices: [{ message: { content: '{"block":"transfer-money"}' } }] })]) {
    const r = await routeRequest('POST', { question: 'Pay rent' }, { FEATHERLESS_API_KEY: 'test-only' }, async () => response);
    assert.deepEqual(r.body, { fallback: true });
  }
});
test('empty and non-POST input do not call a provider', async () => {
  const never = () => { throw Error('Provider must not run'); };
  assert.equal((await routeRequest('POST', { question: ' ' }, {}, never)).status, 400);
  assert.equal((await routeRequest('GET', {}, {}, never)).status, 405);
});
test('Cloudflare requests do not mutate process-wide provider credentials', async () => {
  const previous = process.env.FEATHERLESS_API_KEY;
  const response = await onRequest({ request: new Request('https://kori.invalid/api/route', { method: 'POST', body: JSON.stringify({ question: 'Café spending' }) }), env: {} });
  assert.deepEqual(await response.json(), { fallback: true });
  assert.equal(process.env.FEATHERLESS_API_KEY, previous);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('signed amounts and Finnish decimal commas remain whole literals', () => {
  for (const value of [12, 50]) assert.deepEqual(validateRoute({block:'payday-runway',params:{ticket:value}}, 'Can I spend 12,50 euros?').params, {});
  assert.equal(validateRoute({block:'payday-runway',params:{ticket:12.5}}, 'Can I spend 12,50 euros?').params.ticket,12.5);
  for (const question of ['-50 euros', '- 50 euros', '−€50 euros', '€-50 euros']) assert.deepEqual(validateRoute({block:'payday-runway',params:{ticket:50}}, question).params, {});
});


test('provider aborts return the safe built-in route without leaking an error', async () => {
  const aborted = async () => { throw new DOMException('Timed out', 'TimeoutError'); };
  const result = await routeRequest('POST', { question: 'Where does my money go?' }, { FEATHERLESS_API_KEY: 'test-only' }, aborted);
  assert.deepEqual(result, { status: 200, body: { fallback: true } });
});

test('a category-cost question cannot silently become a spending-habits card', async () => {
  const wrongCard = async () => Response.json({choices:[{message:{content:JSON.stringify({block:'baskets',params:{}})}}]});
  const result = await routeRequest('POST',{question:'What do my subscriptions cost in a year?'},{FEATHERLESS_API_KEY:'test-only'},wrongCard);
  assert.deepEqual(result.body,{fallback:true});
});

test('annual wording retains an explicit annual receipt flag', () => {
  for (const wording of ['annually','yearly','per year'])
    assert.equal(validateRoute({block:'receipt',params:{category:'subscriptions',year:true}}, `What do my subscriptions cost ${wording}?`).params.year,true);
});

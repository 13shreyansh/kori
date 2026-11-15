// Only the question enters the model request. Transactions and calculations stay local.
export const blocks = ['receipt', 'plan-timeline', 'payday-runway', 'coming-up', 'baskets', 'unsupported'];
const categories = ['wolt', 'cafe', 'groceries', 'subscriptions', 'hockey', 'saturday', 'lunch', 'taxi'];
const instruction = 'Choose an existing banking card. Return JSON only: {"block":"receipt|plan-timeline|payday-runway|coming-up|baskets|unsupported","params":{"category":"wolt|cafe|groceries|subscriptions|hockey|saturday|lunch|taxi","monthly":number,"ticket":number,"year":boolean}}. Copy numbers explicitly stated by the user only. Do not calculate, answer the question, or write prose. Saving each month or goal dates: plan-timeline. Affording a ticket or safe spending: payday-runway. Bills before payday: coming-up. Spending habits or where money goes: baskets. Spending on a merchant/category: receipt. Anything else: unsupported. Omit unused parameters.';

export function validateRoute(value, question) {
  if (!value || !blocks.includes(value.block)) throw Error('Unknown card');
  const params = {};
  if (categories.includes(value.params?.category)) params.category = value.params.category;
  const statedNumbers = new Set();
  for (const match of question.matchAll(/(?<![\p{L}\p{N}_.])(?:[-+−]\s*)?(?:€\s*)?\d+(?:[., \u00a0\u202f]\d+)*(?![\p{L}\p{N}_.])/gu)) {
    let literal = match[0].replaceAll('€', '').replaceAll('−', '-').trim();
    if (/^-/.test(literal)) continue;
    literal = literal.replace(/^\+\s*/, '');
    if (/\s/.test(literal)) {
      if (!/^\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?:[.,]\d{1,2})?$/.test(literal)) continue;
      literal = literal.replace(/[ \u00a0\u202f]/g, '');
    }
    if (/^\d{1,3}(?:,\d{3})+\.\d{1,2}$/.test(literal)) literal = literal.replaceAll(',', '');
    else if (/^\d{1,3}(?:\.\d{3})+,\d{1,2}$/.test(literal)) literal = literal.replaceAll('.', '').replace(',', '.');
    else if (/^\d+[.,]\d{1,2}$/.test(literal)) literal = literal.replace(',', '.');
    else if (!/^\d+$/.test(literal)) continue; // Omit ambiguous separators rather than inventing an amount.
    statedNumbers.add(Number(literal));
  }
  for (const field of ['monthly', 'ticket'])
    if (Number.isFinite(value.params?.[field]) && value.params[field] >= 0 && statedNumbers.has(value.params[field])) params[field] = value.params[field];
  if (value.params?.year === true && /\byear\b/i.test(question)) params.year = true;
  return { block: value.block, params };
}

export async function routeRequest(method, body, env = {}, fetcher = fetch) {
  if (method !== 'POST') return { status: 405, body: { error: 'POST only' } };
  const question = typeof body?.question === 'string' ? body.question.trim().slice(0, 1000) : '';
  if (!question) return { status: 400, body: { error: 'Enter a question' } };
  const featherless = Boolean(env.FEATHERLESS_API_KEY);
  const key = env.FEATHERLESS_API_KEY || env.GEMINI_API_KEY;
  if (!key) return { status: 200, body: { fallback: true } };
  const model = featherless ? (env.FEATHERLESS_MODEL || 'google/gemma-3-4b-it') : (env.GEMINI_MODEL || 'gemini-flash-latest');
  const endpoint = featherless ? 'https://api.featherless.ai/v1/chat/completions' : `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  try {
    const response = await fetcher(endpoint, {
      method: 'POST',
      headers: featherless ? { 'content-type': 'application/json', authorization: `Bearer ${key}` } : { 'content-type': 'application/json', 'x-goog-api-key': key },
      signal: AbortSignal.timeout(5200),
      body: JSON.stringify(featherless ? {
        model, messages: [{ role: 'system', content: instruction }, { role: 'user', content: question }],
        temperature: 0, max_tokens: 180, response_format: { type: 'json_object' },
      } : {
        systemInstruction: { parts: [{ text: instruction }] }, contents: [{ role: 'user', parts: [{ text: question }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0, maxOutputTokens: 180 },
      }),
    });
    if (!response.ok) throw Error('Provider unavailable');
    const data = await response.json();
    const text = featherless ? data.choices?.[0]?.message?.content : data.candidates?.[0]?.content?.parts?.map(x => x.text || '').join('');
    const parsed = JSON.parse(String(text || '').replace(/^```(?:json)?\s*|\s*```$/g, ''));
    return { status: 200, body: { ...validateRoute(parsed, question), provider: featherless ? 'featherless' : 'gemini', model, fallback: false } };
  } catch {
    return { status: 200, body: { fallback: true } };
  }
}

export default async function handler(req, res) {
  const result = await routeRequest(req.method, req.body, process.env);
  return res.status(result.status).json(result.body);
}

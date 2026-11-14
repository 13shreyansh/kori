import type { Receipt } from '../engine/analytics';
import type { Customer } from '../engine/model';
import { answerOffline, type CoachAnswer } from './coach';
import { SYSTEM_PROMPT } from './prompt';
import { segmentOf } from '../engine/segments';
import { runTool, TOOL_DECLS, ungroundedNumbers } from './tools';

export async function providerStatus(): Promise<string> {
  try { const r = await fetch('api/health'); const j = await r.json(); return j.gemini ? 'gemini' : 'offline'; } catch { return 'offline'; }
}

type Part = { text?: string; functionCall?: { name: string; args: Record<string, unknown> }; functionResponse?: { name: string; response: unknown } };
type Content = { role: 'user' | 'model'; parts: Part[] };

/** Gemini writes the words; the on-device engine supplies every number via tools. */
export async function askGemini(c: Customer, q: string, history: { role: string; text: string }[], call: (body: unknown) => Promise<any>, systemPrompt = SYSTEM_PROMPT, temperature = 0.3): Promise<CoachAnswer> {
  const contents: Content[] = [...history.map((h) => ({ role: (h.role === 'user' ? 'user' : 'model') as 'user' | 'model', parts: [{ text: h.text }] })), { role: 'user', parts: [{ text: q }] }];
  const results: unknown[] = []; const receipts: Receipt[] = []; const calls: CoachAnswer['toolCalls'] = [];
  for (let step = 0; step < 5; step++) {
    const res = await call({
      systemInstruction: { parts: [{ text: systemPrompt.replace('{TODAY}', c.today).replace('{AGE}', String(c.age)) }] },
      contents, tools: [{ functionDeclarations: TOOL_DECLS }], generationConfig: { temperature, maxOutputTokens: 400 },
    });
    const parts: Part[] = res?.candidates?.[0]?.content?.parts ?? [];
    const fcs = parts.filter((p) => p.functionCall);
    if (!fcs.length) {
      const text = parts.map((p) => p.text ?? '').join('').trim();
      const off = answerOffline(c, q);
      const bad = ungroundedNumbers(text, results);
      if (!text || bad.length) return { ...off, toolCalls: calls, text: off.text, provider: 'offline', ...(bad.length ? { guard: bad } : {}) } as CoachAnswer;
      return { ...off, text, receipts: [...receipts, ...off.receipts], provider: 'gemini', toolCalls: calls };
    }
    contents.push({ role: 'model', parts: fcs });
    const responses: Part[] = [];
    for (const p of fcs) {
      const { name, args } = p.functionCall!;
      const out = runTool(c, name, args ?? {});
      calls.push({ name, args }); results.push(out.result); receipts.push(...out.receipts);
      responses.push({ functionResponse: { name, response: { content: out.result } } });
    }
    contents.push({ role: 'user', parts: responses });
  }
  return answerOffline(c, q);
}

export async function askCoach(c: Customer, q: string, history: { role: string; text: string }[], provider: string): Promise<CoachAnswer> {
  if (provider === 'gemini') {
    try {
      const seg = segmentOf(c).play;
      return await askGemini(c, q, history, async (body) => {
        const r = await fetch('api/gemini', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
        if (!r.ok) throw new Error('gemini ' + r.status);
        return r.json();
      }, `${SYSTEM_PROMPT}\n\nThis customer's behaviour segment: ${seg.name}. ${seg.tone}`);
    } catch (e) { console.warn('Gemini failed, using on-device coach', e); }
  }
  await new Promise((r) => setTimeout(r, 450)); // feels less robotic than an instant reply
  return answerOffline(c, q);
}

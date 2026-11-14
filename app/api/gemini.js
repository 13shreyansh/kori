// Vercel function: forwards the coach's tool-calling request to Gemini so the key stays on the server.
// The browser only ever sends totals produced by the on-device engine, never raw transactions.
export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!key) return res.status(503).json({ error: 'no GEMINI_API_KEY' });
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
    });
    res.status(r.status).setHeader('content-type', 'application/json');
    return res.send(await r.text());
  } catch (e) {
    return res.status(502).json({ error: String(e) });
  }
}

// Tiny proxy so the Gemini key stays on the server. The browser sends only tool summaries, never raw transactions.
export function geminiMiddleware(env = process.env) {
  const key = env.GEMINI_API_KEY;
  const model = env.GEMINI_MODEL || 'gemini-flash-latest';
  return async (req, res, next) => {
    if (req.url === '/api/health') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ gemini: !!key, model })); }
    if (req.url !== '/api/gemini' || req.method !== 'POST') return next();
    if (!key) { res.statusCode = 503; return res.end('{"error":"no GEMINI_API_KEY"}'); }
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body });
      res.statusCode = r.status; res.setHeader('content-type', 'application/json'); res.end(await r.text());
    } catch (e) { res.statusCode = 502; res.end(JSON.stringify({ error: String(e) })); }
  };
}

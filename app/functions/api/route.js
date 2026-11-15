// Cloudflare Pages adapter for the Vercel-style handler in /api/route.js.
import handler from "../../api/route.js";

export async function onRequest({ request, env }) {
  globalThis.process = globalThis.process || { env: {} };
  globalThis.process.env = { ...(globalThis.process.env || {}), GEMINI_API_KEY: env.GEMINI_API_KEY, GEMINI_MODEL: env.GEMINI_MODEL };
  let body = {};
  if (request.method === "POST") {
    try { body = await request.json(); } catch { body = {}; }
  }
  return new Promise((resolve) => {
    let status = 200;
    const res = {
      status(code) { status = code; return res; },
      json(obj) { resolve(new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } })); return res; },
    };
    Promise.resolve(handler({ method: request.method, body }, res)).catch(() =>
      resolve(new Response(JSON.stringify({ fallback: true }), { status: 200, headers: { "content-type": "application/json" } })),
    );
  });
}

// Production server: static app + Gemini proxy. `GEMINI_API_KEY=... node server/serve.mjs`
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { geminiMiddleware } from './gemini.mjs';
const root = new URL('../dist/', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const api = geminiMiddleware();
createServer((req, res) => api(req, res, async () => {
  const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  let f = join(root, p);
  try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); } catch { f = join(root, 'index.html'); }
  try { res.setHeader('content-type', types[extname(f)] ?? 'application/octet-stream'); res.end(await readFile(f)); } catch { res.statusCode = 404; res.end('not found'); }
})).listen(process.env.PORT || 8080, () => console.log('Kori on http://localhost:' + (process.env.PORT || 8080)));

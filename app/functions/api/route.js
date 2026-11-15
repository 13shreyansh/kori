import { routeRequest } from '../../api/route.js';

export async function onRequest({ request, env }) {
  let body = {};
  if (request.method === 'POST') {
    try { body = await request.json(); } catch { /* Invalid JSON becomes an empty question. */ }
  }
  const result = await routeRequest(request.method, body, env);
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

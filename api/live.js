import { getCache } from '@vercel/functions';

const KEY = 'code-qube-live-link';
const TTL = 180;

const response = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type'
  }
});

export async function OPTIONS() { return response({ ok: true }); }

export async function GET() {
  const item = await getCache().get(KEY);
  if (!item?.url || !item?.expiresAt || item.expiresAt <= Date.now()) return response({ active: false });
  return response({ active: true, url: item.url, expiresAt: item.expiresAt });
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return response({ error: 'Invalid request.' }, 400); }
  const raw = typeof body?.url === 'string' ? body.url.trim() : '';
  if (!raw || raw.length > 2048) return response({ error: 'Enter a valid URL.' }, 400);
  let url;
  try { url = new URL(raw); } catch { return response({ error: 'Enter a valid URL.' }, 400); }
  if (!['http:', 'https:'].includes(url.protocol)) return response({ error: 'Only http and https links are allowed.' }, 400);

  const expiresAt = Date.now() + TTL * 1000;
  await getCache().set(KEY, { url: url.href, expiresAt }, { ttl: TTL, name: 'Temporary CODE QUBE live link' });
  return response({ active: true, url: url.href, expiresAt }, 201);
}

export async function DELETE() {
  await getCache().delete(KEY);
  return response({ active: false });
}

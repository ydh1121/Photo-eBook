import {EBOOK_LIMITS, validateBudgetAttestation} from './ebook-asset-budget.js';

const fail = (status, code) => new Response(JSON.stringify({ok: false, code, message: '이미지를 불러오지 못했습니다. 본문은 계속 읽을 수 있습니다.'}), {status, headers: {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'}});
const hex = data => Array.from(new Uint8Array(data), n => n.toString(16).padStart(2, '0')).join('');

export function createEbookAssetHandler({assets, now = Date.now, cache = null} = {}) {
  return async function handle(context) {
    const {request, env = {}} = context, url = new URL(request.url);
    if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, {status: 405, headers: {Allow: 'GET, HEAD', 'Cache-Control': 'no-store'}});
    const match = url.pathname.match(/^\/api\/ebook-assets\/([a-f0-9]{64})\.webp$/);
    if (!match || url.search) return fail(404, 'asset_not_found');
    const hash = match[1], asset = assets && Object.hasOwn(assets, hash) ? assets[hash] : null;
    if (!asset) return fail(404, 'asset_not_found');
    if (env.EBOOK_ASSETS_ENABLED !== 'true' || !env.EBOOK_ASSETS_DB) return fail(503, 'asset_delivery_not_enabled');
    const verified = validateBudgetAttestation(env.EBOOK_BUDGET_ATTESTATION, now());
    if (!verified.ok) return fail(503, verified.reason);
    if (request.headers.has('Range')) return fail(416, 'range_not_supported');
    const headers = {'Content-Type': 'image/webp', 'Content-Length': String(asset.bytes), 'Cache-Control': 'public, max-age=31536000, immutable', ETag: '"' + hash + '"', 'X-Content-Type-Options': 'nosniff', 'X-Ebook-Origin': 'd1', 'Cross-Origin-Resource-Policy': 'same-origin'};
    const db = env.EBOOK_ASSETS_DB, day = new Date(now()).toISOString().slice(0, 10);
    try {
      // This indexed row is shared across isolates. It caps this project's
      // valid asset requests, including Cache API hits. Free-plan account
      // limits are still the authority for all account traffic.
      const usage = await db.prepare('INSERT INTO ebook_asset_daily_usage (day, requests) VALUES (?1, 1) ON CONFLICT(day) DO UPDATE SET requests = requests + 1 WHERE requests < ?2 RETURNING requests').bind(day, EBOOK_LIMITS.maxDailyAssetRequests).first();
      if (!usage) return fail(429, 'asset_daily_budget');
      if (request.method === 'HEAD' || request.headers.get('If-None-Match') === headers.ETag) {
        // An allowlisted build asset may not have been imported yet. Metadata
        // requests must not report a successful publication before it exists.
        const metadata = await db.prepare('SELECT byte_length, mime_type FROM ebook_assets WHERE sha256 = ?1 AND published = 1').bind(hash).first();
        if (!metadata) return fail(404, 'asset_not_published');
        if (metadata.byte_length !== asset.bytes || metadata.mime_type !== 'image/webp') return fail(503, 'asset_integrity_error');
        if (request.headers.get('If-None-Match') === headers.ETag) { const h = {...headers}; delete h['Content-Length']; return new Response(null, {status: 304, headers: h}); }
        return new Response(null, {status: 200, headers});
      }
      const activeCache = cache || (typeof caches !== 'undefined' ? caches.default : null), cacheKey = new Request(url.origin + url.pathname, {method: 'GET'});
      const cached = activeCache ? await activeCache.match(cacheKey) : null;
      if (cached) return cached;
      const row = await db.prepare('SELECT body, byte_length, mime_type FROM ebook_assets WHERE sha256 = ?1 AND published = 1').bind(hash).first();
      if (!row) return fail(404, 'asset_not_published');
      const bytes = row.body instanceof ArrayBuffer ? new Uint8Array(row.body) : new Uint8Array(row.body);
      if (row.byte_length !== asset.bytes || bytes.byteLength !== asset.bytes || row.mime_type !== 'image/webp' || bytes.byteLength > EBOOK_LIMITS.maxAssetBytes) return fail(503, 'asset_integrity_error');
      if (String.fromCharCode(...bytes.slice(0, 4)) !== 'RIFF' || String.fromCharCode(...bytes.slice(8, 12)) !== 'WEBP' || hex(await crypto.subtle.digest('SHA-256', bytes)) !== hash) return fail(503, 'asset_integrity_error');
      const response = new Response(bytes, {status: 200, headers});
      if (activeCache) {
        const job = activeCache.put(cacheKey, response.clone()).catch(() => {});
        if (context.waitUntil) context.waitUntil(job); else await job;
      }
      return response;
    } catch { return fail(503, 'asset_store_unavailable'); }
  };
}

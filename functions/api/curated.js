let cachedToken = null;
let lastManualRefresh = 0;

const SHEET = 'CURATED_LINKS';
const HEADERS = [
  'id', 'title', 'url', 'platform', 'author', 'published_at', 'summary',
  'thumbnail_url', 'og_title', 'og_description', 'tags', 'reaction_text',
  'reaction_value', 'manual_score', 'is_favorite', 'is_visible', 'sort_order',
  'source_query', 'fetch_status', 'last_checked_at', 'created_at', 'updated_at'
];

export async function onRequest(context) {
  const { request, env } = context;

  try {
    if (request.method === 'GET') {
      let rows = await readRows(env);
      const visible = rows.filter(row => truthy(row.is_visible));
      const missing = visible.filter(needsInitialFetch).slice(0, 4);
      let refreshed = false;

      if (missing.length) {
        await refreshRows(env, missing, { force: true });
        rows = await readRows(env);
        refreshed = true;
      }

      const stale = rows
        .filter(row => truthy(row.is_visible) && isStale(row) && !needsInitialFetch(row))
        .slice(0, 5);

      if (stale.length) {
        context.waitUntil(refreshRows(env, stale, { force: false }).catch(console.error));
      }

      return json({
        ok: true,
        items: sortRows(rows.filter(row => truthy(row.is_visible))).map(publicRow),
        refreshed
      });
    }

    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      if (body.action !== 'refresh') {
        return json({ ok: false, message: '지원하지 않는 요청입니다.' }, 400);
      }

      const now = Date.now();
      if (now - lastManualRefresh < 60000) {
        return json({ ok: true, updated: 0, message: '최근에 이미 확인했습니다.' });
      }

      lastManualRefresh = now;
      const rows = (await readRows(env))
        .filter(row => truthy(row.is_visible))
        .slice(0, 10);
      const updated = await refreshRows(env, rows, { force: true });
      return json({ ok: true, updated });
    }

    return json({ ok: false, message: 'Method not allowed' }, 405);
  } catch (error) {
    console.error(error);
    return json({ ok: false, message: safeError(error) }, 500);
  }
}

function publicRow(row) {
  const out = {};
  for (const key of HEADERS) {
    if (['source_query', 'fetch_status', 'last_checked_at', 'created_at', 'updated_at'].includes(key)) continue;
    out[key] = row[key] ?? '';
  }
  return out;
}

function sortRows(rows) {
  return [...rows].sort((a, b) =>
    number(a.sort_order, 999) - number(b.sort_order, 999) ||
    number(b.manual_score, 0) - number(a.manual_score, 0)
  );
}

function number(value, fallback) {
  const n = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

function truthy(value) {
  return !['FALSE', '0', 'NO', 'N', ''].includes(String(value ?? '').trim().toUpperCase());
}

function needsInitialFetch(row) {
  return Boolean(row.url) && (!row.thumbnail_url || !row.og_title || !row.og_description);
}

function isStale(row) {
  const raw = String(row.last_checked_at || '').trim();
  if (!raw) return true;
  const parsed = Date.parse(raw.replace(' ', 'T') + '+09:00');
  if (!Number.isFinite(parsed)) return true;
  return Date.now() - parsed > 7 * 24 * 60 * 60 * 1000;
}

async function readRows(env) {
  const values = await readValues(env, `${SHEET}!A:V`);
  if (!values.length) return [];

  const headers = (values[0] || []).map(value => String(value || '').trim());
  return values
    .slice(1)
    .map((cells, index) => {
      const row = { _row: index + 2, _cells: [...cells] };
      headers.forEach((header, i) => {
        if (header) row[header] = cells[i] ?? '';
      });
      return row;
    })
    .filter(row => String(row.url || '').trim());
}

async function refreshRows(env, rows, { force = false } = {}) {
  let updated = 0;

  for (const row of rows) {
    if (!row.url) continue;
    if (!force && !isStale(row) && !needsInitialFetch(row)) continue;

    try {
      const meta = await fetchMetadata(row.url);
      const cells = Array.from({ length: HEADERS.length }, (_, i) => row._cells[i] ?? '');
      const set = (name, value, onlyIfBlank = false) => {
        const i = HEADERS.indexOf(name);
        if (i < 0) return;
        if (onlyIfBlank && String(cells[i] ?? '').trim()) return;
        cells[i] = value ?? '';
      };

      if (!String(row.id || '').trim()) set('id', `link-${hashUrl(row.url)}`);
      set('title', meta.title || row.title || '', true);
      set('platform', meta.platform || row.platform || inferPlatform(row.url), true);
      set('author', meta.author || row.author || '', true);
      set('published_at', meta.published || row.published_at || '', true);
      set('summary', meta.description || row.summary || '', true);
      set('thumbnail_url', meta.image || row.thumbnail_url || '');
      set('og_title', meta.title || row.og_title || row.title || '');
      set('og_description', meta.description || row.og_description || row.summary || '');

      if (!String(row.reaction_text || '').trim() && meta.reactionText) {
        set('reaction_text', meta.reactionText);
      }
      if (!String(row.reaction_value || '').trim() && meta.reactionValue !== '') {
        set('reaction_value', meta.reactionValue);
      }

      set('fetch_status', 'ok');
      set('last_checked_at', koreaTime());
      set('updated_at', koreaTime());

      await updateValues(env, `${SHEET}!A${row._row}:V${row._row}`, [cells]);
      updated++;
    } catch (error) {
      const cells = Array.from({ length: HEADERS.length }, (_, i) => row._cells[i] ?? '');
      cells[HEADERS.indexOf('fetch_status')] = `error: ${safeError(error).slice(0, 180)}`;
      cells[HEADERS.indexOf('last_checked_at')] = koreaTime();
      cells[HEADERS.indexOf('updated_at')] = koreaTime();
      await updateValues(env, `${SHEET}!A${row._row}:V${row._row}`, [cells]).catch(() => {});
    }
  }

  return updated;
}

async function fetchMetadata(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Photo-eBook Curator/1.0)',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });

    if (!response.ok) throw new Error(`페이지 응답 ${response.status}`);

    const html = (await response.text()).slice(0, 900000);
    const tags = [...html.matchAll(/<meta\s+[^>]*>/gi)].map(match => parseAttrs(match[0]));
    const meta = key => {
      const lower = key.toLowerCase();
      const found = tags.find(attrs => String(attrs.property || attrs.name || '').toLowerCase() === lower);
      return decodeHtml(found?.content || '');
    };

    const title =
      meta('og:title') ||
      meta('twitter:title') ||
      decodeHtml((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
    const description = meta('og:description') || meta('description') || meta('twitter:description');
    const rawImage = meta('og:image') || meta('twitter:image');
    const image = absoluteUrl(rawImage, response.url || url);
    const author = meta('author') || meta('article:author');
    const published = (meta('article:published_time') || meta('date') || '').slice(0, 10);
    const platform = meta('og:site_name') || inferPlatform(response.url || url);
    const engagement = extractEngagement(html);

    return {
      title,
      description,
      image,
      author,
      published,
      platform,
      reactionText: engagement.text,
      reactionValue: engagement.value
    };
  } finally {
    clearTimeout(timer);
  }
}

function parseAttrs(tag) {
  const attrs = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return attrs;
}

function decodeHtml(text) {
  return String(text || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteUrl(value, base) {
  try {
    return value ? new URL(value, base).toString() : '';
  } catch {
    return '';
  }
}

function inferPlatform(url) {
  try {
    const host = new URL(url).hostname;
    if (host.includes('brunch.co.kr')) return '브런치';
    if (host.includes('tistory.com')) return '티스토리';
    return host.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function extractEngagement(html) {
  const text = decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  );

  const brunch = text.match(/라이킷(?:\s*수)?\s*([\d,]+)/);
  if (brunch) {
    const value = Number(brunch[1].replace(/,/g, ''));
    return { text: `라이킷 ${value.toLocaleString('ko-KR')}`, value };
  }

  const comments = text.match(/댓글(?:달기)?\s*([\d,]+)/);
  if (comments) {
    const value = Number(comments[1].replace(/,/g, ''));
    return { text: `댓글 ${value.toLocaleString('ko-KR')}`, value };
  }

  return { text: '', value: '' };
}

function hashUrl(value) {
  let hash = 2166136261;
  for (const ch of String(value || '')) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

async function readValues(env, range) {
  const token = await getAccessToken(env);
  const id = sheetId(env);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Google Sheets 읽기 실패 (${response.status})`);
  return Array.isArray(data.values) ? data.values : [];
}

async function updateValues(env, range, values) {
  const token = await getAccessToken(env);
  const id = sheetId(env);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ majorDimension: 'ROWS', values })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Google Sheets 수정 실패 (${response.status})`);
  return data;
}

async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken?.token && cachedToken.expiresAt - 60 > now) return cachedToken.token;

  const account = parseAccount(env);
  if (!account?.client_email || !account?.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON Secret을 확인해 주세요.');
  }

  const tokenUri = account.token_uri || 'https://oauth2.googleapis.com/token';
  const header = base64UrlJson({ alg: 'RS256', typ: 'JWT' });
  const claims = base64UrlJson({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: tokenUri,
    exp: now + 3600,
    iat: now
  });
  const input = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemBuffer(account.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    new TextEncoder().encode(input)
  );
  const assertion = `${input}.${base64UrlBytes(new Uint8Array(signature))}`;

  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error(data?.error_description || data?.error || `Google 인증 실패 (${response.status})`);
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: now + Number(data.expires_in || 3600)
  };
  return cachedToken.token;
}

function parseAccount(env) {
  const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON || env.GOOGLE_SERVICE_ACCOUNT_JS || '';
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 값이 올바른 JSON 형식이 아닙니다.');
  }
}

function sheetId(env) {
  const id = String(env.GOOGLE_SHEET_ID || '').trim();
  if (!id) throw new Error('GOOGLE_SHEET_ID 환경변수가 없습니다.');
  return id;
}

function base64UrlJson(value) {
  return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));
}

function base64UrlBytes(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function pemBuffer(pem) {
  const body = String(pem)
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\s+/g, '');
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function koreaTime() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(new Date()).replace('T', ' ');
}

function safeError(error) {
  return String(error?.message || error || '알 수 없는 오류')
    .replace(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g, '[redacted]');
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

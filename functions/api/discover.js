/* v32: relevance-validated Brunch/Tistory discovery with Google Sheet priority cache. */
let cachedToken = null;
let memoryRows = { at: 0, rows: [] };

const SHEET = 'CURATED_LINKS';
const HEADERS = [
  'id', 'title', 'url', 'platform', 'author', 'published_at', 'summary',
  'thumbnail_url', 'og_title', 'og_description', 'tags', 'reaction_text',
  'reaction_value', 'manual_score', 'is_favorite', 'is_visible', 'sort_order',
  'source_query', 'fetch_status', 'last_checked_at', 'created_at', 'updated_at'
];

const SEARCH_TERMS = [
  '사진 잘 찍는 법',
  '인물 사진 촬영',
  '제품 사진 촬영',
  '카페 음식 사진 촬영',
  '아이폰 사진 잘 찍는 법',
  '사진 구도 초보',
  '포토샵 사진 보정',
  '라이트룸 사진 보정',
  '상업 사진 촬영',
  '스마트폰 사진 촬영',
  '프로필 사진 촬영',
  '제품 사진 조명',
  '음식 사진 조명',
  '사진 포트폴리오 만들기',
  '사진 색보정',
  '사진 노출 구도'
];

const HOST_GROUPS = [
  ['brunch.co.kr'],
  ['tistory.com'],
  ['brunch.co.kr', 'tistory.com']
];

const QUERY_SUFFIXES = ['실전', '초보', '촬영 팁', '구도 조명', '보정', '상업사진'];
const BATCH_SIZE = 8;
const DB_CACHE_MS = 120000;
const CORE_RE = /사진|촬영|카메라|렌즈|구도|조명|노출|셔터|조리개|iso\b|화이트\s*밸런스|색보정|보정|리터칭|포토샵|photoshop|라이트룸|lightroom|스튜디오|피사체|초점|심도|플래시|스트로보|raw\b/i;
const STRONG_TITLE_RE = /사진|촬영|카메라|포토샵|photoshop|라이트룸|lightroom|리터칭|보정|구도|조명|렌즈|노출|스마트폰\s*카메라|아이폰\s*카메라/i;
const NEGATIVE_TITLE_RE = /용도지역|도시지역|상업지역\s*종류|제품과\s*상품의\s*차이|상품과\s*제품의\s*차이|음식\s*종류\s*\d+|유명한\s*인물|존경하는\s*인물|인물\s*top\s*\d+|무설치|크랙|정품\s*인증|다운로드\s*방법|무료\s*다운로드|설치파일|주식|코인|부동산|용적률|건폐율|정치|대선|연예인\s*순위/i;
const INSTALL_RE = /무설치|설치(?:하는)?\s*법|다운로드|크랙|정품\s*인증|시리얼|portable|포터블/i;
const GENERIC_NOISE_RE = /종류\s*\d+가지|차이\s*완벽\s*정리|가장\s*유명한|가장\s*존경하는|top\s*10|법률|시행령|용도지역|도시계획/i;

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const cursor = Math.max(0, parseInt(url.searchParams.get('cursor') || '0', 10) || 0);
  const limit = Math.max(4, Math.min(12, parseInt(url.searchParams.get('limit') || String(BATCH_SIZE), 10) || BATCH_SIZE));
  const requested = String(url.searchParams.get('q') || '').trim().slice(0, 70);

  const baseTerm = requested || SEARCH_TERMS[cursor % SEARCH_TERMS.length];
  const round = Math.floor(cursor / SEARCH_TERMS.length);
  const hosts = HOST_GROUPS[round % HOST_GROUPS.length];
  const page = Math.floor(round / HOST_GROUPS.length) % 6;
  const suffix = QUERY_SUFFIXES[Math.floor(round / (HOST_GROUPS.length * 6)) % QUERY_SUFFIXES.length];
  const searchTerm = round >= HOST_GROUPS.length * 6 ? `${baseTerm} ${suffix}` : baseTerm;

  try {
    const stored = await readCuratedRowsCached(context.env).catch(() => []);
    const rankedStored = rankStored(stored, baseTerm);
    const storedWindow = pickStoredWindow(rankedStored, cursor, requested ? 2 : 3);
    const already = new Set(storedWindow.map(item => cleanUrl(item.url)));
    const needed = Math.max(2, limit - storedWindow.length);

    const fresh = await discover(searchTerm, baseTerm, hosts, page, needed + 3, already);
    const combined = uniqueByUrl([...storedWindow, ...fresh]).slice(0, limit);

    const newRows = fresh.filter(item => !stored.some(row => cleanUrl(row.url) === cleanUrl(item.url)));
    if (newRows.length) {
      context.waitUntil(persistValidated(context.env, newRows, baseTerm).catch(error => console.warn('discover persist skipped', safeError(error))));
    }

    return json({
      ok: true,
      cursor,
      nextCursor: cursor + 1,
      query: baseTerm,
      items: combined.map(publicItem),
      hasMore: true,
      validated: true
    }, 200, { 'Cache-Control': 'public, max-age=120, s-maxage=900, stale-while-revalidate=1800' });
  } catch (error) {
    return json({
      ok: true,
      cursor,
      nextCursor: cursor + 1,
      query: baseTerm,
      items: [],
      hasMore: true,
      fallback: true,
      message: safeError(error)
    }, 200, { 'Cache-Control': 'public, max-age=45, s-maxage=120' });
  }
}

function publicItem(item) {
  const out = { ...item };
  delete out._cells;
  delete out._row;
  delete out._score;
  delete out.fetch_status;
  delete out.source_query;
  delete out.last_checked_at;
  delete out.created_at;
  delete out.updated_at;
  return out;
}

function pickStoredWindow(rows, cursor, count) {
  if (!rows.length || count <= 0) return [];
  const stride = Math.max(1, count);
  const start = (cursor * stride) % Math.max(rows.length, 1);
  const picked = [];
  for (let i = 0; i < rows.length && picked.length < count; i++) {
    picked.push(rows[(start + i) % rows.length]);
  }
  return picked;
}

function rankStored(rows, term) {
  return (rows || [])
    .filter(row => truthy(row.is_visible) && isSupportedArticleUrl(row.url))
    .map(row => {
      const score = relevanceScore(row.title || row.og_title, row.summary || row.og_description, '', term);
      return { ...row, _score: Math.max(score, number(row.manual_score, 0) / 10) };
    })
    .filter(row => row._score >= 7)
    .sort((a, b) =>
      number(b.manual_score, 0) - number(a.manual_score, 0) ||
      number(b.reaction_value, 0) - number(a.reaction_value, 0) ||
      number(a.sort_order, 9999) - number(b.sort_order, 9999)
    );
}

async function discover(searchTerm, relevanceTerm, hosts, page, limit, already = new Set()) {
  const queries = hosts.map(host => `site:${host} ${searchTerm} 사진 촬영 -무설치 -다운로드 -용도지역 -상품차이`);
  let urls = [];

  for (let attempt = 0; attempt < 5 && urls.length < Math.max(limit * 3, 18); attempt++) {
    const query = queries[attempt % queries.length] || queries[0];
    const first = 1 + Math.max(0, page + Math.floor(attempt / Math.max(1, queries.length))) * 10;

    const bing = await searchBingRss(query, first).catch(() => []);
    urls.push(...bing.map(item => item.url));

    if (urls.length < Math.max(limit * 2, 12)) {
      const naver = await searchNaverView(query, first).catch(() => []);
      urls.push(...naver);
    }
  }

  urls = unique(urls)
    .map(cleanUrl)
    .filter(url => isSupportedArticleUrl(url) && !already.has(url))
    .slice(0, Math.max(limit * 5, 30));

  const results = [];
  let index = 0;
  const workerCount = Math.min(4, Math.max(1, urls.length));
  const workers = Array.from({ length: workerCount }, async () => {
    while (index < urls.length && results.length < limit) {
      const current = urls[index++];
      const item = await enrich(current, relevanceTerm).catch(() => null);
      if (!item || !item.title) continue;
      if (results.some(row => cleanUrl(row.url) === cleanUrl(item.url))) continue;
      results.push(item);
    }
  });
  await Promise.all(workers);
  return results.sort((a, b) => number(b._score, 0) - number(a._score, 0)).slice(0, limit);
}

async function searchBingRss(query, first) {
  const target = `https://www.bing.com/search?format=rss&setlang=ko-KR&cc=KR&first=${first}&q=${encodeURIComponent(query)}`;
  const response = await fetchWithTimeout(target, 5200, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Photo-eBook/1.0)',
      'Accept': 'application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.6',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.5'
    }
  });
  if (!response.ok) throw new Error(`검색 응답 ${response.status}`);
  const xml = await response.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(match => {
    const block = match[1];
    return {
      title: xmlText(block, 'title'),
      url: xmlText(block, 'link'),
      summary: stripTags(xmlText(block, 'description'))
    };
  }).filter(item => item.url);
}

async function searchNaverView(query, first) {
  const target = `https://search.naver.com/search.naver?where=view&sm=tab_pge&start=${first}&query=${encodeURIComponent(query)}`;
  const response = await fetchWithTimeout(target, 5200, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.5'
    }
  });
  if (!response.ok) throw new Error(`검색 응답 ${response.status}`);
  let html = await response.text();
  html = html
    .replace(/\\u002F/gi, '/')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&');
  const matches = html.match(/https?:\/\/(?:brunch\.co\.kr\/[^\s"'<>]+|[a-z0-9-]+\.tistory\.com\/[^\s"'<>]+)/gi) || [];
  return unique(matches.map(cleanUrl));
}

async function enrich(url, term) {
  const response = await fetchWithTimeout(url, 5600, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Photo-eBook Reader/1.3)',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.5'
    }
  });
  if (!response.ok) throw new Error(`원문 응답 ${response.status}`);

  const finalUrl = cleanUrl(response.url || url);
  if (!isSupportedArticleUrl(finalUrl)) return null;

  const html = (await response.text()).slice(0, 900000);
  const meta = readMeta(html);
  const title = cleanTitle(meta('og:title') || meta('twitter:title') || decodeHtml((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || ''));
  const summary = trimText(meta('og:description') || meta('description') || meta('twitter:description') || '', 420);
  const body = extractReadableText(html).slice(0, 18000);
  const score = relevanceScore(title, summary, body, term);

  if (!title || score < 7) return null;
  if (NEGATIVE_TITLE_RE.test(title)) return null;
  if (/포토샵|photoshop/i.test(title) && INSTALL_RE.test(`${title} ${summary}`)) return null;

  const image = absoluteUrl(meta('og:image') || meta('twitter:image'), finalUrl);
  const author = trimText(meta('author') || meta('article:author') || inferAuthor(finalUrl), 80);
  const published = (meta('article:published_time') || meta('date') || '').slice(0, 10);
  const platform = inferPlatform(finalUrl);
  const engagement = extractEngagement(html);
  const tags = inferTags(`${title} ${summary} ${body.slice(0, 1800)}`);

  return {
    id: `discover-${hash(finalUrl)}`,
    title,
    url: finalUrl,
    platform,
    author,
    published_at: published,
    summary,
    thumbnail_url: image,
    og_title: title,
    og_description: summary,
    tags: tags.join(' / '),
    reaction_text: engagement.text,
    reaction_value: engagement.value,
    manual_score: Math.round(score * 10),
    is_favorite: false,
    is_visible: true,
    sort_order: 9000,
    source_query: term,
    fetch_status: 'validated-auto',
    _score: score
  };
}

function relevanceScore(title = '', summary = '', body = '', term = '') {
  const t = normalize(title);
  const s = normalize(summary);
  const b = normalize(body);
  const combined = `${t} ${s}`;

  if (!t || NEGATIVE_TITLE_RE.test(t)) return -50;
  if (/포토샵|photoshop/i.test(t) && INSTALL_RE.test(`${t} ${s}`)) return -40;
  if (GENERIC_NOISE_RE.test(t) && !STRONG_TITLE_RE.test(t)) return -24;

  let score = 0;
  if (STRONG_TITLE_RE.test(t)) score += 8;
  else if (CORE_RE.test(t)) score += 5;
  if (CORE_RE.test(s)) score += 3;

  const bodyMatches = b.match(new RegExp(CORE_RE.source, 'gi')) || [];
  score += Math.min(5, bodyMatches.length * 0.55);

  const termTokens = keywordTokens(term);
  for (const token of termTokens) {
    if (t.includes(token)) score += 1.5;
    else if (s.includes(token)) score += .8;
    else if (b.includes(token)) score += .25;
  }

  if (/잘\s*찍|찍는\s*법|촬영\s*팁|촬영법|구도|빛|조명|노출|보정|리터칭|포트폴리오/i.test(combined)) score += 2;
  if (/상업사진|제품사진|인물사진|프로필사진|음식사진|스마트폰사진|아이폰사진/i.test(combined.replace(/\s/g, ''))) score += 2;

  if (NEGATIVE_TITLE_RE.test(s)) score -= 7;
  if (INSTALL_RE.test(combined) && /포토샵|photoshop/i.test(combined)) score -= 14;

  const titleHasPhotoContext = STRONG_TITLE_RE.test(t);
  const summaryHasPhotoContext = CORE_RE.test(s);
  if (!titleHasPhotoContext && !summaryHasPhotoContext && bodyMatches.length < 5) return -20;

  if (/인물/.test(t) && !/사진|촬영|카메라|보정|리터칭|포토샵|프로필/.test(t)) score -= 10;
  if (/제품|상품/.test(t) && !/사진|촬영|카메라|보정|리터칭|누끼|조명/.test(t)) score -= 10;
  if (/음식/.test(t) && !/사진|촬영|카메라|구도|조명|찍/.test(t)) score -= 9;

  return score;
}

function keywordTokens(term) {
  const stop = new Set(['사진', '촬영', '잘', '찍는', '법', '초보', '실전', '팁']);
  return normalize(term)
    .split(/[^0-9a-zA-Z가-힣]+/)
    .filter(token => token.length >= 2 && !stop.has(token))
    .slice(0, 5);
}

function extractReadableText(html) {
  return stripTags(String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' '));
}

function cleanTitle(value) {
  return trimText(String(value || '')
    .replace(/\s*[-|]\s*(브런치|티스토리).*$/i, '')
    .replace(/\s+/g, ' '), 160);
}

function trimText(value, max) {
  const text = decodeHtml(String(value || '')).replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

function normalize(value) {
  return decodeHtml(String(value || '')).replace(/\s+/g, ' ').trim().toLowerCase();
}

function readMeta(html) {
  const tags = [...html.matchAll(/<meta\s+[^>]*>/gi)].map(match => parseAttrs(match[0]));
  return key => {
    const lower = key.toLowerCase();
    const found = tags.find(attrs => String(attrs.property || attrs.name || '').toLowerCase() === lower);
    return decodeHtml(found?.content || '');
  };
}

function parseAttrs(tag) {
  const attrs = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return attrs;
}

function xmlText(block, name) {
  const match = block.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return decodeHtml(String(match?.[1] || '').replace(/^<!\[CDATA\[|\]\]>$/g, ''));
}

function stripTags(value) {
  return decodeHtml(String(value || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function decodeHtml(text) {
  return String(text || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteUrl(value, base) {
  try { return value ? new URL(value, base).toString() : ''; }
  catch { return ''; }
}

function cleanUrl(value) {
  try {
    const url = new URL(decodeHtml(value));
    url.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'source'].forEach(key => url.searchParams.delete(key));
    return url.toString();
  } catch { return String(value || '').split('#')[0]; }
}

function isSupportedArticleUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (host === 'brunch.co.kr') return /^\/@[^/]+\/\d+/.test(url.pathname) || /^\/@@[^/]+\/\d+/.test(url.pathname);
    if (host.endsWith('.tistory.com')) return /^\/(?:entry\/[^/?#]+|\d+)(?:[/?#]|$)/.test(url.pathname);
    return false;
  } catch { return false; }
}

function inferPlatform(value) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    if (host === 'brunch.co.kr') return '브런치';
    if (host.endsWith('.tistory.com')) return '티스토리';
    return host.replace(/^www\./, '');
  } catch { return '외부 글'; }
}

function inferAuthor(value) {
  try {
    const url = new URL(value);
    if (url.hostname === 'brunch.co.kr') return decodeURIComponent((url.pathname.match(/^\/@([^/]+)/) || [])[1] || '브런치');
    if (url.hostname.endsWith('.tistory.com')) return url.hostname.split('.')[0];
    return '';
  } catch { return ''; }
}

function inferTags(text) {
  const rules = [
    ['인물', /인물\s*사진|프로필\s*사진|portrait/i],
    ['제품', /제품\s*사진|상품\s*사진|product\s*photo/i],
    ['음식', /음식\s*사진|카페\s*사진|메뉴\s*사진|food\s*photo/i],
    ['아이폰', /아이폰|iphone|스마트폰\s*사진/i],
    ['보정', /보정|포토샵|라이트룸|retouch|lightroom|photoshop/i],
    ['구도', /구도|프레이밍|composition/i],
    ['조명', /조명|빛\s*방향|lighting|스트로보|플래시/i],
    ['상업사진', /상업\s*사진|브랜드\s*촬영|쇼핑몰\s*촬영|광고\s*촬영/i]
  ];
  return rules.filter(([, pattern]) => pattern.test(text)).map(([tag]) => tag).slice(0, 4);
}

function extractEngagement(html) {
  const text = stripTags(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' '));
  const patterns = [
    ['라이킷', /라이킷(?:\s*수)?\s*([\d,]+)/],
    ['댓글', /댓글(?:달기)?\s*([\d,]+)/],
    ['조회', /조회(?:수)?\s*([\d,]+)/]
  ];
  for (const [label, pattern] of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const value = Number(match[1].replace(/,/g, '')) || 0;
    return { text: `${label} ${value.toLocaleString('ko-KR')}`, value };
  }
  return { text: '', value: '' };
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function uniqueByUrl(items) {
  const map = new Map();
  for (const item of items || []) {
    const key = cleanUrl(item?.url || '');
    if (key && !map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}

function hash(value) {
  let h = 2166136261;
  for (const ch of String(value || '')) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function number(value, fallback = 0) {
  const n = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

function truthy(value) {
  return !['FALSE', '0', 'NO', 'N', ''].includes(String(value ?? '').trim().toUpperCase());
}

async function readCuratedRowsCached(env) {
  const now = Date.now();
  if (memoryRows.rows.length && now - memoryRows.at < DB_CACHE_MS) return memoryRows.rows;

  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const cacheKey = new Request('https://photo-ebook.internal/cache/curated-links-v32');
  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) {
      const rows = await hit.json().catch(() => []);
      if (Array.isArray(rows)) {
        memoryRows = { at: now, rows };
        return rows;
      }
    }
  }

  const values = await readValues(env, `${SHEET}!A:V`);
  if (!values.length) return [];
  const headers = (values[0] || []).map(value => String(value || '').trim());
  const rows = values.slice(1).map((cells, index) => {
    const row = { _row: index + 2, _cells: [...cells] };
    headers.forEach((header, i) => { if (header) row[header] = cells[i] ?? ''; });
    return row;
  }).filter(row => String(row.url || '').trim());

  memoryRows = { at: now, rows };
  if (cache) {
    await cache.put(cacheKey, new Response(JSON.stringify(rows), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' }
    })).catch(() => {});
  }
  return rows;
}

async function persistValidated(env, items, sourceQuery) {
  const current = await readCuratedRowsCached(env).catch(() => []);
  const known = new Set(current.map(row => cleanUrl(row.url)));
  const now = koreaTime();
  const rows = [];

  for (const item of uniqueByUrl(items)) {
    const url = cleanUrl(item.url);
    if (!url || known.has(url) || !isSupportedArticleUrl(url)) continue;
    known.add(url);
    const cells = Array(HEADERS.length).fill('');
    const set = (key, value) => { const index = HEADERS.indexOf(key); if (index >= 0) cells[index] = value ?? ''; };
    set('id', item.id || `discover-${hash(url)}`);
    set('title', item.title || item.og_title || '');
    set('url', url);
    set('platform', item.platform || inferPlatform(url));
    set('author', item.author || '');
    set('published_at', item.published_at || '');
    set('summary', item.summary || item.og_description || '');
    set('thumbnail_url', item.thumbnail_url || '');
    set('og_title', item.og_title || item.title || '');
    set('og_description', item.og_description || item.summary || '');
    set('tags', item.tags || '');
    set('reaction_text', item.reaction_text || '');
    set('reaction_value', item.reaction_value || '');
    set('manual_score', item.manual_score || Math.round(number(item._score, 7) * 10));
    set('is_favorite', 'FALSE');
    set('is_visible', 'TRUE');
    set('sort_order', 9000);
    set('source_query', sourceQuery || item.source_query || '');
    set('fetch_status', 'validated-auto');
    set('last_checked_at', now);
    set('created_at', now);
    set('updated_at', now);
    rows.push(cells);
    if (rows.length >= 6) break;
  }

  if (!rows.length) return 0;
  await appendValues(env, `${SHEET}!A:V`, rows);
  memoryRows = { at: 0, rows: [] };
  return rows.length;
}

async function fetchWithTimeout(url, timeout, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); }
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

async function appendValues(env, range, values) {
  const token = await getAccessToken(env);
  const id = sheetId(env);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ majorDimension: 'ROWS', values })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Google Sheets 저장 실패 (${response.status})`);
  return data;
}

async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken?.token && cachedToken.expiresAt - 60 > now) return cachedToken.token;

  const account = parseAccount(env);
  if (!account?.client_email || !account?.private_key) throw new Error('Google 서비스 계정 설정을 확인해 주세요.');

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
    'pkcs8', pemBuffer(account.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' }, key, new TextEncoder().encode(input)
  );
  const assertion = `${input}.${base64UrlBytes(new Uint8Array(signature))}`;

  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new Error(data?.error_description || data?.error || `Google 인증 실패 (${response.status})`);

  cachedToken = { token: data.access_token, expiresAt: now + Number(data.expires_in || 3600) };
  return cachedToken.token;
}

function parseAccount(env) {
  const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON || env.GOOGLE_SERVICE_ACCOUNT_JS || '';
  if (!raw) return null;
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { throw new Error('Google 서비스 계정 설정 형식을 확인해 주세요.'); }
}

function sheetId(env) {
  const id = String(env.GOOGLE_SHEET_ID || '').trim();
  if (!id) throw new Error('Google Sheet 연결 설정을 확인해 주세요.');
  return id;
}

function base64UrlJson(value) {
  return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));
}

function base64UrlBytes(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
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
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(new Date()).replace('T', ' ');
}

function safeError(error) {
  return String(error?.message || error || '검색 실패')
    .replace(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g, '[redacted]')
    .slice(0, 180);
}

function json(payload, status = 200, extra = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra }
  });
}

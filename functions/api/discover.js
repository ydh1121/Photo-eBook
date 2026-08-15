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
const BATCH_SIZE = 8;

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const cursor = Math.max(0, parseInt(url.searchParams.get('cursor') || '0', 10) || 0);
  const limit = Math.max(4, Math.min(12, parseInt(url.searchParams.get('limit') || String(BATCH_SIZE), 10) || BATCH_SIZE));
  const requested = String(url.searchParams.get('q') || '').trim().slice(0, 70);

  const term = requested || SEARCH_TERMS[cursor % SEARCH_TERMS.length];
  const round = Math.floor(cursor / SEARCH_TERMS.length);
  const hosts = HOST_GROUPS[round % HOST_GROUPS.length];
  const page = Math.floor(round / HOST_GROUPS.length);

  try {
    const found = await discover(term, hosts, page, limit);
    return json({
      ok: true,
      cursor,
      nextCursor: cursor + 1,
      query: term,
      items: found,
      hasMore: true
    }, 200, { 'Cache-Control': 'public, max-age=180, s-maxage=1800' });
  } catch (error) {
    return json({
      ok: true,
      cursor,
      nextCursor: cursor + 1,
      query: term,
      items: [],
      hasMore: true,
      fallback: true,
      message: safeError(error)
    }, 200, { 'Cache-Control': 'public, max-age=60, s-maxage=180' });
  }
}

async function discover(term, hosts, page, limit) {
  const queries = hosts.map(host => `site:${host} ${term}`);
  let urls = [];

  for (let attempt = 0; attempt < Math.min(3, queries.length + 1) && urls.length < limit; attempt++) {
    const query = queries[attempt % queries.length] || queries[0];
    const first = 1 + Math.max(0, page + attempt) * 10;
    const batch = await searchBingRss(query, first).catch(() => []);
    urls.push(...batch.map(item => item.url));

    if (urls.length < limit) {
      const naver = await searchNaverView(query, first).catch(() => []);
      urls.push(...naver);
    }
  }

  urls = unique(urls)
    .filter(isSupportedArticleUrl)
    .slice(0, Math.max(limit * 2, 12));

  const results = [];
  let index = 0;
  const workers = Array.from({ length: Math.min(4, urls.length || 1) }, async () => {
    while (index < urls.length && results.length < limit) {
      const current = urls[index++];
      const item = await enrich(current).catch(() => null);
      if (item && item.title && !results.some(row => row.url === item.url)) results.push(item);
    }
  });
  await Promise.all(workers);
  return results.slice(0, limit);
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

async function enrich(url) {
  const response = await fetchWithTimeout(url, 5200, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Photo-eBook Reader/1.2)',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.5'
    }
  });
  if (!response.ok) throw new Error(`원문 응답 ${response.status}`);
  const finalUrl = cleanUrl(response.url || url);
  if (!isSupportedArticleUrl(finalUrl)) return null;
  const html = (await response.text()).slice(0, 850000);
  const meta = readMeta(html);
  const title = meta('og:title') || meta('twitter:title') || decodeHtml((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const summary = meta('og:description') || meta('description') || meta('twitter:description') || '';
  const image = absoluteUrl(meta('og:image') || meta('twitter:image'), finalUrl);
  const author = meta('author') || meta('article:author') || inferAuthor(finalUrl);
  const published = (meta('article:published_time') || meta('date') || '').slice(0, 10);
  const platform = inferPlatform(finalUrl);
  const engagement = extractEngagement(html);
  const tags = inferTags(`${title} ${summary}`);

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
    manual_score: 0,
    is_favorite: false,
    is_visible: true,
    sort_order: 9999
  };
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
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(key => url.searchParams.delete(key));
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
    ['인물', /인물|프로필|portrait/i],
    ['제품', /제품|상품|product/i],
    ['음식', /음식|카페|메뉴|food/i],
    ['아이폰', /아이폰|iphone|스마트폰/i],
    ['보정', /보정|포토샵|라이트룸|retouch|lightroom|photoshop/i],
    ['구도', /구도|프레이밍|composition/i],
    ['조명', /조명|빛|lighting/i],
    ['상업사진', /상업|브랜드|쇼핑몰|광고/i]
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

async function fetchWithTimeout(url, timeout, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

function hash(value) {
  let h = 2166136261;
  for (const ch of String(value || '')) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function safeError(error) {
  return String(error?.message || error || '검색 실패').slice(0, 160);
}

function json(payload, status = 200, extra = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...extra
    }
  });
}

const SEARCHES = [
  '권학봉 제품사진 조명',
  '권학봉 포토샵 사진 보정',
  '권학봉 인물사진 리터칭',
  '상업사진 제품 촬영 조명',
  '제품사진 촬영 배경 조명',
  '인물사진 피부보정 포토샵',
  '라이트룸 인물사진 보정',
  '사진 리터칭 상업사진',
  '스튜디오 제품사진 촬영',
  '음식사진 촬영 조명',
  '아이폰 제품사진 촬영',
  '사진 포트폴리오 상업사진',
  '상업사진 납품 워크플로우',
  'Capture One 테더 촬영',
  '제품사진 누끼 포토샵',
  '인물사진 Dodge Burn'
];

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const cursor = Math.max(0, Number.parseInt(url.searchParams.get('cursor') || '0', 10) || 0);
  const requested = String(url.searchParams.get('q') || '').trim().slice(0, 80);
  const query = requested || SEARCHES[cursor % SEARCHES.length];

  try {
    const items = await searchYouTube(query);
    const ranked = rankVideos(items).slice(0, 10);
    if (!ranked.length) throw new Error('검색 결과 없음');
    return json({ ok: true, query, cursor, nextCursor: cursor + 1, items: ranked }, 200, {
      'Cache-Control': 'public, max-age=120, s-maxage=900'
    });
  } catch (error) {
    return json({
      ok: true,
      query,
      cursor,
      nextCursor: cursor + 1,
      items: [fallbackSearchCard(query)],
      fallback: true,
      message: safeError(error)
    }, 200, { 'Cache-Control': 'public, max-age=45, s-maxage=180' });
  }
}

async function searchYouTube(query) {
  const target = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=ko&gl=KR`;
  const response = await fetchWithTimeout(target, 4400, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml'
    }
  });
  if (!response.ok) throw new Error(`YouTube ${response.status}`);
  const html = await response.text();

  const found = [];
  const initial = extractInitialData(html);
  if (initial) collectFromInitial(initial, query, found);
  if (!found.length) collectFromRendererBlocks(html, query, found);

  const unique = new Map();
  found.forEach(item => { if (item?.id && !unique.has(item.id)) unique.set(item.id, item); });
  if (!unique.size) throw new Error('영상 결과를 읽지 못했습니다.');
  return [...unique.values()];
}

function collectFromInitial(initial, query, out) {
  walk(initial, value => {
    const renderer = value?.videoRenderer;
    if (!renderer?.videoId) return;
    const item = rendererToItem(renderer, query);
    if (item) out.push(item);
  });
}

function collectFromRendererBlocks(html, query, out) {
  let start = 0;
  let count = 0;
  while (count < 30) {
    const marker = html.indexOf('"videoRenderer":', start);
    if (marker < 0) break;
    const brace = html.indexOf('{', marker + 16);
    if (brace < 0) break;
    const raw = balancedObject(html, brace);
    start = brace + Math.max(raw.length, 1);
    if (!raw) continue;
    try {
      const renderer = JSON.parse(raw);
      const item = rendererToItem(renderer, query);
      if (item) out.push(item);
    } catch {}
    count++;
  }
}

function rendererToItem(renderer, query) {
  const id = String(renderer?.videoId || '');
  const title = textOf(renderer?.title);
  if (!id || !title) return null;
  const channel = textOf(renderer.ownerText) || textOf(renderer.shortBylineText);
  const views = textOf(renderer.viewCountText) || textOf(renderer.shortViewCountText);
  const published = textOf(renderer.publishedTimeText);
  const duration = textOf(renderer.lengthText);
  const description = (renderer.detailedMetadataSnippets || [])
    .map(item => textOf(item?.snippetText))
    .filter(Boolean)
    .join(' ')
    .slice(0, 180);
  const thumbs = renderer.thumbnail?.thumbnails || [];
  const thumbnail = thumbs.at(-1)?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  return {
    id,
    title,
    channel,
    views,
    published,
    duration,
    description,
    thumbnail,
    url: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
    platform: 'YouTube',
    query
  };
}

function extractInitialData(html) {
  const patterns = [
    /(?:var\s+)?ytInitialData\s*=\s*/g,
    /window\["ytInitialData"\]\s*=\s*/g
  ];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(html);
    if (!match) continue;
    const start = html.indexOf('{', match.index + match[0].length);
    if (start < 0) continue;
    const raw = balancedObject(html, start);
    if (!raw) continue;
    try { return JSON.parse(raw); } catch {}
  }
  return null;
}

function balancedObject(source, start) {
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return '';
}

function walk(value, visit) {
  if (!value || typeof value !== 'object') return;
  visit(value);
  if (Array.isArray(value)) value.forEach(item => walk(item, visit));
  else Object.values(value).forEach(item => walk(item, visit));
}

function textOf(value) {
  if (!value) return '';
  if (typeof value.simpleText === 'string') return value.simpleText.trim();
  if (Array.isArray(value.runs)) return value.runs.map(run => run?.text || '').join('').trim();
  return '';
}

function rankVideos(items) {
  return [...items].sort((a, b) => score(b) - score(a));
}

function score(item) {
  const channel = String(item.channel || '');
  const title = String(item.title || '');
  let result = 0;
  if (/권학봉|Hakbong/i.test(channel)) result += 5000000;
  if (/데르센|Story Shot/i.test(channel)) result += 3000000;
  if (/사진|포토|스튜디오|phot/i.test(channel)) result += 500000;
  if (/제품|인물|리터칭|보정|조명|포토샵|라이트룸|촬영|테더|누끼/.test(title)) result += 200000;
  result += viewNumber(item.views);
  return result;
}

function viewNumber(text) {
  const value = String(text || '').replace(/조회수|회|views?/gi, '').trim();
  const match = value.match(/([\d,.]+)\s*(만|천)?/);
  if (!match) return 0;
  const n = Number(String(match[1]).replace(/,/g, '')) || 0;
  if (match[2] === '만') return Math.round(n * 10000);
  if (match[2] === '천') return Math.round(n * 1000);
  return Math.round(n);
}

function fallbackSearchCard(query) {
  return {
    id: `search-${hash(query)}`,
    title: `${query} 영상 보기`,
    channel: 'YouTube 검색',
    views: '',
    published: '',
    duration: '',
    description: '관련 촬영 예시와 실무 영상을 바로 확인할 수 있습니다.',
    thumbnail: '',
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    platform: 'YouTube',
    query,
    isSearchFallback: true
  };
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
  return String(error?.message || error || '영상 검색 실패').slice(0, 140);
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

const SEARCHES = [
  { query: '인물 사진 리터칭 포토샵 피부 보정', category: '인물 리터칭' },
  { query: '제품 사진 포토샵 누끼 리터칭', category: '제품 리터칭' },
  { query: '인테리어 공간 사진 보정 라이트룸', category: '공간 보정' },
  { query: '상업사진 셀렉 납품 워크플로우', category: '셀렉 / 납품' },
  { query: '제품 사진 조명 촬영 세팅', category: '제품 촬영' },
  { query: '음식 사진 촬영 조명', category: '음식 촬영' },
  { query: '상업사진 포트폴리오 만드는 법', category: '포트폴리오' },
  { query: '라이트룸 컬러 보정 사진', category: '색보정' },
  { query: '아이폰 제품 사진 촬영', category: '모바일 촬영' },
  { query: '사진 RAW 셀렉 보정 워크플로우', category: 'RAW 워크플로우' },
  { query: '상업사진 고객 납품 수정 견적', category: '납품 / 운영' },
  { query: '스튜디오 제품 사진 촬영', category: '스튜디오 촬영' }
];

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const cursor = Math.max(0, Number.parseInt(url.searchParams.get('cursor') || '0', 10) || 0);
  const requested = String(url.searchParams.get('q') || '').trim().slice(0, 100);
  const preset = SEARCHES[cursor % SEARCHES.length];
  const query = requested || preset.query;
  const category = categoryForQuery(query, preset.category);

  try {
    const items = await searchYouTube(query, category);
    return json({
      ok: true,
      query,
      category,
      cursor,
      nextCursor: cursor + 1,
      items: rankVideos(items, query).slice(0, 12)
    }, 200, { 'Cache-Control': 'public, max-age=120, s-maxage=600' });
  } catch (error) {
    console.warn('videos discovery fallback', safeMessage(error));
    return json({
      ok: true,
      query,
      category,
      cursor,
      nextCursor: cursor + 1,
      items: [fallbackSearchCard(query, category)],
      fallback: true
    }, 200, { 'Cache-Control': 'public, max-age=60, s-maxage=120' });
  }
}

async function searchYouTube(query, category) {
  const page = await fetchSearchPage(query);
  let initial = extractInitialData(page.html);

  if (!initial) {
    initial = await searchInnertube(query, page.html);
  }

  if (!initial) throw new Error('검색 결과를 읽지 못했습니다.');

  const found = collectVideos(initial, query, category);
  if (!found.length) throw new Error('영상 결과가 없습니다.');
  return found;
}

async function fetchSearchPage(query) {
  const target = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=ko&gl=KR`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(target, {
      redirect: 'follow',
      signal: controller.signal,
      headers: youtubeHeaders()
    });
    if (!response.ok) throw new Error(`YouTube ${response.status}`);
    return { html: await response.text(), url: response.url };
  } finally {
    clearTimeout(timer);
  }
}

async function searchInnertube(query, html) {
  let source = html || '';
  let apiKey = findConfig(source, 'INNERTUBE_API_KEY');
  let clientVersion = findConfig(source, 'INNERTUBE_CLIENT_VERSION');
  let visitorData = findConfig(source, 'VISITOR_DATA');

  if (!apiKey || !clientVersion) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    try {
      const response = await fetch('https://www.youtube.com/?hl=ko&gl=KR', {
        signal: controller.signal,
        headers: youtubeHeaders()
      });
      if (response.ok) {
        source = await response.text();
        apiKey = apiKey || findConfig(source, 'INNERTUBE_API_KEY');
        clientVersion = clientVersion || findConfig(source, 'INNERTUBE_CLIENT_VERSION');
        visitorData = visitorData || findConfig(source, 'VISITOR_DATA');
      }
    } finally {
      clearTimeout(timer);
    }
  }

  if (!apiKey || !clientVersion) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(`https://www.youtube.com/youtubei/v1/search?key=${encodeURIComponent(apiKey)}&prettyPrint=false`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        ...youtubeHeaders(),
        'Content-Type': 'application/json',
        'Origin': 'https://www.youtube.com',
        'X-Youtube-Client-Name': '1',
        'X-Youtube-Client-Version': clientVersion
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion,
            hl: 'ko',
            gl: 'KR',
            ...(visitorData ? { visitorData } : {})
          }
        },
        query
      })
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function youtubeHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.7',
    'Cookie': 'CONSENT=YES+cb; SOCS=CAI'
  };
}

function findConfig(html, key) {
  const patterns = [
    new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`),
    new RegExp(`${key}\\s*[=:]\\s*"([^"]+)"`)
  ];
  for (const pattern of patterns) {
    const match = String(html || '').match(pattern);
    if (match?.[1]) return decodeEscapes(match[1]);
  }
  return '';
}

function decodeEscapes(value) {
  return String(value || '')
    .replace(/\\u0026/g, '&')
    .replace(/\\u003d/g, '=')
    .replace(/\\u002f/g, '/')
    .replace(/\\\\/g, '\\');
}

function collectVideos(initial, query, category) {
  const found = [];
  walk(initial, value => {
    const renderer = value?.videoRenderer || value?.gridVideoRenderer || value?.compactVideoRenderer;
    if (!renderer?.videoId) return;
    const id = String(renderer.videoId || '');
    const title = textOf(renderer.title);
    if (!id || !title) return;
    const channel = textOf(renderer.ownerText) || textOf(renderer.shortBylineText) || textOf(renderer.longBylineText);
    const views = textOf(renderer.viewCountText) || textOf(renderer.shortViewCountText);
    const published = textOf(renderer.publishedTimeText);
    const duration = textOf(renderer.lengthText);
    const description = (renderer.detailedMetadataSnippets || renderer.metadataSnippets || [])
      .map(item => textOf(item?.snippetText))
      .filter(Boolean)
      .join(' ')
      .slice(0, 190);
    const thumbs = renderer.thumbnail?.thumbnails || [];
    const thumbnail = normalizeThumb(thumbs.at(-1)?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
    found.push({
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
      query,
      category,
      matchScore: relevanceScore({ title, channel, description }, query)
    });
  });

  const unique = new Map();
  found.forEach(item => {
    if (!unique.has(item.id)) unique.set(item.id, item);
  });
  return [...unique.values()];
}

function normalizeThumb(url) {
  return String(url || '').replace(/^\/\//, 'https://');
}

function extractInitialData(html) {
  const markers = ['var ytInitialData = ', 'window["ytInitialData"] = ', 'ytInitialData = '];
  for (const marker of markers) {
    const pos = String(html || '').indexOf(marker);
    if (pos < 0) continue;
    const start = html.indexOf('{', pos + marker.length);
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
  if (Array.isArray(value)) {
    value.forEach(item => walk(item, visit));
    return;
  }
  Object.values(value).forEach(item => walk(item, visit));
}

function textOf(value) {
  if (!value) return '';
  if (typeof value.simpleText === 'string') return value.simpleText.trim();
  if (Array.isArray(value.runs)) return value.runs.map(run => run?.text || '').join('').trim();
  return '';
}

function categoryForQuery(query, fallback = '') {
  const q = String(query || '');
  if (/인물|피부|Dodge|Burn|Liquify/.test(q)) return '인물 리터칭';
  if (/제품|누끼|패키지|스크래치/.test(q)) return '제품 리터칭';
  if (/인테리어|공간|건축/.test(q)) return '공간 보정';
  if (/셀렉|납품|고객|수정|견적/.test(q)) return '셀렉 / 납품';
  if (/음식|푸드|카페/.test(q)) return '음식 촬영';
  if (/라이트룸|색보정|컬러/.test(q)) return '색보정';
  if (/포트폴리오/.test(q)) return '포트폴리오';
  if (/아이폰|스마트폰|모바일/.test(q)) return '모바일 촬영';
  if (/조명|스튜디오|촬영/.test(q)) return '촬영 / 조명';
  return fallback || '상업사진 실무';
}

function rankVideos(items, query) {
  return [...items].sort((a, b) => score(b, query) - score(a, query));
}

function score(item, query) {
  const channel = String(item.channel || '');
  const title = String(item.title || '');
  let result = Number(item.matchScore || 0) * 100000;
  if (/권학봉|Hakbong/i.test(channel)) result += 3200000;
  if (/사진|포토|스튜디오|phot|Adobe|어도비/i.test(channel)) result += 420000;
  if (/제품|인물|리터칭|보정|조명|포토샵|라이트룸|촬영|납품|포트폴리오/.test(title)) result += 180000;
  result += viewNumber(item.views);
  return result;
}

function relevanceScore(item, query) {
  const source = `${item.title || ''} ${item.channel || ''} ${item.description || ''}`.toLowerCase();
  const terms = String(query || '')
    .toLowerCase()
    .split(/\s+/)
    .map(term => term.trim())
    .filter(term => term.length >= 2);
  return terms.reduce((score, term) => score + (source.includes(term) ? 1 : 0), 0);
}

function viewNumber(text) {
  const value = String(text || '').replace(/조회수|회|views?/gi, '').trim();
  const match = value.match(/([\d,.]+)\s*(억|만|천)?/);
  if (!match) return 0;
  const n = Number(String(match[1]).replace(/,/g, '')) || 0;
  if (match[2] === '억') return Math.round(n * 100000000);
  if (match[2] === '만') return Math.round(n * 10000);
  if (match[2] === '천') return Math.round(n * 1000);
  return Math.round(n);
}

function fallbackSearchCard(query, category) {
  return {
    id: `search-${hash(query)}`,
    title: `${category} 관련 영상 검색`,
    channel: 'YouTube 검색',
    views: '',
    published: '',
    duration: '',
    description: '해당 작업과 관련된 영상 검색 결과로 이동합니다.',
    thumbnail: '',
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    platform: 'YouTube',
    query,
    category,
    isSearchFallback: true,
    matchScore: 0
  };
}

function hash(value) {
  let h = 2166136261;
  for (const ch of String(value || '')) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function safeMessage(error) {
  return String(error?.message || error || 'unknown').slice(0, 180);
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

import {noticeSources as catalog,noticeBootstrap as bootstrap} from './learning-discovery-catalog.js';

// This collector reads only the reviewed, public source pages in the catalog.
// It does not submit applications or infer a reader's eligibility.
export const SUBJECTS = Object.freeze(['video', 'ai', 'community', 'real-estate', 'auction']);
export const PROVIDERS = Object.freeze(catalog.providers);
export const CACHE_SECONDS = 600;
export const LAST_GOOD_SECONDS = 7 * 86400;
// Four providers can also use 16 cache operations; keep the whole request below 50.
export const MAX_FETCHES = 28;
const MAX_DETAILS = 6;
const MAX_HTML_BYTES = 1000000;
const REQUEST_TIMEOUT_MS = 6500;
const PROVIDER_TIMEOUT_MS = 18000;
const CACHE_VERSION = 'learning-opportunities-v1';
const SUBJECT_PATTERNS = {
  video: /영상|촬영|미디어|유튜브|숏폼|콘텐츠|스튜디오|편집|OBS\b/i,
  ai: /\bAI\b|인공지능|생성형|챗\s*GPT|ChatGPT|제미나이|프롬프트|디지털\s*(?:전환|교육|활용)/i,
  community: /커뮤니티|공동체|마을|네트워킹|모임|소통|온라인\s*(?:판로|홍보|플랫폼)|SNS|마케팅|로컬\s*크리에이터|시민.*콘텐츠/i,
  'real-estate': /부동산|주택|집수리|인테리어|도시재생|임대차|등기|건축물|임장/,
  auction: /경매|공매|권리분석|온비드/
};
const OPEN_LABEL = /^(?:접수중|접수 중|모집중|모집 중|신청중|신청 중|신청하기|수강신청)$/;
const CLOSED_LABEL = /^(?:접수마감|접수 마감|모집마감|모집 마감|신청마감|신청 마감|접수종료|접수 종료|종료|마감|조기마감|조기 마감|정원마감|정원 마감|모집완료|취소|폐강)$/;
const WAIT_LABEL = /대기\s*(?:접수|신청)|(?:접수|신청)\s*대기/;
const UPCOMING_LABEL = /^(?:접수예정|접수 예정|모집예정|모집 예정|신청시작전|신청 시작 전)$/;

export function parseFilters(url) {
  const params = url instanceof URL ? url.searchParams : new URL(url).searchParams;
  const allowed = new Set(['subject', 'region', 'type']);
  for (const key of params.keys()) if (!allowed.has(key)) throw new Error('허용되지 않은 조회 조건입니다.');
  for (const key of allowed) if (params.getAll(key).length > 1) throw new Error('조회 조건을 한 번씩 입력해 주세요.');
  const filters = { subject: params.get('subject') || '', region: params.get('region') || 'all', type: params.get('type') || 'all' };
  if (!SUBJECTS.includes(filters.subject)) throw new Error('분야를 확인해 주세요.');
  if (!['all', 'busan', 'seo-gu', 'any'].includes(filters.region)) throw new Error('지역을 확인해 주세요.');
  if (!['all', 'education', 'grant'].includes(filters.type)) throw new Error('공고 종류를 확인해 주세요.');
  return filters;
}

function decode(value) {
  const named = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', middot: '·', ndash: '–', mdash: '—' };
  return String(value || '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, key) => {
    if (key[0] !== '#') return named[key.toLowerCase()] ?? all;
    const n = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
    return n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : '';
  });
}

export function plainText(value) {
  return decode(String(value || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' '))
    .replace(/[\u200b-\u200d\ufeff]/g, '').replace(/\s+/g, ' ').trim();
}

function elements(html, tag) {
  return [...String(html || '').matchAll(new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}\\s*>`, 'gi'))]
    .map(match => ({ attributes: match[1], html: match[2], outer: match[0] }));
}
function attribute(attributes, name) {
  const match = String(attributes || '').match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return decode(match ? match[1] ?? match[2] ?? match[3] : '');
}
function hasClass(node, name) { return attribute(node.attributes, 'class').split(/\s+/).includes(name); }
function firstText(html, tag, className) {
  const node = elements(html, tag).find(item => !className || hasClass(item, className));
  return node ? plainText(node.html) : '';
}
function fieldFromList(html, label) {
  for (const li of elements(html, 'li')) {
    const heading = elements(li.html, 'span').find(node => hasClass(node, 'title') || hasClass(node, 's_title'));
    if (heading && plainText(heading.html) === label) return plainText(li.html.slice(li.html.indexOf(heading.outer) + heading.outer.length));
  }
  return '';
}
function tableFields(html) {
  const fields = {};
  for (const row of elements(html, 'tr')) {
    const cells = [...row.html.matchAll(/<(th|td)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)].map(match => ({ tag: match[1].toLowerCase(), text: plainText(match[2]) }));
    for (let i = 0; i < cells.length - 1; i++) if (cells[i].tag === 'th' && cells[i + 1].tag === 'td') fields[cells[i].text] = cells[i + 1].text;
  }
  return fields;
}
function stableHash(value) {
  let hash = 2166136261;
  for (const char of String(value)) { hash ^= char.codePointAt(0); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(16);
}
function unique(items) { return [...new Map(items.map(item => [item.id, item])).values()]; }

function kstDate(year, month, day, hour, minute, second) {
  if (![year, month, day, hour, minute, second].every(Number.isInteger) || year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) return null;
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}+09:00`;
}

// Only application-period fields reach this function; teaching/event dates never do.
export function parseApplicationPeriod(raw, yearHint) {
  const conditionalDeadline = /예산\s*소진|모집\s*규모\s*충족|선착순\s*마감|조기\s*마감/.test(plainText(raw));
  const unresolved = { applicationPeriod: plainText(raw), startsAt: undefined, endsAt: undefined, deadlinePrecision: undefined, conditionalDeadline };
  const text = plainText(raw).replace(/\([^)]*\)/g, ' ').replace(/([0-9])\s*[월화수목금토일](?=\s+\d{1,2}:)/g, '$1 ');
  if (!text || /세부\s*사업별|별도\s*공지|추후\s*공지|상시\s*접수|상시\s*모집/.test(text)) return unresolved;
  const pieces = text.split(/\s*(?:~|∼|～|–|부터)\s*/);
  if (pieces.length !== 2) return unresolved;
  const parse = (part, inheritedYear, isEnd) => {
    // Two-digit years are accepted only in an explicit YY.MM.DD form.
    const full = part.match(/(?<!\d)(20\d{2}|\d{2})\s*[년.\/-]\s*(\d{1,2})\s*[월.\/-]\s*(\d{1,2})\s*일?\.?/);
    const short = !full && part.match(/(?<!\d)(\d{1,2})\s*[월.\/-]\s*(\d{1,2})\s*일?\.?/);
    if (!full && !short) return null;
    const match = full || short;
    const year = full ? Number(full[1]) + (full[1].length === 2 ? 2000 : 0) : Number(inheritedYear);
    const month = Number(full ? full[2] : short[1]);
    const day = Number(full ? full[3] : short[2]);
    const after = part.slice(match.index + match[0].length).replace(/^[\s월화수목금토일]+/, '');
    const time = after.match(/^(\d{1,2})\s*(?::\s*(\d{2})|시(?:\s*(\d{1,2})\s*분)?)/);
    const hour = time ? Number(time[1]) : isEnd ? 23 : 0;
    const minute = time ? Number(time[2] || time[3] || 0) : isEnd ? 59 : 0;
    const second = !time && isEnd ? 59 : 0;
    const value = kstDate(year, month, day, hour, minute, second);
    return value ? { value, year, precision: time ? 'minute' : 'day' } : null;
  };
  const start = parse(pieces[0], yearHint, false);
  const end = parse(pieces[1], start?.year || yearHint, true);
  if (!start || !end || Date.parse(start.value) > Date.parse(end.value)) return unresolved;
  return { applicationPeriod: plainText(raw), startsAt: start.value, endsAt: end.value, deadlinePrecision: end.precision, conditionalDeadline };
}

export function computeStatus(item, now = Date.now()) {
  const nowMs = typeof now === 'number' ? now : Date.parse(now);
  const end = Date.parse(item.endsAt || '');
  const start = Date.parse(item.startsAt || '');
  const labels = Array.isArray(item.sourceStatus) ? item.sourceStatus : [item.sourceStatus || ''];
  if (Number.isFinite(end) && nowMs > end) return { status: 'closed', statusReason: '원문의 접수 마감일이 지났습니다.' };
  if (labels.some(label => CLOSED_LABEL.test(String(label).trim()))) return { status: 'closed', statusReason: '원문에 접수 마감으로 표시되어 있습니다.' };
  if (Number.isFinite(start) && nowMs < start) return { status: 'upcoming', statusReason: '원문의 접수 시작일 전입니다.' };
  if (labels.some(label => WAIT_LABEL.test(label))) return { status: 'unknown', statusReason: '원문은 대기 접수로 표시합니다.' };
  if (item.detailUnverified) return { status: 'unknown', statusReason: '상세 공고의 접수 상태를 확인하고 있습니다.' };
  if (labels.some(label => UPCOMING_LABEL.test(String(label).trim()))) return { status: 'upcoming', statusReason: '원문에 접수 예정으로 표시되어 있습니다.' };
  if (labels.some(label => OPEN_LABEL.test(String(label).trim()))) return { status: 'open', statusReason: '원문에 접수 중으로 표시되어 있습니다.' };
  if (item.conditionalDeadline) return { status: 'unknown', statusReason: '예산이나 모집인원에 따라 마감됩니다. 현재 상태는 원문에서 확인해 주세요.' };
  if (Number.isFinite(start) && Number.isFinite(end) && nowMs >= start && nowMs <= end) return { status: 'open', statusReason: '원문에 안내된 접수기간입니다. 잔여 정원은 원문에서 확인해 주세요.' };
  return { status: 'unknown', statusReason: '접수 상태는 원문에서 확인해 주세요.' };
}

export function subjectTags(title, summary = '') {
  const text = `${title} ${summary}`;
  if (/평생교육이용권/.test(title)) return [...SUBJECTS];
  return SUBJECTS.filter(subject => SUBJECT_PATTERNS[subject].test(text));
}
function regionalTitle(title) {
  const bracket = title.match(/^\s*\[([^\]]+)\]/)?.[1] || '';
  if (/부산.*서구|서구.*부산/.test(bracket)) return 'seo-gu';
  if (/부산/.test(bracket)) return 'busan';
  if (/전국|지역\s*무관/.test(bracket)) return 'any';
  // A different region must never be silently presented as unrestricted.
  if (/서울|경기|인천|대구|광주|전남|전북|충남|충북|경남|경북|강원|대전|세종|울산|제주/.test(bracket)) return null;
  return undefined;
}
function normalizedItem(fields, provider, checkedAt) {
  const title = plainText(fields.title).slice(0, 240);
  const summary = plainText(fields.summary).slice(0, 280);
  const item = {
    ...fields, id: `${provider.id}:${fields.sourceId}`, title, summary,
    provider: provider.name, providerId: provider.id, type: provider.type,
    checkedAt, subjects: fields.subjects || subjectTags(title, summary)
  };
  delete item.sourceId;
  return item;
}

export function parseKcmfList(html, url, checkedAt, provider = PROVIDERS.find(item => item.adapter === 'kcmf')) {
  const chunks = String(html).split(/<div\b[^>]*class=["']edu_program_list["'][^>]*>/i).slice(1);
  const items = [];
  for (const chunk of chunks) {
    const sourceId = chunk.match(/fn_goView\(['"](\d+)['"]\)/)?.[1];
    const title = firstText(chunk, 'h4');
    const period = fieldFromList(chunk, '신청기간');
    if (!sourceId || !title || !period) continue;
    const detail = new URL(url); detail.search = new URLSearchParams({ page: '1', viewCount: '12', pcode: sourceId, schM: 'view' }).toString();
    if (!isAllowedSourceUrl(detail.href, provider)) continue;
    items.push(normalizedItem({ sourceId, title, url: detail.href, region: 'busan', summary: fieldFromList(chunk, '개요'), educationPeriod: fieldFromList(chunk, '강의기간'), ...parseApplicationPeriod(period), sourceStatus: '' }, provider, checkedAt));
  }
  return unique(items);
}

export function parseKcmfDetail(html, candidate, checkedAt) {
  const start = String(html).search(/<div\b[^>]*class=["']edu_program_detail["']/i);
  if (start < 0) throw new Error('강좌 상세 형식을 확인하지 못했습니다.');
  const top = html.slice(start).split(/<div\b[^>]*class=["']edu_program_detail_mid["']/i)[0];
  const title = firstText(top, 'h3');
  const period = fieldFromList(top, '신청기간');
  if (!title || !period) throw new Error('강좌의 제목 또는 신청기간이 없습니다.');
  const sourceStatus = ['a', 'span', 'button'].flatMap(tag => elements(top, tag)).map(a => plainText(a.html)).filter(label => OPEN_LABEL.test(label) || CLOSED_LABEL.test(label) || WAIT_LABEL.test(label) || UPCOMING_LABEL.test(label));
  const summary = fieldFromList(top, '개요');
  return { ...candidate, title, summary, educationPeriod: fieldFromList(top, '강의기간'), ...parseApplicationPeriod(period), sourceStatus, checkedAt, subjects: subjectTags(title, summary), detailVerified: true };
}

export function parseSeoPlatformList(html, url, checkedAt, provider = PROVIDERS.find(item => item.adapter === 'seo-platform')) {
  const items = [];
  for (const row of elements(html, 'tr')) {
    const anchor = elements(row.html, 'a').find(a => /bsseogu\.go\.kr\/edu\/index\.bsseogu\?/.test(attribute(a.attributes, 'href')));
    if (!anchor) continue;
    const detail = new URL(attribute(anchor.attributes, 'href'));
    if (!isAllowedSourceUrl(detail.href, provider)) continue;
    const sourceId = detail.searchParams.get('el_code');
    const title = firstText(anchor.html, 'span', 'tit');
    if (!sourceId || !/^\d+$/.test(sourceId) || !title) continue;
    const spans = elements(row.html, 'span');
    const receipt = spans.find(node => plainText(node.html).startsWith('일반접수'));
    const education = spans.find(node => plainText(node.html).startsWith('교육기간'));
    const sourceStatus = spans.filter(node => hasClass(node, 's_btn')).map(node => plainText(node.html)).filter(label => OPEN_LABEL.test(label) || CLOSED_LABEL.test(label) || WAIT_LABEL.test(label) || UPCOMING_LABEL.test(label));
    items.push(normalizedItem({ sourceId, title, url: detail.href, listUrl: url, region: 'seo-gu', summary: '서구 평생학습 강좌입니다. 접수 상태와 과정 설명은 상세 공고에서 확인해 주세요.', ...parseApplicationPeriod(plainText(receipt?.html).replace(/^일반접수\s*/, '')), educationPeriod: plainText(education?.html).replace(/^교육기간\s*/, ''), sourceStatus, detailUnverified: true, subjects: subjectTags(title) }, provider, checkedAt));
  }
  return unique(items);
}

export function parseSeoDetail(html, candidate, checkedAt) {
  const fields = tableFields(html);
  const title = fields['강좌명'];
  const period = fields['접수기간'];
  if (!title || !period || !fields['상태']) throw new Error('서구 강좌 상세 형식을 확인하지 못했습니다.');
  const summary = (fields['상세내용'] || '').slice(0, 280);
  return { ...candidate, title, summary, sourceStatus: fields['상태'], educationPeriod: fields['학습기간'] || '', ...parseApplicationPeriod(period), checkedAt, subjects: subjectTags(title, summary), detailUnverified: false, detailVerified: true };
}

export function parseBizinfoList(html, url, checkedAt, provider = PROVIDERS.find(item => item.adapter === 'bizinfo')) {
  const items = [];
  for (const row of elements(html, 'tr')) {
    const anchor = elements(row.html, 'a').find(a => /selectSIIA200Detail\.do\?/.test(attribute(a.attributes, 'href')));
    if (!anchor) continue;
    const detail = new URL(attribute(anchor.attributes, 'href'), url);
    if (!isAllowedSourceUrl(detail.href, provider)) continue;
    const sourceId = detail.searchParams.get('pblancId');
    const title = plainText(anchor.html);
    if (!/^PBLN_\d+$/.test(sourceId || '') || !title) continue;
    const region = regionalTitle(title);
    if (region === null) continue;
    const cells = elements(row.html, 'td').map(cell => plainText(cell.html));
    const period = cells[3] || '';
    // Keep only the identifier: tracking/search parameters do not identify a notice.
    detail.search = new URLSearchParams({ pblancId: sourceId }).toString();
    items.push(normalizedItem({ sourceId, title, url: detail.href, region: region || 'any', regionEvidence: region ? '원문 제목의 지역 표기' : '원문 제목에 지역 구분이 없습니다. 신청 조건은 상세 공고를 확인해 주세요.', summary: '', ...parseApplicationPeriod(period), sourceStatus: '', authority: cells[4] || '' }, provider, checkedAt));
  }
  return unique(items);
}

export function parseBizinfoDetail(html, candidate, checkedAt) {
  const title = firstText(html, 'h2', 'title');
  const period = fieldFromList(html, '신청기간');
  const summary = fieldFromList(html, '사업개요');
  if (!title || !period || !summary) throw new Error('지원사업 상세 형식을 확인하지 못했습니다.');
  const titleRegion = regionalTitle(title);
  const restricted = summary.match(/(?:☞\s*)?(서울|경기|인천|대구|광주|전남|전북|충남|충북|경남|경북|강원|대전|세종|울산|제주)(?:특별자치도|특별시|광역시|도)?\s*(?:지역\s*|내\s*|소재\s*)?(?:소재|내\s|기업|소상공인|중소기업)/);
  // Unreviewed geographic restrictions cannot become the "지역 구분 없음" bucket.
  if (titleRegion === null || (candidate.region === 'any' && restricted)) return null;
  const item = { ...candidate, title, summary: summary.slice(0, 280), ...parseApplicationPeriod(period), sourceStatus: '', checkedAt, authority: fieldFromList(html, '소관부처·지자체'), performingAgency: fieldFromList(html, '사업수행기관'), subjects: subjectTags(title, summary), detailVerified: true };
  if (titleRegion) item.region = titleRegion;
  return item;
}

export function parseVoucherList(html, url, checkedAt, provider = PROVIDERS.find(item => item.adapter === 'voucher')) {
  const items = [];
  for (const anchor of elements(html, 'a')) {
    if (!/fn_vc_Move\(/.test(attribute(anchor.attributes, 'href')) || !hasClass(anchor, 'slide_card')) continue;
    const title = firstText(anchor.html, 'div', 'subject');
    const text = plainText(anchor.html);
    const period = text.match(/신청기간\s+([\s\S]*?)\s+지원금액/)?.[1] || '';
    const year = title.match(/\b(20\d{2})\b/)?.[1];
    if (!title || !period || !year) continue;
    items.push(normalizedItem({ sourceId: stableHash(title), title, url, region: 'busan', summary: '부산광역시 평생교육이용권 모집 공고입니다. 지원 유형과 신청 조건은 원문에서 확인해 주세요.', ...parseApplicationPeriod(period, year), sourceStatus: firstText(anchor.html, 'div', 'type'), subjects: [...SUBJECTS], detailVerified: false, sourceLevel: 'official-notice-card' }, provider, checkedAt));
  }
  return unique(items);
}

export function isAllowedSourceUrl(value, provider) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && provider.allowedHosts.includes(url.hostname) && provider.allowedPaths.includes(url.pathname);
  } catch { return false; }
}

async function boundedHtml(response) {
  if (Number(response.headers.get('content-length')) > MAX_HTML_BYTES) throw new Error('원문 크기가 수집 한도를 넘었습니다.');
  const reader = response.body?.getReader();
  if (!reader) return '';
  let size = 0; let html = ''; const decoder = new TextDecoder('utf-8');
  try {
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_HTML_BYTES) throw new Error('원문 크기가 수집 한도를 넘었습니다.');
      html += decoder.decode(value, { stream: true });
    }
    return html + decoder.decode();
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

export async function fetchOfficialHtml(url, provider, { fetcher = fetch, budget = { count: 0 }, signal, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  let current = url;
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, timeoutMs);
  try {
    for (let redirects = 0; redirects <= 2; redirects++) {
      if (controller.signal.aborted) throw new Error('공식 사이트 응답을 기다리는 시간이 지났습니다.');
      if (!isAllowedSourceUrl(current, provider)) throw new Error('허용되지 않은 원문 주소입니다.');
      if (budget.count >= MAX_FETCHES) throw new Error('이번 조회의 원문 수집 한도에 도달했습니다.');
      budget.count++;
      const response = await fetcher(current, { method: 'GET', redirect: 'manual', signal: controller.signal, headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': 'Personal-Edu-Source-Reader/1.0' } });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        await response.body?.cancel().catch(() => {});
        const location = response.headers.get('location');
        if (!location) throw new Error('원문 이동 주소가 없습니다.');
        current = new URL(location, current).href;
        continue;
      }
      if (!response.ok) { await response.body?.cancel().catch(() => {}); throw new Error(`공식 사이트 응답 오류 (${response.status})`); }
      const contentType = response.headers.get('content-type') || '';
      if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) { await response.body?.cancel().catch(() => {}); throw new Error('공식 사이트가 HTML 공고를 반환하지 않았습니다.'); }
      return { html: await boundedHtml(response), url: current };
    }
    throw new Error('원문 주소 이동이 너무 많습니다.');
  } catch (error) {
    if (controller.signal.aborted) throw new Error('공식 사이트 응답을 기다리는 시간이 지났습니다.');
    throw error;
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}

async function mapLimit(items, limit, callback) {
  const out = new Array(items.length); let index = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) { const n = index++; if (n >= items.length) return; out[n] = await callback(items[n], n); }
  }));
  return out;
}
function providerParsers(provider) {
  return {
    kcmf: [parseKcmfList, parseKcmfDetail],
    'seo-platform': [parseSeoPlatformList, parseSeoDetail],
    bizinfo: [parseBizinfoList, parseBizinfoDetail],
    voucher: [parseVoucherList, null]
  }[provider.adapter];
}

export async function collectProvider(provider, { fetcher = fetch, budget = { count: 0 }, now = Date.now() } = {}) {
  const checkedAt = new Date(now).toISOString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  const [listParser, detailParser] = providerParsers(provider) || [];
  if (!listParser) { clearTimeout(timer); throw new Error('지원하지 않는 공고 원본입니다.'); }
  const errors = [];
  try {
    const lists = await Promise.all(provider.listUrls.map(async url => {
      try {
        const response = await fetchOfficialHtml(url, provider, { fetcher, budget, signal: controller.signal });
        const items = listParser(response.html, response.url, checkedAt, provider);
        const recognizedRegionalList = provider.adapter === 'bizinfo' && /selectSIIA200Detail\.do\?[^"'<>]*pblancId=PBLN_\d+/.test(response.html);
        if (!items.length && !recognizedRegionalList && !/등록된\s*(?:강좌|게시물|공고|데이터).*없|검색\s*결과.*없|조회된\s*결과.*없/.test(plainText(response.html))) throw new Error('공고 목록의 형식을 확인하지 못했습니다.');
        return items;
      } catch (error) { errors.push(error.message); return null; }
    }));
    if (lists.every(list => list === null)) throw new Error(errors[0] || '원문을 확인하지 못했습니다.');
    let candidates = unique(lists.flatMap(list => list || []));
    for (const record of provider.reviewedDetails || []) {
      if (!candidates.some(item => item.id === `${provider.id}:${record.id}`)) candidates.push(normalizedItem({ sourceId: record.id, url: record.url, region: record.region, regionEvidence: record.regionEvidence, title: '', summary: '', subjects: [] }, provider, checkedAt));
    }
    if (!detailParser) return { checkedAt, items: candidates, status: errors.length ? 'partial' : 'ok', error: errors[0] };
    // Reviewed cross-regional notices stay available while new matching list entries are discovered.
    const reviewedIds = new Set((provider.reviewedDetails || []).map(item => `${provider.id}:${item.id}`));
    const relevant = candidates.filter(item => item.subjects.length || reviewedIds.has(item.id));
    relevant.sort((a, b) => Number(reviewedIds.has(b.id)) - Number(reviewedIds.has(a.id)));
    const details = relevant.slice(0, MAX_DETAILS);
    const detailIds = new Set(details.map(item => item.id));
    const resolved = await mapLimit(details, 3, async candidate => {
      try {
        const response = await fetchOfficialHtml(candidate.url, provider, { fetcher, budget, signal: controller.signal });
        return detailParser(response.html, candidate, checkedAt);
      } catch (error) {
        errors.push(error.message);
        return candidate.title ? { ...candidate, detailUnverified: true } : null;
      }
    });
    // No unchecked detail receives an affirmative open state from a list badge alone.
    const pending = relevant.filter(item => !detailIds.has(item.id)).map(item => ({ ...item, detailUnverified: true }));
    return { checkedAt, items: unique([...resolved.filter(Boolean), ...pending]), status: errors.length ? 'partial' : 'ok', error: errors[0] };
  } finally { clearTimeout(timer); }
}

function cacheKey(provider, suffix) { return new Request(`https://photo-ebook.internal/cache/${CACHE_VERSION}/${provider.id}/${suffix}`); }
async function readCache(cache, key) {
  if (!cache) return null;
  try { const response = await cache.match(key); return response ? await response.json() : null; } catch { return null; }
}
async function putCache(cache, key, value, maxAge) {
  if (!cache) return;
  try { await cache.put(key, new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${maxAge}` } })); } catch { /* A cache outage must not discard a successful source read. */ }
}
function validSnapshot(value) { return value && typeof value.checkedAt === 'string' && Number.isFinite(Date.parse(value.checkedAt)) && Array.isArray(value.items); }

async function cachedProvider(provider, context, options) {
  const { now, cache } = options;
  const fresh = await readCache(cache, cacheKey(provider, 'fresh'));
  const cachedAt = Date.parse(fresh?.cachedAt || fresh?.checkedAt || '');
  if (validSnapshot(fresh) && now - cachedAt < CACHE_SECONDS * 1000 && now >= cachedAt) return { ...fresh, cached: true };
  const old = await readCache(cache, cacheKey(provider, 'last-good'));
  try {
    const latest = await collectProvider(provider, options);
    // A detail failure must not overwrite a previously verified record with a weaker list record.
    if (validSnapshot(old)) {
      const previous = new Map(old.items.map(item => [item.id, item]));
      latest.items = latest.items.map(item => item.detailUnverified && previous.get(item.id)?.detailVerified && computeStatus(item, now).status !== 'closed' ? { ...previous.get(item.id), stale: true } : item);
      if (latest.status === 'partial') {
        const latestIds = new Set(latest.items.map(item => item.id));
        latest.items.push(...old.items.filter(item => !latestIds.has(item.id)).map(item => ({ ...item, stale: true })));
      }
    }
    const saves = Promise.all([
      putCache(cache, cacheKey(provider, 'fresh'), latest, CACHE_SECONDS),
      // Partial snapshots preserve last verified records above, and keep current explicit closures.
      putCache(cache, cacheKey(provider, 'last-good'), latest, LAST_GOOD_SECONDS)
    ]);
    if (context?.waitUntil) context.waitUntil(saves); else await saves;
    return latest;
  } catch (error) {
    const seed = bootstrap.providers[provider.id];
    const fallback = validSnapshot(old) ? old : validSnapshot(seed) ? seed : null;
    const failed = {
      checkedAt: fallback?.checkedAt || new Date(now).toISOString(), attemptedAt: new Date(now).toISOString(), cachedAt: new Date(now).toISOString(), lastSuccessAt: fallback?.checkedAt,
      items: fallback ? fallback.items.map(item => ({ ...item, stale: true })) : [],
      status: fallback ? 'stale' : 'error', error: error.message,
      stale: Boolean(fallback), bootstrap: !validSnapshot(old) && Boolean(fallback)
    };
    const save = putCache(cache, cacheKey(provider, 'fresh'), failed, CACHE_SECONDS);
    if (context?.waitUntil) context.waitUntil(save); else await save;
    return failed;
  }
}

export async function getLearningOpportunities(context, filters, options = {}) {
  const now = options.now ?? Date.now();
  const cache = options.cache === undefined ? globalThis.caches?.default : options.cache;
  const providers = (options.providers || PROVIDERS).filter(provider => (filters.type === 'all' || provider.type === filters.type) && (filters.region === 'all' || provider.regions.includes(filters.region)));
  const budget = { count: 0 };
  const results = await Promise.all(providers.map(async provider => ({ provider, result: await cachedProvider(provider, context, { now, cache, fetcher: options.fetcher || fetch, budget }) })));
  const items = unique(results.flatMap(({ result }) => result.items))
    .filter(item => item.title && SUBJECTS.includes(filters.subject) && item.subjects?.includes(filters.subject) && (filters.region === 'all' || item.region === filters.region) && (filters.type === 'all' || item.type === filters.type))
    .map(item => ({ ...item, ...computeStatus(item, now) }))
    .sort((a, b) => ({ open: 0, upcoming: 1, unknown: 2, closed: 3 }[a.status] - { open: 0, upcoming: 1, unknown: 2, closed: 3 }[b.status]) || (Date.parse(b.checkedAt) - Date.parse(a.checkedAt)) || a.id.localeCompare(b.id));
  const statuses = results.map(({ provider, result }) => ({ id: provider.id, name: provider.name, status: result.status, checkedAt: result.checkedAt, ...(result.attemptedAt ? { attemptedAt: result.attemptedAt } : {}), ...(result.lastSuccessAt ? { lastSuccessAt: result.lastSuccessAt } : {}), ...(result.error ? { error: result.error } : {}), ...(result.cached ? { cached: true } : {}), ...(result.bootstrap ? { bootstrap: true } : {}) }));
  return {
    ok: statuses.some(provider => provider.status !== 'error'), items,
    lastCheckedAt: statuses.length ? new Date(Math.max(...statuses.map(provider => Date.parse(provider.checkedAt)))).toISOString() : null,
    providers: statuses, stale: results.some(({ result }) => result.stale || result.items.some(item => item.stale)),
    partial: statuses.some(provider => ['partial', 'stale', 'error'].includes(provider.status))
  };
}

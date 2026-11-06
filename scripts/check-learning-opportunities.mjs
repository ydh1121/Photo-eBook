#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  SUBJECTS, PROVIDERS, CACHE_SECONDS, MAX_FETCHES, parseFilters,
  parseApplicationPeriod, computeStatus, subjectTags, plainText,
  parseKcmfList, parseKcmfDetail, parseSeoPlatformList, parseSeoDetail,
  parseBizinfoList, parseBizinfoDetail, parseVoucherList,
  isAllowedSourceUrl, fetchOfficialHtml, collectProvider, getLearningOpportunities
} from '../functions/lib/learning-opportunities.js';
import { onRequestGet } from '../functions/api/learning-opportunities.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const recorded = JSON.parse(fs.readFileSync(path.join(root, 'content/discovery/v1/notices-fixtures.json'), 'utf8'));
const fixtures = new Map(recorded.fixtures.map(fixture => [fixture.id, fixture]));
const checkedAt = recorded.checkedAt;
const now = Date.parse(checkedAt);
const [kcmf, seo, biz, voucher] = PROVIDERS;
const html = id => fixtures.get(id).html;
const response = body => new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
const failures = [];
let checks = 0;
async function check(name, fn) {
  checks++;
  try { await fn(); }
  catch (error) { failures.push(`${name}: ${error.message}`); }
}
function exactStatus(item, expected, time = now) { assert.equal(computeStatus(item, time).status, expected); }
function rowFor(id, list = 'kcmf-open-list') {
  const chunks = html(list).match(/<div class="edu_program_list">[\s\S]*?<!-- edu_program_list-->\s*<\/div>/g) || [];
  const result = chunks.find(chunk => chunk.includes(`fn_goView('${id}')`));
  assert.ok(result, `captured row ${id} exists`); return result;
}

for (const fixture of fixtures.values()) {
  await check(`captured fixture provenance ${fixture.id}`, () => {
    assert.equal(fixture.kind, 'captured_html_fragment');
    assert.equal(crypto.createHash('sha256').update(fixture.html).digest('hex'), fixture.htmlSha256);
    assert.match(fixture.responseSha256, /^[a-f0-9]{64}$/);
    assert.ok(Number.isFinite(Date.parse(fixture.capturedAt)));
    assert.ok(PROVIDERS.some(provider => isAllowedSourceUrl(fixture.sourceUrl, provider)), fixture.sourceUrl);
  });
}

const openCourses = parseKcmfList(html('kcmf-open-list'), kcmf.listUrls[0], checkedAt);
const pastCourses = parseKcmfList(html('kcmf-past-list'), kcmf.listUrls[1], checkedAt);
const obs = parseKcmfDetail(html('kcmf-open'), openCourses.find(item => item.id === 'kcmf-busan:10009035'), checkedAt);
const oldAi = parseKcmfDetail(html('kcmf-closed'), pastCourses.find(item => item.id === 'kcmf-busan:10008997'), checkedAt);

await check('KCMF recorded lists expose 10 upcoming and 12 past courses', () => {
  assert.equal(openCourses.length, 10); assert.equal(pastCourses.length, 12);
  assert.equal(new Set([...openCourses, ...pastCourses].map(item => item.id)).size, 22);
});
await check('KCMF JS links become verified detail URLs', () => {
  assert.equal(obs.url, 'https://kcmf.or.kr/KCMF/contents/KCMF05011203.do?page=1&viewCount=12&pcode=10009035&schM=view');
  assert.ok(isAllowedSourceUrl(obs.url, kcmf));
});
await check('KCMF open detail has application times distinct from teaching dates', () => {
  assert.equal(obs.startsAt, '2026-11-01T18:00:00+09:00');
  assert.equal(obs.endsAt, '2026-11-25T18:00:00+09:00');
  assert.equal(obs.educationPeriod, '2026-11-30 ~ 2026-12-08');
  assert.deepEqual(obs.sourceStatus, ['신청하기']);
  assert.deepEqual(obs.subjects, ['video']); exactStatus(obs, 'open');
});
await check('KCMF past course closes on application deadline, not teaching day', () => {
  assert.equal(oldAi.endsAt, '2026-10-23T10:00:00+09:00');
  assert.equal(oldAi.educationPeriod, '2026-10-26 ~ 2026-10-26');
  exactStatus(oldAi, 'closed'); assert.ok(oldAi.subjects.includes('ai'));
});
await check('KCMF detail identity cannot be inferred from generic login HTML', () => assert.throws(() => parseKcmfDetail('<title>로그인</title>', obs, checkedAt)));

const grants = parseBizinfoList(html('bizinfo-keyword'), biz.listUrls[0], checkedAt);
const central = parseBizinfoList(html('bizinfo-central'), biz.listUrls[1], checkedAt);
const reviewed = record => ({ ...record, id: `bizinfo:${record.id}`, providerId: 'bizinfo', provider: biz.name, type: 'grant' });
const digital = parseBizinfoDetail(html('bizinfo-digital-open'), reviewed(biz.reviewedDetails[0]), checkedAt);
const aiGrant = parseBizinfoDetail(html('bizinfo-ai-closed'), reviewed(biz.reviewedDetails[1]), checkedAt);
const vp = parseBizinfoDetail(html('bizinfo-vp-open'), grants.find(item => item.id === 'bizinfo:PBLN_000000000127432'), checkedAt);
const unknownGrant = parseBizinfoDetail(html('bizinfo-unknown'), { id: 'bizinfo:PBLN_000000000117016', region: 'any' }, checkedAt);

await check('Bizinfo excludes explicitly unrelated local regions from unrestricted results', () => {
  assert.equal(grants.length, 5);
  assert.ok(grants.some(item => item.region === 'busan'));
  assert.ok(grants.every(item => !/^\[(?:경기|울산|광주|인천|충북)\]/.test(item.title)));
});
await check('A source row cannot turn an external host into an official notice link', () => {
  const hostile = html('bizinfo-keyword').replaceAll('selectSIIA200Detail.do?', 'https://evil.test/sii/siia/selectSIIA200Detail.do?');
  assert.equal(parseBizinfoList(hostile, biz.listUrls[0], checkedAt).length, 0);
});
await check('Bizinfo list preserves date-only KST end precision', () => {
  assert.equal(vp.endsAt, '2026-11-17T23:59:59+09:00');
  assert.equal(vp.deadlinePrecision, 'day'); exactStatus(vp, 'open');
});
await check('Verified digital education support is currently within its recruitment window', () => {
  assert.equal(digital.endsAt, '2026-11-30T23:59:59+09:00');
  assert.equal(digital.authority, '중소벤처기업부');
  assert.equal(digital.performingAgency, '소상공인시장진흥공단');
  assert.equal(digital.region, 'any'); assert.ok(digital.subjects.includes('community')); exactStatus(digital, 'open');
});
await check('Verified AI support notice stays closed after July', () => {
  assert.equal(aiGrant.endsAt, '2026-07-03T23:59:59+09:00'); exactStatus(aiGrant, 'closed');
});
await check('Different subprogram deadlines do not fabricate a universal deadline', () => {
  assert.equal(unknownGrant.applicationPeriod, '세부사업별 상이');
  assert.equal(unknownGrant.endsAt, undefined); exactStatus(unknownGrant, 'unknown');
});
await check('New unspecified detail deadline clears a former dated list value', () => {
  const changed = parseBizinfoDetail(html('bizinfo-unknown'), { ...vp }, checkedAt);
  assert.equal(changed.endsAt, undefined); assert.equal(changed.startsAt, undefined); exactStatus(changed, 'unknown');
});
await check('Source metadata never claims personal eligibility', () => {
  for (const item of [digital, aiGrant, vp, unknownGrant]) {
    assert.equal(item.eligible, undefined); assert.equal(item.entitledAmount, undefined); assert.equal(item.approved, undefined);
  }
});

const seoCourses = parseSeoPlatformList(html('seogu-platform-list'), seo.listUrls[0], checkedAt);
await check('Seo-gu actual platform list supplies ten external course URLs', () => {
  assert.equal(seoCourses.length, 10); assert.ok(seoCourses.every(item => item.region === 'seo-gu' && isAllowedSourceUrl(item.url, seo)));
});
await check('Seo-gu platform course dates do not become application dates', () => {
  const cake = seoCourses.find(item => item.id === 'busan-seo-learning:1991');
  assert.equal(cake.endsAt, '2026-12-04T23:59:59+09:00');
  assert.equal(cake.educationPeriod, '26.12.19.~26.12.19.');
  assert.ok(cake.sourceStatus.includes('접수중'));
  exactStatus(cake, 'unknown'); // The direct source may already be full.
});
await check('Unrelated crafts and general EBS access do not become AI recommendations', () => {
  assert.ok(seoCourses.every(item => item.subjects.length === 0));
});
await check('Seo-gu parser rejects a page lacking a structured state or application period', () => assert.throws(() => parseSeoDetail('<table><tr><th>학습기간</th><td>2026-01-01 ~ 2026-12-31</td></tr></table>', seoCourses[0], checkedAt)));
await check('Seo-gu future detail guard is synthetic and explicitly separate from captured fixtures', () => {
  const synthetic = '<table><tr><th>강좌명</th><td>검증용 영상 강좌</td><th>접수기간</th><td>2026-11-01 ~ 2026-11-30</td></tr><tr><th>학습기간</th><td>2026-12-01 ~ 2026-12-31</td><th>상태</th><td>접수마감</td></tr></table>';
  const item = parseSeoDetail(synthetic, seoCourses[0], checkedAt);
  assert.equal(item.detailUnverified, false); assert.equal(item.endsAt, '2026-11-30T23:59:59+09:00'); exactStatus(item, 'closed');
});

const vouchers = parseVoucherList(html('busan-voucher'), voucher.listUrls[0], checkedAt);
await check('Seven real Busan voucher notices are closed; announcement date is not deadline', () => {
  assert.equal(vouchers.length, 7);
  assert.equal(vouchers[0].endsAt, '2026-09-22T17:00:00+09:00');
  assert.equal(vouchers[0].title, '2026 AI·디지털 평생교육이용권 2차');
  for (const item of vouchers) { exactStatus(item, 'closed'); assert.deepEqual(item.subjects, SUBJECTS); }
});
await check('Repeated shared source URL still has separate stable notice IDs', () => {
  assert.equal(new Set(vouchers.map(item => item.url)).size, 1);
  assert.equal(new Set(vouchers.map(item => item.id)).size, 7);
  assert.deepEqual(parseVoucherList(html('busan-voucher'), voucher.listUrls[0], checkedAt).map(item => item.id), vouchers.map(item => item.id));
});

await check('Day-only deadline remains open through 23:59:59 KST', () => {
  exactStatus(vp, 'open', '2026-11-17T23:59:59+09:00');
  exactStatus(vp, 'closed', '2026-11-18T00:00:00+09:00');
});
await check('Timed deadline closes after its exact minute, without a UTC date shortcut', () => {
  exactStatus(obs, 'open', '2026-11-25T09:00:00Z');
  exactStatus(obs, 'closed', '2026-11-25T09:00:00.001Z');
});
await check('Expired deadline outranks an obsolete recruiting badge', () => exactStatus({ ...obs, sourceStatus: '모집중' }, 'closed', '2026-11-26T00:00:00+09:00'));
await check('Closed source badge outranks a future start and future end', () => exactStatus({ startsAt: '2026-12-01T00:00:00+09:00', endsAt: '2026-12-30T23:59:59+09:00', sourceStatus: '접수마감' }, 'closed'));
await check('Future application start outranks an early recruiting badge', () => exactStatus({ startsAt: '2026-11-18T00:00:00+09:00', sourceStatus: '모집중' }, 'upcoming'));
await check('Waitlist is not normal open recruitment', () => exactStatus({ ...obs, sourceStatus: '대기접수' }, 'unknown'));
await check('Failed detail cannot turn a list label into certain open recruitment', () => exactStatus({ ...obs, sourceStatus: '접수중', detailUnverified: true }, 'unknown'));
await check('Missing period with no reliable status remains unknown', () => exactStatus({ applicationPeriod: '예산 소진시까지' }, 'unknown'));
await check('Capacity condition retains an explicit maximum date and closes after it', () => {
  const item = parseApplicationPeriod('2026.11.01 ~ 2026.11.10 (예산 소진 시 조기 마감)');
  assert.equal(item.endsAt, '2026-11-10T23:59:59+09:00'); exactStatus(item, 'unknown'); exactStatus(item, 'closed', '2026-11-11T00:00:00+09:00');
});
for (const invalid of ['2026-02-30 ~ 2026-03-06', '2026-11-06 ~ 2026-11-01', '2026-11-01 25:00 ~ 2026-11-30', '11.01 ~ 11.30', '2026-11-01', '2026-12-31 ~ 01-02']) {
  await check(`Ambiguous/invalid deadline stays unknown: ${invalid}`, () => assert.equal(parseApplicationPeriod(invalid).endsAt, undefined));
}
await check('Year may be inherited from the explicit start date', () => assert.equal(parseApplicationPeriod('2026. 10. 21.(수) ~ 11.16.(월)').endsAt, '2026-11-16T23:59:59+09:00'));
await check('Year may come from a verified voucher title, never the wall clock', () => {
  assert.equal(parseApplicationPeriod('09.09(수) 10시 ~ 09.22(화) 17시', 2026).endsAt, '2026-09-22T17:00:00+09:00');
  assert.equal(parseApplicationPeriod('09.09(수) 10시 ~ 09.22(화) 17시').endsAt, undefined);
});
await check('Plain metadata strips scripts and comments', () => assert.equal(plainText('<script>secret()</script><!--접수중--><p>영상&nbsp;교육</p>'), '영상 교육'));
await check('Subject matching does not invent property or auction relevance', () => {
  assert.deepEqual(subjectTags('레진 공예'), []);
  assert.deepEqual(subjectTags('부동산 계약과 등기'), ['real-estate']);
  assert.deepEqual(subjectTags('온비드 공매 권리분석'), ['auction']);
});
await check('SNS classification requires a platform or meaningful social publishing context', () => {
  for (const title of ['SNS 마케팅 기초', '인스타그램 계정 운영', '유튜브 Shorts 제작', '메타 Threads 글쓰기', '스레드 계정 만들기', '소셜 미디어 홍보', '온라인 플랫폼 입점 및 홍보 교육']) assert.ok(subjectTags(title).includes('sns'), title);
  for (const title of ['멀티스레드 프로그래밍', '파이썬 threads 동기화', '생성형 AI 자기소개서', '스마트폰 사진 촬영 기초', '오프라인 판매 기법']) assert.ok(!subjectTags(title).includes('sns'), title);
  assert.ok(digital.subjects.includes('sns'));
  assert.deepEqual(parseFilters('https://unit.test/api?subject=sns&region=seo-gu&type=education'), { subject: 'sns', region: 'seo-gu', type: 'education' });
});

await check('Only declared query values are accepted', () => {
  assert.deepEqual(parseFilters('https://unit.test/api?subject=ai'), { subject: 'ai', region: 'all', type: 'all' });
  for (const query of ['subject=photography', 'subject=ai&region=seoul', 'subject=ai&type=loan', 'subject=ai&url=https://evil.test/', 'subject=ai&subject=video', 'region=all']) assert.throws(() => parseFilters(`https://unit.test/api?${query}`));
});
await check('Bad API query returns 400 before fetching any source', async () => {
  const result = await onRequestGet({ request: new Request('https://unit.test/api?subject=ai&url=https://evil.test') });
  assert.equal(result.status, 400); assert.equal((await result.json()).ok, false);
});
for (const blocked of ['http://kcmf.or.kr/KCMF/contents/KCMF05011203.do', 'https://kcmf.or.kr.evil.test/KCMF/contents/KCMF05011203.do', 'https://user:pass@kcmf.or.kr/KCMF/contents/KCMF05011203.do', 'https://kcmf.or.kr:8443/KCMF/contents/KCMF05011203.do', 'https://kcmf.or.kr/private/admin', 'https://127.0.0.1/KCMF/contents/KCMF05011203.do']) {
  await check(`URL allowlist rejects ${blocked}`, () => assert.equal(isAllowedSourceUrl(blocked, kcmf), false));
}
await check('Cross-host redirect is rejected before the second request', async () => {
  let count = 0;
  await assert.rejects(fetchOfficialHtml(kcmf.listUrls[0], kcmf, { fetcher: async () => { count++; return new Response(null, { status: 302, headers: { Location: 'https://evil.test/private' } }); } }), /허용되지/);
  assert.equal(count, 1);
});
await check('Allowed redirect remains inside provider paths and uses manual redirect handling', async () => {
  let count = 0;
  const result = await fetchOfficialHtml(kcmf.listUrls[0], kcmf, { fetcher: async (_, init) => { assert.equal(init.redirect, 'manual'); return ++count === 1 ? new Response(null, { status: 302, headers: { Location: 'https://www.kcmf.or.kr/KCMF/contents/KCMF05011203.do' } }) : response('ok'); } });
  assert.equal(result.html, 'ok'); assert.equal(count, 2);
});
await check('A redirect loop is bounded', async () => {
  let count = 0;
  await assert.rejects(fetchOfficialHtml(kcmf.listUrls[0], kcmf, { fetcher: async () => { count++; return new Response(null, { status: 302, headers: { Location: kcmf.listUrls[0] } }); } }), /이동이 너무 많/);
  assert.equal(count, 3);
});
await check('A login/forbidden response is not retried with credentials or alternate identities', async () => {
  let count = 0;
  await assert.rejects(fetchOfficialHtml(kcmf.listUrls[0], kcmf, { fetcher: async (_, init) => { count++; assert.equal(init.headers.Cookie, undefined); assert.equal(init.headers.Authorization, undefined); return new Response('blocked', { status: 403 }); } }), /403/);
  assert.equal(count, 1);
});
await check('Request deadline aborts a stalled official fetch', async () => {
  await assert.rejects(fetchOfficialHtml(kcmf.listUrls[0], kcmf, { timeoutMs: 5, fetcher: (_, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })) }), /시간이 지났/);
});
await check('Oversized HTML is rejected before it can become a parser success', async () => {
  await assert.rejects(fetchOfficialHtml(kcmf.listUrls[0], kcmf, { fetcher: async () => new Response('oversized', { headers: { 'Content-Type': 'text/html', 'Content-Length': '1000001' } }) }), /수집 한도/);
});
await check('Non-HTML responses cannot masquerade as scraped notices', async () => {
  await assert.rejects(fetchOfficialHtml(kcmf.listUrls[0], kcmf, { fetcher: async () => new Response('{}', { headers: { 'Content-Type': 'application/json' } }) }), /HTML/);
});
await check('Total request budget also covers redirects', async () => {
  let calls = 0;
  await assert.rejects(fetchOfficialHtml(kcmf.listUrls[0], kcmf, { budget: { count: MAX_FETCHES }, fetcher: async () => { calls++; return response(''); } }), /수집 한도/);
  assert.equal(calls, 0); assert.ok(MAX_FETCHES < 50);
  assert.ok(MAX_FETCHES + PROVIDERS.length * 4 < 50, 'cache reads/writes also fit the request limit');
});
await check('Provider reads at most six detail pages and preserves failed detail uncertainty', async () => {
  let details = 0; const budget = { count: 0 };
  const result = await collectProvider(kcmf, { now, budget, fetcher: async url => {
    if (url.includes('pcode=')) { details++; return new Response('offline', { status: 503 }); }
    return response(html(url.includes('05011204') ? 'kcmf-past-list' : 'kcmf-open-list'));
  } });
  assert.equal(details, 6); assert.equal(budget.count, 8); assert.equal(result.status, 'partial');
  assert.ok(result.items.every(item => computeStatus(item, now).status !== 'open'));
});

class MemoryCache {
  values = new Map();
  async match(key) { return this.values.get(key.url)?.clone(); }
  async put(key, value) { this.values.set(key.url, value.clone()); }
}
const testProvider = { ...kcmf, id: 'fixture-kcmf', listUrls: [kcmf.listUrls[0]] };
const filters = { subject: 'video', region: 'all', type: 'all' };
const liveFixture = async url => response(url.includes('pcode=') ? html('kcmf-open') : rowFor('10009035'));

await check('SNS can classify a pre-SNS provider cache without changing verification time or other tags', async () => {
  const seed=JSON.parse(fs.readFileSync(path.join(root,'content/discovery/v1/notices-bootstrap.json'),'utf8')).providers.bizinfo.items.find(item=>item.id==='bizinfo:PBLN_000000000122273');
  const legacy={...seed,subjects:seed.subjects.filter(subject=>subject!=='sns')};
  const cached={checkedAt,items:[legacy],status:'ok'};
  let calls=0;
  const result=await getLearningOpportunities(null,{subject:'sns',region:'all',type:'all'},{now,providers:[biz],cache:{async match(){return new Response(JSON.stringify(cached));}},fetcher:async()=>{calls++;throw new Error('fresh cache must not fetch');}});
  assert.equal(calls,0);assert.equal(result.items.length,1);assert.equal(result.items[0].checkedAt,legacy.checkedAt);
  assert.deepEqual(result.items[0].subjects,[...legacy.subjects,'sns']);assert.equal(result.items[0].endsAt,legacy.endsAt);assert.equal(result.items[0].sourceStatus,legacy.sourceStatus);
});

await check('Successful collection is cached once across different subject queries', async () => {
  const cache = new MemoryCache(); let calls = 0;
  const fetcher = async url => { calls++; return liveFixture(url); };
  const first = await getLearningOpportunities(null, filters, { now, cache, providers: [testProvider], fetcher });
  const second = await getLearningOpportunities(null, { ...filters, subject: 'ai' }, { now: now + 1000, cache, providers: [testProvider], fetcher });
  assert.equal(first.items.length, 1); assert.equal(calls, 2); assert.equal(second.items.length, 0);
  assert.equal(second.providers[0].cached, true);
});
await check('A cached response recomputes closure when the deadline passes', async () => {
  const cache = new MemoryCache(); let calls = 0; const time = Date.parse('2026-11-25T08:59:59Z');
  const fetcher = async url => { calls++; return liveFixture(url); };
  const before = await getLearningOpportunities(null, filters, { now: time, cache, providers: [testProvider], fetcher });
  const after = await getLearningOpportunities(null, filters, { now: time + 2000, cache, providers: [testProvider], fetcher });
  assert.equal(before.items[0].status, 'open'); assert.equal(after.items[0].status, 'closed'); assert.equal(calls, 2);
});
await check('Source outage retains last good item, original checkedAt, and stale state', async () => {
  const cache = new MemoryCache();
  const before = await getLearningOpportunities(null, filters, { now, cache, providers: [testProvider], fetcher: liveFixture });
  let failures = 0; const fail = async () => { failures++; return new Response('offline', { status: 503 }); };
  const afterTime = now + (CACHE_SECONDS + 1) * 1000;
  const after = await getLearningOpportunities(null, filters, { now: afterTime, cache, providers: [testProvider], fetcher: fail });
  assert.equal(after.items[0].id, before.items[0].id); assert.equal(after.items[0].checkedAt, before.items[0].checkedAt);
  assert.equal(after.items[0].status, 'open'); assert.equal(after.items[0].stale, true); assert.equal(after.stale, true);
  assert.equal(after.providers[0].status, 'stale'); assert.equal(after.providers[0].checkedAt, before.providers[0].checkedAt);
  assert.equal(after.providers[0].attemptedAt, new Date(afterTime).toISOString());
  await getLearningOpportunities(null, filters, { now: afterTime + 1000, cache, providers: [testProvider], fetcher: fail });
  assert.equal(failures, 1, 'outage is not retried on every client request');
});
await check('Detail-only outage does not replace a previously verified course with a weak list row', async () => {
  const cache = new MemoryCache();
  await getLearningOpportunities(null, filters, { now, cache, providers: [testProvider], fetcher: liveFixture });
  const result = await getLearningOpportunities(null, filters, { now: now + 601000, cache, providers: [testProvider], fetcher: async url => url.includes('pcode=') ? new Response('offline', { status: 503 }) : response(rowFor('10009035')) });
  assert.equal(result.items[0].detailVerified, true); assert.equal(result.items[0].stale, true); assert.equal(result.items[0].checkedAt, new Date(now).toISOString());
  assert.equal(result.providers[0].status, 'partial');
});
await check('Explicitly shortened list deadline still closes despite detail outage and old cache', async () => {
  const cache = new MemoryCache();
  await getLearningOpportunities(null, filters, { now, cache, providers: [testProvider], fetcher: liveFixture });
  // Synthetic mutation models an edited source; the original recorded fixture is untouched.
  const shortened = rowFor('10009035').replace('2026-11-25', '2026-11-05');
  const result = await getLearningOpportunities(null, filters, { now: now + 601000, cache, providers: [testProvider], fetcher: async url => url.includes('pcode=') ? new Response('offline', { status: 503 }) : response(shortened) });
  assert.equal(result.items[0].status, 'closed'); assert.equal(result.items[0].endsAt, '2026-11-05T18:00:00+09:00');
});
await check('Malformed successful HTML is a provider error, not a fake empty success', async () => {
  const result = await getLearningOpportunities(null, filters, { now, cache: new MemoryCache(), providers: [testProvider], fetcher: async () => response('<h1>Sign in</h1>') });
  assert.equal(result.ok, false); assert.equal(result.items.length, 0); assert.equal(result.providers[0].status, 'error');
});
await check('One failed provider does not discard a different successful provider', async () => {
  const result = await getLearningOpportunities(null, filters, { now, cache: new MemoryCache(), providers: [testProvider, { ...voucher, id: 'fixture-voucher' }], fetcher: async url => url.includes('lllcard.kr') ? new Response('offline', { status: 503 }) : liveFixture(url) });
  assert.equal(result.ok, true); assert.equal(result.items.length, 1); assert.equal(result.partial, true);
  assert.ok(result.providers.some(provider => provider.status === 'error'));
});
await check('Exact region and type filtering does not relabel items', async () => {
  const result = await getLearningOpportunities(null, { subject: 'video', region: 'any', type: 'education' }, { now, cache: new MemoryCache(), providers: [testProvider], fetcher: async () => { throw new Error('must not fetch mismatched provider'); } });
  assert.equal(result.providers.length, 0); assert.equal(result.items.length, 0);
});

const snapshotPath = path.join(root, 'public/content-discovery/learning-opportunities.json');
if (fs.existsSync(snapshotPath)) {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  await check('Public bootstrap snapshot uses stable IDs, source URLs, and declared statuses', () => {
    assert.ok(Number.isFinite(Date.parse(snapshot.checkedAt))); assert.ok(Array.isArray(snapshot.providers));
    assert.equal(new Set(snapshot.items.map(item => item.id)).size, snapshot.items.length);
    for (const item of snapshot.items) {
      assert.ok(item.title && item.checkedAt && item.providerId && item.id.startsWith(`${item.providerId}:`));
      assert.ok(PROVIDERS.some(provider => provider.id === item.providerId && isAllowedSourceUrl(item.url, provider)));
      assert.ok(['open', 'closed', 'upcoming', 'unknown'].includes(item.status));
      assert.ok(item.subjects.length && item.subjects.every(subject => SUBJECTS.includes(subject)));
      assert.equal(item.status, computeStatus(item, snapshot.checkedAt).status);
    }
  });
} else failures.push('Public bootstrap snapshot is missing.');

if (process.argv.includes('--live')) {
  const results = await Promise.all(PROVIDERS.map(provider => collectProvider(provider).then(value => ({ id: provider.id, status: value.status, items: value.items.length, error: value.error })).catch(error => ({ id: provider.id, status: 'error', error: error.message }))));
  console.log(JSON.stringify({ liveRead: results }, null, 2));
}

if (failures.length) {
  console.error(`FAIL ${failures.length}/${checks} checks\n${failures.map(failure => `- ${failure}`).join('\n')}`);
  process.exitCode = 1;
} else console.log(`PASS ${checks} checks: captured official HTML, dates/status precedence, source isolation, bounded requests, stale-cache preservation, API filtering and verified snapshot.`);

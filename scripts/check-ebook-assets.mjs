import assert from 'node:assert/strict';
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {openLocalD1} from './ebook/sqlite-d1-adapter.mjs';
import {EBOOK_LIMITS, validateBudgetAttestation, calculateAssetPublicationBudget} from '../functions/lib/ebook-asset-budget.js';
import {publishEbookAssets} from '../functions/lib/ebook-asset-publisher.js';
import {createEbookAssetHandler} from '../functions/lib/ebook-asset-service.js';

const results = [];
async function test(name, fn) { await fn(); results.push({name, pass: true}); }
const now = Date.parse('2026-11-06T12:00:00Z');
const proof = {plan: 'free', planVerified: true, accountUsageComplete: true, observedAt: '2026-11-06T11:00:00Z', accountStorageBytes: 1000000, accountRequestsToday: 100, accountRowsReadToday: 100, accountRowsWrittenToday: 10};
// A real checked-in WebP tests binary type conversion and exact byte serving.
const body = new Uint8Array(readFileSync(new URL('../public/assets/images/generated/personal-edu-v1/sns-hero.webp', import.meta.url)));
const hash = createHash('sha256').update(body).digest('hex');
const record = {assetId: 'test-photo', sha256: hash, bytes: body.length, width: 1536, height: 1024, mimeType: 'image/webp', body};
const schema = readFileSync(new URL('../migrations/ebook-assets/0001-assets.sql', import.meta.url), 'utf8');
const newDatabase = () => {const database = openLocalD1(); database.sqlite.exec(schema); return database;};
const db = newDatabase();
const noQueries = {prepare() {throw new Error('unexpected database access');}};
const totalChanges = database => database.sqlite.prepare('SELECT total_changes() AS n').get().n;
const assets = {[hash]: record}, env = {EBOOK_ASSETS_ENABLED: 'true', EBOOK_ASSETS_DB: db, EBOOK_BUDGET_ATTESTATION: JSON.stringify(proof)};
const cached = new Map(); const cache = {async match(r) {return cached.get(r.url)?.clone() || null;}, async put(r, response) {cached.set(r.url, response.clone());}};
const handler = createEbookAssetHandler({assets, now: () => now, cache});
const url = 'https://example.test/api/ebook-assets/' + hash + '.webp';
const request = (options = {}, overrides = {}) => handler({request: new Request(url, options), env: {...env, ...overrides}});

await test('missing account verification fails closed', () => assert.equal(validateBudgetAttestation(null, now).ok, false));
await test('Paid plan never silently uses Free proof', () => assert.equal(validateBudgetAttestation({...proof, plan: 'paid'}, now).ok, false));
await test('incomplete account traffic is rejected', () => assert.equal(validateBudgetAttestation({...proof, accountUsageComplete: false}, now).ok, false));
await test('future proof rejected', () => assert.equal(validateBudgetAttestation({...proof, observedAt: '2026-11-06T13:00:00Z'}, now).ok, false));
await test('UTC day change expires proof', () => assert.equal(validateBudgetAttestation(proof, Date.parse('2026-11-07T00:01:00Z')).reason, 'budget_day_changed'));
await test('large account usage rejected', () => assert.equal(validateBudgetAttestation({...proof, accountRequestsToday: 70001}, now).ok, false));
await test('old and new editions share storage budget', () => assert.equal(calculateAssetPublicationBudget({assets: [record], existingBytes: 399999999, accountBytes: 100}).ok, false));
await test('same hash is charged once', () => assert.equal(calculateAssetPublicationBudget({assets: [record, record], existingBytes: 0, accountBytes: 0}).newAssets, 1));
await test('existing hash needs no new bytes', () => assert.equal(calculateAssetPublicationBudget({assets: [record], existingBytes: body.length, accountBytes: body.length, existingHashes: [hash]}).newBytes, 0));
await test('publication budget separates reuse and promotion', () => {
  const reused = calculateAssetPublicationBudget({assets: [record, record], existingAssets: [{sha256: hash, published: 1}]});
  assert.equal(reused.reusedAssets, 1); assert.equal(reused.republishedAssets, 0); assert.equal(reused.estimatedWriteRows, 0); assert.equal(reused.newBytes, 0);
  const staged = calculateAssetPublicationBudget({assets: [record], existingAssets: [{sha256: hash, published: 0}]});
  assert.equal(staged.republishedAssets, 1); assert.equal(staged.reusedAssets, 0); assert.equal(staged.estimatedWriteRows, 2); assert.equal(staged.newBytes, 0);
  assert.equal(reused.estimatedReadRows, staged.estimatedReadRows);
});
await test('unknown database size rejected', () => assert.equal(calculateAssetPublicationBudget({assets: [record], existingBytes: NaN, accountBytes: 0}).ok, false));
await test('oversized BLOB rejected before import', () => assert.equal(calculateAssetPublicationBudget({assets: [{...record, bytes: 1500001}]}).ok, false));
await test('publisher requires account proof', async () => assert.rejects(() => publishEbookAssets(db, [record], {attestation: null, existingDatabaseBytes: 0, now}), /account_verification_required/));
await test('publisher requires observed database size before access', async () => assert.rejects(() => publishEbookAssets(noQueries, [record], {attestation: proof, now}), /publication_storage_evidence/));
await test('publication batch cap rejects before access', async () => {
  await assert.rejects(() => publishEbookAssets(noQueries, Array(EBOOK_LIMITS.maxPublicationRecords + 1).fill(record), {attestation: proof, existingDatabaseBytes: 0, now}), /publication_budget_failed/);
});
await test('publication reserves read budget before access', async () => {
  await assert.rejects(() => publishEbookAssets(noQueries, [record], {attestation: {...proof, accountRowsReadToday: EBOOK_LIMITS.maxAccountReadsAtActivation}, existingDatabaseBytes: 0, now}), /publication_read_budget/);
});
await test('duplicate hash with conflicting metadata rejected before access', async () => {
  await assert.rejects(() => publishEbookAssets(noQueries, [record, {...record, width: record.width + 1}], {attestation: proof, existingDatabaseBytes: 0, now}), /publication_budget_failed/);
});
await test('damaged binary rejected before any write', async () => {await assert.rejects(() => publishEbookAssets(db, [{...record, body: body.slice(1)}], {attestation: proof, existingDatabaseBytes: 0, now}), /integrity/); assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM ebook_assets').get().n, 0);});
await test('binary import and full SQLite readback', async () => {const r = await publishEbookAssets(db, [record], {attestation: proof, existingDatabaseBytes: 0, now}); assert.equal(r.fullByteReadbackMatches, true); assert.equal(db.sqlite.prepare('SELECT typeof(body) AS type FROM ebook_assets').get().type, 'blob');});
await test('unchanged published asset performs zero writes and full readback', async () => {
  const before = totalChanges(db);
  const r = await publishEbookAssets(db, [record], {attestation: proof, existingDatabaseBytes: body.length, now});
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM ebook_assets').get().n, 1);
  assert.equal(totalChanges(db), before); assert.equal(r.estimatedWriteRows, 0); assert.equal(r.reusedAssets, 1); assert.equal(r.fullByteReadbackMatches, true);
});
await test('unchanged asset still needs stored metadata to match', async () => {
  const before = totalChanges(db);
  await assert.rejects(() => publishEbookAssets(db, [{...record, width: record.width + 1}], {attestation: proof, existingDatabaseBytes: body.length, now}), /publication_asset_metadata/);
  assert.equal(totalChanges(db), before);
});
await test('unpublished asset promotion is budgeted and writes once', async () => {
  const local = newDatabase();
  try {
    await publishEbookAssets(local, [record], {attestation: proof, existingDatabaseBytes: 0, now});
    local.sqlite.prepare('UPDATE ebook_assets SET published = 0').run(); const before = totalChanges(local);
    const r = await publishEbookAssets(local, [record], {attestation: proof, existingDatabaseBytes: body.length, now});
    assert.equal(r.republishedAssets, 1); assert.equal(r.estimatedWriteRows, 2); assert.equal(r.newBytes, 0); assert.equal(r.fullByteReadbackMatches, true);
    assert.equal(totalChanges(local) - before, 1); assert.equal(local.sqlite.prepare('SELECT published FROM ebook_assets').get().published, 1);
  } finally {local.close();}
});
await test('corrupt staged bytes cannot become published', async () => {
  const local = newDatabase();
  try {
    await publishEbookAssets(local, [record], {attestation: proof, existingDatabaseBytes: 0, now});
    local.sqlite.prepare('UPDATE ebook_assets SET published = 0, body = zeroblob(byte_length)').run(); const before = totalChanges(local);
    await assert.rejects(() => publishEbookAssets(local, [record], {attestation: proof, existingDatabaseBytes: body.length, now}), /publication_stored_asset_integrity/);
    assert.equal(totalChanges(local), before); assert.equal(local.sqlite.prepare('SELECT published FROM ebook_assets').get().published, 0);
  } finally {local.close();}
});
await test('corrupt published bytes fail reuse readback without writes', async () => {
  const local = newDatabase();
  try {
    await publishEbookAssets(local, [record], {attestation: proof, existingDatabaseBytes: 0, now});
    local.sqlite.prepare('UPDATE ebook_assets SET body = zeroblob(byte_length)').run(); const before = totalChanges(local);
    await assert.rejects(() => publishEbookAssets(local, [record], {attestation: proof, existingDatabaseBytes: body.length, now}), /publication_readback_failed/);
    assert.equal(totalChanges(local), before);
  } finally {local.close();}
});
await test('disabled delivery performs no D1 access', async () => {const r = await request({}, {EBOOK_ASSETS_ENABLED: 'false', EBOOK_ASSETS_DB: {prepare() {throw Error('unexpected query');}}}); assert.equal(r.status, 503);});
await test('unverified delivery performs no D1 access', async () => {const r = await request({}, {EBOOK_BUDGET_ATTESTATION: '{}'}); assert.equal(r.status, 503);});
await test('GET yields original WebP bytes and immutable ETag', async () => {const r = await request(); assert.equal(r.status, 200); assert.equal(r.headers.get('Content-Type'), 'image/webp'); assert.equal(r.headers.get('ETag'), '"' + hash + '"'); assert.deepEqual(new Uint8Array(await r.arrayBuffer()), body);});
await test('Cache API hit still consumes project request budget', async () => {const before = db.sqlite.prepare('SELECT requests FROM ebook_asset_daily_usage').get().requests; const r = await request(); assert.equal(r.status, 200); assert.equal(db.sqlite.prepare('SELECT requests FROM ebook_asset_daily_usage').get().requests, before + 1);});
await test('conditional request returns bodyless 304', async () => {const r = await request({headers: {'If-None-Match': '"' + hash + '"'}}); assert.equal(r.status, 304); assert.equal((await r.arrayBuffer()).byteLength, 0);});
await test('HEAD returns metadata without body', async () => {const r = await request({method: 'HEAD'}); assert.equal(r.status, 200); assert.equal(r.headers.get('Content-Length'), String(body.length)); assert.equal((await r.arrayBuffer()).byteLength, 0);});
await test('allowlisted missing row is 404 for HEAD and conditional GET', async () => {
  const local = newDatabase();
  try {
    assert.equal((await request({method: 'HEAD'}, {EBOOK_ASSETS_DB: local})).status, 404);
    assert.equal((await request({headers: {'If-None-Match': '"' + hash + '"'}}, {EBOOK_ASSETS_DB: local})).status, 404);
  } finally {local.close();}
});
await test('unpublished row is 404 for HEAD and conditional GET', async () => {
  const local = newDatabase();
  try {
    await publishEbookAssets(local, [record], {attestation: proof, existingDatabaseBytes: 0, now});
    local.sqlite.prepare('UPDATE ebook_assets SET published = 0').run();
    assert.equal((await request({method: 'HEAD'}, {EBOOK_ASSETS_DB: local})).status, 404);
    assert.equal((await request({headers: {'If-None-Match': '"' + hash + '"'}}, {EBOOK_ASSETS_DB: local})).status, 404);
  } finally {local.close();}
});
await test('unknown hash never queries D1', async () => {const r = await handler({request: new Request('https://example.test/api/ebook-assets/' + '0'.repeat(64) + '.webp'), env: {...env, EBOOK_ASSETS_DB: {prepare() {throw Error('unexpected query');}}}}); assert.equal(r.status, 404);});
await test('query strings do not multiply cache keys', async () => {const r = await handler({request: new Request(url + '?v=1'), env}); assert.equal(r.status, 404);});
await test('unsupported methods and ranges are explicit', async () => {assert.equal((await request({method: 'POST'})).status, 405); assert.equal((await request({headers: {Range: 'bytes=0-10'}})).status, 416);});
await test('database integrity failure is not cached', async () => {cached.clear(); db.sqlite.prepare('UPDATE ebook_assets SET body = zeroblob(byte_length)').run(); const r = await request(); assert.equal(r.status, 503); assert.equal(cached.size, 0);});
await test('atomic daily cap stops excess requests', async () => {db.sqlite.prepare('UPDATE ebook_asset_daily_usage SET requests = ?').run(EBOOK_LIMITS.maxDailyAssetRequests); assert.equal((await request()).status, 429); assert.equal(db.sqlite.prepare('SELECT requests FROM ebook_asset_daily_usage').get().requests, EBOOK_LIMITS.maxDailyAssetRequests);});
await test('binding outage gives finite failure', async () => {const r = await request({}, {EBOOK_ASSETS_DB: {prepare() {throw new Error('offline');}}}); assert.equal(r.status, 503);});
db.close();
const report = {scope: 'Actual local SQLite BLOB and SQL integration; no remote Cloudflare plan or D1 assertion', passed: results.length, total: results.length, results};
const output = process.env.EBOOK_QA_DIR || 'artifacts/ebook-qa'; mkdirSync(output, {recursive: true}); writeFileSync(output + '/assets.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({passed: results.length, total: results.length, report: output + '/assets.json'}));

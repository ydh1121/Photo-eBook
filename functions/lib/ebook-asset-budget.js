// Technical safety margins; these are stricter than the provider's limits.
// A verified Free plan is required because a function-local counter cannot
// cap account-wide invocations or stop a Paid plan's overage billing.
export const EBOOK_LIMITS = Object.freeze({
  maxAssetBytes: 1500000,
  maxDatabaseBytes: 400000000,
  maxAccountBytes: 4500000000,
  maxDailyAssetRequests: 10000,
  maxAccountRequestsAtActivation: 70000,
  maxAccountReadsAtActivation: 4000000,
  maxAccountWritesAtActivation: 60000,
  maxAccountWritesAfterPublication: 80000,
  // One metadata query, at most 20 pre-publication checks, one batch and
  // 20 readbacks stay below D1 Free's 50 calls per Worker invocation.
  maxPublicationRecords: 20,
  // Conservative allowance for primary-key/index lookups, promotion checks,
  // mutations and full-byte readback. This is not a provider billing metric.
  publicationReadRowsPerAsset: 8,
  maxAttestationAgeMs: 24 * 60 * 60 * 1000
});

export function validateBudgetAttestation(raw, now = Date.now()) {
  let proof;
  try { proof = typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { return {ok: false, reason: 'invalid_budget_proof'}; }
  if (!proof || proof.plan !== 'free' || proof.planVerified !== true || proof.accountUsageComplete !== true) {
    return {ok: false, reason: 'account_verification_required'};
  }
  const at = Date.parse(proof.observedAt);
  if (!Number.isFinite(at) || at > now || now - at > EBOOK_LIMITS.maxAttestationAgeMs) return {ok: false, reason: 'budget_proof_expired'};
  // A previous UTC day's counters cannot authorize this day's publication.
  if (new Date(at).toISOString().slice(0, 10) !== new Date(now).toISOString().slice(0, 10)) return {ok: false, reason: 'budget_day_changed'};
  const limits = {
    accountStorageBytes: EBOOK_LIMITS.maxAccountBytes,
    accountRequestsToday: EBOOK_LIMITS.maxAccountRequestsAtActivation,
    accountRowsReadToday: EBOOK_LIMITS.maxAccountReadsAtActivation,
    accountRowsWrittenToday: EBOOK_LIMITS.maxAccountWritesAtActivation
  };
  for (const [key, limit] of Object.entries(limits)) {
    if (!Number.isSafeInteger(proof[key]) || proof[key] < 0 || proof[key] > limit) return {ok: false, reason: 'account_budget_unavailable'};
  }
  return {ok: true, proof};
}

export function calculateAssetPublicationBudget({assets, existingBytes = 0, accountBytes = 0, existingHashes = [], existingAssets = []}) {
  const failures = [], known = new Set([...existingHashes, ...existingAssets.map(a => a.sha256)]);
  const published = new Set(existingAssets.filter(a => a.published === 1).map(a => a.sha256)), hashes = new Map();
  let totalBytes = 0, newBytes = 0, newAssets = 0, republishedAssets = 0, reusedAssets = 0;
  if (!Array.isArray(assets) || assets.length > EBOOK_LIMITS.maxPublicationRecords) failures.push({reason: 'publication_batch_limit'});
  for (const a of Array.isArray(assets) ? assets.slice(0, EBOOK_LIMITS.maxPublicationRecords) : []) {
    if (!a || !/^[a-f0-9]{64}$/.test(a.sha256 || '') || a.mimeType !== 'image/webp' || !Number.isSafeInteger(a.bytes) || a.bytes <= 12 || a.bytes > EBOOK_LIMITS.maxAssetBytes || !Number.isInteger(a.width) || !Number.isInteger(a.height) || a.width < 1 || a.height < 1 || a.width > 8192 || a.height > 8192) { failures.push({id: a?.assetId || '', reason: 'invalid_asset'}); continue; }
    const metadata = [a.mimeType, a.bytes, a.width, a.height].join(':');
    if (hashes.has(a.sha256)) {
      if (hashes.get(a.sha256) !== metadata) failures.push({id: a.assetId || '', reason: 'conflicting_asset_metadata'});
      continue;
    }
    hashes.set(a.sha256, metadata); totalBytes += a.bytes;
    if (!known.has(a.sha256)) { newBytes += a.bytes; newAssets++; }
    else if (published.has(a.sha256)) reusedAssets++;
    else republishedAssets++;
  }
  if (![existingBytes, accountBytes].every(n => Number.isSafeInteger(n) && n >= 0)) failures.push({reason: 'unknown_existing_storage'});
  // SQLite page/index allocation has overhead. Actual file size is checked
  // again after import. Both previous and current editions remain included.
  const reservedNewBytes = Math.ceil(newBytes * 1.15) + newAssets * 4096;
  if (existingBytes + reservedNewBytes > EBOOK_LIMITS.maxDatabaseBytes) failures.push({reason: 'database_budget'});
  if (accountBytes + reservedNewBytes > EBOOK_LIMITS.maxAccountBytes) failures.push({reason: 'account_storage_budget'});
  return {ok: failures.length === 0, failures, uniqueAssets: hashes.size, totalBytes, newBytes, reservedNewBytes, newAssets, republishedAssets, reusedAssets,
    estimatedWriteRows: (newAssets + republishedAssets) * 2,
    estimatedReadRows: hashes.size * EBOOK_LIMITS.publicationReadRowsPerAsset};
}

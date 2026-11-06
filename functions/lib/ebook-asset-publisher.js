import {EBOOK_LIMITS, calculateAssetPublicationBudget, validateBudgetAttestation} from './ebook-asset-budget.js';

const digest = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2, '0')).join('');
const metadataMatches = (row, asset) => row && row.mime_type === asset.mimeType && row.byte_length === asset.bytes && row.width === asset.width && row.height === asset.height;
async function storedBytesMatch(row, asset) {
  if (!metadataMatches(row, asset)) return false;
  const bytes = new Uint8Array(row.body);
  return bytes.byteLength === asset.bytes && await digest(bytes) === asset.sha256;
}

// Operator-only library: no public upload route, URL fetcher or SQL input.
// The caller supplies already-reviewed binary files and a verified usage proof.
export async function publishEbookAssets(db, records, {attestation, existingDatabaseBytes, now = Date.now()} = {}) {
  const checked = validateBudgetAttestation(attestation, now);
  if (!checked.ok) throw new Error(checked.reason);
  if (!Number.isSafeInteger(existingDatabaseBytes) || existingDatabaseBytes < 0) throw new Error('publication_storage_evidence');
  const preflight = calculateAssetPublicationBudget({assets: records});
  if (!preflight.ok) throw new Error('publication_budget_failed');
  // Reserve all publication reads before making even the metadata query.
  if (checked.proof.accountRowsReadToday + preflight.estimatedReadRows > EBOOK_LIMITS.maxAccountReadsAtActivation) throw new Error('publication_read_budget');
  const unique = new Map();
  // Validate every binary before making a write, including duplicate records.
  for (const asset of records) {
    const body = asset.body instanceof Uint8Array ? asset.body : new Uint8Array(asset.body);
    if (body.byteLength !== asset.bytes || String.fromCharCode(...body.slice(0, 4)) !== 'RIFF' || String.fromCharCode(...body.slice(8, 12)) !== 'WEBP' || await digest(body) !== asset.sha256) throw new Error('publication_asset_integrity');
    unique.set(asset.sha256, {...asset, body});
  }
  const hashes = [...unique.keys()];
  // Never scan every stored edition to publish a small set of requested hashes.
  const existing = hashes.length ? await db.prepare(`SELECT sha256, mime_type, byte_length, width, height, published FROM ebook_assets WHERE sha256 IN (${hashes.map((_, i) => `?${i + 1}`).join(', ')})`).bind(...hashes).all() : {results: []};
  const known = new Map(existing.results.map(row => [row.sha256, row]));
  const budget = calculateAssetPublicationBudget({assets: records, existingBytes: existingDatabaseBytes, accountBytes: checked.proof.accountStorageBytes, existingAssets: existing.results});
  if (!budget.ok) throw new Error('publication_budget_failed');
  if (checked.proof.accountRowsWrittenToday + budget.estimatedWriteRows > EBOOK_LIMITS.maxAccountWritesAfterPublication) throw new Error('publication_write_budget');
  // A hash identifies immutable bytes and metadata. Reject contradictory input
  // instead of treating it as an unchanged asset or mutating that identity.
  for (const asset of unique.values()) {
    const previous = known.get(asset.sha256);
    if (previous && !metadataMatches(previous, asset)) throw new Error('publication_asset_metadata');
  }
  const statements = [];
  for (const asset of unique.values()) {
    const previous = known.get(asset.sha256);
    if (previous?.published === 1) continue;
    if (previous) {
      // Do not expose a corrupt stored BLOB while promoting a staged asset.
      const row = await db.prepare('SELECT body, mime_type, byte_length, width, height FROM ebook_assets WHERE sha256 = ?1').bind(asset.sha256).first();
      if (!await storedBytesMatch(row, asset)) throw new Error('publication_stored_asset_integrity');
      statements.push(db.prepare('UPDATE ebook_assets SET published = 1 WHERE sha256 = ?1 AND published = 0').bind(asset.sha256));
    } else {
      statements.push(db.prepare('INSERT INTO ebook_assets (sha256, mime_type, byte_length, width, height, body, published, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7) ON CONFLICT(sha256) DO NOTHING').bind(asset.sha256, asset.mimeType, asset.bytes, asset.width, asset.height, asset.body, new Date(now).toISOString()));
    }
  }
  if (statements.length) await db.batch(statements);
  // Full byte readback covers new, promoted and completely unchanged assets.
  for (const asset of unique.values()) {
    const row = await db.prepare('SELECT body, mime_type, byte_length, width, height FROM ebook_assets WHERE sha256 = ?1 AND published = 1').bind(asset.sha256).first();
    if (!await storedBytesMatch(row, asset)) throw new Error('publication_readback_failed');
  }
  return {...budget, writtenOrReused: unique.size, fullByteReadbackMatches: true};
}

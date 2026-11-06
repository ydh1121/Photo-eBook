#!/usr/bin/env node
/** Local JSON/Sheet-row conversion. This module never reads credentials or calls a service. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CODEC_VERSION = 'json-pointer-all-nodes-v1';
export const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
export const pointerEscape = part => String(part).replaceAll('~', '~0').replaceAll('/', '~1');
export function pointerUnescape(part) {
  if (/~(?![01])/u.test(part)) throw new Error(`Invalid JSON Pointer escape: ${part}`);
  return part.replaceAll('~1', '/').replaceAll('~0', '~');
}

/** Key-order-independent content digest input; array order remains significant. */
export function canonicalJSON(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalJSON).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalJSON(value[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}

/** One [pointer, type, value] row for every node, including empty containers. */
export function flattenJSON(value, pointer = '', rows = []) {
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  if (!['object', 'array', 'string', 'number', 'boolean', 'null'].includes(type)) {
    throw new Error(`Unsupported JSON value at ${pointer}`);
  }
  if (type === 'number' && !Number.isFinite(value)) throw new Error(`Non-finite number at ${pointer}`);
  rows.push([pointer, type, ['object', 'array', 'null'].includes(type) ? '' : value]);
  if (type === 'object' || type === 'array') {
    for (const [key, child] of Object.entries(value)) flattenJSON(child, pointer + '/' + pointerEscape(key), rows);
  }
  return rows;
}

/** Accept a row array, a Sheets ValueRange, or the connector's structured ValueRange. */
export function sheetRows(input) {
  const rows = Array.isArray(input) ? input : input?.values ?? input?.structuredContent?.values;
  if (!Array.isArray(rows)) throw new Error('Expected a row array or a ValueRange with values.');
  return rows.map((row, index) => {
    if (!Array.isArray(row) || row.length < 2) throw new Error(`Missing path/type cells at data row ${index + 1}.`);
    return [row[0] ?? '', row[1], row[2] ?? ''];
  });
}

/** Restore native UNFORMATTED_VALUE cells without guessing primitive types. */
export function unflattenJSON(input) {
  const rows = sheetRows(input);
  const seen = new Map();
  for (const [pointer, type, raw] of rows) {
    if (typeof pointer !== 'string' || (pointer !== '' && !pointer.startsWith('/'))) throw new Error(`Invalid pointer: ${pointer}`);
    for (const part of pointer.split('/').slice(1)) pointerUnescape(part);
    if (seen.has(pointer)) throw new Error(`Duplicate pointer: ${pointer}`);
    let value;
    if (type === 'object') value = {};
    else if (type === 'array') value = [];
    else if (type === 'null') value = null;
    else if (type === 'string') {
      if (typeof raw !== 'string') throw new Error(`Expected string at ${pointer}`);
      value = raw;
    } else if (type === 'number') {
      if (typeof raw !== 'number' || !Number.isFinite(raw)) throw new Error(`Expected finite number at ${pointer}`);
      value = raw;
    } else if (type === 'boolean') {
      if (typeof raw !== 'boolean') throw new Error(`Expected boolean at ${pointer}`);
      value = raw;
    } else throw new Error(`Invalid JSON type: ${type}`);
    if (['object', 'array', 'null'].includes(type) && raw !== '') throw new Error(`Container/null value must be blank at ${pointer}`);
    seen.set(pointer, { type, value });
  }
  if (!seen.has('')) throw new Error('Root node is missing.');
  const sorted = [...seen.entries()].filter(([pointer]) => pointer !== '').sort(([a], [b]) => a.split('/').length - b.split('/').length || a.localeCompare(b, 'en', { numeric: true }));
  for (const [pointer, node] of sorted) {
    const parts = pointer.split('/');
    const key = pointerUnescape(parts.pop());
    const parentPath = parts.join('/');
    const parent = seen.get(parentPath);
    if (!parent || !['object', 'array'].includes(parent.type)) throw new Error(`Missing container at ${parentPath}`);
    if (parent.type === 'array' && (!/^(0|[1-9][0-9]*)$/u.test(key) || Number(key) > 4294967294)) throw new Error(`Invalid array index at ${pointer}`);
    // defineProperty preserves literal keys such as __proto__ without prototype mutation.
    Object.defineProperty(parent.value, key, { value: node.value, enumerable: true, writable: true, configurable: true });
  }
  for (const [pointer, node] of seen) {
    if (node.type === 'array' && Object.keys(node.value).length !== node.value.length) throw new Error(`Sparse array at ${pointer}`);
  }
  return seen.get('').value;
}

/** Two-space UTF-8 JSON, no trailing newline: the initial verified snapshot byte format. */
export const serializeSnapshot = value => JSON.stringify(value, null, 2);

export function verifyRows(input, snapshotText) {
  const rows = sheetRows(input);
  const restored = unflattenJSON(rows);
  const snapshot = JSON.parse(snapshotText);
  if (canonicalJSON(restored) !== canonicalJSON(snapshot)) throw new Error('Sheet content differs from the snapshot.');
  const restoredText = serializeSnapshot(restored);
  return {
    codecVersion: CODEC_VERSION,
    rowCount: rows.length,
    primitiveCount: rows.filter(row => !['object', 'array'].includes(row[1])).length,
    contentMatches: true,
    byteIdentical: restoredText === snapshotText,
    snapshotSha256: sha256(snapshotText),
    restoredSha256: sha256(restoredText),
    canonicalSha256: sha256(canonicalJSON(restored)),
  };
}

const usage = `Usage:
  node scripts/content/learning-sheet-codec.mjs flatten <snapshot.json> [rows.json|-]
  node scripts/content/learning-sheet-codec.mjs restore <rows.json> [snapshot.json|-]
  node scripts/content/learning-sheet-codec.mjs verify <rows.json> <snapshot.json>
  node scripts/content/learning-sheet-codec.mjs hash <snapshot.json>

Use '-' for stdin or stdout. Read Sheets data from row 2 with UNFORMATTED_VALUE.
Do not include the header. Keep private readback files outside the repository.
`;

function readText(file) {
  return fs.readFileSync(file === '-' ? 0 : file, 'utf8');
}

function writeText(file, value, inputFile) {
  if (!file || file === '-') {
    process.stdout.write(value);
    return;
  }
  if (inputFile !== '-' && path.resolve(file) === path.resolve(inputFile)) throw new Error('Input and output paths must differ.');
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, value, 'utf8');
}

export function main(args) {
  const [command, input, output] = args;
  if (!command || ['--help', '-h', 'help'].includes(command)) {
    process.stdout.write(usage);
    return;
  }
  if (!input || args.length > 3) throw new Error(usage.trim());
  if (command === 'flatten') {
    writeText(output, serializeSnapshot(flattenJSON(JSON.parse(readText(input)))), input);
  } else if (command === 'restore' || command === 'unflatten') {
    writeText(output, serializeSnapshot(unflattenJSON(JSON.parse(readText(input)))), input);
  } else if (command === 'verify') {
    if (!output || (input === '-' && output === '-')) throw new Error('verify needs a rows file and a snapshot file.');
    process.stdout.write(JSON.stringify(verifyRows(JSON.parse(readText(input)), readText(output)), null, 2) + '\n');
  } else if (command === 'hash') {
    if (output) throw new Error('hash accepts one input file.');
    process.stdout.write(sha256(readText(input)) + '\n');
  } else throw new Error(`Unknown command: ${command}\n${usage}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); }
  catch (error) {
    process.stderr.write(`learning-sheet-codec: ${error.message}\n`);
    process.exitCode = 1;
  }
}

#!/usr/bin/env node
// Standalone: copied to the backup host; no application, database or npm setup.
import { constants, promises as fs } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BYTES = 64 * 1024 * 1024;
const MAX_RECORDS = 100_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HASH = /^[a-f0-9]{64}$/;
const SNAPSHOT = /^[0-9]{13}-[0-9a-f-]{36}$/;
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const fail = message => { throw new Error(message); };
function object(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).sort().join(',') !== [...keys].sort().join(',')) fail('Unexpected journal structure.');
}
function uuid(value) { if (typeof value !== 'string' || !UUID.test(value)) fail('Invalid stable identity.'); return value; }
function hash(value) { if (typeof value !== 'string' || !HASH.test(value)) fail('Invalid hash.'); return value; }
function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(value)
    || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 19) !== value.slice(0, 19)) fail('Invalid timestamp.');
  return value;
}
function anchor(value) {
  object(value, ['version', 'instanceId']);
  if (value.version !== 1) fail('Unsupported journal version.');
  return { version: 1, instanceId: uuid(value.instanceId) };
}
export function checkpoint(value) {
  object(value, ['version', 'instanceId', 'sequence', 'hash']);
  if (value.version !== 1 || !Number.isSafeInteger(value.sequence) || value.sequence < 0 || value.sequence > MAX_RECORDS) fail('Invalid checkpoint.');
  return { version: 1, instanceId: uuid(value.instanceId), sequence: value.sequence, hash: hash(value.hash) };
}
function record(value) {
  object(value, ['entry', 'hash']);
  const e = value.entry;
  object(e, ['version', 'instanceId', 'sequence', 'previousHash', 'requestedAt', 'target']);
  if (e.version !== 1 || !Number.isSafeInteger(e.sequence) || e.sequence < 1) fail('Invalid sequence.');
  let target;
  if (e.target?.type === 'leads') {
    object(e.target, ['type', 'keys']);
    if (!Array.isArray(e.target.keys) || !e.target.keys.length) fail('Missing lead identities.');
    target = { type: 'leads', keys: e.target.keys.map(uuid) };
  } else {
    object(e.target, ['type', 'key', 'files']);
    if (e.target.type !== 'account' || !Array.isArray(e.target.files)) fail('Invalid account target.');
    target = { type: 'account', key: uuid(e.target.key), files: e.target.files.map(file => {
      object(file, ['area', 'filename']);
      if (!['public', 'support'].includes(file.area) || typeof file.filename !== 'string'
        || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,254}$/.test(file.filename) || file.filename.includes('..')) fail('Invalid upload filename.');
      return { area: file.area, filename: file.filename };
    }) };
  }
  return { entry: { version: 1, instanceId: uuid(e.instanceId), sequence: e.sequence,
    previousHash: hash(e.previousHash), requestedAt: date(e.requestedAt), target }, hash: hash(value.hash) };
}
export function validateJournal(input) {
  const a = anchor(input.anchor);
  if (!Array.isArray(input.records) || input.records.length > MAX_RECORDS) fail('Invalid record count.');
  let previousHash = digest(a);
  const records = input.records.map((raw, index) => {
    const r = record(raw);
    if (r.entry.instanceId !== a.instanceId || r.entry.sequence !== index + 1
      || r.entry.previousHash !== previousHash || digest(r.entry) !== r.hash) fail('Broken journal chain.');
    previousHash = r.hash;
    return r;
  });
  const head = { ...a, sequence: records.length, hash: previousHash };
  if (input.checkpoint && !equal(head, checkpoint(input.checkpoint))) fail('Checkpoint mismatch.');
  return { anchor: a, records, checkpoint: head };
}
async function privateDir(directory, create = false) {
  if (!path.isAbsolute(directory)) fail('An absolute private directory is required.');
  if (create) await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const stat = await fs.lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink() || (stat.mode & 0o077)) fail('Directory must be private (0700) and not a symlink.');
}
async function readJson(filename) {
  const h = await fs.open(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await h.stat();
    if (!stat.isFile() || (stat.mode & 0o077) || stat.size > MAX_BYTES) fail('Invalid private JSON file.');
    return JSON.parse(await h.readFile('utf8'));
  } finally { await h.close(); }
}
async function syncDir(directory) {
  const h = await fs.open(directory, constants.O_RDONLY | constants.O_NOFOLLOW);
  try { await h.sync(); } finally { await h.close(); }
}
async function writeJson(filename, data) {
  const h = await fs.open(filename, 'wx', 0o600);
  try { await h.writeFile(JSON.stringify(data) + '\n'); await h.sync(); } finally { await h.close(); }
}
async function replaceJson(directory, name, data) {
  const tmp = path.join(directory, `.tmp-${randomUUID()}`);
  try { await writeJson(tmp, data); await fs.rename(tmp, path.join(directory, name)); await syncDir(directory); }
  finally { await fs.unlink(tmp).catch(() => {}); }
}
export async function readJournal(directory) {
  await privateDir(directory);
  const a = await readJson(path.join(directory, 'anchor.json'));
  const names = (await fs.readdir(directory)).filter(n => !n.startsWith('.tmp-') && n !== 'anchor.json').sort();
  if (names.length > MAX_RECORDS) fail('Journal exceeds backup limit.');
  const records = [];
  let totalBytes = 0;
  for (const [index, name] of names.entries()) {
    if (name !== `${String(index + 1).padStart(12, '0')}.json`) fail('Missing or unexpected journal file.');
    const r = await readJson(path.join(directory, name));
    totalBytes += Buffer.byteLength(JSON.stringify(r));
    if (totalBytes > MAX_BYTES) fail('Journal exceeds backup limit.');
    records.push(r);
  }
  return validateJournal({ anchor: a, records });
}
export function assertExtension(previous, next) {
  if (previous.instanceId !== next.checkpoint.instanceId || previous.sequence > next.records.length) fail('Source journal regressed or changed identity.');
  const h = previous.sequence ? next.records[previous.sequence - 1].hash : digest(next.anchor);
  if (h !== previous.hash) fail('Source journal rewrote a previously backed-up prefix.');
}
export async function exportJournal(directory, nonce) {
  uuid(nonce);
  const journal = await readJournal(directory);
  // A concurrent append causes a retry on the next scheduled run, never a mixed snapshot.
  if (!equal(journal.checkpoint, (await readJournal(directory)).checkpoint)) fail('Source advanced during export; retry.');
  return { ...journal, nonce };
}
const shellQuote = value => "'" + value.replaceAll("'", "'\\''") + "'";
export async function fetchRemote(config, nonce) {
  if (typeof config.host !== 'string' || !/^(?:[a-zA-Z0-9_][a-zA-Z0-9_.-]*@)?[a-zA-Z0-9][a-zA-Z0-9.-]*$/.test(config.host)) fail('Invalid SSH host.');
  if (!path.isAbsolute(config.source) || /[\r\n\0]/.test(config.source)) fail('Invalid source path.');
  const script = await fs.readFile(fileURLToPath(import.meta.url));
  const command = `/usr/bin/node --input-type=module - --remote ${shellQuote(config.source)} ${shellQuote(nonce)}`;
  return new Promise((resolve, reject) => {
    const child = spawn('/usr/bin/ssh', ['-T', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes',
      '-o', 'ConnectTimeout=15', '-o', 'ServerAliveInterval=10', '-o', 'ServerAliveCountMax=2', config.host, command], { stdio: ['pipe', 'pipe', 'pipe'] });
    const output = []; let length = 0; let ended = false;
    const finish = (error, value) => { if (ended) return; ended = true; clearTimeout(timer); error ? reject(error) : resolve(value); };
    const timer = setTimeout(() => { child.kill('SIGKILL'); finish(new Error('Journal SSH timeout.')); }, 60_000);
    child.on('error', error => finish(error));
    child.stdin.on('error', () => {});
    // Never log source records or arbitrary remote stderr (may contain sensitive data).
    child.stderr.resume();
    child.stdout.on('data', chunk => {
      length += chunk.length;
      if (length > MAX_BYTES) { child.kill('SIGKILL'); finish(new Error('Remote snapshot exceeds limit.')); }
      else output.push(chunk);
    });
    child.on('close', code => {
      if (code !== 0) return finish(new Error(`Journal SSH export failed (exit ${code}).`));
      try { finish(null, JSON.parse(Buffer.concat(output).toString('utf8'))); }
      catch { finish(new Error('Invalid journal export.')); }
    });
    child.stdin.end(script);
  });
}
async function readLatest(destination) {
  let latest;
  try { latest = await readJson(path.join(destination, 'latest.json')); }
  catch (e) { if (e.code === 'ENOENT') return undefined; throw e; }
  object(latest, ['version', 'snapshot', 'checkpoint', 'verifiedAt']);
  if (latest.version !== 1 || !SNAPSHOT.test(latest.snapshot)) fail('Invalid snapshot reference.');
  date(latest.verifiedAt);
  const saved = await readJournal(path.join(destination, 'snapshots', latest.snapshot, 'journal'));
  const savedHead = checkpoint(await readJson(path.join(destination, 'snapshots', latest.snapshot, 'checkpoint.json')));
  if (!equal(savedHead, saved.checkpoint) || !equal(checkpoint(latest.checkpoint), savedHead)) fail('Saved checkpoint mismatch.');
  return { ...latest, checkpoint: savedHead };
}
async function saveSnapshot(destination, journal) {
  const root = path.join(destination, 'snapshots'); await privateDir(root, true);
  const id = `${Date.now()}-${randomUUID()}`, staging = path.join(root, `.tmp-${id}`);
  await privateDir(path.join(staging, 'journal'), true);
  await writeJson(path.join(staging, 'journal', 'anchor.json'), journal.anchor);
  for (const r of journal.records) await writeJson(path.join(staging, 'journal', `${String(r.entry.sequence).padStart(12, '0')}.json`), r);
  await writeJson(path.join(staging, 'checkpoint.json'), journal.checkpoint);
  await syncDir(path.join(staging, 'journal')); await syncDir(staging);
  await fs.rename(staging, path.join(root, id)); await syncDir(root);
  return id;
}
export async function runBackup(config, remote = fetchRemote) {
  await privateDir(config.destination, true);
  const lock = path.join(config.destination, '.backup-lock');
  try { await fs.mkdir(lock, { mode: 0o700 }); }
  catch (e) { if (e.code === 'EEXIST') fail('Backup lock exists; check for a running or interrupted job.'); throw e; }
  const startedAt = new Date().toISOString();
  try {
    const previous = await readLatest(config.destination);
    if (!previous) {
      // Missing pointer must never silently reset the trust history.
      const existing = await fs.readdir(path.join(config.destination, 'snapshots')).catch(e => { if (e.code === 'ENOENT') return []; throw e; });
      if (existing.length) fail('Snapshots exist without a latest pointer; recovery required.');
    }
    const nonce = randomUUID(), bundle = await remote(config, nonce);
    object(bundle, ['anchor', 'records', 'checkpoint', 'nonce']);
    if (bundle.nonce !== nonce) fail('Export challenge mismatch.');
    const journal = validateJournal(bundle);
    if (config.initialCheckpoint) assertExtension(checkpoint(config.initialCheckpoint), journal);
    if (previous) assertExtension(previous.checkpoint, journal);
    const snapshot = previous && equal(previous.checkpoint, journal.checkpoint)
      ? previous.snapshot : await saveSnapshot(config.destination, journal);
    const latest = { version: 1, snapshot, checkpoint: journal.checkpoint, verifiedAt: startedAt };
    await replaceJson(config.destination, 'latest.json', latest);
    await replaceJson(config.destination, 'status.json', { version: 1, ok: true, attemptedAt: startedAt, sequence: journal.checkpoint.sequence });
    return latest;
  } catch (error) {
    await replaceJson(config.destination, 'status.json', { version: 1, ok: false, attemptedAt: startedAt, error: 'Backup failed; latest successful snapshot retained. Inspect service log.' }).catch(() => {});
    throw error;
  } finally { await fs.rmdir(lock); await syncDir(config.destination); }
}
export async function backupStatus(config, now = Date.now()) {
  await privateDir(config.destination);
  const latest = await readLatest(config.destination);
  if (!latest) fail('No verified backup.');
  const state = await readJson(path.join(config.destination, 'status.json'));
  if (state.ok !== true) fail('Last backup attempt failed.');
  const age = now - Date.parse(latest.verifiedAt);
  if (age < 0 || age > config.maxAgeSeconds * 1000) fail('Backup is stale or clock moved backwards.');
  if (await fs.lstat(path.join(config.destination, '.backup-lock')).then(() => true, e => { if (e.code === 'ENOENT') return false; throw e; })) fail('Backup in progress or interrupted.');
  return { ok: true, verifiedAt: latest.verifiedAt, ageSeconds: Math.floor(age / 1000), checkpoint: latest.checkpoint, snapshot: latest.snapshot };
}
export async function verifyCurrent(config, remote = fetchRemote) {
  await privateDir(config.destination);
  const latest = await readLatest(config.destination);
  if (!latest) fail('No verified backup.');
  const nonce = randomUUID(), bundle = await remote(config, nonce);
  object(bundle, ['anchor', 'records', 'checkpoint', 'nonce']);
  if (bundle.nonce !== nonce) fail('Export challenge mismatch.');
  const current = validateJournal(bundle);
  if (!equal(latest.checkpoint, current.checkpoint)) fail('Backup is not the current source head; run backup again.');
  return { matchesSource: true, checkedAt: new Date().toISOString(), checkpoint: latest.checkpoint,
    journal: path.join(config.destination, 'snapshots', latest.snapshot, 'journal'),
    checkpointFile: path.join(config.destination, 'snapshots', latest.snapshot, 'checkpoint.json') };
}
async function configFile(filename) {
  const config = await readJson(path.resolve(filename));
  object(config, ['version', 'host', 'source', 'destination', 'maxAgeSeconds', 'initialCheckpoint']);
  if (config.version !== 1 || !path.isAbsolute(config.destination) || !Number.isInteger(config.maxAgeSeconds)
    || config.maxAgeSeconds < 60 || config.maxAgeSeconds > 86400) fail('Invalid backup configuration.');
  checkpoint(config.initialCheckpoint);
  return config;
}
async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === '--remote' && args.length === 2) {
    const bundle = await exportJournal(args[0], args[1]);
    const output = JSON.stringify(bundle);
    if (Buffer.byteLength(output) > MAX_BYTES) fail('Journal exceeds export limit.');
    process.stdout.write(output + '\n'); return;
  }
  if (!['run', 'status', 'verify-current'].includes(command) || args.length !== 1) fail('Usage: run|status|verify-current <private-config.json>');
  const config = await configFile(args[0]);
  const result = command === 'run' ? await runBackup(config) : command === 'status' ? await backupStatus(config) : await verifyCurrent(config);
  process.stdout.write(JSON.stringify(result) + '\n');
}
if (process.argv[2] === '--remote' || (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))) {
  main().catch(error => { console.error(`${new Date().toISOString()} ${error.message}`); process.exitCode = 1; });
}

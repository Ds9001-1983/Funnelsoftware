#!/usr/bin/env node
// Read-only inventory and retention preview. No delete, move, chmod, SQL or network operations.
import { promises as fs, constants } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const DAY = 86400000;
const RELEASE = /^(\d{8}T\d{6})-([a-f0-9]{12})$/;
const DAILY = /^(db|uploads)_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2})\.(gz|tar\.gz)$/;
const HASH = /^[a-f0-9]{64}$/;
const RELEASE_FILES = new Set(['commit', 'db.dump', 'uploads.tar.gz', 'environment', 'SHA256SUMS',
  'previous-dist', 'nginx-site', 'upload-ownership-approvals.json', 'journal-baseline.dump',
  'journal-baseline-uploads.tar.gz', 'journal-baseline-checkpoint.json', 'journal-baseline-SHA256SUMS']);
const ANCHOR_FILES = ['db.dump', 'uploads.tar.gz', 'journal-baseline.dump', 'journal-baseline-uploads.tar.gz', 'journal-baseline-checkpoint.json'];
class PreviewIssue extends Error {}
const fail = message => { throw new PreviewIssue(message); };
function object(value, fields) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== [...fields].sort().join(',')) fail('Invalid configuration structure.');
}
function date(value) {
  const time = Date.parse(value);
  if (typeof value !== 'string' || !Number.isFinite(time) || new Date(time).toISOString() !== value) fail('Expected an exact UTC timestamp.');
  return time;
}
function filenameDate(name, kind) {
  const iso = kind === 'releases'
    ? name.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})-.+$/, '$1-$2-$3T$4:$5:$6.000Z')
    : name.replace(/^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})$/, '$1T$2:$3:00.000Z');
  return date(iso);
}
export function validateConfig(config) {
  object(config, ['version', 'roots', 'recoveryAnchor', ...('dailyRecovery' in config ? ['dailyRecovery'] : [])]);
  if (config.version !== 1 || !Array.isArray(config.roots) || !config.roots.length || config.roots.length > 20) fail('Invalid inventory roots.');
  const ids = new Set(), paths = new Set();
  for (const root of config.roots) {
    object(root, ['id', 'path', 'kind', 'retentionDays', 'holds']);
    if (typeof root.id !== 'string' || !/^[a-z0-9-]{1,60}$/.test(root.id) || ids.has(root.id)) fail('Invalid or duplicate root ID.');
    if (typeof root.path !== 'string' || !path.isAbsolute(root.path) || path.resolve(root.path) === path.parse(root.path).root || paths.has(path.resolve(root.path))) fail('Invalid or duplicate root path.');
    if (!['releases', 'daily'].includes(root.kind)) fail('Unsupported backup class.');
    if (root.retentionDays !== null && (!Number.isSafeInteger(root.retentionDays) || root.retentionDays < 1 || root.retentionDays > 36500)) fail('Retention must be unset or explicit whole days.');
    if (!Array.isArray(root.holds) || root.holds.length > 10000 || root.holds.some(n => typeof n !== 'string' || !/^[a-zA-Z0-9_.-]{1,150}$/.test(n) || n.includes('..'))) fail('Invalid hold.');
    ids.add(root.id); paths.add(path.resolve(root.path));
  }
  if (config.recoveryAnchor !== null) {
    const a = config.recoveryAnchor;
    object(a, ['rootId', 'entry', 'verifiedAt', 'verificationRef', 'hashes']);
    if (!ids.has(a.rootId) || typeof a.entry !== 'string' || !RELEASE.test(a.entry) || !config.roots.some(r => r.id === a.rootId && r.kind === 'releases')) fail('Anchor must name a release in a configured root.');
    date(a.verifiedAt);
    if (typeof a.verificationRef !== 'string' || !a.verificationRef.trim() || a.verificationRef.length > 1000) fail('A restore verification reference is required.');
    if (!a.hashes || typeof a.hashes !== 'object' || Array.isArray(a.hashes) || Object.keys(a.hashes).length > 64
      || Object.entries(a.hashes).some(([n, h]) => !RELEASE_FILES.has(n) || typeof h !== 'string' || !HASH.test(h))
      || ANCHOR_FILES.some(n => !a.hashes[n])) fail('Anchor requires complete file hashes and a journal baseline.');
  }
  if (config.dailyRecovery != null) {
    const a = config.dailyRecovery;
    object(a, ['rootId', 'entry', 'verifiedAt', 'verificationRef', 'hashes']);
    if (!config.roots.some(r => r.id === a.rootId && r.kind === 'daily') || typeof a.entry !== 'string') fail('Invalid daily restore root.');
    filenameDate(a.entry, 'daily'); date(a.verifiedAt);
    if (typeof a.verificationRef !== 'string' || !a.verificationRef.trim() || a.verificationRef.length > 1000) fail('Daily restore evidence required.');
    object(a.hashes, [`db_${a.entry}.gz`, `uploads_${a.entry}.tar.gz`]);
    if (Object.values(a.hashes).some(h => typeof h !== 'string' || !HASH.test(h))) fail('Daily restore hashes required.');
  }
  return config;
}
const signature = s => `${s.dev}:${s.ino}:${s.size}:${s.mtimeMs}:${s.ctimeMs}:${s.mode}:${s.nlink}`;
async function fileInfo(full, text = false) {
  const h = await fs.open(full, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const before = await h.stat();
    if (!before.isFile() || before.nlink !== 1 || (text && before.size > 1024 * 1024)) fail('Unsafe backup file.');
    const hash = createHash('sha256'); let content = '';
    for await (const chunk of h.createReadStream({ autoClose: false })) { hash.update(chunk); if (text) content += chunk.toString('utf8'); }
    if (signature(before) !== signature(await h.stat()) || signature(before) !== signature(await fs.lstat(full))) fail('Backup changed while reading.');
    return { name: path.basename(full), bytes: before.size, mtimeMs: before.mtimeMs, sha256: hash.digest('hex'), ...(text ? { content } : {}) };
  } finally { await h.close(); }
}
function checkManifest(text, files, expected) {
  const seen = new Set();
  for (const line of text.trim().split('\n')) {
    const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
    if (!match) fail('Invalid checksum manifest.');
    // Older release manifests contain original server paths. Never follow them.
    const name = path.posix.basename(match[2]);
    if (!expected.includes(name) || seen.has(name) || files.find(f => f.name === name)?.sha256 !== match[1]) fail('Checksum mismatch.');
    seen.add(name);
  }
  if (seen.size !== expected.length) fail('Incomplete checksum manifest.');
}
async function releaseEntry(root, name) {
  const full = path.join(root.path, name), before = await fs.lstat(full);
  if (!before.isDirectory() || before.isSymbolicLink()) fail('Release is not a real directory.');
  const names = (await fs.readdir(full)).sort();
  if (names.length > 64 || names.some(n => !RELEASE_FILES.has(n)) || ['db.dump', 'uploads.tar.gz', 'commit', 'SHA256SUMS'].some(n => !names.includes(n))) fail('Unknown or incomplete release.');
  const files = [];
  for (const n of names) files.push(await fileInfo(path.join(full, n), n === 'commit' || n.endsWith('SHA256SUMS')));
  if (files.some(f => (f.name.endsWith('.dump') || f.name.endsWith('.gz')) && !f.bytes)) fail('Empty backup.');
  const commit = files.find(f => f.name === 'commit').content.trim();
  if (!/^[a-f0-9]{40}$/.test(commit) || !commit.startsWith(RELEASE.exec(name)[2])) fail('Release identity mismatch.');
  checkManifest(files.find(f => f.name === 'SHA256SUMS').content, files, ['db.dump', 'uploads.tar.gz']);
  const baseline = names.filter(n => n.startsWith('journal-baseline'));
  if (baseline.length) {
    if (baseline.length !== 4) fail('Incomplete journal baseline.');
    checkManifest(files.find(f => f.name === 'journal-baseline-SHA256SUMS').content, files, ['journal-baseline.dump', 'journal-baseline-uploads.tar.gz', 'journal-baseline-checkpoint.json']);
  }
  if (signature(before) !== signature(await fs.lstat(full)) || JSON.stringify(names) !== JSON.stringify((await fs.readdir(full)).sort())) fail('Release changed while reading.');
  return { id: name, path: full, complete: true, journalBaseline: baseline.length === 4,
    timestampMs: Math.max(filenameDate(name, 'releases'), before.mtimeMs, ...files.map(f => f.mtimeMs)),
    bytes: files.reduce((sum, f) => sum + f.bytes, 0), files: files.map(({ content, ...file }) => file) };
}
async function inspectRoot(root) {
  const output = { ...root, path: path.resolve(root.path), entries: [], issues: [] };
  try {
    if (await fs.realpath(root.path) !== output.path) fail('Root or ancestor is a symlink.');
    const stat = await fs.lstat(root.path);
    if (!stat.isDirectory() || stat.isSymbolicLink()) fail('Root is not a directory.');
    const names = (await fs.readdir(root.path)).sort();
    if (names.length > 10000) fail('Inventory root exceeds entry limit.');
    const groups = new Map();
    for (const name of names) {
      if (root.kind === 'releases' && RELEASE.test(name)) {
        try { output.entries.push(await releaseEntry(root, name)); }
        catch (error) { output.entries.push({ id: name, path: path.join(root.path, name), complete: false, decision: 'review', reasons: ['invalid_or_changing_release'], detail: error instanceof PreviewIssue ? error.message : 'File access failed.' }); }
      } else if (root.kind === 'daily' && DAILY.test(name)) {
        const match = DAILY.exec(name);
        if ((match[1] === 'db' && match[3] !== 'gz') || (match[1] === 'uploads' && match[3] !== 'tar.gz')) {
          output.entries.push({ id: name, complete: false, decision: 'review', reasons: ['unrecognized_entry'] }); continue;
        }
        const list = groups.get(match[2]) || []; list.push(name); groups.set(match[2], list);
      } else {
        output.entries.push({ id: name, path: path.join(root.path, name), complete: false, decision: 'protected', reasons: ['unrecognized_entry_not_traversed'] });
      }
    }
    for (const [id, files] of groups) {
      try {
        if (files.length !== 2) fail('Incomplete daily pair.');
        const info = [];
        for (const name of files) info.push(await fileInfo(path.join(root.path, name)));
        if (info.some(f => !f.bytes)) fail('Empty backup.');
        output.entries.push({ id, complete: true, timestampMs: Math.max(filenameDate(id, 'daily'), ...info.map(f => f.mtimeMs)),
          bytes: info.reduce((sum, f) => sum + f.bytes, 0), files: info, integrity: 'hashed_only_not_restore_tested' });
      } catch { output.entries.push({ id, complete: false, decision: 'review', reasons: ['invalid_or_incomplete_daily_pair'], fileNames: files }); }
    }
    if (signature(stat) !== signature(await fs.lstat(root.path)) || JSON.stringify(names) !== JSON.stringify((await fs.readdir(root.path)).sort())) output.issues.push('root_changed_during_inventory');
    for (const held of root.holds) if (!output.entries.some(e => e.id === held)) output.issues.push('held_entry_missing');
  } catch { output.issues.push('root_unavailable_or_unsafe'); }
  return output;
}
export async function previewRetention(raw, now = new Date()) {
  const config = validateConfig(raw), time = date(now.toISOString()), roots = [];
  for (const root of config.roots) roots.push(await inspectRoot(root));
  const a = config.recoveryAnchor, anchorRoot = a && roots.find(r => r.id === a.rootId), anchor = anchorRoot?.entries.find(e => e.id === a.entry);
  const anchorValid = !!(a && anchorRoot && !anchorRoot.issues.length && anchor?.complete && anchor.journalBaseline
    && date(a.verifiedAt) <= time && anchor.timestampMs <= date(a.verifiedAt)
    && Object.keys(a.hashes).length === anchor.files.length && anchor.files.every(f => a.hashes[f.name] === f.sha256));
  const anchorTime = anchor?.timestampMs;
  const d = config.dailyRecovery, dailyRoot = d && roots.find(r => r.id === d.rootId), daily = dailyRoot?.entries.find(e => e.id === d.entry);
  const dailyValid = !!(d && daily?.complete && !dailyRoot.issues.length && date(d.verifiedAt) <= time
    && daily.timestampMs <= date(d.verifiedAt) && daily.files.every(f => d.hashes[f.name] === f.sha256));
  const dailyTime = daily?.timestampMs;
  const candidates = [];
  for (const root of roots) {
    const complete = root.entries.filter(e => e.complete);
    const newest = Math.max(-Infinity, ...complete.map(e => e.timestampMs));
    for (const e of root.entries) {
      if (!e.complete) continue;
      e.ageDays = Math.floor((time - e.timestampMs) / DAY); e.timestamp = new Date(e.timestampMs).toISOString();
      e.reasons = [];
      if (root.issues.length) e.reasons.push('root_requires_review');
      if (root.retentionDays === null) e.reasons.push('policy_unset');
      if (!anchorValid) e.reasons.push('no_matching_verified_recovery_anchor');
      if (d?.rootId === root.id && !dailyValid) e.reasons.push('invalid_daily_recovery_reference');
      if (a?.rootId === root.id && a.entry === e.id) e.reasons.push('verified_recovery_anchor');
      if (e.timestampMs === newest) e.reasons.push('newest_complete_backup');
      if (root.holds.includes(e.id)) e.reasons.push('explicit_hold');
      if (e.timestampMs > time) e.reasons.push('future_timestamp');
      const recoveryTime = dailyValid && d.rootId === root.id ? Math.max(anchorTime ?? -Infinity, dailyTime) : anchorTime;
      if (dailyValid && d.rootId === root.id && d.entry === e.id) e.reasons.push('verified_daily_recovery');
      if (anchorValid && e.timestampMs >= recoveryTime) e.reasons.push('not_older_than_recovery_anchor');
      if (root.retentionDays !== null && time - e.timestampMs < root.retentionDays * DAY) e.reasons.push('within_retention');
      e.decision = e.reasons.length ? 'protected' : 'candidate';
      if (e.decision === 'candidate') candidates.push({ rootId: root.id, entry: e.id, bytes: e.bytes,
        files: e.files.map(f => ({ path: path.join(root.path, root.kind === 'releases' ? e.id : '', f.name), bytes: f.bytes, sha256: f.sha256 })) });
      delete e.timestampMs;
    }
    root.entries.sort((x, y) => x.id.localeCompare(y.id));
  }
  return { version: 1, readOnly: true, generatedAt: now.toISOString(), recoveryAnchor: { valid: anchorValid,
    reference: a?.verificationRef ?? null, verifiedAt: a?.verifiedAt ?? null }, roots, candidates,
    dailyRecovery: { valid: dailyValid, reference: d?.verificationRef ?? null },
    summary: { completeBackups: roots.reduce((sum, r) => sum + r.entries.filter(e => e.complete).length, 0),
      candidateBackups: candidates.length, candidateFiles: candidates.reduce((sum, e) => sum + e.files.length, 0), candidateBytes: candidates.reduce((sum, e) => sum + e.bytes, 0) } };
}
async function main() {
  const [command, input, ...extra] = process.argv.slice(2);
  if (extra.length || !input || !['preview', 'preview-json'].includes(command)) fail('Usage: preview <config.json> | preview-json <base64url-config>. Read-only; no apply command.');
  let raw;
  if (command === 'preview') {
    const file = await fs.open(path.resolve(input), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    try { const stat = await file.stat(); if (!stat.isFile() || stat.size > 65536) fail('Invalid configuration file.'); raw = await file.readFile('utf8'); }
    finally { await file.close(); }
  } else {
    if (input.length > 90000 || !/^[A-Za-z0-9_-]+$/.test(input)) fail('Invalid configuration encoding.');
    raw = Buffer.from(input, 'base64url').toString('utf8');
  }
  process.stdout.write(JSON.stringify(await previewRetention(JSON.parse(raw)), null, 2) + '\n');
}
if (process.argv[1] && (path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) || (process.argv[1] === '-' && process.argv[2] === 'preview-json'))) {
  main().catch(() => { console.error('Backup preview failed. Check configuration, paths and permissions; no files were modified.'); process.exitCode = 1; });
}

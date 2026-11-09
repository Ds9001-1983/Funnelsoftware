// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { previewRetention, validateConfig } from './backup-retention-preview.mjs';
const execute = promisify(execFile), hash = x => createHash('sha256').update(x).digest('hex');
const now = new Date('2026-10-24T12:00:00.000Z');
let base, releases, daily, config, old, current;
async function stamp(p, at) { await fs.utimes(p, at, at); }
async function release(name, at, baseline = true) {
  const dir = path.join(releases, name); await fs.mkdir(dir);
  const commit = name.slice(-12) + '0'.repeat(28);
  const files = { 'db.dump': `synthetic-dump-${name}`, 'uploads.tar.gz': 'synthetic-archive', commit, environment: 'synthetic-secret-do-not-print' };
  files.SHA256SUMS = ['db.dump', 'uploads.tar.gz'].map(n => `${hash(files[n])}  /old/server/path/${n}\n`).join('');
  if (baseline) {
    files['journal-baseline.dump'] = 'synthetic-baseline'; files['journal-baseline-uploads.tar.gz'] = 'synthetic-archive';
    files['journal-baseline-checkpoint.json'] = '{}';
    files['journal-baseline-SHA256SUMS'] = ['journal-baseline.dump', 'journal-baseline-uploads.tar.gz', 'journal-baseline-checkpoint.json'].map(n => `${hash(files[n])}  ${n}\n`).join('');
  }
  for (const [n, content] of Object.entries(files)) { await fs.writeFile(path.join(dir, n), content); await stamp(path.join(dir, n), at); }
  await stamp(dir, at);
  return { id: name, dir, hashes: Object.fromEntries(Object.entries(files).map(([n, content]) => [n, hash(content)])) };
}
async function pair(id, at) {
  const names = [`db_${id}.gz`, `uploads_${id}.tar.gz`];
  for (const n of names) { await fs.writeFile(path.join(daily, n), 'synthetic-backup'); await stamp(path.join(daily, n), at); }
  return names;
}
beforeEach(async () => {
  base = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'backup-preview-')));
  releases = path.join(base, 'releases'); daily = path.join(base, 'daily');
  await fs.mkdir(releases); await fs.mkdir(daily);
  old = await release('20260801T120000-aaaaaaaaaaaa', new Date('2026-08-01T12:00:00Z'), false);
  current = await release('20261023T120000-bbbbbbbbbbbb', new Date('2026-10-23T12:00:00Z'));
  await pair('2026-08-01_12-00', new Date('2026-08-01T12:00:00Z'));
  await pair('2026-10-23_12-00', new Date('2026-10-23T12:00:00Z'));
  config = { version: 1, roots: [
    { id: 'releases', path: releases, kind: 'releases', retentionDays: 30, holds: [] },
    { id: 'daily', path: daily, kind: 'daily', retentionDays: 30, holds: [] },
  ], recoveryAnchor: { rootId: 'releases', entry: current.id, verifiedAt: '2026-10-23T13:00:00.000Z', verificationRef: 'synthetic successful restore record', hashes: current.hashes } };
});
afterEach(async () => { await fs.rm(base, { recursive: true, force: true }); });
const entries = (result, root = 'releases') => result.roots.find(r => r.id === root).entries;
describe('read-only backup inventory and retention preview', () => {
  it('lists complete old sets as candidates while preserving every file and withholding contents', async () => {
    const before = await fs.readFile(path.join(old.dir, 'environment'));
    const result = await previewRetention(config, now);
    expect(result).toMatchObject({ readOnly: true, recoveryAnchor: { valid: true }, summary: { completeBackups: 4, candidateBackups: 2, candidateFiles: 7 } });
    expect(entries(result).find(e => e.id === current.id).reasons).toContain('verified_recovery_anchor');
    expect(await fs.readFile(path.join(old.dir, 'environment'))).toEqual(before);
    expect(JSON.stringify(result)).not.toContain('synthetic-secret-do-not-print');
    expect(result.candidates.every(e => e.files.every(f => f.path.startsWith(base) && f.sha256.length === 64))).toBe(true);
  });
  it('does not infer a duration or recoverability from filenames', async () => {
    for (const root of config.roots) root.retentionDays = null;
    expect((await previewRetention(config, now)).summary.candidateBackups).toBe(0);
    config.roots[0].retentionDays = 30; config.recoveryAnchor = null;
    const result = await previewRetention(config, now);
    expect(result.summary.candidateBackups).toBe(0);
    expect(entries(result).find(e => e.id === old.id).reasons).toContain('no_matching_verified_recovery_anchor');
  });
  it('protects unknown directories, journals, reviews and unpaired files without traversal', async () => {
    for (const name of ['erasure-journal', 'reviews']) {
      await fs.mkdir(path.join(daily, name)); await fs.writeFile(path.join(daily, name, 'private.json'), 'not-read');
    }
    await fs.writeFile(path.join(daily, 'uploads_2020-01-01_03-00.tar.gz'), 'unpaired');
    await fs.mkdir(path.join(releases, 'preflight-20200101'));
    const result = await previewRetention(config, now);
    expect(entries(result, 'daily').find(e => e.id === 'erasure-journal').decision).toBe('protected');
    expect(entries(result, 'daily').find(e => e.id === '2020-01-01_03-00').decision).toBe('review');
    expect(JSON.stringify(result)).not.toContain('private.json');
    expect(result.summary.candidateBackups).toBe(2);
  });
  it('respects explicit holds and blocks a root when a held entry is missing', async () => {
    config.roots[0].holds = [old.id];
    expect((await previewRetention(config, now)).candidates.map(e => e.rootId)).toEqual(['daily']);
    config.roots[1].holds = ['missing'];
    expect((await previewRetention(config, now)).summary.candidateBackups).toBe(0);
  });
  it('blocks every candidate when the verified anchor is missing or its contents change', async () => {
    await fs.writeFile(path.join(current.dir, 'environment'), 'changed');
    expect((await previewRetention(config, now)).summary.candidateBackups).toBe(0);
    await fs.rm(current.dir, { recursive: true });
    expect((await previewRetention(config, now)).recoveryAnchor.valid).toBe(false);
  });
  it('does not accept an anchor with incomplete hashes or a future verification date', async () => {
    delete config.recoveryAnchor.hashes.environment;
    expect((await previewRetention(config, now)).summary.candidateBackups).toBe(0);
    config.recoveryAnchor.hashes = current.hashes; config.recoveryAnchor.verifiedAt = '2027-01-01T00:00:00.000Z';
    expect((await previewRetention(config, now)).summary.candidateBackups).toBe(0);
  });
  it('protects all backups at least as new as the anchor across roots', async () => {
    config.roots.forEach(r => { r.retentionDays = 1; });
    const later = new Date('2026-10-24T12:00:00Z');
    await pair('2026-10-24_12-00', later);
    const result = await previewRetention(config, new Date('2026-11-24T12:00:00.000Z'));
    expect(entries(result, 'daily').find(e => e.id === '2026-10-23_12-00').reasons).toContain('not_older_than_recovery_anchor');
    expect(result.candidates.map(e => e.entry)).toEqual([old.id, '2026-08-01_12-00']);
  });
  it('uses a newer verified daily restore without weakening release or journal protection', async () => {
    const id = '2026-10-24_11-00';
    const names = await pair(id, new Date('2026-10-24T11:00:00Z'));
    config.dailyRecovery = { rootId: 'daily', entry: id, verifiedAt: '2026-10-24T11:30:00.000Z', verificationRef: 'synthetic isolated daily restore', hashes: {} };
    for (const n of names) config.dailyRecovery.hashes[n] = hash(await fs.readFile(path.join(daily, n)));
    const result = await previewRetention(config, new Date('2026-12-24T12:00:00.000Z'));
    expect(result.dailyRecovery.valid).toBe(true);
    expect(result.candidates.map(e => e.entry)).toContain('2026-10-23_12-00');
    expect(entries(result).find(e => e.id === current.id).decision).toBe('protected');
    expect(entries(result, 'daily').find(e => e.id === id).decision).toBe('protected');
    config.recoveryAnchor = null;
    expect((await previewRetention(config, new Date('2026-12-24T12:00:00.000Z'))).summary.candidateBackups).toBe(0);
  });
  it('blocks daily cleanup with incomplete, altered or future-dated daily restore proof', async () => {
    const id = '2026-10-23_12-00';
    config.dailyRecovery = { rootId: 'daily', entry: id, verifiedAt: '2026-10-23T13:00:00.000Z', verificationRef: 'synthetic restore', hashes: {} };
    expect(() => validateConfig(config)).toThrow();
    for (const n of [`db_${id}.gz`, `uploads_${id}.tar.gz`]) config.dailyRecovery.hashes[n] = '0'.repeat(64);
    let result = await previewRetention(config, now);
    expect(result.candidates.some(e => e.rootId === 'daily')).toBe(false);
    for (const n of Object.keys(config.dailyRecovery.hashes)) config.dailyRecovery.hashes[n] = hash(await fs.readFile(path.join(daily, n)));
    config.dailyRecovery.verifiedAt = '2027-01-01T00:00:00.000Z';
    result = await previewRetention(config, now);
    expect(result.dailyRecovery.valid).toBe(false);
    expect(result.candidates.some(e => e.rootId === 'daily')).toBe(false);
  });
  it('uses elapsed 24-hour periods and the most recent file time, never just an old name', async () => {
    const fresh = new Date(now.getTime() - 30 * 86400000 + 1);
    await stamp(path.join(old.dir, 'environment'), fresh);
    let result = await previewRetention(config, now);
    expect(entries(result).find(e => e.id === old.id).reasons).toContain('within_retention');
    await stamp(path.join(old.dir, 'environment'), new Date(fresh.getTime() - 1));
    result = await previewRetention(config, now);
    expect(entries(result).find(e => e.id === old.id).decision).toBe('candidate');
  });
  it('retains the newest complete daily pair even when old and superseded by a release', async () => {
    await fs.rm(path.join(daily, 'db_2026-10-23_12-00.gz')); await fs.rm(path.join(daily, 'uploads_2026-10-23_12-00.tar.gz'));
    expect(entries(await previewRetention(config, now), 'daily').find(e => e.id === '2026-08-01_12-00').reasons).toContain('newest_complete_backup');
  });
  it('rejects changed checksums and unknown release files', async () => {
    await fs.writeFile(path.join(old.dir, 'db.dump'), 'tampered');
    expect(entries(await previewRetention(config, now)).find(e => e.id === old.id).decision).toBe('review');
    await fs.writeFile(path.join(current.dir, 'extra-secret'), 'not-read');
    expect((await previewRetention(config, now)).summary.candidateBackups).toBe(0);
  });
  it('keeps empty daily backups and partial journal baselines for review', async () => {
    await fs.writeFile(path.join(daily, 'db_2026-08-01_12-00.gz'), '');
    expect(entries(await previewRetention(config, now), 'daily').find(e => e.id === '2026-08-01_12-00').decision).toBe('review');
    await fs.unlink(path.join(current.dir, 'journal-baseline.dump'));
    const result = await previewRetention(config, now);
    expect(result.recoveryAnchor.valid).toBe(false);
    expect(result.summary.candidateBackups).toBe(0);
  });
  it('protects the anchor after a clock rollback and retains a future-dated set', async () => {
    expect((await previewRetention(config, new Date('2026-10-22T12:00:00.000Z'))).summary.candidateBackups).toBe(0);
    const future = await release('20270101T120000-cccccccccccc', new Date('2027-01-01T12:00:00Z'));
    expect(entries(await previewRetention(config, now)).find(e => e.id === future.id).reasons).toContain('future_timestamp');
  });
  it('refuses symlinked roots, directories, files and hardlinks', async () => {
    const link = path.join(base, 'alias'); await fs.symlink(releases, link);
    config.roots[0].path = link;
    expect((await previewRetention(config, now)).summary.candidateBackups).toBe(0);
    config.roots[0].path = releases;
    await fs.unlink(path.join(old.dir, 'environment')); await fs.symlink(path.join(current.dir, 'environment'), path.join(old.dir, 'environment'));
    expect(entries(await previewRetention(config, now)).find(e => e.id === old.id).decision).toBe('review');
    await fs.link(path.join(current.dir, 'db.dump'), path.join(base, 'hardlink'));
    expect((await previewRetention(config, now)).summary.candidateBackups).toBe(0);
  });
  it('rejects invalid dates and directories masquerading as daily files', async () => {
    await pair('2026-02-30_12-00', new Date('2026-03-01T12:00:00Z'));
    await fs.unlink(path.join(daily, 'db_2026-08-01_12-00.gz')); await fs.mkdir(path.join(daily, 'db_2026-08-01_12-00.gz'));
    const result = await previewRetention(config, now);
    expect(entries(result, 'daily').find(e => e.id === '2026-02-30_12-00').decision).toBe('review');
    expect(entries(result, 'daily').find(e => e.id === '2026-08-01_12-00').decision).toBe('review');
  });
  it('rejects named pipes without waiting for a writer', async () => {
    const fifo = path.join(daily, 'db_2026-08-01_12-00.gz');
    await fs.unlink(fifo); await execute('mkfifo', [fifo]);
    expect(entries(await previewRetention(config, now), 'daily').find(e => e.id === '2026-08-01_12-00').decision).toBe('review');
    await expect(execute(process.execPath, ['scripts/backup-retention-preview.mjs', 'preview', fifo], { timeout: 2000 })).rejects.toMatchObject({ code: 1 });
  });
  it('validates explicit policies and denies an apply command', async () => {
    for (const days of [0, -1, 1.5, '30', 36501]) expect(() => validateConfig({ ...config, roots: [{ ...config.roots[0], retentionDays: days }] })).toThrow();
    await expect(execute(process.execPath, ['scripts/backup-retention-preview.mjs', 'apply', 'anything'])).rejects.toMatchObject({ code: 1 });
    expect(await fs.readFile(path.join(old.dir, 'environment'), 'utf8')).toContain('do-not-print');
  });
  it('runs the same standalone scanner through stdin for remote inspection', async () => {
    const script = await fs.readFile('scripts/backup-retention-preview.mjs', 'utf8');
    const { spawn } = await import('node:child_process');
    const output = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['--input-type=module', '-', 'preview-json', Buffer.from(JSON.stringify(config)).toString('base64url')]);
      let out = '', err = ''; child.stdout.on('data', data => { out += data; }); child.stderr.on('data', data => { err += data; });
      child.once('error', reject); child.once('exit', code => code === 0 ? resolve(out) : reject(new Error(err))); child.stdin.end(script);
    });
    expect(JSON.parse(output).readOnly).toBe(true);
    expect(JSON.parse(output).recoveryAnchor.valid).toBe(true);
  });
});

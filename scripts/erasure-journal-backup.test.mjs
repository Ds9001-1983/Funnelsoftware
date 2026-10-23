// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { validateJournal, readJournal, exportJournal, runBackup, backupStatus, verifyCurrent } from './erasure-journal-backup.mjs';
const digest = v => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const execute = promisify(execFile);
let base, source, config, journal;
async function json(file, value) { await fs.writeFile(file, JSON.stringify(value) + '\n', { mode: 0o600 }); }
async function append(target = { type: 'leads', keys: [randomUUID()] }) {
  const entry = { version: 1, instanceId: journal.anchor.instanceId, sequence: journal.records.length + 1,
    previousHash: journal.checkpoint.hash, requestedAt: new Date().toISOString(), target };
  const r = { entry, hash: digest(entry) };
  journal = validateJournal({ anchor: journal.anchor, records: [...journal.records, r] });
  await json(path.join(source, `${String(entry.sequence).padStart(12, '0')}.json`), r);
}
const remote = (_config, nonce) => exportJournal(source, nonce);
beforeEach(async () => {
  base = await fs.mkdtemp(path.join(os.tmpdir(), 'journal-backup-'));
  source = path.join(base, 'source'); await fs.mkdir(source, { mode: 0o700 });
  const anchor = { version: 1, instanceId: randomUUID() };
  journal = validateJournal({ anchor, records: [] });
  await json(path.join(source, 'anchor.json'), anchor);
  config = { destination: path.join(base, 'external'), maxAgeSeconds: 900, initialCheckpoint: journal.checkpoint };
});
afterEach(async () => { await fs.rm(base, { recursive: true, force: true }); });

describe('external append-only erasure journal backup', () => {
  it('backs up an empty journal and updates freshness without duplicating snapshots', async () => {
    const first = await runBackup(config, remote), second = await runBackup(config, remote);
    expect(first.snapshot).toBe(second.snapshot);
    expect((await fs.readdir(path.join(config.destination, 'snapshots'))).length).toBe(1);
    expect((await backupStatus(config)).ok).toBe(true);
  });
  it('preserves previous snapshots when leads and account file deletions are appended', async () => {
    const first = await runBackup(config, remote);
    await append();
    await append({ type: 'account', key: randomUUID(), files: [{ area: 'public', filename: 'image.webp' }, { area: 'support', filename: 'report.png' }] });
    const second = await runBackup(config, remote);
    expect(first.snapshot).not.toBe(second.snapshot);
    const old = await readJournal(path.join(config.destination, 'snapshots', first.snapshot, 'journal'));
    expect(old.checkpoint.sequence).toBe(0);
    const current = await verifyCurrent(config, remote);
    expect(current.matchesSource).toBe(true);
    expect((await readJournal(current.journal)).checkpoint).toEqual(journal.checkpoint);
    expect(JSON.parse(await fs.readFile(current.checkpointFile, 'utf8'))).toEqual(journal.checkpoint);
  });
  it('uses owner-only permissions and exports no unrelated files', async () => {
    await append(); await runBackup(config, remote);
    const result = await verifyCurrent(config, remote);
    for (const dir of [config.destination, path.dirname(result.journal), result.journal]) expect((await fs.stat(dir)).mode & 0o077).toBe(0);
    for (const file of [result.checkpointFile, path.join(result.journal, 'anchor.json'), path.join(config.destination, 'latest.json')]) expect((await fs.stat(file)).mode & 0o077).toBe(0);
    await json(path.join(source, '.tmp-interrupted-write'), { incomplete: true });
    expect((await remote(config, randomUUID())).records.length).toBe(1);
    await json(path.join(source, 'unexpected.json'), {});
    await expect(runBackup(config, remote)).rejects.toThrow('unexpected');
  });
  it('keeps the last backup and reports a failed connection', async () => {
    const first = await runBackup(config, remote);
    await expect(runBackup(config, async () => { throw new Error('offline'); })).rejects.toThrow('offline');
    expect(JSON.parse(await fs.readFile(path.join(config.destination, 'latest.json'), 'utf8'))).toEqual(first);
    await expect(backupStatus(config)).rejects.toThrow('failed');
    await runBackup(config, remote);
    expect((await backupStatus(config)).ok).toBe(true);
  });
  it('rejects stale backups and a backwards clock', async () => {
    const first = await runBackup(config, remote);
    await expect(backupStatus(config, Date.parse(first.verifiedAt) + 901_000)).rejects.toThrow('stale');
    await expect(backupStatus(config, Date.parse(first.verifiedAt) - 1)).rejects.toThrow('clock');
  });
  it('requires a live source match for a final restore checkpoint', async () => {
    await runBackup(config, remote); await append();
    await expect(verifyCurrent(config, remote)).rejects.toThrow('current source');
    await expect(verifyCurrent(config, async () => { throw new Error('offline'); })).rejects.toThrow('offline');
    await runBackup(config, remote);
    expect((await verifyCurrent(config, remote)).checkpoint.sequence).toBe(1);
  });
  it('rejects a truncated source even when its shorter hash chain is valid', async () => {
    await append(); await runBackup(config, remote);
    await fs.unlink(path.join(source, '000000000001.json'));
    await expect(runBackup(config, remote)).rejects.toThrow('regressed');
  });
  it('rejects a valid but rewritten previously secured prefix', async () => {
    await append(); await runBackup(config, remote);
    journal = validateJournal({ anchor: journal.anchor, records: [] });
    await append();
    await expect(runBackup(config, remote)).rejects.toThrow('rewrote');
  });
  it('rejects a changed source identity', async () => {
    await runBackup(config, remote);
    await json(path.join(source, 'anchor.json'), { version: 1, instanceId: randomUUID() });
    await expect(runBackup(config, remote)).rejects.toThrow('identity');
  });
  it('pins the first download to an independently known checkpoint', async () => {
    config.initialCheckpoint = { ...config.initialCheckpoint, instanceId: randomUUID() };
    await expect(runBackup(config, remote)).rejects.toThrow('identity');
    await expect(fs.stat(path.join(config.destination, 'latest.json'))).rejects.toMatchObject({ code: 'ENOENT' });
  });
  it('rejects a missing middle record, modified content and the wrong checkpoint', async () => {
    await append(); await append();
    await fs.unlink(path.join(source, '000000000001.json'));
    await expect(runBackup(config, remote)).rejects.toThrow('Missing');
    await json(path.join(source, '000000000001.json'), journal.records[0]);
    const altered = structuredClone(journal);
    altered.records[0].entry.target.keys[0] = randomUUID();
    expect(() => validateJournal(altered)).toThrow('chain');
    expect(() => validateJournal({ ...journal, checkpoint: { ...journal.checkpoint, hash: '0'.repeat(64) } })).toThrow('mismatch');
  });
  it('rejects replayed transport responses with the wrong challenge', async () => {
    await expect(runBackup(config, () => exportJournal(source, randomUUID()))).rejects.toThrow('challenge');
  });
  it('rejects symlinked and publicly readable journal files', async () => {
    await append();
    const record = path.join(source, '000000000001.json'), saved = path.join(base, 'saved');
    await fs.rename(record, saved); await fs.symlink(saved, record);
    await expect(runBackup(config, remote)).rejects.toThrow();
    await fs.unlink(record); await fs.rename(saved, record); await fs.chmod(record, 0o644);
    await expect(runBackup(config, remote)).rejects.toThrow('private');
  });
  it('rejects a symlinked destination', async () => {
    const real = path.join(base, 'real'); await fs.mkdir(real, { mode: 0o700 });
    await fs.symlink(real, config.destination);
    await expect(runBackup(config, remote)).rejects.toThrow('symlink');
  });
  it('refuses to advance a corrupted local backup', async () => {
    const first = await runBackup(config, remote);
    await json(path.join(config.destination, 'snapshots', first.snapshot, 'checkpoint.json'), { ...first.checkpoint, hash: '0'.repeat(64) });
    await expect(runBackup(config, remote)).rejects.toThrow('mismatch');
    await expect(verifyCurrent(config, remote)).rejects.toThrow('mismatch');
  });
  it('requires manual recovery if the latest pointer disappears', async () => {
    await runBackup(config, remote);
    await fs.unlink(path.join(config.destination, 'latest.json'));
    await expect(runBackup(config, remote)).rejects.toThrow('recovery');
  });
  it('serializes concurrent runs and flags an abandoned lock', async () => {
    let release, arrived;
    const ready = new Promise(resolve => { arrived = resolve; });
    const first = runBackup(config, async (c, n) => { arrived(); await new Promise(resolve => { release = resolve; }); return remote(c, n); });
    await ready;
    await expect(runBackup(config, remote)).rejects.toThrow('lock');
    release(); await first;
    await fs.mkdir(path.join(config.destination, '.backup-lock'));
    await expect(backupStatus(config)).rejects.toThrow('interrupted');
  });
  it('rejects unexpected contact fields and unsafe file names', async () => {
    await append();
    const contact = structuredClone(journal); contact.records[0].entry.target.email = 'private@example.test';
    expect(() => validateJournal(contact)).toThrow('structure');
    await append({ type: 'account', key: randomUUID(), files: [] });
    const unsafe = structuredClone(journal);
    unsafe.records[1].entry.target.files = [{ area: 'public', filename: '../secret' }];
    expect(() => validateJournal(unsafe)).toThrow('filename');
  });
  it('runs the standalone export as the exact stdin-based remote command', async () => {
    await append();
    const nonce = randomUUID(), script = await fs.readFile(new URL('./erasure-journal-backup.mjs', import.meta.url), 'utf8');
    const { spawn } = await import('node:child_process');
    const output = await new Promise((resolve, reject) => {
      const p = spawn(process.execPath, ['--input-type=module', '-', '--remote', source, nonce]);
      let out = '', err = ''; p.stdout.on('data', c => { out += c; }); p.stderr.on('data', c => { err += c; });
      p.on('error', reject); p.on('close', code => code ? reject(new Error(err)) : resolve(out)); p.stdin.end(script);
    });
    const bundle = JSON.parse(output);
    expect(bundle.nonce).toBe(nonce); expect(validateJournal(bundle).checkpoint).toEqual(journal.checkpoint);
  });
  it('produces journals accepted by the actual application restore parser', async () => {
    await append();
    await append({ type: 'account', key: randomUUID(), files: [{ area: 'support', filename: 'attachment.pdf' }] });
    await runBackup(config, remote);
    const result = await verifyCurrent(config, remote);
    const application = await import('../server/erasure-journal.ts');
    const parsed = await application.readJournal(result.journal);
    expect(parsed.checkpoint).toEqual(journal.checkpoint);
    expect(parsed.entries).toEqual(journal.records);
  });
  it('returns a nonzero CLI status when offline evidence is stale', async () => {
    await runBackup(config, remote);
    const latestPath = path.join(config.destination, 'latest.json');
    const latest = JSON.parse(await fs.readFile(latestPath, 'utf8')); latest.verifiedAt = '2020-01-01T00:00:00.000Z'; await json(latestPath, latest);
    const file = path.join(base, 'config.json');
    await json(file, { version: 1, host: 'example.test', source, ...config });
    await expect(execute(process.execPath, ['scripts/erasure-journal-backup.mjs', 'status', file])).rejects.toMatchObject({ code: 1 });
  });
});

it('escapes launchd arguments and installs a five-minute, noninteractive schedule', async () => {
  const { agentPlist } = await import('./install-erasure-backup.mjs');
  const plist = agentPlist({ node: '/node', script: '/a & b/backup.mjs', config: '/private/config.json', log: '/private/backup.log', directory: '/a & b' });
  expect(plist).toContain('/a &amp; b/backup.mjs');
  expect(plist).toContain('<key>StartInterval</key><integer>300</integer>');
  expect(plist).toContain('<key>RunAtLoad</key><true/>');
  expect(plist).not.toContain('/bin/sh');
  if (process.platform === 'darwin') {
    const file = path.join(base, 'agent.plist'); await fs.writeFile(file, plist);
    const result = await execute('/usr/bin/plutil', ['-lint', file]); expect(result.stdout).toContain('OK');
  }
});

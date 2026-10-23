#!/usr/bin/env node
// Installs only the local Mac backup agent. Never changes the source server.
import { promises as fs, constants } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { backupStatus } from './erasure-journal-backup.mjs';
const execute = promisify(execFile);
const label = 'de.trichterwerk.erasure-journal-backup';
const xml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
export function agentPlist({ node, script, config, log, directory }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array>${[node, script, 'run', config].map(v => `<string>${xml(v)}</string>`).join('')}</array>
<key>WorkingDirectory</key><string>${xml(directory)}</string>
<key>RunAtLoad</key><true/>
<key>StartInterval</key><integer>300</integer>
<key>ProcessType</key><string>Background</string>
<key>Umask</key><integer>63</integer>
<key>StandardOutPath</key><string>${xml(log)}</string>
<key>StandardErrorPath</key><string>${xml(log)}</string>
</dict></plist>\n`;
}
async function replace(filename, data) {
  const temporary = `${filename}.tmp-${randomUUID()}`;
  await fs.writeFile(temporary, data, { flag: 'wx', mode: 0o600 });
  await fs.rename(temporary, filename);
}
async function main() {
  if (process.platform !== 'darwin' || process.argv.length !== 3) throw new Error('Usage on macOS: node scripts/install-erasure-backup.mjs <private-config.json>');
  const input = path.resolve(process.argv[2]);
  const h = await fs.open(input, constants.O_RDONLY | constants.O_NOFOLLOW);
  let raw;
  try {
    const stat = await h.stat();
    if (!stat.isFile() || (stat.mode & 0o077) || stat.size > 16384) throw new Error('Configuration must be a private regular file (0600).');
    raw = await h.readFile('utf8');
  } finally { await h.close(); }
  const config = JSON.parse(raw);
  // Use the actual CLI validator and transfer before installing a recurring task.
  await execute(process.execPath, [fileURLToPath(new URL('./erasure-journal-backup.mjs', import.meta.url)), 'run', input], { timeout: 90_000 });
  await backupStatus(config);
  const directory = path.join(os.homedir(), 'Library/Application Support/Trichterwerk/JournalBackup');
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const stat = await fs.lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink() || (stat.mode & 0o077)) throw new Error('Installation directory must be private and not a symlink.');
  const script = path.join(directory, 'backup.mjs'), configPath = path.join(directory, 'config.json'), log = path.join(directory, 'backup.log');
  const agent = path.join(os.homedir(), 'Library/LaunchAgents', `${label}.plist`);
  const domain = `gui/${process.getuid()}`, target = `${domain}/${label}`;
  let loaded = false;
  try { await execute('/bin/launchctl', ['print', target]); loaded = true; } catch { /* First installation. */ }
  if (loaded) await execute('/bin/launchctl', ['bootout', target]);
  await replace(script, await fs.readFile(new URL('./erasure-journal-backup.mjs', import.meta.url)));
  await replace(configPath, raw);
  await fs.mkdir(path.dirname(agent), { recursive: true });
  await replace(agent, agentPlist({ node: process.execPath, script, config: configPath, log, directory }));
  await execute('/usr/bin/plutil', ['-lint', agent]);
  await execute('/bin/launchctl', ['bootstrap', domain, agent]);
  console.log(JSON.stringify({ installed: true, label, intervalSeconds: 300, script, config: configPath, agent, log }));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}

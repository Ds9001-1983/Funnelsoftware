// @vitest-environment node
import { it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
it('verifies real filesystem, transfer, lock and pruning failure scenarios', async () => {
  const result = await promisify(execFile)('python3', ['scripts/backup-operations-test.py', '-v'], {
    env: { ...process.env, BACKUP_TEST_NODE: process.execPath }, timeout: 90000,
  });
  expect(result.stderr).toContain('OK');
}, 95000);

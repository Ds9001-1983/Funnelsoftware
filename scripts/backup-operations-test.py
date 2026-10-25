import datetime as dt
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('operations', Path(__file__).with_name('backup-operations.py'))
ops = importlib.util.module_from_spec(spec); spec.loader.exec_module(ops)
digest = lambda b: hashlib.sha256(b).hexdigest()


class OperationsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.base = Path(self.temp.name).resolve()
        self.root = self.base / 'backups'; self.root.mkdir()
        (self.root / 'releases').mkdir()
        self.state = self.base / 'state'; self.state.mkdir(mode=0o700)
        self.c = {'version': 1, 'role': 'mac', 'backupRoot': str(self.root), 'stateDir': str(self.state), 'node': os.environ['BACKUP_TEST_NODE'], 'retentionDays': {'releases': 90, 'daily': 30}, 'sshHost': 'test@example.invalid', 'remoteRuntime': '/private/runtime'}
        self.now = dt.datetime.now(dt.timezone.utc)
        self.old_day = (self.now - dt.timedelta(days=150)).strftime('%Y-%m-%d_%H-%M')
        self.new_day = (self.now - dt.timedelta(hours=1)).strftime('%Y-%m-%d_%H-%M')
        self.old = self.release(self.now - dt.timedelta(days=150), 'aaaaaaaaaaaa')
        self.current = self.release(self.now - dt.timedelta(days=3), 'bbbbbbbbbbbb')
        self.pair(self.old_day, self.now - dt.timedelta(days=150))
        self.pair(self.new_day, self.now - dt.timedelta(hours=1))
        ops.record_release(self.c, self.current)
        ops.record_daily(self.c, self.new_day)

    def tearDown(self):
        self.temp.cleanup()

    def pair(self, day, when):
        for name in ('db_' + day + '.gz', 'uploads_' + day + '.tar.gz'):
            p = self.root / name; p.write_bytes(b'synthetic-' + day.encode()); os.utime(p, (when.timestamp(), when.timestamp()))

    def release(self, when, sha):
        entry = when.strftime('%Y%m%dT%H%M%S') + '-' + sha
        p = self.root / 'releases' / entry; p.mkdir()
        files = {'commit': (sha + '0' * 28).encode(), 'db.dump': b'synthetic', 'uploads.tar.gz': b'archive', 'environment': b'never-log-this', 'journal-baseline.dump': b'baseline', 'journal-baseline-uploads.tar.gz': b'archive', 'journal-baseline-checkpoint.json': b'{}'}
        for manifest, names in [('SHA256SUMS', ['db.dump', 'uploads.tar.gz']), ('journal-baseline-SHA256SUMS', ['journal-baseline.dump', 'journal-baseline-uploads.tar.gz', 'journal-baseline-checkpoint.json'])]:
            files[manifest] = ''.join(digest(files[n]) + '  ' + n + '\n' for n in names).encode()
        for name, contents in files.items():
            (p / name).write_bytes(contents); os.utime(p / name, (when.timestamp(), when.timestamp()))
        os.utime(p, (when.timestamp(), when.timestamp()))
        return entry

    def archive(self):
        p = self.base / 'bundle.tar'
        with p.open('wb') as output: ops.bundle(self.c, output)
        return p

    def test_prune_removes_only_exact_old_sets_and_keeps_journal(self):
        (self.root / 'erasure-journal').mkdir(); (self.root / 'erasure-journal' / 'db_2000-01-01_00-00.gz').write_bytes(b'protected')
        (self.root / 'uploads_2000-01-01_00-00.tar.gz').write_bytes(b'orphan')
        result = ops.prune(self.c)
        self.assertEqual(result['deletedFiles'], 11)
        self.assertFalse((self.root / 'releases' / self.old).exists())
        self.assertTrue((self.root / 'releases' / self.current).exists())
        self.assertTrue((self.root / ('db_' + self.new_day + '.gz')).exists())
        self.assertTrue((self.root / 'erasure-journal' / 'db_2000-01-01_00-00.gz').exists())
        audit = ops.read_json(result['review'])
        self.assertTrue(audit['complete']); self.assertEqual(len(audit['deleted']), 11)
        self.assertNotIn('never-log-this', json.dumps(audit))
        self.assertEqual(ops.prune(self.c)['deletedFiles'], 0)

    def test_mismatch_after_preview_stops_before_unlink(self):
        original = ops.preview
        count = 0
        def changed(*args):
            nonlocal count
            count += 1
            if count == 2: (self.root / 'releases' / self.old / 'environment').write_bytes(b'changed')
            return original(*args)
        with patch.object(ops, 'preview', changed):
            with self.assertRaises(ValueError): ops.prune(self.c)
        self.assertTrue((self.root / 'releases' / self.old / 'db.dump').exists())

    def test_audit_failure_prevents_deletion(self):
        with patch.object(ops, 'write_json', side_effect=OSError('disk full')):
            with self.assertRaises(OSError): ops.prune(self.c)
        self.assertTrue((self.root / 'releases' / self.old / 'db.dump').exists())

    def test_partial_unlink_failure_is_durably_recorded_and_not_retried(self):
        original = os.unlink
        count = 0
        def fail_second(*args, **kwargs):
            nonlocal count
            count += 1
            if count == 2: raise OSError('synthetic failure')
            return original(*args, **kwargs)
        with patch.object(ops.os, 'unlink', fail_second):
            with self.assertRaises(OSError): ops.prune(self.c)
        audit = ops.read_json(next((self.state / 'reviews').iterdir()))
        self.assertFalse(audit['complete']); self.assertEqual(len(audit['deleted']), 1)
        result = ops.prune(self.c)
        self.assertEqual(result['deletedFiles'], 2)  # Only the unrelated complete daily pair.
        self.assertTrue((self.root / 'releases' / self.old).exists())

    def test_bad_anchor_blocks_all_deletion(self):
        (self.root / 'releases' / self.current / 'environment').write_bytes(b'changed')
        with self.assertRaises(ValueError): ops.prune(self.c)
        self.assertTrue((self.root / 'releases' / self.old).exists())

    def test_release_change_since_mac_copy_blocks_server_cleanup(self):
        with self.assertRaises(ValueError): ops.prune(self.c, self.old)
        self.assertTrue((self.root / 'releases' / self.old).exists())

    def test_lock_excludes_other_process_and_releases_on_failure(self):
        code = "import os,fcntl;f=os.open(os.environ['LOCK'],os.O_RDWR);fcntl.flock(f,fcntl.LOCK_EX|fcntl.LOCK_NB)"
        with ops.locked(self.c):
            result = subprocess.run([sys.executable, '-c', code], env={**os.environ, 'LOCK': str(self.state / 'operation.lock')}, capture_output=True)
            self.assertNotEqual(result.returncode, 0)
        with ops.locked(self.c): pass

    def test_export_import_verifies_both_sets_and_is_idempotent(self):
        archive = self.archive()
        staging = self.base / 'staging'; staging.mkdir()
        manifest = ops.unpack(archive, staging)
        destination = self.base / 'mac'; destination.mkdir(); (destination / 'releases').mkdir()
        state = self.base / 'mac-state'; state.mkdir(mode=0o700)
        c = {**self.c, 'backupRoot': str(destination), 'stateDir': str(state)}
        ops.install_bundle(c, staging, manifest)
        self.assertTrue(ops.preview(c)['dailyRecovery']['valid'])
        before = {p.name: ops.inspect_file(p) for p in destination.iterdir() if p.is_file()}
        staging2 = self.base / 'staging2'; staging2.mkdir()
        ops.install_bundle(c, staging2, ops.unpack(archive, staging2))
        self.assertEqual(before, {p.name: ops.inspect_file(p) for p in destination.iterdir() if p.is_file()})

    def test_changed_existing_local_copy_is_not_overwritten(self):
        archive = self.archive(); staging = self.base / 'staging'; staging.mkdir()
        manifest = ops.unpack(archive, staging)
        (self.root / ('db_' + self.new_day + '.gz')).write_bytes(b'local change')
        with self.assertRaises(ValueError): ops.install_bundle(self.c, staging, manifest)
        self.assertEqual((self.root / ('db_' + self.new_day + '.gz')).read_bytes(), b'local change')

    def test_symlinked_release_destination_is_rejected(self):
        archive = self.archive(); staging = self.base / 'staging'; staging.mkdir()
        manifest = ops.unpack(archive, staging)
        destination = self.base / 'mac'; destination.mkdir(); (destination / 'releases').symlink_to(self.root / 'releases')
        with self.assertRaises(ValueError): ops.install_bundle({**self.c, 'backupRoot': str(destination)}, staging, manifest)

    def test_tampered_archive_is_rejected(self):
        archive = self.archive()
        raw = archive.read_bytes().replace(b'synthetic-', b'TAMPERED--', 1); archive.write_bytes(raw)
        staging = self.base / 'staging'; staging.mkdir()
        with self.assertRaises(ValueError): ops.unpack(archive, staging)

    def test_archive_symlink_and_unexpected_member_are_rejected(self):
        archive = self.archive()
        with tarfile.open(archive, 'a') as tar:
            info = tarfile.TarInfo('payload/../../escape'); info.type = tarfile.SYMTYPE; info.linkname = '/tmp/escape'; tar.addfile(info)
        staging = self.base / 'staging'; staging.mkdir()
        with self.assertRaises(ValueError): ops.unpack(archive, staging)

    def test_stale_daily_proof_blocks_export(self):
        proof = ops.read_json(self.state / 'daily.json'); proof['verifiedAt'] = '2000-01-01T00:00:00.000Z'; ops.write_json(self.state / 'daily.json', proof)
        with self.assertRaises(ValueError): self.archive()

    def test_network_failure_prevents_any_cleanup(self):
        with patch.object(ops, 'ssh', side_effect=OSError('offline')), patch.object(ops, 'prune') as prune:
            with self.assertRaises(OSError): ops.mac_run(self.c)
            prune.assert_not_called()

    def test_no_server_prune_when_local_copy_fails(self):
        archive = self.archive()
        def export(c, command, **kwargs): kwargs['stdout'].write(archive.read_bytes())
        with patch.object(ops, 'ssh', side_effect=export) as ssh, patch.object(ops, 'install_bundle', side_effect=ValueError('copy failed')):
            with self.assertRaises(ValueError): ops.mac_run(self.c)
            self.assertEqual(ssh.call_count, 1)

    def test_initial_sync_does_not_prune_and_only_then_full_run_cleans(self):
        archive = self.archive()
        destination = self.base / 'mac'; destination.mkdir(); (destination / 'releases').mkdir()
        state = self.base / 'mac-state'; state.mkdir(mode=0o700)
        c = {**self.c, 'backupRoot': str(destination), 'stateDir': str(state)}
        def remote(c, command, **kwargs):
            if ' export ' in command:
                kwargs['stdout'].write(archive.read_bytes())
            else:
                return subprocess.CompletedProcess([], 0, stdout='{"deletedFiles":0}')
        with patch.object(ops, 'ssh', side_effect=remote) as ssh, patch.object(ops, 'prune', return_value={'deletedFiles': 0}) as prune:
            result = ops.mac_run(c, cleanup=False)
            self.assertFalse(result['cleanup']); self.assertEqual(ssh.call_count, 1); prune.assert_not_called()
            result = ops.mac_run(c)
            self.assertTrue(result['cleanup']); self.assertEqual(ssh.call_count, 3); prune.assert_called_once()

    def test_inherited_shell_lock_is_required_for_restore_records(self):
        filename = self.state / 'config.json'; ops.write_json(filename, {**self.c, 'role': 'server', 'retentionDays': {'releases': 30, 'daily': 30}})
        command = [sys.executable, str(Path(ops.__file__)), 'record-release', str(filename), self.current]
        failed = subprocess.run(command, capture_output=True)
        self.assertNotEqual(failed.returncode, 0)
        # Bash FD 9 is inherited exactly as in deployment and the daily backup job.
        result = subprocess.run(['bash', '-c', 'exec 9>"$1"; shift; exec "$@"', 'backup-test', str(self.state / 'operation.lock'), *command], capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_hardlinked_candidate_is_preserved(self):
        os.link(self.root / 'releases' / self.old / 'environment', self.base / 'hardlink')
        self.assertEqual(ops.prune(self.c)['deletedFiles'], 2)
        self.assertTrue((self.root / 'releases' / self.old).exists())


if __name__ == '__main__':
    unittest.main()

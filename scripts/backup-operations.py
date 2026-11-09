#!/usr/bin/env python3
"""Locked backup transfer and pruning. The independent Node scanner decides eligibility."""
import contextlib
import datetime as dt
import fcntl
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys
import tarfile
import tempfile
import time
import uuid

SCRIPT = Path(__file__).resolve().parent
RELEASE = re.compile(r'^\d{8}T\d{6}-[a-f0-9]{12}$')
DAILY = re.compile(r'^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}$')
MAX_BUNDLE = 512 * 1024 * 1024


def require(ok, message):
    if not ok:
        raise ValueError(message)


def utc():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')


def verified_time():
    # Filesystems retain sub-millisecond mtimes; JSON/Node evidence uses whole ms.
    # Advance the clock rather than issuing a future-dated verification receipt.
    time.sleep(0.002)
    return utc()


def age(value):
    return (dt.datetime.now(dt.timezone.utc) - dt.datetime.fromisoformat(value.replace('Z', '+00:00'))).total_seconds()


def real_dir(p):
    p = Path(p)
    require(p.is_absolute() and str(p) != '/' and p.resolve() == p and stat.S_ISDIR(p.lstat().st_mode), 'Unsafe directory')
    return p


def fingerprint(s):
    return (s.st_dev, s.st_ino, s.st_size, s.st_mtime_ns, s.st_ctime_ns, s.st_mode, s.st_nlink)


def inspect_file(p):
    fd = os.open(p, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(fd, 'rb') as f:
        before = os.fstat(f.fileno())
        require(stat.S_ISREG(before.st_mode) and before.st_nlink == 1, 'Unsafe backup file')
        digest = hashlib.sha256()
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            digest.update(chunk)
        require(fingerprint(before) == fingerprint(os.fstat(f.fileno())) == fingerprint(os.lstat(p)), 'File changed')
    return {'bytes': before.st_size, 'sha256': digest.hexdigest()}


def read_json(p):
    fd = os.open(p, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(fd) as f:
        s = os.fstat(f.fileno())
        require(stat.S_ISREG(s.st_mode) and s.st_size <= 1024 * 1024, 'Invalid metadata file')
        return json.load(f)


def sync_dir(p):
    fd = os.open(p, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def write_json(p, data):
    p = Path(p)
    temporary = p.with_name('.' + p.name + '-' + uuid.uuid4().hex)
    with open(temporary, 'x', opener=lambda name, flags: os.open(name, flags, 0o600)) as f:
        json.dump(data, f, indent=2)
        f.write('\n')
        f.flush()
        os.fsync(f.fileno())
    os.replace(temporary, p)
    sync_dir(p.parent)


def config(filename):
    c = read_json(filename)
    require(c.get('version') == 1 and c.get('role') in ('server', 'mac'), 'Invalid configuration')
    for key in ('backupRoot', 'stateDir'):
        real_dir(c[key])
    require(Path(c['node']).is_absolute(), 'Absolute Node path required')
    require(c['retentionDays'] == {'releases': 30 if c['role'] == 'server' else 90, 'daily': 30}, 'Unexpected operator policy')
    require(Path(c['stateDir']).stat().st_mode & 0o077 == 0, 'State directory must be private')
    require(Path(filename).stat().st_mode & 0o077 == 0, 'Configuration must be private')
    require(not Path(c['stateDir']).is_relative_to(Path(c['backupRoot']) / 'releases'), 'State must be outside release sets')
    if c['role'] == 'mac':
        require(re.fullmatch(r'[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+', c['sshHost']), 'Invalid SSH host')
        require(re.fullmatch(r'/[a-zA-Z0-9/_-]+', c['remoteRuntime']), 'Invalid remote runtime')
    return c


@contextlib.contextmanager
def locked(c, inherited=False):
    p = Path(c['stateDir']) / 'operation.lock'
    fd = 9 if inherited else os.open(p, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    try:
        require(stat.S_ISREG(os.fstat(fd).st_mode) and os.fstat(fd).st_nlink == 1, 'Unsafe lock')
        if inherited:
            require(os.path.samestat(os.fstat(fd), p.lstat()), 'Deploy lock missing')
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield
    finally:
        if not inherited:
            os.close(fd)


def policy(c, anchor=None):
    if anchor is None:
        anchor = read_json(Path(c['stateDir']) / 'recovery.json')['anchor']
    result = {'version': 1, 'roots': [
        {'id': 'releases', 'path': str(Path(c['backupRoot']) / 'releases'), 'kind': 'releases', 'retentionDays': c['retentionDays']['releases'], 'holds': c.get('releaseHolds', [])},
        {'id': 'daily', 'path': c['backupRoot'], 'kind': 'daily', 'retentionDays': c['retentionDays']['daily'], 'holds': c.get('dailyHolds', [])},
    ], 'recoveryAnchor': anchor}
    daily_path = Path(c['stateDir']) / 'daily.json'
    if daily_path.exists():
        d = read_json(daily_path)
        result['dailyRecovery'] = {'rootId': 'daily', 'entry': d['entry'], 'verifiedAt': d['verifiedAt'], 'verificationRef': 'isolated-daily-restore:' + d['entry'], 'hashes': {n: f['sha256'] for n, f in d['files'].items()}}
    return result


def preview(c, anchor=None):
    import base64
    encoded = base64.urlsafe_b64encode(json.dumps(policy(c, anchor)).encode()).decode().rstrip('=')
    result = json.loads(subprocess.check_output([c['node'], str(SCRIPT / 'backup-retention-preview.mjs'), 'preview-json', encoded], timeout=300))
    require(result['recoveryAnchor']['valid'] and all(not r['issues'] for r in result['roots']), 'Recovery reference or inventory unavailable')
    return result


def record_release(c, entry):
    require(RELEASE.fullmatch(entry), 'Invalid release ID')
    directory = real_dir(Path(c['backupRoot']) / 'releases' / entry)
    hashes = {p.name: inspect_file(p)['sha256'] for p in directory.iterdir()}
    anchor = {'rootId': 'releases', 'entry': entry, 'verifiedAt': verified_time(), 'verificationRef': 'successful-deployment-restore:' + entry, 'hashes': hashes}
    preview(c, anchor)
    write_json(Path(c['stateDir']) / 'recovery.json', {'version': 1, 'anchor': anchor})


def record_daily(c, entry):
    require(DAILY.fullmatch(entry), 'Invalid daily ID')
    names = ['db_' + entry + '.gz', 'uploads_' + entry + '.tar.gz']
    files = {n: inspect_file(Path(c['backupRoot']) / n) for n in names}
    require(all(f['bytes'] > 0 for f in files.values()), 'Empty daily backup')
    write_json(Path(c['stateDir']) / 'daily.json', {'version': 1, 'entry': entry, 'verifiedAt': verified_time(), 'files': files, 'verification': 'isolated-psql-restore-and-repeated-migration;uploads-and-private-uploads-archive-tested'})


def journal_ready(c):
    if c['role'] == 'server':
        subprocess.run([c['node'], '/var/www/funnelflow/scripts/erasure-journal-backup.mjs', 'source-status', '/var/lib/funnelflow/erasure-journal'], check=True, stdout=subprocess.DEVNULL, timeout=30)


def bundle(c, target):
    journal_ready(c)
    scan = preview(c)
    require(scan['dailyRecovery']['valid'], 'Daily restore reference is invalid')
    recovery = read_json(Path(c['stateDir']) / 'recovery.json')
    daily = read_json(Path(c['stateDir']) / 'daily.json')
    require(0 <= age(daily['verifiedAt']) <= 48 * 3600, 'Daily restore proof is stale')
    require(DAILY.fullmatch(daily['entry']), 'Invalid daily reference')
    entry = next(e for e in scan['roots'][0]['entries'] if e['id'] == recovery['anchor']['entry'])
    selected = {}
    for f in entry['files']:
        selected['releases/' + entry['id'] + '/' + f['name']] = {'bytes': f['bytes'], 'sha256': f['sha256']}
    for name, expected in daily['files'].items():
        require(name in ('db_' + daily['entry'] + '.gz', 'uploads_' + daily['entry'] + '.tar.gz'), 'Unexpected daily file')
        require(inspect_file(Path(c['backupRoot']) / name) == expected, 'Daily backup changed')
        selected[name] = expected
    require(len(daily['files']) == 2, 'Incomplete daily proof')
    require(sum(f['bytes'] for f in selected.values()) <= MAX_BUNDLE, 'Backup bundle exceeds transfer limit')
    manifest = {'version': 1, 'createdAt': utc(), 'recovery': recovery, 'daily': daily, 'files': selected}
    data = json.dumps(manifest).encode()
    with tarfile.open(fileobj=target, mode='w|') as tar:
        info = tarfile.TarInfo('manifest.json'); info.size = len(data); info.mode = 0o600
        tar.addfile(info, io.BytesIO(data))
        for name, expected in selected.items():
            p = Path(c['backupRoot']) / name
            require(inspect_file(p) == expected, 'Backup changed before export')
            tar.add(p, arcname='payload/' + name, recursive=False)


def unpack(bundle_path, staging):
    with tarfile.open(bundle_path, 'r:') as tar:
        members = []
        for member in tar:
            members.append(member)
            require(len(members) <= 20, 'Too many archive members')
        require(len(members) <= 20 and len({m.name for m in members}) == len(members), 'Invalid archive members')
        require(members and members[0].name == 'manifest.json' and members[0].isfile() and members[0].size <= 65536, 'Missing manifest')
        manifest = json.load(tar.extractfile(members[0]))
        require(manifest['version'] == 1 and 0 <= age(manifest['createdAt']) <= 900, 'Stale transfer')
        entry = manifest['recovery']['anchor']['entry']; day = manifest['daily']['entry']
        require(RELEASE.fullmatch(entry) and DAILY.fullmatch(day), 'Invalid backup identifiers')
        names = manifest['files']
        require(set(names) == {'releases/' + entry + '/' + n for n in manifest['recovery']['anchor']['hashes']} | {'db_' + day + '.gz', 'uploads_' + day + '.tar.gz'}, 'Incomplete transfer')
        require({m.name for m in members[1:]} == {'payload/' + n for n in names}, 'Unexpected transfer files')
        require(sum(m.size for m in members) <= MAX_BUNDLE + 65536, 'Oversized transfer')
        for m in members[1:]:
            name = m.name.removeprefix('payload/')
            require(m.isfile() and all(re.fullmatch(r'[a-zA-Z0-9_.-]+', part) and part not in ('.', '..') for part in name.split('/')), 'Unsafe archive entry')
            expected = names[name]
            require(m.size == expected['bytes'], 'Transfer size mismatch')
            p = staging / name; p.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
            with p.open('xb') as out:
                shutil.copyfileobj(tar.extractfile(m), out)
                out.flush(); os.fsync(out.fileno())
            os.chmod(p, 0o600)
            os.utime(p, (m.mtime, m.mtime))
            require(inspect_file(p) == expected, 'Transfer checksum mismatch')
        for n, digest in manifest['recovery']['anchor']['hashes'].items():
            require(names['releases/' + entry + '/' + n]['sha256'] == digest, 'Recovery hash mismatch')
        require(0 <= age(manifest['daily']['verifiedAt']) <= 48 * 3600, 'Stale daily backup')
        for n, expected in manifest['daily']['files'].items():
            require(names.get(n) == expected, 'Daily proof mismatch')
        return manifest


def install_bundle(c, staging, manifest):
    root = real_dir(c['backupRoot'])
    real_dir(root / 'releases')
    # Validate the staged release with the same scanner before publishing any files.
    # Keep staged validation independent of a previous local daily reference.
    temporary_state = staging / '.verification'; temporary_state.mkdir(mode=0o700)
    test_config = {**c, 'backupRoot': str(staging), 'stateDir': str(temporary_state)}
    anchor = dict(manifest['recovery']['anchor'])
    anchor['verifiedAt'] = verified_time()  # Local copy verified now; original restore proof remains in manifest.
    preview(test_config, anchor)
    entry = anchor['entry']
    target = root / 'releases' / entry
    if target.exists() or target.is_symlink():
        real_dir(target)
        require({p.name for p in target.iterdir()} == set(anchor['hashes']), 'Existing release layout differs')
        for name, digest in anchor['hashes'].items():
            require(inspect_file(target / name)['sha256'] == digest, 'Existing release differs')
    else:
        os.rename(staging / 'releases' / entry, target)
        sync_dir(target.parent)
    sync_dir(target)
    for name in manifest['daily']['files']:
        destination = root / name
        if destination.exists() or destination.is_symlink():
            require(inspect_file(destination) == manifest['files'][name], 'Existing daily copy differs')
        else:
            os.rename(staging / name, destination)
    sync_dir(root)
    # Preserve source mtimes for retention; copying must not restart the age clock.
    # A new directory's mtime intentionally protects a newly imported release for its full local period.
    for name in manifest['daily']['files']:
        require(inspect_file(root / name) == manifest['files'][name], 'Installed copy differs')
    write_json(Path(c['stateDir']) / 'recovery.json', {'version': 1, 'anchor': {**anchor, 'verifiedAt': verified_time()}, 'sourceProof': manifest['recovery']})
    write_json(Path(c['stateDir']) / 'daily.json', {**manifest['daily'], 'verifiedAt': verified_time(), 'sourceProof': manifest['daily']})
    preview(c)


def prune(c, expected_anchor=None):
    journal_ready(c)
    scan = preview(c)
    anchor = read_json(Path(c['stateDir']) / 'recovery.json')['anchor']
    if expected_anchor is not None:
        require(expected_anchor == anchor['entry'], 'Release changed since Mac transfer')
    if not scan['candidates']:
        return {'deletedFiles': 0, 'review': None}
    audit_dir = Path(c['stateDir']) / 'reviews'; audit_dir.mkdir(mode=0o700, exist_ok=True); real_dir(audit_dir)
    run = audit_dir / (dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S') + '-' + uuid.uuid4().hex + '.json')
    log = {'startedAt': utc(), 'policy': policy(c), 'preview': scan, 'deleted': [], 'complete': False}
    write_json(run, log)  # Durable concrete plan before the first unlink.
    for candidate in scan['candidates'][:50]:
        fresh = preview(c)
        require(candidate in fresh['candidates'], 'Candidate changed since preview')
        root = next(r for r in fresh['roots'] if r['id'] == candidate['rootId'])
        parent = real_dir(Path(root['path']) / candidate['entry'] if root['kind'] == 'releases' else Path(root['path']))
        checked = {}
        for file in candidate['files']:
            p = Path(file['path'])
            require(p.parent == parent and inspect_file(p) == {'bytes': file['bytes'], 'sha256': file['sha256']}, 'Candidate hash changed')
            checked[p.name] = fingerprint(p.lstat())
        fd = os.open(parent, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try:
            require(os.path.samestat(os.fstat(fd), parent.lstat()), 'Candidate directory changed')
            for name, signature in checked.items():
                require(fingerprint(os.stat(name, dir_fd=fd, follow_symlinks=False)) == signature, 'Candidate file changed')
                os.unlink(name, dir_fd=fd)
                os.fsync(fd)
                log['deleted'].append(str(parent / name)); write_json(run, log)
        finally:
            os.close(fd)
        if root['kind'] == 'releases':
            os.rmdir(parent)  # Never recurse; unknown or newly added files prevent removal.
            sync_dir(parent.parent)
    log['complete'] = True; log['finishedAt'] = utc(); write_json(run, log)
    return {'deletedFiles': len(log['deleted']), 'review': str(run)}


def ssh(c, command, **kwargs):
    return subprocess.run(['/usr/bin/ssh', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o', 'ConnectTimeout=15', '-o', 'ServerAliveInterval=15', '-o', 'ServerAliveCountMax=3', c['sshHost'], command], check=True, timeout=600, **kwargs)


def mac_run(c, cleanup=True):
    remote = '/usr/bin/python3 ' + c['remoteRuntime'] + '/backup-operations.py '
    remote_config = c['remoteRuntime'] + '/config.json'
    with tempfile.TemporaryDirectory(prefix='.transfer-', dir=c['stateDir']) as temporary:
        temporary = Path(temporary)
        archive = temporary / 'bundle.tar'
        with archive.open('xb') as output:
            ssh(c, remote + 'export ' + remote_config, stdout=output)
        require(archive.stat().st_size <= MAX_BUNDLE + 1024 * 1024, 'Oversized bundle')
        staging = temporary / 'staging'; staging.mkdir(mode=0o700)
        manifest = unpack(archive, staging)
        install_bundle(c, staging, manifest)
    # Server cleanup is reached only after the Mac has durably verified both copies.
    server, local = None, None
    if cleanup:
        server = json.loads(ssh(c, remote + 'prune ' + remote_config + ' ' + manifest['recovery']['anchor']['entry'], stdout=subprocess.PIPE, text=True).stdout)
        local = prune(c)
    result = {'ok': True, 'finishedAt': utc(), 'daily': manifest['daily']['entry'], 'release': manifest['recovery']['anchor']['entry'], 'cleanup': cleanup, 'server': server, 'mac': local}
    write_json(Path(c['stateDir']) / 'status.json', result)
    return result


def main():
    os.umask(0o077)
    require(len(sys.argv) in (3, 4), 'Usage: command config [entry]')
    command, filename = sys.argv[1:3]; c = config(filename)
    entry = sys.argv[3] if len(sys.argv) == 4 else None
    if command == 'status':
        result = read_json(Path(c['stateDir']) / 'status.json')
        require(result['ok'] and 0 <= age(result['finishedAt']) <= 48 * 3600, 'Backup status stale or failed')
        print(json.dumps(result)); return
    require(command in ('record-release', 'record-daily', 'export', 'prune', 'run', 'sync', 'preview'), 'Unknown command')
    require(c['role'] == ('mac' if command in ('run', 'sync') else 'server') or command == 'preview', 'Command not allowed for this role')
    with locked(c, inherited=command.startswith('record-')):
        if command == 'record-release': record_release(c, entry)
        elif command == 'record-daily': record_daily(c, entry)
        elif command == 'export': bundle(c, sys.stdout.buffer)
        elif command == 'prune':
            require(entry and RELEASE.fullmatch(entry), 'Expected copied release required')
            print(json.dumps(prune(c, entry)))
        elif command in ('run', 'sync'):
            try:
                print(json.dumps(mac_run(c, cleanup=command == 'run')))
            except Exception:
                write_json(Path(c['stateDir']) / 'status.json', {'ok': False, 'failedAt': utc(), 'error': 'Backup or cleanup failed; inspect private log and review records.'})
                raise
        elif command == 'preview': print(json.dumps(preview(c), indent=2))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('Backup operation stopped: ' + (str(error) if isinstance(error, (ValueError, BlockingIOError)) else type(error).__name__), file=sys.stderr)
        sys.exit(1)

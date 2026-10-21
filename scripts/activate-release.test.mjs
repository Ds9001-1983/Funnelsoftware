// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, writeFile, symlink, readlink, rm, copyFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { configureUploadCache } from "./configure-upload-cache.mjs";

const execute = promisify(execFile);
const roots = [];
const site = `server {
    server_name example.test;
    location /uploads/ {
        alias /var/www/funnelflow/uploads/;
        try_files $uri =404;
        expires 30d;
        add_header Cache-Control "public, immutable";
        include /etc/nginx/snippets/security-headers.conf;
    }
    location /assets/ { expires 1y; }
}
`;
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });

describe("upload cache configuration", () => {
  it("changes only uploads, preserves local settings and is repeatable", () => {
    const updated = configureUploadCache(site);
    expect(updated).toContain('add_header Cache-Control "no-store" always;');
    expect(updated).toContain("expires off;");
    expect(updated).not.toContain("immutable");
    expect(updated).toContain("server_name example.test;");
    expect(updated).toContain("location /assets/ { expires 1y; }");
    expect(updated).toContain("include /etc/nginx/snippets/security-headers.conf;");
    expect(configureUploadCache(updated)).toBe(updated);
  });
  it.each([site + site, site.replace("/uploads/ {", "/other/ {"), site.replace("alias /var/www/funnelflow/uploads/", "alias /unexpected/")])("refuses ambiguous or unfamiliar live rules", config => {
    expect(() => configureUploadCache(config)).toThrow();
  });
});

async function fixture(failure = "") {
  const root = await mkdtemp(path.join(os.tmpdir(), "release-switch-test-")); roots.push(root);
  for (const name of ["app", "old/dist", "release/dist", "release/scripts", "backup", "bin"]) await mkdir(path.join(root, name), { recursive: true });
  await symlink(path.join(root, "old/dist"), path.join(root, "app/dist"));
  await writeFile(path.join(root, "site.conf"), site);
  await copyFile(fileURLToPath(new URL("./configure-upload-cache.mjs", import.meta.url)), path.join(root, "release/scripts/configure-upload-cache.mjs"));
  await writeFile(path.join(root, "state.json"), JSON.stringify({ status: "online", release: "old" }));
  // Actual temporary files/symlinks are changed by the real activation script;
  // only service/network commands and the remote DB inventory are substituted.
  const stub = `#!${process.execPath}
const fs=require('node:fs'), path=require('node:path'), cp=require('node:child_process');
const root=process.env.RELEASE_TEST_ROOT, name=path.basename(process.argv[1]), args=process.argv.slice(2);
const statePath=path.join(root,'state.json'), state=JSON.parse(fs.readFileSync(statePath,'utf8'));
const fail=process.env.RELEASE_TEST_FAILURE;
const record=value=>fs.appendFileSync(path.join(root,'commands.log'),value+'\\n');
if(name==='node') {
  if(args[0]==='scripts/audit-upload-ownership.mjs') {
    record('audit:'+state.status);
    if(state.status!=='stopped') process.exit(90);
    process.exit(fail==='inventory'?2:0);
  }
  const result=cp.spawnSync(${JSON.stringify(process.execPath)},args,{stdio:'inherit'}); process.exit(result.status??1);
}
if(name==='pm2') {
  record('pm2:'+args[0]);
  if(args[0]==='stop') state.status='stopped';
  if(args[0]==='restart') {
    state.release=process.env.APP_RELEASE_SHA; state.status='online';
    if(fail==='restart'&&state.release==='new') process.exit(1);
  }
  fs.writeFileSync(statePath,JSON.stringify(state));
}
if(name==='nginx') {
  record('nginx:test');
  if(fail==='nginx'&&fs.readFileSync(path.join(root,'site.conf'),'utf8').includes('no-store')) process.exit(1);
}
if(name==='systemctl') {
  record('nginx:reload');
  if(fail==='reload'&&fs.readFileSync(path.join(root,'site.conf'),'utf8').includes('no-store')) process.exit(1);
}
if(name==='curl') {
  if(fail==='health'&&state.release==='new') process.exit(22);
  process.stdout.write(JSON.stringify({status:state.status==='online'?'ok':'stopped',release:state.release}));
}
`;
  for (const name of ["node", "pm2", "nginx", "systemctl", "curl", "sleep"]) await writeFile(path.join(root, "bin", name), stub, { mode: 0o755 });
  const env = { PATH: `${root}/bin:${process.env.PATH}`, RELEASE_TEST_ROOT: root, RELEASE_TEST_FAILURE: failure };
  const args = [fileURLToPath(new URL("./activate-release.sh", import.meta.url)), `${root}/app`, `${root}/release`, `${root}/backup`, "old", "new", `${root}/site.conf`];
  let result;
  try { result = { code: 0, ...await execute("bash", args, { env, timeout: 20_000 }) }; }
  catch (error) { result = error; }
  return { root, result, state: JSON.parse(await readFile(`${root}/state.json`, "utf8")), config: await readFile(`${root}/site.conf`, "utf8"), dist: await readlink(`${root}/app/dist`), commands: await readFile(`${root}/commands.log`, "utf8") };
}

describe("production release activation", () => {
  it("stops old uploads before inventory and starts the verified release with the new cache rule", async () => {
    const run = await fixture();
    expect(run.result.code).toBe(0);
    expect(run.state).toEqual({ status: "online", release: "new" });
    expect(run.dist).toBe(`${run.root}/release/dist`);
    expect(run.config).toBe(configureUploadCache(site));
    expect(run.commands).toContain("pm2:stop\naudit:stopped\nnginx:test\nnginx:reload\npm2:restart");
    expect(await readFile(`${run.root}/backup/nginx-site`, "utf8")).toBe(site);
  });
  it.each(["inventory", "nginx", "reload", "restart", "health"])("restores the old live release and cache config after %s failure", async failure => {
    const run = await fixture(failure);
    expect(run.result.code).toBe(1);
    expect(run.state).toEqual({ status: "online", release: "old" });
    expect(run.dist).toBe(`${run.root}/old/dist`);
    expect(run.config).toBe(site);
    expect(await readFile(`${run.root}/backup/nginx-site`, "utf8")).toBe(site);
  }, 25_000);
});

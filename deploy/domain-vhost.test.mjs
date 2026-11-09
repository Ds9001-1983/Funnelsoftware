// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const script = readFileSync(new URL("./domain-provisioner.sh", import.meta.url), "utf8");
const template = readFileSync(new URL("./custom-domain-vhost.template", import.meta.url), "utf8");
const hostname = "funnel.example.test";
const roots = [];
function shellFunction(name) {
  const result = script.match(new RegExp(`^${name}\\(\\) \\{[\\s\\S]*?^}`, "m"));
  if (!result) throw new Error(`Missing production function: ${name}`);
  return result[0];
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

function fixture({ existing = true, scenario = "success", missing = false, invalid = false } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "domain vhost test-"));
  roots.push(root);
  const bin = path.join(root, "bin"), vhosts = path.join(root, "etc/nginx/customer-domains");
  mkdirSync(bin, { recursive: true }); mkdirSync(vhosts, { recursive: true });
  // Mirror the documented installation: cp deploy/custom-domain-vhost.template /etc/nginx/.
  const installedTemplate = path.join(root, "etc/nginx/custom-domain-vhost.template");
  if (!missing) writeFileSync(installedTemplate, invalid ? `${template}\nINVALID\n` : template);
  const configuredTemplate = root + script.match(/^TEMPLATE="([^"]+)"/m)[1];
  const conf = path.join(vhosts, `${hostname}.conf`);
  if (existing) writeFileSync(conf, "# Previous working vhost\n");
  const calls = path.join(root, "calls");
  writeFileSync(path.join(bin, "nginx"), `#!/bin/sh
echo nginx-test >> "$CALLS"
[ "$SCENARIO" != baseline-failure ] || exit 1
if [ -f "$CONF" ] && grep -q INVALID "$CONF"; then exit 1; fi
exit 0
`, { mode: 0o755 });
  writeFileSync(path.join(bin, "systemctl"), `#!/bin/sh
[ "$1" = reload ] && [ "$2" = nginx ] || exit 9
echo reload >> "$CALLS"
if [ "$SCENARIO" = recovery-failure ]; then exit 1; fi
if [ "$SCENARIO" = reload-failure ] && [ ! -f "$RELOAD_MARKER" ]; then
  touch "$RELOAD_MARKER"
  exit 1
fi
exit 0
`, { mode: 0o755 });
  const command = `set -euo pipefail\n${script.match(/^log\(\).*$/m)[0]}\n${shellFunction("render_vhost")}\n${shellFunction("activate_vhost")}\nif activate_vhost "$1"; then echo ACTIVATED; else exit "$?"; fi`;
  const result = spawnSync("bash", ["-c", command, "vhost-test", hostname], {
    encoding: "utf8", timeout: 10_000,
    env: { PATH: `${bin}:${process.env.PATH}`, TEMPLATE: configuredTemplate, VHOST_DIR: vhosts,
      CALLS: calls, CONF: conf, SCENARIO: scenario, RELOAD_MARKER: path.join(root, "reload-attempted") },
  });
  return { result, conf, vhosts, calls: existsSync(calls) ? readFileSync(calls, "utf8").trim().split("\n") : [] };
}

describe("domain vhost activation using real temporary files and service stubs", () => {
  it("uses the installed template filename, retains nginx variables and activates a new vhost", () => {
    const f = fixture({ existing: false });
    expect(f.result.status, f.result.stderr).toBe(0);
    const contents = readFileSync(f.conf, "utf8");
    expect(contents).toContain(`server_name ${hostname};`);
    expect(contents).toContain(`live/${hostname}/fullchain.pem`);
    expect(contents).toContain("proxy_set_header Host $host;");
    expect(contents).not.toContain("__HOSTNAME__");
    expect(f.calls).toEqual(["nginx-test", "nginx-test", "reload"]);
    expect(readdirSync(f.vhosts)).toEqual([`${hostname}.conf`]);
  });
  it("replaces an existing vhost only after rendering and removes temporary backups after success", () => {
    const f = fixture();
    expect(f.result.status, f.result.stderr).toBe(0);
    expect(readFileSync(f.conf, "utf8")).toContain(`server_name ${hostname};`);
    expect(readdirSync(f.vhosts)).toEqual([`${hostname}.conf`]);
  });
  it("preserves the previous vhost when the template is missing", () => {
    const f = fixture({ missing: true });
    expect(f.result.status).toBe(1);
    expect(readFileSync(f.conf, "utf8")).toBe("# Previous working vhost\n");
    expect(f.calls).toEqual(["nginx-test"]);
    expect(readdirSync(f.vhosts)).toEqual([`${hostname}.conf`]);
  });
  it("restores the previous vhost if nginx rejects the new configuration", () => {
    const f = fixture({ invalid: true });
    expect(f.result.status).toBe(1);
    expect(readFileSync(f.conf, "utf8")).toBe("# Previous working vhost\n");
    expect(f.calls).toEqual(["nginx-test", "nginx-test", "nginx-test", "reload"]);
    expect(readdirSync(f.vhosts)).toEqual([`${hostname}.conf`]);
  });
  it("removes a rejected first vhost without leaving a file that blocks later reloads", () => {
    const f = fixture({ existing: false, invalid: true });
    expect(f.result.status).toBe(1);
    expect(readdirSync(f.vhosts)).toEqual([]);
    expect(f.calls.at(-1)).toBe("reload");
  });
  it("restores and reloads the previous vhost after a reload failure", () => {
    const f = fixture({ scenario: "reload-failure" });
    expect(f.result.status).toBe(1);
    expect(readFileSync(f.conf, "utf8")).toBe("# Previous working vhost\n");
    expect(f.calls.filter(call => call === "reload")).toHaveLength(2);
    expect(readdirSync(f.vhosts)).toEqual([`${hostname}.conf`]);
  });
  it("does not change files when the existing nginx configuration is already invalid", () => {
    const f = fixture({ scenario: "baseline-failure" });
    expect(f.result.status).toBe(2);
    expect(readFileSync(f.conf, "utf8")).toBe("# Previous working vhost\n");
    expect(f.calls).toEqual(["nginx-test"]);
  });
  it("reports failed recovery without claiming activation or discarding the old configuration", () => {
    const f = fixture({ scenario: "recovery-failure" });
    expect(f.result.status).toBe(2);
    expect(f.result.stdout).toContain("Wiederanlauf muss manuell geprüft werden");
    expect(f.result.stdout).not.toContain("ACTIVATED");
    expect(readFileSync(f.conf, "utf8")).toBe("# Previous working vhost\n");
  });
});

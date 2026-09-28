// An isolated environment is built BEFORE starting any DB or application code.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createE2EServerEnvironment } from "./e2e-env.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const env = createE2EServerEnvironment();
let activeChild;
let stopping = false;

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopping = true;
    activeChild?.kill(signal);
  });
}

function run(args) {
  if (stopping) return Promise.reject(new Error("E2E-Serverstart abgebrochen."));
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: root, env, stdio: "inherit" });
    activeChild = child;
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      activeChild = undefined;
      if (code === 0) resolve();
      else reject(new Error(`E2E-Prozess beendet (${signal ?? code}).`));
    });
  });
}

try {
  await run(["scripts/e2e-ensure-db.mjs"]);
  // --force is restricted to the explicitly validated disposable database.
  await run(["node_modules/drizzle-kit/bin.cjs", "push", "--force"]);
  await run(["--import", "tsx", "server/index.ts"]);
} catch (error) {
  if (!stopping) console.error(error.message);
  process.exitCode = stopping ? 0 : 1;
}

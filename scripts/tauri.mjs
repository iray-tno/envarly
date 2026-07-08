import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { isAbsolute, join } from "node:path";

function needsAbsoluteTemp(value) {
  return !value || value.includes("%") || !isAbsolute(value);
}

function fallbackTempDir(env) {
  if (env.LOCALAPPDATA && isAbsolute(env.LOCALAPPDATA)) {
    return join(env.LOCALAPPDATA, "Temp");
  }
  if (env.USERPROFILE && isAbsolute(env.USERPROFILE)) {
    return join(env.USERPROFILE, "AppData", "Local", "Temp");
  }
  return null;
}

const env = { ...process.env };

if (process.platform === "win32" && (needsAbsoluteTemp(env.TEMP) || needsAbsoluteTemp(env.TMP))) {
  const tempDir = fallbackTempDir(env);
  if (tempDir) {
    mkdirSync(tempDir, { recursive: true });
    env.TEMP = tempDir;
    env.TMP = tempDir;
  }
}

const tauriCli = join(process.cwd(), "node_modules", "@tauri-apps", "cli", "tauri.js");

const child = spawn(process.execPath, [tauriCli, ...process.argv.slice(2)], {
  env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

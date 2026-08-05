// Drives the real, packaged Envarly app (launched with --demo, which loads
// src/demo/envarly-demo.json through a fully client-side mocked API — no
// registry writes) via Playwright connected over CDP to WebView2. This is the
// only way to reach the actual rendered UI outside Storybook (isTauri() must
// be true for demo mode to activate at all — see src/api.ts's getApi()).
//
// Produces raw, titlebar-less content screenshots into raw/. compose.mjs
// stacks the synthetic titlebar on top and writes the final assets.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const CDP_PORT = 9222;
const outDir = join(__dirname, "raw");
mkdirSync(outDir, { recursive: true });

function resolveExe() {
  const release = join(repoRoot, "src-tauri", "target", "release", "envarly.exe");
  const debug = join(repoRoot, "src-tauri", "target", "debug", "envarly.exe");
  if (existsSync(release)) return release;
  if (existsSync(debug)) return debug;
  throw new Error(
    "No envarly.exe found. Build first: npm run tauri build (or `npm run tauri dev` once, then Ctrl+C).",
  );
}

async function waitForCdp(url, timeoutMs = 20000) {
  const start = Date.now();
  let lastErr;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`CDP endpoint not ready after ${timeoutMs}ms: ${url} (${lastErr})`);
}

const exe = resolveExe();
console.log(`Launching ${exe} --demo (CDP :${CDP_PORT})`);
const child = spawn(exe, ["--demo"], {
  env: { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${CDP_PORT}` },
  stdio: "ignore",
});

try {
  await waitForCdp(`http://localhost:${CDP_PORT}/json/version`);
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`);
  const context = browser.contexts()[0];
  const page = context.pages()[0] ?? (await context.waitForEvent("page"));
  await page.waitForLoadState("domcontentloaded");
  await page.waitForSelector("li", { timeout: 20000 });

  // Select the User-scope "Path" row (there's also a System-scope "Path" row;
  // disambiguate via the sibling scope badge, which renders just "U"/"S").
  const pathUserRow = page
    .locator("li")
    .filter({ hasText: "Path" })
    .filter({ has: page.getByText("U", { exact: true }) })
    .first();
  await pathUserRow.click();
  await page.waitForTimeout(400);

  // --- State 1: default dashboard, Path (User) selected, warning banner visible ---
  await page.screenshot({ path: join(outDir, "dashboard.png") });
  console.log("captured dashboard.png");

  // Remove the known-missing PATH entry from the demo fixture, stage it, then
  // open the Apply confirmation modal in Full diff view.
  await page.getByLabel("Remove C:\\Users\\demo\\Tools\\missing-bin").click();
  await page.getByRole("button", { name: "Stage", exact: true }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /staged/i }).click();
  await page.waitForTimeout(300);
  const fullTab = page.getByRole("button", { name: "full" });
  if (await fullTab.isVisible().catch(() => false)) {
    await fullTab.click();
    await page.waitForTimeout(200);
  }

  // --- State 2: Apply confirmation modal, Full diff view ---
  await page.screenshot({ path: join(outDir, "apply-modal.png") });
  console.log("captured apply-modal.png");

  await browser.close();
} finally {
  child.kill();
}

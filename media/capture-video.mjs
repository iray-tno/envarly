// Same real-app-in---demo-mode + Playwright-over-CDP approach as capture.mjs,
// but scripted as a short interaction sequence instead of a handful of still
// states. Produces a burst-captured PNG frame sequence (dense during
// transitions, sparse during holds — full 30fps capture the whole way through
// isn't achievable over CDP round-trips, and isn't needed: most of the motion
// is the app's own CSS transitions, not continuous cursor movement) plus
// frames/manifest.json, which is the single source of truth for both frame
// timing and captions. media/remotion/Root.tsx just renders whatever this
// manifest says — edit the narrative here, not there.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const CDP_PORT = 9223; // distinct from capture.mjs's port, in case both are run close together
// Lives under remotion/public so Remotion's staticFile() can serve it directly.
const publicDir = join(__dirname, "remotion", "public");
const framesDir = join(publicDir, "frames");

rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });
copyFileSync(join(__dirname, "titlebar.png"), join(publicDir, "titlebar.png"));

function resolveExe() {
  const release = join(repoRoot, "src-tauri", "target", "release", "envarly.exe");
  const debug = join(repoRoot, "src-tauri", "target", "debug", "envarly.exe");
  if (existsSync(release)) return release;
  if (existsSync(debug)) return debug;
  throw new Error("No envarly.exe found. Build first: npm run tauri build -- --debug");
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

// --- Timeline recorder ---------------------------------------------------
const frames = [];
const captions = [];
let frameIndex = 0;

async function shot(page, holdMs) {
  const file = `${String(frameIndex).padStart(4, "0")}.png`;
  await page.screenshot({ path: join(framesDir, file) });
  frames.push({ file, holdMs });
  frameIndex++;
}

/** Capture `count` frames spaced `intervalMs` apart, to cover a transition. */
async function burst(page, count, intervalMs) {
  for (let i = 0; i < count; i++) {
    await shot(page, intervalMs);
    await page.waitForTimeout(intervalMs);
  }
}

/** Extend the most recently captured frame's on-screen duration. */
function hold(ms) {
  if (frames.length === 0) throw new Error("hold() called before any frame was captured");
  frames[frames.length - 1].holdMs += ms;
}

function totalMsSoFar() {
  return frames.reduce((sum, f) => sum + f.holdMs, 0);
}

/** Record a caption anchored to the current point in the timeline. */
function caption(text, durationMs) {
  const startMs = totalMsSoFar();
  captions.push({ text, startMs, endMs: startMs + durationMs });
}

// --- Drive the app ---------------------------------------------------------
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

  const pathUserRow = page
    .locator("li")
    .filter({ hasText: "Path" })
    .filter({ has: page.getByText("U", { exact: true }) })
    .first();

  // 1. Opening shot: default dashboard.
  await page.waitForTimeout(300);
  await shot(page, 33);
  caption("Envarly finds problems in your environment variables...", 2200);
  hold(2200);

  // 2. Select Path (User) — reveals the "1 path not found on disk" warning.
  await pathUserRow.click();
  await burst(page, 6, 80);
  caption("...like a PATH entry that doesn't exist on disk", 2200);
  hold(1600);

  // 3. Remove the missing entry.
  await page.getByLabel("Remove C:\\Users\\demo\\Tools\\missing-bin").click();
  await burst(page, 8, 70);
  caption("Fix it, then stage the change...", 1500);
  hold(500);

  // 4. Stage it.
  await page.getByRole("button", { name: "Stage", exact: true }).click();
  await burst(page, 5, 80);
  hold(700);

  // 5. Open the Apply confirmation modal (Full diff view).
  await page.getByRole("button", { name: /staged/i }).click();
  await burst(page, 10, 60);
  const fullTab = page.getByRole("button", { name: "full" });
  if (await fullTab.isVisible().catch(() => false)) {
    await fullTab.click();
    await burst(page, 4, 60);
  }
  caption("...and review exactly what will change before it's written", 3000);
  hold(2200);

  // 6. Apply.
  await page.getByRole("button", { name: /Apply \d+ change/ }).click();
  await burst(page, 10, 80);
  caption("Nothing touches the registry until you say so", 2000);
  hold(1200);

  await browser.close();

  writeFileSync(
    join(framesDir, "manifest.json"),
    JSON.stringify({ fps: 30, frames, captions }, null, 2),
  );
  console.log(`Captured ${frames.length} frames, ${(totalMsSoFar() / 1000).toFixed(1)}s total`);
} finally {
  child.kill();
}

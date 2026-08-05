// Renders a static synthetic Windows titlebar (icon + "Envarly" + min/max/close
// glyphs) to titlebar.png. This is composited onto content-only screenshots by
// compose.mjs instead of capturing the real OS window chrome, which is fragile
// across DPI/theme/window-focus. Colors match src/index.css's dark theme
// (--color-panel/--color-rim-subtle/--color-fg) so the seam with the app
// content below is invisible.
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WIDTH = 1200;
const HEIGHT = 40;

const iconBuf = readFileSync(join(__dirname, "..", "src-tauri", "icons", "icon.png"));
const iconSrc = `data:image/png;base64,${iconBuf.toString("base64")}`;

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${WIDTH}px; height: ${HEIGHT}px;
    background: #161b22;
    border-bottom: 1px solid #30363d;
    display: flex; align-items: center; justify-content: space-between;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .brand { display: flex; align-items: center; gap: 8px; padding-left: 12px; }
  .brand img { width: 16px; height: 16px; border-radius: 3px; }
  .brand span { color: #e6edf3; font-size: 13px; font-weight: 600; }
  .controls { display: flex; height: 100%; }
  .btn {
    width: 46px; height: 100%;
    display: flex; align-items: center; justify-content: center;
    color: #a6b0ba;
  }
  .btn svg { width: 10px; height: 10px; }
</style></head>
<body>
  <div class="brand"><img src="${iconSrc}"><span>Envarly</span></div>
  <div class="controls">
    <div class="btn"><svg viewBox="0 0 10 10"><line x1="0" y1="5" x2="10" y2="5" stroke="currentColor" stroke-width="1"/></svg></div>
    <div class="btn"><svg viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1"/></svg></div>
    <div class="btn"><svg viewBox="0 0 10 10"><line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" stroke-width="1"/><line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" stroke-width="1"/></svg></div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
await page.setContent(html);
await page.screenshot({ path: join(__dirname, "titlebar.png") });
await browser.close();

console.log(`titlebar.png written (${WIDTH}x${HEIGHT})`);

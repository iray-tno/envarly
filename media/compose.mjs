// Stacks titlebar.png on top of each raw content screenshot from capture.mjs
// and writes the final assets in place. Reuses Playwright itself (already a
// dependency) instead of adding a separate image-compositing library: renders
// a tiny local HTML page with the two images stacked via flex, screenshots
// that page.
import { chromium } from "playwright";
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

const titlebarSrc = toDataUri(join(__dirname, "titlebar.png"));

function toDataUri(path) {
  return `data:image/png;base64,${readFileSync(path).toString("base64")}`;
}

async function compose(page, contentPath, width, contentHeight) {
  const contentSrc = toDataUri(contentPath);
  const html = `<!doctype html><html><head><style>
    * { margin: 0; padding: 0; }
    body { width: ${width}px; }
    img { display: block; width: ${width}px; }
  </style></head><body>
    <img src="${titlebarSrc}">
    <img src="${contentSrc}">
  </body></html>`;
  await page.setViewportSize({ width, height: contentHeight + 40 });
  await page.setContent(html);
  return page.screenshot();
}

const browser = await chromium.launch();
const page = await browser.newPage();

const dashboard = await compose(page, join(__dirname, "raw", "dashboard.png"), 1200, 760);
const applyModal = await compose(page, join(__dirname, "raw", "apply-modal.png"), 1200, 760);

await browser.close();

writeFileSync(join(repoRoot, "docs", "screenshot-dark.png"), dashboard);
writeFileSync(join(repoRoot, "lp", "public", "screenshot-path-editor.png"), dashboard);
writeFileSync(join(repoRoot, "lp", "public", "screenshot-apply-modal.png"), applyModal);

console.log("Wrote docs/screenshot-dark.png");
console.log("Wrote lp/public/screenshot-path-editor.png");
console.log("Wrote lp/public/screenshot-apply-modal.png");
console.log("Final size: 1200x800");

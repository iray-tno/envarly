import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, isAbsolute, relative, resolve } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const dist = fileURLToPath(new URL("../lp/dist/", import.meta.url));
const locales = ["", "ja/", "zh-cn/", "ru/", "ko/", "vi/"];
const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".webm": "video/webm",
};
let browser;
let server;
let origin;

before(async () => {
  await readFile(resolve(dist, "index.html"));
  server = createServer(async (request, response) => {
    try {
      const path = new URL(request.url, "http://localhost").pathname;
      if (!path.startsWith("/envarly/")) {
        response.writeHead(404).end();
        return;
      }
      const file = resolve(
        dist,
        path.slice("/envarly/".length),
        path.endsWith("/") ? "index.html" : "",
      );
      const localPath = relative(dist, file);
      if (localPath.startsWith("..") || isAbsolute(localPath)) {
        response.writeHead(404).end();
        return;
      }
      const data = await readFile(file);
      response.setHeader("Content-Type", mime[extname(file)] ?? "application/octet-stream");
      response.end(data);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((done, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", done);
  });
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  if (server?.listening) await new Promise((done) => server.close(done));
});

for (const [index, locale] of locales.entries()) {
  test(`LP navigation: ${locale || "en"}`, async () => {
    const page = await browser.newPage();
    try {
      await page.route(/googletagmanager|clarity\.ms/, (route) => route.abort());
      await page.addInitScript(() => {
        window.__trackedEvents = [];
        window.gtag = (...args) => window.__trackedEvents.push(args);
      });
      const scripts = [];
      page.on("request", (request) => {
        if (request.url().startsWith(origin) && request.resourceType() === "script")
          scripts.push(request.url());
      });
      const path = `/envarly/${locale}`;
      for (const width of [320, 375, 768, 1024, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${origin}${path}`);
        assert.equal(await page.locator("astro-island").count(), 0);
        assert.equal(await page.locator("#lang-select").inputValue(), path);
        assert.equal(await page.locator("#lang-select option").count(), 6);
        assert.equal(await page.locator("header a").first().getAttribute("href"), path);
        assert.equal(await page.locator("header nav").count(), 1);
        assert.equal(await page.locator("#nav-github").isVisible(), width >= 1024);
        const layout = await page.locator("header").evaluate((header) => ({
          position: getComputedStyle(header).position,
          height: header.getBoundingClientRect().height,
          background: getComputedStyle(header).backgroundColor,
          bounds: [...header.querySelectorAll("a, select")]
            .filter((element) => element.getBoundingClientRect().width)
            .map((element) => ({
              left: element.getBoundingClientRect().left,
              right: element.getBoundingClientRect().right,
            })),
        }));
        assert.equal(layout.position, "sticky");
        assert.equal(layout.height, 57);
        assert.notEqual(layout.background, "rgba(0, 0, 0, 0)");
        for (const bound of layout.bounds) {
          assert.ok(
            bound.left >= 0 && bound.right <= width,
            `${width}px: header control outside viewport`,
          );
        }
        for (let i = 1; i < layout.bounds.length; i++) {
          assert.ok(
            layout.bounds[i - 1].right <= layout.bounds[i].left + 0.5,
            `${width}px: header controls overlap`,
          );
        }
        await page.locator("#lang-select").focus();
        await page.keyboard.press("Tab");
        assert.equal(await page.evaluate(() => document.activeElement.id), "nav-download");
        await page.evaluate(() => scrollTo(0, 500));
        assert.equal(
          await page.locator("header").evaluate((header) => header.getBoundingClientRect().top),
          0,
        );
      }
      await page.evaluate(() => {
        for (const id of ["nav-github", "nav-download"]) {
          document.getElementById(id).addEventListener("click", (event) => event.preventDefault());
        }
      });
      await page.locator("#nav-github").click();
      await page.locator("#nav-download").click();
      assert.deepEqual(await page.evaluate(() => window.__trackedEvents), [
        ["event", "github_link_click"],
        ["event", "download_click"],
      ]);
      const nextPath = `/envarly/${locales[(index + 1) % locales.length]}`;
      await Promise.all([
        page.waitForURL(`${origin}${nextPath}`),
        page.locator("#lang-select").selectOption(nextPath),
      ]);
      assert.equal(await page.locator("#lang-select").inputValue(), nextPath);
      assert.deepEqual(scripts, [], "Static navigation must not load local scripts");
    } finally {
      await page.close();
    }
  });
}

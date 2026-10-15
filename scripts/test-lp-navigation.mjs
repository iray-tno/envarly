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

async function checkFaq(page, width) {
  const faq = page.locator("#faq");
  assert.equal(await faq.locator("h2").count(), 1);
  assert.equal(await faq.locator("h3").count(), 7);
  const items = await faq.locator(":scope > div").evaluateAll((elements) =>
    elements.map((element) => ({
      id: element.id,
      question: element.querySelector("h3").textContent,
      answer: element.querySelector("p").textContent,
    })),
  );
  assert.deepEqual(
    items.map((item) => item.id),
    ["windows-editor", "path", "preview", "snapshots", "admin", "terminal", "cli"].map(
      (id) => `faq-${id}`,
    ),
  );
  for (const item of items) {
    assert.ok(item.question.trim().length);
    assert.ok(item.answer.trim().length);
  }
  const schema = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((scripts) => scripts.map((script) => JSON.parse(script.textContent)));
  assert.equal(schema.filter((entry) => entry["@type"] === "SoftwareApplication").length, 1);
  const faqs = schema.filter((entry) => entry["@type"] === "FAQPage");
  assert.equal(faqs.length, 1);
  assert.equal(faqs[0]["@context"], "https://schema.org");
  assert.equal(faqs[0].inLanguage, await page.locator("html").getAttribute("lang"));
  assert.equal(
    faqs[0]["@id"],
    `${await page.locator('link[rel="canonical"]').getAttribute("href")}#faq`,
  );
  assert.deepEqual(
    faqs[0].mainEntity,
    items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  );
  assert.equal(
    await faq.locator("pre code").innerText(),
    "envarly --help\nenvarly list --scope user",
  );
  assert.equal(
    await faq.locator("a").getAttribute("href"),
    "https://github.com/iray-tno/envarly/blob/main/README.md#cli-usage",
  );
  const bounds = await faq.locator("h2,h3,p,pre,a").evaluateAll((elements) =>
    elements.map((element) => ({
      left: element.getBoundingClientRect().left,
      right: element.getBoundingClientRect().right,
    })),
  );
  for (const bound of bounds) {
    assert.ok(bound.left >= 0 && bound.right <= width, `${width}px: FAQ outside viewport`);
  }
}

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

test("LP Open Graph image", async () => {
  const page = await browser.newPage();
  try {
    const response = await page.goto(`${origin}/envarly/og-image.png`);
    assert.equal(response.status(), 200);
    assert.equal(response.headers()["content-type"], "image/png");
    const size = await page.locator("img").evaluate(async (image) => {
      await image.decode();
      return { width: image.naturalWidth, height: image.naturalHeight };
    });
    assert.deepEqual(size, { width: 1200, height: 630 });
  } finally {
    await page.close();
  }
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
        const content = await page.locator("#features").evaluate((section) => {
          const grids = [...section.children].filter(
            (element) => getComputedStyle(element).display === "grid",
          );
          const audience = section.nextElementSibling;
          const stack = document.getElementById("stack");
          return {
            tag: section.tagName,
            headings: section.querySelectorAll("h3").length,
            cards: grids.map((grid) => grid.children.length),
            columns: grids.map(
              (grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length,
            ),
            audienceTag: audience.tagName,
            audienceHeadings: audience.querySelectorAll("h2").length,
            audienceParagraphs: audience.querySelectorAll("p").length,
            stackTag: stack.tagName,
            stackItems: stack.querySelectorAll("span").length,
            bounds: [section, audience, stack].flatMap((element) =>
              [...element.querySelectorAll("h2,h3,p,span")].map((node) => ({
                text: node.textContent.trim(),
                left: node.getBoundingClientRect().left,
                right: node.getBoundingClientRect().right,
              })),
            ),
          };
        });
        assert.equal(content.tag, "SECTION");
        assert.equal(content.headings, 12);
        assert.deepEqual(content.cards, [4, 8]);
        assert.deepEqual(content.columns, [
          width >= 1024 ? 4 : width >= 640 ? 2 : 1,
          width >= 640 ? 2 : 1,
        ]);
        assert.equal(content.audienceTag, "SECTION");
        assert.equal(content.audienceHeadings, 1);
        assert.equal(content.audienceParagraphs, 2);
        assert.equal(content.stackTag, "SECTION");
        assert.equal(content.stackItems, 5);
        await checkFaq(page, width);
        for (const bound of content.bounds) {
          assert.ok(bound.text.length, "Localized section text must not be empty");
          assert.ok(
            bound.left >= 0 && bound.right <= width,
            `${width}px: section text outside viewport: ${JSON.stringify(bound)}`,
          );
        }
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
        );
        assert.equal(await page.locator("astro-island").count(), 0);
        assert.equal(await page.locator("#lang-select").inputValue(), path);
        assert.equal(await page.locator("#lang-select option").count(), 6);
        assert.equal(await page.getByRole("combobox", { name: "Language" }).count(), 1);
        const controlCursors = await page.locator("button, select").evaluateAll((controls) =>
          controls.map((control) => ({
            id: control.id,
            cursor: getComputedStyle(control).cursor,
          })),
        );
        assert.deepEqual(
          controlCursors.map((control) => control.id),
          [
            "lang-select",
            "winget-copy",
            "carousel-prev",
            "carousel-next",
            "dot-0",
            "dot-1",
            "dot-2",
          ],
        );
        for (const control of controlCursors) {
          assert.equal(control.cursor, "pointer", `${control.id} should use the pointer cursor`);
        }
        assert.equal(await page.locator("h1").count(), 1);
        assert.equal(await page.locator("h1").innerText(), "Envarly");
        const heroType = await page
          .locator("main > section > p")
          .first()
          .evaluate((element) => {
            const style = getComputedStyle(element);
            return {
              fontSize: Number.parseFloat(style.fontSize),
              lineHeight: Number.parseFloat(style.lineHeight),
            };
          });
        assert.equal(heroType.fontSize, width >= 640 ? 20 : 18);
        assert.equal(heroType.lineHeight / heroType.fontSize, 1.625);
        assert.equal(
          await page.locator("#hero-download").getAttribute("href"),
          "https://github.com/iray-tno/envarly/releases/latest",
        );
        assert.equal(
          await page.locator("#hero-github").getAttribute("href"),
          "https://github.com/iray-tno/envarly",
        );
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
              name: element.id || element.textContent.trim(),
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
            `${width}px: header control outside viewport: ${JSON.stringify(bound)}`,
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
        for (const id of ["nav-github", "nav-download", "hero-github", "hero-download"]) {
          document.getElementById(id).addEventListener("click", (event) => event.preventDefault());
        }
      });
      await page.locator("#nav-github").click();
      await page.locator("#nav-download").click();
      await page.locator("#hero-github").click();
      await page.locator("#hero-download").click();
      await page.evaluate(() => {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async (value) => {
              window.__copiedText = value;
            },
          },
        });
      });
      const copy = page.locator("#winget-copy");
      const label = page.locator("#winget-copy-label");
      const originalLabel = await label.innerText();
      const originalWidth = await copy.evaluate((element) => element.getBoundingClientRect().width);
      await page.clock.install();
      await copy.click();
      assert.equal(
        await page.evaluate(() => window.__copiedText),
        "winget install Envarly.Envarly",
      );
      assert.equal(await label.innerText(), await copy.getAttribute("data-copied-label"));
      assert.equal(
        await copy.evaluate((element) => element.getBoundingClientRect().width),
        originalWidth,
      );
      await page.clock.fastForward(1600);
      assert.equal(await label.innerText(), originalLabel);
      const disabledCursors = await page.locator("button, select").evaluateAll((controls) =>
        controls.flatMap((control) => {
          const results = [];
          for (const attribute of ["disabled", "aria-disabled", "data-hozo-disabled"]) {
            control.setAttribute(attribute, attribute === "aria-disabled" ? "true" : "");
            results.push({ id: control.id, attribute, cursor: getComputedStyle(control).cursor });
            control.removeAttribute(attribute);
          }
          return results;
        }),
      );
      for (const control of disabledCursors) {
        assert.notEqual(
          control.cursor,
          "pointer",
          `${control.id} should not use pointer with ${control.attribute}`,
        );
      }
      assert.deepEqual(await page.evaluate(() => window.__trackedEvents), [
        ["event", "github_link_click"],
        ["event", "download_click"],
        ["event", "github_link_click"],
        ["event", "download_click"],
        ["event", "winget_copy_click"],
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

for (const locale of locales) {
  test(`LP static HTML without JavaScript: ${locale || "en"}`, async () => {
    const page = await browser.newPage({ javaScriptEnabled: false });
    try {
      const path = `/envarly/${locale}`;
      await page.goto(`${origin}${path}`);
      assert.equal(await page.locator("#lang-select").inputValue(), path);
      assert.equal(await page.getByRole("combobox", { name: "Language" }).count(), 1);
      assert.equal(await page.locator("#lang-select option").count(), 6);
      assert.equal(await page.getByRole("heading", { name: "Envarly", level: 1 }).count(), 1);
      assert.ok((await page.locator("main > section > p").first().innerText()).length);
      assert.ok((await page.locator("#hero-download").innerText()).length);
      assert.ok((await page.locator("#features h3").first().innerText()).length);
      await checkFaq(page, 1280);
      assert.equal(await page.locator("astro-island").count(), 0);
    } finally {
      await page.close();
    }
  });
}

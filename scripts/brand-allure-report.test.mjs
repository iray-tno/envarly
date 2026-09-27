import assert from "node:assert/strict";
import test from "node:test";
import { brandAllureReportHtml } from "./brand-allure-report.mjs";

const SAMPLE_ALLURE_HTML = `<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
    <meta charset="utf-8">
    <title> Envarly — Test Reports </title>
    <link rel="icon" href="favicon.ico">
</head>
<body>
    <div id="allure-app-loader"></div>
    <div id="app"></div>
    <script src="app.js"></script>
</body>
</html>`;

test("trims whitespace from title tag", () => {
  const result = brandAllureReportHtml(SAMPLE_ALLURE_HTML);
  assert.ok(result.includes("<title>Envarly — Test Reports</title>"));
  assert.ok(!result.includes("<title> Envarly — Test Reports </title>"));
});

test("injects Open Graph and meta description tags before </head>", () => {
  const result = brandAllureReportHtml(SAMPLE_ALLURE_HTML);
  assert.ok(result.includes('<meta property="og:site_name" content="Envarly" />'));
  assert.ok(result.includes('<meta property="og:title" content="Envarly — Test Reports" />'));
  assert.ok(result.includes('<meta name="description" content="CI test reports for Envarly'));
});

test("injects back-to-lp button and script before </body>", () => {
  const result = brandAllureReportHtml(SAMPLE_ALLURE_HTML);
  assert.ok(result.includes('id="envarly-back-btn"'));
  assert.ok(result.includes('href="/envarly/"'));
  assert.ok(result.includes("Back to Envarly"));
  assert.ok(result.includes("envarly-back-btn-styles"));
});

test("is idempotent when applied multiple times", () => {
  const once = brandAllureReportHtml(SAMPLE_ALLURE_HTML);
  const twice = brandAllureReportHtml(once);
  assert.equal(once, twice);
});

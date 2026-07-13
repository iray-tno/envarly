import assert from "node:assert/strict";
import test from "node:test";
import { DOMParser } from "@xmldom/xmldom";
import { normalizeJUnit } from "./normalize-junit.mjs";

function parse(xml) {
  return new DOMParser().parseFromString(xml, "application/xml");
}

test("normalizes TypeScript suites and file paths", () => {
  const normalized = normalizeJUnit(
    `<?xml version="1.0"?><testsuites name="vitest tests"><testsuite name="src/hooks/useAppInit.test.ts"><testcase classname="src\\hooks\\useAppInit.test.ts" name="useAppInit &gt; loads"/></testsuite></testsuites>`,
    "typescript",
  );
  const document = parse(normalized);
  const testcase = document.getElementsByTagName("testcase")[0];

  assert.equal(document.documentElement.getAttribute("name"), "TypeScript");
  assert.equal(testcase.parentNode.getAttribute("name"), "TypeScript");
  assert.equal(testcase.getAttribute("classname"), "hooks::useAppInit");
  assert.equal(testcase.getAttribute("name"), "useAppInit > loads");
});

test("normalizes Rust suites and module paths", () => {
  const normalized = normalizeJUnit(
    `<?xml version="1.0"?><testsuites name="nextest-run"><testsuite name="envarly"><testcase classname="envarly" name="env_store::tests::preserves_kind"><failure message="failed">details</failure></testcase></testsuite></testsuites>`,
    "rust",
  );
  const document = parse(normalized);
  const testcase = document.getElementsByTagName("testcase")[0];

  assert.equal(document.documentElement.getAttribute("name"), "Rust");
  assert.equal(testcase.parentNode.getAttribute("name"), "Rust");
  assert.equal(testcase.getAttribute("classname"), "env_store");
  assert.equal(testcase.getAttribute("name"), "preserves_kind");
  assert.equal(testcase.getElementsByTagName("failure")[0].textContent, "details");
});

test("uses a root module for tests without a module path", () => {
  const normalized = normalizeJUnit(
    `<testsuites><testsuite name="envarly"><testcase classname="envarly" name="smoke"/></testsuite></testsuites>`,
    "rust",
  );
  const testcase = parse(normalized).getElementsByTagName("testcase")[0];

  assert.equal(testcase.getAttribute("classname"), "root");
  assert.equal(testcase.getAttribute("name"), "smoke");
});

test("rejects unknown report types", () => {
  assert.throws(() => normalizeJUnit("<testsuites/>", "java"), /Unknown report type/);
});

test("rejects malformed XML", () => {
  assert.throws(
    () => normalizeJUnit("<testsuites><testsuite>", "typescript"),
    /Invalid JUnit XML|unclosed xml tag/,
  );
});

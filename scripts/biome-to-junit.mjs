import { createInterface } from 'node:readline';

const chunks = [];
const rl = createInterface({ input: process.stdin });
for await (const line of rl) chunks.push(line);

let data;
try {
  data = JSON.parse(chunks.join('\n'));
} catch {
  data = { diagnostics: [] };
}

// Biome's --json diagnostics report `location.path` as a plain string
// (e.g. "src/foo.tsx"), not `{ file: "..." }` as biome-to-junit assumed
// pre-2.x. That mismatch silently dropped every diagnostic here, so this
// always emitted "all clear" regardless of real biome check results.
function pathOf(location) {
  const path = location?.path;
  return typeof path === 'string' ? path : path?.file;
}

const diags = (data.diagnostics ?? []).filter(d => pathOf(d.location));
const failures = diags.length;
const tests = Math.max(failures, 1);

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let cases = '';
if (failures === 0) {
  cases = '    <testcase name="all clear" classname="biome" />\n';
} else {
  for (const d of diags) {
    const file = pathOf(d.location);
    const line = d.location?.start?.line ?? 1;
    const msg = d.message ?? d.description ?? 'lint violation';
    const sev = d.severity ?? 'warning';
    // d.category is biome's rule id (e.g. "lint/suspicious/noDebugger", or
    // "format" for formatting drift) — a much stabler grouping key than a
    // slice of the free-text message.
    const classname = d.category ?? msg.slice(0, 80);
    cases += `    <testcase name="${esc(file)}:${line}" classname="${esc(classname)}">\n`;
    cases += `      <failure message="${esc(msg)}" type="${esc(sev)}">${esc(msg)}\n  at ${esc(file)}:${line}</failure>\n`;
    cases += `    </testcase>\n`;
  }
}

process.stdout.write(`<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Biome" tests="${tests}" failures="${failures}">
  <testsuite name="Biome" tests="${tests}" failures="${failures}">
${cases}  </testsuite>
</testsuites>
`);

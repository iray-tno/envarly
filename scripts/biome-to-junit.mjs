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

const diags = (data.diagnostics ?? []).filter(d => d.location?.path?.file);
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
    const file = d.location.path.file;
    const line = d.location?.span?.start?.line ?? 1;
    const msg = d.description ?? 'lint violation';
    const sev = d.severity ?? 'warning';
    cases += `    <testcase name="${esc(file)}:${line}" classname="${esc(msg.slice(0, 80))}">\n`;
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

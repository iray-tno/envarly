import { createInterface } from 'node:readline';

const messages = [];
const rl = createInterface({ input: process.stdin });
for await (const line of rl) {
  try {
    const msg = JSON.parse(line);
    if (
      msg.reason === 'compiler-message' &&
      msg.message?.code?.code?.startsWith('clippy') &&
      msg.message?.spans?.length > 0
    ) {
      messages.push(msg.message);
    }
  } catch {}
}

const failures = messages.length;
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
  cases = '    <testcase name="all clear" classname="clippy" />\n';
} else {
  for (const m of messages) {
    const span = m.spans[0];
    cases += `    <testcase name="${esc(span.file_name)}:${span.line_start}" classname="${esc(m.code.code)}">\n`;
    cases += `      <failure message="${esc(m.message)}" type="${esc(m.level)}">${esc(m.message)}\n  at ${esc(span.file_name)}:${span.line_start}:${span.column_start}</failure>\n`;
    cases += `    </testcase>\n`;
  }
}

process.stdout.write(`<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Clippy" tests="${tests}" failures="${failures}">
  <testsuite name="Clippy" tests="${tests}" failures="${failures}">
${cases}  </testsuite>
</testsuites>
`);

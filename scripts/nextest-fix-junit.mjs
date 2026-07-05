// Rewrites nextest JUnit XML to use module paths as classnames.
// nextest outputs classname="envarly" (crate name) for all tests.
// This splits "env_store::tests::my_test" into classname="env_store", name="my_test",
// making Allure group tests by module instead of lumping them all under the crate name.
import { readFileSync, writeFileSync } from 'node:fs';

const filePath = process.argv[2];
if (!filePath) {
  process.stderr.write('Usage: node nextest-fix-junit.mjs <junit.xml>\n');
  process.exit(1);
}

const xml = readFileSync(filePath, 'utf8');

const fixed = xml.replace(/<testcase\b([^>]*?)(\s*\/>|>)/gs, (match, attrs, closing) => {
  const nameMatch = attrs.match(/\bname="([^"]*)"/);
  if (!nameMatch) return match;

  const parts = nameMatch[1].split('::').filter(p => p !== 'tests');
  if (parts.length <= 1) return match;

  const testName = parts[parts.length - 1];
  const classname = parts.slice(0, -1).join('::');

  const newAttrs = attrs
    .replace(/\bname="[^"]*"/, `name="${testName}"`)
    .replace(/\bclassname="[^"]*"/, `classname="${classname}"`);

  return `<testcase${newAttrs}${closing}`;
});

writeFileSync(filePath, fixed, 'utf8');

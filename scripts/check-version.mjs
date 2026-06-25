import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const tauri = JSON.parse(readFileSync(join(root, "src-tauri", "tauri.conf.json"), "utf8")).version;
const cargo = readFileSync(join(root, "src-tauri", "Cargo.toml"), "utf8")
  .match(/^version = "([^"]+)"/m)?.[1];

console.log(`package.json:      ${pkg}`);
console.log(`tauri.conf.json:   ${tauri}`);
console.log(`Cargo.toml:        ${cargo}`);

if (pkg !== tauri || pkg !== cargo) {
  console.error("\nVersion mismatch! Run: npm version <patch|minor|major>");
  process.exit(1);
}

console.log("\nAll versions match.");

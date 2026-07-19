import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const tauri = JSON.parse(readFileSync(join(root, "src-tauri", "tauri.conf.json"), "utf8")).version;
const cargo = readFileSync(join(root, "src-tauri", "Cargo.toml"), "utf8")
  .match(/^version = "([^"]+)"/m)?.[1];
const cargoLock = readFileSync(join(root, "src-tauri", "Cargo.lock"), "utf8")
  .match(/\[\[package\]\]\nname = "envarly"\nversion = "([^"]+)"/)?.[1];
const lpContent = readFileSync(join(root, "lp", "src", "lib", "lpContent.ts"), "utf8")
  .match(/export const VERSION = '([^']+)';/)?.[1];

console.log(`package.json:      ${pkg}`);
console.log(`tauri.conf.json:   ${tauri}`);
console.log(`Cargo.toml:        ${cargo}`);
console.log(`Cargo.lock:        ${cargoLock}`);
console.log(`lpContent.ts:      ${lpContent}`);

if (pkg !== tauri || pkg !== cargo || pkg !== cargoLock || pkg !== lpContent) {
  console.error("\nVersion mismatch! Run: npm version <patch|minor|major>");
  process.exit(1);
}

console.log("\nAll versions match.");

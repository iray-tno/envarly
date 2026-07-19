import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

// tauri.conf.json
const confPath = join(root, "src-tauri", "tauri.conf.json");
const conf = JSON.parse(readFileSync(confPath, "utf8"));
conf.version = version;
writeFileSync(confPath, JSON.stringify(conf, null, 2) + "\n");

// Cargo.toml — replace the first `version = "..."` line (the package version)
const cargoPath = join(root, "src-tauri", "Cargo.toml");
const cargo = readFileSync(cargoPath, "utf8").replace(
  /^version = "[^"]*"/m,
  `version = "${version}"`
);
writeFileSync(cargoPath, cargo);

// Cargo.lock — the envarly package's own (self-referential) locked version
const cargoLockPath = join(root, "src-tauri", "Cargo.lock");
const cargoLock = readFileSync(cargoLockPath, "utf8").replace(
  /(\[\[package\]\]\nname = "envarly"\nversion = ")[^"]*(")/,
  `$1${version}$2`
);
writeFileSync(cargoLockPath, cargoLock);

// Landing page version display
const lpContentPath = join(root, "lp", "src", "lib", "lpContent.ts");
const lpContent = readFileSync(lpContentPath, "utf8").replace(
  /export const VERSION = '[^']*';/,
  `export const VERSION = '${version}';`
);
writeFileSync(lpContentPath, lpContent);

console.log(
  `synced version ${version} → tauri.conf.json, Cargo.toml, Cargo.lock, lpContent.ts`
);

/**
 * Generates src/assets/oss-licenses.json from npm and Cargo dependencies.
 * Run: node scripts/gen-licenses.mjs
 */
import { execSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { createRequire } from "module";
import { resolve } from "path";

const require = createRequire(import.meta.url);
const checker = require("license-checker-rseidelsohn");
const root = resolve(import.meta.dirname, "..");

// ── npm ────────────────────────────────────────────────────────────────────

const rawNpm = await new Promise((resolve, reject) => {
  checker.init(
    {
      start: root,
      production: false,
      excludePrivatePackages: true,
      excludePackages: "envarly@0.1.0",
      fields: ["licenses", "repository", "description"],
    },
    (err, data) => (err ? reject(err) : resolve(data)),
  );
});

const npm = Object.entries(rawNpm)
  .map(([nameVer, info]) => {
    const atIdx = nameVer.lastIndexOf("@");
    const name = atIdx > 0 ? nameVer.slice(0, atIdx) : nameVer;
    const version = atIdx > 0 ? nameVer.slice(atIdx + 1) : "";
    return {
      name,
      version,
      license: Array.isArray(info.licenses) ? info.licenses.join(", ") : (info.licenses ?? "Unknown"),
      repository: info.repository ?? "",
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

// ── Cargo ──────────────────────────────────────────────────────────────────

const meta = JSON.parse(
  execSync("cargo metadata --format-version=1", {
    cwd: resolve(root, "src-tauri"),
    encoding: "utf-8",
    maxBuffer: 128 * 1024 * 1024, // cargo metadata can be large
  }),
);

// workspace member IDs to exclude (our own crate)
const workspaceIds = new Set(meta.workspace_members ?? []);

const rust = meta.packages
  .filter((p) => !workspaceIds.has(`${p.name} ${p.version} (${p.id.split(" (")[1] ?? ""}`.slice(0, -1)))
  .filter((p) => !workspaceIds.has(p.id))
  .map((p) => ({
    name: p.name,
    version: p.version,
    license: p.license ?? "Unknown",
    repository: p.repository ?? "",
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

// ── Write ──────────────────────────────────────────────────────────────────

const out = { npm, rust };
mkdirSync(resolve(root, "src/assets"), { recursive: true });
const outPath = resolve(root, "src/assets/oss-licenses.json");
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`✓ ${npm.length} npm packages, ${rust.length} Rust crates → src/assets/oss-licenses.json`);

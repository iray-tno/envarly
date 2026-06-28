import { useMemo, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { cn } from "../../lib/cn";
import licensesData from "../../assets/oss-licenses.json";

type TopTab = "envarly" | "third-party";
type Ecosystem = "npm" | "rust";

interface LicenseEntry {
  name: string;
  version: string;
  license: string;
  repository: string;
}

const ALL: Record<Ecosystem, LicenseEntry[]> = {
  npm: licensesData.npm as LicenseEntry[],
  rust: licensesData.rust as LicenseEntry[],
};

const MIT_TEXT = `MIT License

Copyright (c) 2025 iray-tno

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

const LICENSE_COLOR: Record<string, string> = {
  MIT: "text-success",
  "Apache-2.0": "text-accent",
  "ISC": "text-accent",
  "BSD-2-Clause": "text-violet",
  "BSD-3-Clause": "text-violet",
  "0BSD": "text-success",
  "CC0-1.0": "text-muted",
  "Unlicense": "text-muted",
};

function licenseColor(license: string): string {
  for (const [key, cls] of Object.entries(LICENSE_COLOR)) {
    if (license.includes(key)) return cls;
  }
  return "text-warn";
}

function RepoLink({ url }: { url: string }) {
  if (!url) return null;
  const display = url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  return (
    <button
      type="button"
      onClick={() => openUrl(url)}
      title={display}
      className="text-dim hover:text-accent transition-colors text-[11px] font-mono whitespace-nowrap focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
    >
      {display}
    </button>
  );
}

export function LicensesPanel() {
  const [tab, setTab] = useState<TopTab>("envarly");
  const [eco, setEco] = useState<Ecosystem>("npm");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return ALL[eco];
    return ALL[eco].filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.license.toLowerCase().includes(q),
    );
  }, [eco, query]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top-level tabs */}
      <div className="px-5 pt-4 pb-0 border-b border-rim shrink-0">
        <h2 className="text-sm font-semibold text-fg mb-3">Licenses</h2>
        <div className="flex gap-0.5">
          {([
            ["envarly", "Envarly"],
            ["third-party", `Third-party (${ALL.npm.length + ALL.rust.length})`],
          ] as [TopTab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 rounded-t text-xs font-medium transition-colors -mb-px border-b",
                tab === t
                  ? "bg-canvas text-fg border-canvas"
                  : "text-muted hover:bg-hover hover:text-fg border-transparent",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "envarly" ? (
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-fg">Envarly</p>
              <p className="text-xs text-dim mt-0.5">MIT License · Copyright © 2025 iray-tno</p>
            </div>
            <button
              type="button"
              onClick={() => openUrl("https://github.com/iray-tno/envarly")}
              className="text-[11px] font-mono text-dim hover:text-accent transition-colors shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              github.com/iray-tno/envarly ↗
            </button>
          </div>
          <pre className="rounded border border-rim bg-surface px-4 py-3 text-[11px] font-mono text-muted leading-relaxed whitespace-pre-wrap select-text">
            {MIT_TEXT}
          </pre>
        </div>
      ) : (
        <>
          {/* Third-party sub-header */}
          <div className="px-5 py-3 border-b border-rim-subtle shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 shrink-0">
                {(["npm", "rust"] as Ecosystem[]).map((e) => (
                  <button
                    key={e}
                    onClick={() => setEco(e)}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-mono transition-colors",
                      eco === e
                        ? "bg-surface text-fg"
                        : "text-muted hover:bg-hover hover:text-fg",
                    )}
                  >
                    {e === "npm" ? `npm (${ALL.npm.length})` : `Rust (${ALL.rust.length})`}
                  </button>
                ))}
              </div>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by name or license…"
                className="flex-1 min-w-0 rounded border border-rim bg-canvas px-3 py-1 text-xs text-fg placeholder:text-dim focus:outline-none focus:border-accent"
              />
              <span className="text-xs text-dim shrink-0">
                {filtered.length} / {ALL[eco].length}
              </span>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
            {filtered.length === 0 ? (
              <p className="px-5 py-8 text-xs text-dim text-center">No packages match "{query}"</p>
            ) : (
              <table className="text-xs border-collapse">
                <thead className="sticky top-0 bg-panel z-10">
                  <tr className="border-b border-rim text-muted uppercase text-[10px] tracking-wide">
                    <th className="px-5 py-2 text-left font-medium whitespace-nowrap">Package</th>
                    <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Version</th>
                    <th className="px-3 py-2 text-left font-medium whitespace-nowrap">License</th>
                    <th className="px-5 py-2 text-left font-medium whitespace-nowrap">Repository</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={`${p.name}@${p.version}`}
                      className="border-b border-rim-subtle last:border-0 hover:bg-hover transition-colors"
                    >
                      <td className="px-5 py-2 font-mono font-semibold text-fg whitespace-nowrap">
                        {p.name}
                      </td>
                      <td className="px-3 py-2 font-mono text-dim whitespace-nowrap">
                        {p.version}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={licenseColor(p.license)}>{p.license}</span>
                      </td>
                      <td className="px-5 py-2">
                        <RepoLink url={p.repository} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

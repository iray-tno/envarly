import { useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import licensesData from "../../assets/oss-licenses.json";

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
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="text-dim hover:text-accent transition-colors truncate text-[11px] font-mono"
    >
      {display}
    </a>
  );
}

export function LicensesPanel() {
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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-rim shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-semibold text-fg">Open Source Licenses</h2>
          <span className="text-xs text-dim ml-auto">
            {filtered.length} / {ALL[eco].length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Ecosystem tabs */}
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

          {/* Search */}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name or license…"
            className="flex-1 min-w-0 rounded border border-rim bg-canvas px-3 py-1 text-xs text-fg placeholder:text-dim focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-5 py-8 text-xs text-dim text-center">No packages match "{query}"</p>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-panel z-10">
              <tr className="border-b border-rim text-muted uppercase text-[10px] tracking-wide">
                <th className="px-5 py-2 text-left font-medium">Package</th>
                <th className="px-3 py-2 text-left font-medium">Version</th>
                <th className="px-3 py-2 text-left font-medium">License</th>
                <th className="px-5 py-2 text-left font-medium">Repository</th>
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
                  <td className="px-5 py-2 max-w-xs">
                    <RepoLink url={p.repository} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2 border-t border-rim shrink-0 text-[11px] text-dim flex items-center gap-3">
        <span>Envarly is released under the MIT License.</span>
        <a
          href="https://github.com/iray-tno/envarly"
          target="_blank"
          rel="noreferrer"
          className="ml-auto hover:text-accent transition-colors font-mono"
        >
          github.com/iray-tno/envarly ↗
        </a>
      </div>
    </div>
  );
}

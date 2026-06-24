import { useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import type { EnvVar, VarScope } from "../../types";

interface Props {
  vars: EnvVar[];
  selected: EnvVar | null;
  onSelect: (v: EnvVar) => void;
  loading: boolean;
}

const SCOPES = ["All", "User", "System"] as const;
type ScopeFilter = (typeof SCOPES)[number];

export function Sidebar({ vars, selected, onSelect, loading }: Props) {
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("All");

  const filtered = useMemo(
    () =>
      vars.filter((v) => {
        const matchScope = scopeFilter === "All" || v.scope === scopeFilter;
        const q = search.toLowerCase();
        const matchSearch =
          !q || v.name.toLowerCase().includes(q) || v.value.toLowerCase().includes(q);
        return matchScope && matchSearch;
      }),
    [vars, search, scopeFilter],
  );

  const counts: Record<VarScope, number> = {
    User: vars.filter((v) => v.scope === "User").length,
    System: vars.filter((v) => v.scope === "System").length,
  };

  return (
    <aside className="w-[300px] shrink-0 flex flex-col bg-panel border-r border-rim overflow-hidden">
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <input
          className="w-full px-3 py-2 bg-surface border border-rim rounded text-fg text-xs focus:border-accent focus:outline-none placeholder:text-dim transition-colors"
          type="text"
          placeholder="Search variables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Scope tabs */}
      <div className="flex gap-1 px-3 pb-2">
        {SCOPES.map((scope) => {
          const count =
            scope === "All" ? vars.length : counts[scope as VarScope];
          return (
            <button
              key={scope}
              onClick={() => setScopeFilter(scope)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] transition-colors",
                scopeFilter === scope
                  ? "bg-surface text-accent"
                  : "text-muted hover:bg-hover hover:text-fg",
              )}
            >
              {scope}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-hover text-dim">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Variable list */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {loading && (
          <p className="text-center text-dim text-xs py-8">Loading…</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-dim text-xs py-8">No variables found</p>
        )}
        {filtered.map((v) => {
          const isSelected =
            selected?.name === v.name && selected?.scope === v.scope;
          return (
            <button
              key={`${v.scope}:${v.name}`}
              onClick={() => onSelect(v)}
              className={cn(
                "flex items-center w-full gap-2.5 px-3 py-2 rounded text-left transition-colors",
                isSelected
                  ? "bg-surface text-fg"
                  : "text-muted hover:bg-hover hover:text-fg",
              )}
            >
              <span className="flex-1 font-mono text-[12px] truncate">{v.name}</span>
              <span
                className={cn(
                  "text-[10px] font-semibold w-4 h-4 rounded flex items-center justify-center shrink-0",
                  v.scope === "User"
                    ? "bg-accent/15 text-accent"
                    : "bg-violet/15 text-violet",
                )}
              >
                {v.scope[0]}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

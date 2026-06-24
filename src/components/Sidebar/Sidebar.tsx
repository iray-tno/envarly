import { useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import type { EnvVar, VarScope } from "../../types";
import { SegmentedControl } from "../ui/SegmentedControl";
import { TextInput } from "../ui/TextInput";

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

  const scopeOptions = SCOPES.map((s) => ({
    value: s,
    label: s,
    count: s === "All" ? vars.length : counts[s as VarScope],
  }));

  return (
    <aside className="w-[300px] shrink-0 flex flex-col bg-panel border-r border-rim overflow-hidden">
      <div className="px-3 pt-3 pb-2">
        <TextInput
          label="Search"
          labelHidden
          type="text"
          placeholder="Search variables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="px-3 pb-2">
        <SegmentedControl
          aria-label="Filter by scope"
          options={scopeOptions}
          value={scopeFilter}
          onChange={setScopeFilter}
          className="w-full [&>button]:flex-1 [&>button]:justify-center"
        />
      </div>

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
              type="button"
              onClick={() => onSelect(v)}
              className={cn(
                "flex items-center w-full gap-2.5 px-3 py-2 rounded text-left transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
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

import { useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import { resolveSecret } from "../../lib/secrets";
import type { EnvVar, VarScope } from "../../types";
import { SegmentedControl } from "../ui/SegmentedControl";
import { TextInput } from "../ui/TextInput";

interface Props {
  vars: EnvVar[];
  selected: EnvVar | null;
  onSelect: (v: EnvVar) => void;
  loading: boolean;
}

const SCOPES = ["All", "User", "System", "Secrets"] as const;
type ScopeFilter = (typeof SCOPES)[number];

export function Sidebar({ vars, selected, onSelect, loading }: Props) {
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("All");

  const filtered = useMemo(
    () =>
      vars.filter((v) => {
        if (scopeFilter === "Secrets") {
          if (!resolveSecret(v.name, v.value)) return false;
        } else if (scopeFilter !== "All") {
          if (v.scope !== scopeFilter) return false;
        }
        const q = search.toLowerCase();
        return !q || v.name.toLowerCase().includes(q) || v.value.toLowerCase().includes(q);
      }),
    [vars, search, scopeFilter],
  );

  const counts: Record<VarScope, number> = {
    User: vars.filter((v) => v.scope === "User").length,
    System: vars.filter((v) => v.scope === "System").length,
  };
  const secretCount = vars.filter((v) => resolveSecret(v.name, v.value) !== null).length;

  const scopeOptions = SCOPES.map((s) => ({
    value: s,
    label: s === "Secrets" ? "⚠ Secrets" : s,
    count: s === "All" ? vars.length : s === "Secrets" ? secretCount : counts[s as VarScope],
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

      <div className="flex-1 overflow-y-auto py-1">
        {loading && (
          <p className="text-center text-dim text-xs py-8">Loading…</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-dim text-xs py-8">No variables found</p>
        )}
        {filtered.map((v) => {
          const isSelected =
            selected?.name === v.name && selected?.scope === v.scope;
          const secret = resolveSecret(v.name, v.value);
          return (
            <button
              key={`${v.scope}:${v.name}`}
              type="button"
              onClick={() => onSelect(v)}
              className={cn(
                "flex items-center mx-2 w-[calc(100%-1rem)] gap-2 px-4 py-2 rounded text-left transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
                isSelected
                  ? "bg-surface text-fg"
                  : "text-muted hover:bg-hover hover:text-fg",
              )}
            >
              <span className="flex-1 font-mono text-sm truncate">{v.name}</span>
              {secret && (
                <span
                  title={secret.label}
                  className="text-[9px] font-medium text-warn/80 shrink-0 max-w-[44px] truncate"
                >
                  {secret.service}
                </span>
              )}
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

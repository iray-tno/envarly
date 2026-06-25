import { useCallback, useMemo, useRef, useState } from "react";
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
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
      e.preventDefault();

      const currentIdx = selected
        ? filtered.findIndex((v) => v.name === selected.name && v.scope === selected.scope)
        : -1;

      let nextIdx: number;
      if (e.key === "ArrowDown") nextIdx = currentIdx < filtered.length - 1 ? currentIdx + 1 : 0;
      else if (e.key === "ArrowUp") nextIdx = currentIdx > 0 ? currentIdx - 1 : filtered.length - 1;
      else if (e.key === "Home") nextIdx = 0;
      else nextIdx = filtered.length - 1;

      const next = filtered[nextIdx];
      if (!next) return;
      onSelect(next);
      const btn = itemRefs.current.get(`${next.scope}:${next.name}`);
      btn?.focus();
      btn?.scrollIntoView({ block: "nearest" });
    },
    [filtered, selected, onSelect],
  );

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

      <div
        role="listbox"
        aria-label="Environment variables"
        className="flex-1 overflow-y-auto py-1"
        onKeyDown={handleKeyDown}
      >
        {loading && (
          <p className="text-center text-dim text-sm py-8">Loading…</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-dim text-sm py-8">No variables found</p>
        )}
        {filtered.map((v) => {
          const key = `${v.scope}:${v.name}`;
          const isSelected = selected?.name === v.name && selected?.scope === v.scope;
          const secret = resolveSecret(v.name, v.value);
          return (
            <button
              key={key}
              ref={(el) => {
                if (el) itemRefs.current.set(key, el);
                else itemRefs.current.delete(key);
              }}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(v)}
              className={cn(
                "flex items-center mx-2 w-[calc(100%-1rem)] gap-2 px-4 py-2.5 rounded text-left transition-colors",
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

import { useCallback, useMemo, useRef, useState } from "react";
import { useI18n } from "../../hooks/useI18n";
import type { StagedChange } from "../../hooks/useStaged";
import { stagedKey } from "../../hooks/useStaged";
import { cn } from "../../lib/cn";
import { resolveSecret } from "../../lib/secrets";
import type { EnvVar, VarScope } from "../../types";
import { SegmentedControl } from "../ui/SegmentedControl";
import { TextInput } from "../ui/TextInput";

interface Props {
  vars: EnvVar[];
  selected: EnvVar | null;
  onSelect: (v: EnvVar) => void;
  onCreateNew: () => void;
  loading: boolean;
  staged: Map<string, StagedChange>;
}

const SCOPES = ["All", "User", "System"] as const;
type ScopeFilter = (typeof SCOPES)[number];

export function Sidebar({ vars, selected, onSelect, onCreateNew, loading, staged }: Props) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("All");
  const [secretsOnly, setSecretsOnly] = useState(false);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = (value: string, rowKey: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedKey(rowKey);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedKey(null), 1500);
    });
  };

  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "scope" | "staged">("name-asc");

  const filtered = useMemo(
    () =>
      vars.filter((v) => {
        if (secretsOnly && !resolveSecret(v.name, v.value)) return false;
        if (scopeFilter !== "All" && v.scope !== scopeFilter) return false;
        const q = search.toLowerCase();
        return !q || v.name.toLowerCase().includes(q) || v.value.toLowerCase().includes(q);
      }),
    [vars, search, scopeFilter, secretsOnly],
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const byName = (a: EnvVar, b: EnvVar) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    switch (sortBy) {
      case "name-asc": return arr.sort(byName);
      case "name-desc": return arr.sort((a, b) => byName(b, a));
      case "scope": return arr.sort((a, b) => a.scope.localeCompare(b.scope) || byName(a, b));
      case "staged": return arr.sort((a, b) => {
        const aS = staged.has(stagedKey(a.name, a.scope)) ? 0 : 1;
        const bS = staged.has(stagedKey(b.name, b.scope)) ? 0 : 1;
        return aS - bS || byName(a, b);
      });
    }
  }, [filtered, sortBy, staged]);

  const counts: Record<VarScope, number> = {
    User: vars.filter((v) => v.scope === "User").length,
    System: vars.filter((v) => v.scope === "System").length,
  };
  const secretCount = vars.filter((v) => resolveSecret(v.name, v.value) !== null).length;

  const scopeOptions = SCOPES.map((s) => ({
    value: s,
    label: s,
    count: s === "All" ? vars.length : counts[s as VarScope],
  }));

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
      e.preventDefault();

      const currentIdx = selected
        ? sorted.findIndex((v) => v.name === selected.name && v.scope === selected.scope)
        : -1;

      let nextIdx: number;
      if (e.key === "ArrowDown") nextIdx = currentIdx < sorted.length - 1 ? currentIdx + 1 : 0;
      else if (e.key === "ArrowUp") nextIdx = currentIdx > 0 ? currentIdx - 1 : sorted.length - 1;
      else if (e.key === "Home") nextIdx = 0;
      else nextIdx = sorted.length - 1;

      const next = sorted[nextIdx];
      if (!next) return;
      onSelect(next);
      const btn = itemRefs.current.get(`${next.scope}:${next.name}`);
      btn?.focus();
      btn?.scrollIntoView({ block: "nearest" });
    },
    [sorted, selected, onSelect],
  );

  return (
    <aside className="w-[300px] shrink-0 flex flex-col bg-panel border-r border-rim overflow-hidden">
      <div className="px-3 pt-3 pb-2">
        <TextInput
          label="Search"
          labelHidden
          type="text"
          placeholder={t("sidebar.search_placeholder")}
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

      <div className="px-3 pb-1.5 flex items-center justify-between">
        {secretCount > 0 ? (
          <button
            type="button"
            onClick={() => setSecretsOnly((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              secretsOnly
                ? "bg-warn/20 text-warn border border-warn/40"
                : "bg-warn/10 text-warn/70 border border-warn/20 hover:bg-warn/15 hover:text-warn",
            )}
          >
            <span>⚠</span>
            <span>{t("sidebar.secret", { count: secretCount })}</span>
            {secretsOnly && <span className="opacity-60">✕</span>}
          </button>
        ) : (
          <span />
        )}
        <select
          aria-label="Sort order"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="text-[10px] text-dim bg-transparent cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
        >
          <option value="name-asc">{t("sidebar.sort_name_asc")}</option>
          <option value="name-desc">{t("sidebar.sort_name_desc")}</option>
          <option value="scope">{t("sidebar.sort_scope")}</option>
          <option value="staged">{t("sidebar.sort_staged")}</option>
        </select>
      </div>

      <div
        role="listbox"
        aria-label="Environment variables"
        className="flex-1 overflow-y-auto py-1"
        onKeyDown={handleKeyDown}
      >
        {loading && (
          <p className="text-center text-dim text-sm py-8">{t("sidebar.loading")}</p>
        )}
        {!loading && sorted.length === 0 && (
          <p className="text-center text-dim text-sm py-8">{t("sidebar.empty")}</p>
        )}
        {sorted.map((v) => {
          const key = stagedKey(v.name, v.scope);
          const isSelected = selected?.name === v.name && selected?.scope === v.scope;
          const secret = resolveSecret(v.name, v.value);
          const stagedChange = staged.get(key);
          const isDelete = stagedChange?.kind === "delete";
          const isSet = stagedChange?.kind === "set";
          const isNew = isSet && stagedChange.originalValue === null;
          return (
            <div
              key={key}
              ref={(el) => {
                if (el) itemRefs.current.set(key, el);
                else itemRefs.current.delete(key);
              }}
              role="option"
              aria-selected={isSelected}
              tabIndex={-1}
              onClick={() => onSelect(v)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(v); }
              }}
              className={cn(
                "group flex items-center mx-2 w-[calc(100%-1rem)] gap-2 px-4 py-2.5 rounded text-left transition-colors cursor-pointer",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
                isSelected
                  ? "bg-surface text-fg"
                  : "text-muted hover:bg-hover hover:text-fg",
                isDelete && "opacity-50",
              )}
            >
              <span className={cn("flex-1 font-mono text-sm truncate", isDelete && "line-through")}>
                {v.name}
              </span>
              {secret && !isDelete && (
                <span
                  title={secret.label}
                  className="text-[9px] font-medium text-warn/80 shrink-0 max-w-[44px] truncate"
                >
                  {secret.service}
                </span>
              )}
              {isDelete && (
                <span className="text-[9px] font-bold text-danger shrink-0">D</span>
              )}
              {isNew && (
                <span className="text-[9px] font-bold text-success shrink-0">A</span>
              )}
              {isSet && !isNew && (
                <span className="text-[9px] font-bold text-warn shrink-0">M</span>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleCopy(v.value, key); }}
                aria-label={`Copy value of ${v.name}`}
                title="Copy value"
                className={cn(
                  "shrink-0 text-[10px] px-1 py-0.5 rounded transition-all",
                  "opacity-0 group-hover:opacity-100 focus:opacity-100",
                  copiedKey === key ? "text-success" : "text-dim hover:text-muted",
                )}
              >
                {copiedKey === key ? "✓" : "⧉"}
              </button>
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
            </div>
          );
        })}
      </div>

      {/* Footer: new variable */}
      <div className="px-3 py-2 border-t border-rim shrink-0">
        <button
          type="button"
          onClick={onCreateNew}
          className="w-full text-left text-xs text-dim hover:text-muted px-2 py-1.5 rounded hover:bg-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {t("sidebar.new_var")}
        </button>
      </div>
    </aside>
  );
}

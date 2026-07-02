import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api";
import { lintPathValue } from "../../lib/lint";
import type { EnvVar } from "../../types";
import type { ListEntry } from "../ListEditor/SortableListEditor";
import { SortableListEditor } from "../ListEditor/SortableListEditor";

export type PathEntry = ListEntry;

interface Props {
  rawValue: string;
  onChange: (newValue: string) => void;
  readOnly?: boolean;
  /** When provided, enables lint warnings for unresolvable %VAR% references. */
  allVars?: EnvVar[];
  /** Skip filesystem existence checks (e.g. for PATHEXT whose entries are extensions, not paths). */
  skipPathValidation?: boolean;
  /** Called before structural changes (drag, add, remove) so parent can snapshot state for undo. */
  onBeforeReorder?: () => void;
}

export function PathEditor({ rawValue, onChange, readOnly = false, allVars, skipPathValidation = false, onBeforeReorder }: Props) {
  const [entries, setEntries] = useState<ListEntry[]>([]);
  // Lint runs against lintedValue, which only updates on blur or when rawValue changes while not focused.
  const [lintedValue, setLintedValue] = useState(rawValue);
  const hasFocusRef = useRef(false);

  // Sync lintedValue when rawValue changes externally (e.g. variable switch) while not focused.
  useEffect(() => {
    if (!hasFocusRef.current) setLintedValue(rawValue);
  }, [rawValue]);

  // Parse rawValue → entries. Guard prevents reset when the change originated here.
  useEffect(() => {
    const current = entries.map((e) => e.value).join(";");
    if (current === rawValue) return;
    const parts = rawValue.split(";").filter((p) => p.trim().length > 0);
    // Reuse existing entry IDs to preserve DOM nodes and focus across undo operations.
    // 1. Value match  — handles drag undo (same values, reordered).
    // 2. Index match  — handles text-edit undo (same position, different value).
    const pool = entries.map((e, i) => ({ e, i, used: false }));
    setEntries(parts.map((value, i) => {
      const byVal = pool.find((p) => !p.used && p.e.value === value);
      if (byVal) { byVal.used = true; return byVal.e; }
      const byIdx = pool.find((p) => !p.used && p.i === i);
      if (byIdx) { byIdx.used = true; return { ...byIdx.e, value, exists: null }; }
      return { id: `${i}-${value}-${Date.now()}`, value, exists: null };
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawValue]);

  // Validate paths when new entries appear with exists === null.
  useEffect(() => {
    if (skipPathValidation || entries.length === 0) return;
    if (entries.every((e) => e.exists !== null && e.exists !== undefined)) return;
    let cancelled = false;
    api
      .validatePaths(entries.map((e) => e.value))
      .then((results) => {
        if (!cancelled) {
          setEntries((prev) => prev.map((e, i) => ({ ...e, exists: results[i] ?? null })));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [skipPathValidation, entries]);

  const handleEntriesChange = (next: ListEntry[]) => {
    setEntries(next);
    onChange(next.map((e) => e.value).join(";"));
  };

  const invalidCount = entries.filter((e) => e.exists === false).length;

  const { unresolvedRefs, hasWhitespace } = useMemo(() => {
    if (!allVars) return { unresolvedRefs: [], hasWhitespace: false };
    const diags = lintPathValue(lintedValue, allVars);
    return {
      unresolvedRefs: [...new Set(diags.filter((d) => d.kind === "unresolved-ref").map((d) => d.varName))],
      hasWhitespace: diags.some((d) => d.kind === "whitespace"),
    };
  }, [lintedValue, allVars]);

  return (
    <div
      className="flex flex-col gap-2"
      onFocus={() => { hasFocusRef.current = true; }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          hasFocusRef.current = false;
          setLintedValue(rawValue);
        }
      }}
    >
      {hasWhitespace && (
        <div className="px-2.5 py-1.5 rounded border border-warn/30 bg-warn/10 text-warn text-xs" role="alert">
          Some entries have leading or trailing spaces — remove them to avoid lookup failures
        </div>
      )}
      {unresolvedRefs.length > 0 && (
        <div className="px-2.5 py-1.5 rounded border border-warn/30 bg-warn/10 text-warn text-xs" role="alert">
          {unresolvedRefs.length} unresolvable {unresolvedRefs.length === 1 ? "reference" : "references"}:{" "}
          {unresolvedRefs.map((v) => `%${v}%`).join(", ")}
        </div>
      )}
      {invalidCount > 0 && (
        <div className="px-2.5 py-1.5 rounded border border-warn/30 bg-warn/10 text-warn text-xs" role="alert">
          {invalidCount} path{invalidCount > 1 ? "s" : ""} not found on disk
        </div>
      )}
      <SortableListEditor
        separator=";"
        entries={entries}
        onEntriesChange={handleEntriesChange}
        onBeforeChange={onBeforeReorder}
        readOnly={readOnly}
        addPlaceholder="Add new path…"
      />
    </div>
  );
}

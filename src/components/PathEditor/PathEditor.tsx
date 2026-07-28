import { open } from "@tauri-apps/plugin-dialog";
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
  /** Show folder picker buttons for entries. Disable for path-like lists that are not folders. */
  allowFolderBrowse?: boolean;
  /** Called before structural changes (drag, add, remove) so parent can snapshot state for undo. */
  onBeforeReorder?: () => void;
}

export function PathEditor({
  rawValue,
  onChange,
  readOnly = false,
  allVars,
  skipPathValidation = false,
  allowFolderBrowse = true,
  onBeforeReorder,
}: Props) {
  const [entries, setEntries] = useState<ListEntry[]>([]);
  // Linting operates on `lintedValue`, updated on blur or when external changes occur while unfocused.
  const [lintedValue, setLintedValue] = useState(rawValue);
  const hasFocusRef = useRef(false);

  // Synchronize `lintedValue` when `rawValue` changes externally (e.g., switching variables).
  useEffect(() => {
    if (!hasFocusRef.current) setLintedValue(rawValue);
  }, [rawValue]);

  // Parse `rawValue` into entry objects, preserving item identity across undo operations.
  useEffect(() => {
    setEntries((prev) => {
      const current = prev.map((e) => e.value).join(";");
      if (current === rawValue) return prev;
      const parts = rawValue.split(";").filter((p) => p.trim().length > 0);
      // Re-use stable IDs by matching previous values (for reordering) or indices (for text updates).
      const pool = prev.map((e, i) => ({ e, i, used: false }));
      return parts.map((value, i) => {
        const byVal = pool.find((p) => !p.used && p.e.value === value);
        if (byVal) {
          byVal.used = true;
          return byVal.e;
        }
        const byIdx = pool.find((p) => !p.used && p.i === i);
        if (byIdx) {
          byIdx.used = true;
          return { ...byIdx.e, value, exists: null };
        }
        return { id: `${i}-${value}-${Date.now()}`, value, exists: null };
      });
    });
  }, [rawValue]);

  // Asynchronously validate filesystem existence for unverified path entries.
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
    return () => {
      cancelled = true;
    };
  }, [skipPathValidation, entries]);

  const handleEntriesChange = (next: ListEntry[]) => {
    setEntries(next);
    onChange(next.map((e) => e.value).join(";"));
  };

  const handleBrowseEntry = async (entry: ListEntry) => {
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: entry.value.trim() || undefined,
    });
    return typeof selected === "string" ? selected : null;
  };

  const handleBrowseNewEntry = async (currentValue: string) => {
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: currentValue.trim() || undefined,
    });
    return typeof selected === "string" ? selected : null;
  };

  const invalidCount = entries.filter((e) => e.exists === false).length;

  const { unresolvedRefs, hasWhitespace } = useMemo(() => {
    if (!allVars) return { unresolvedRefs: [], hasWhitespace: false };
    const diags = lintPathValue(lintedValue, allVars);
    return {
      unresolvedRefs: [
        ...new Set(diags.filter((d) => d.kind === "unresolved-ref").map((d) => d.varName)),
      ],
      hasWhitespace: diags.some((d) => d.kind === "whitespace"),
    };
  }, [lintedValue, allVars]);

  return (
    <fieldset
      className="flex flex-col gap-2 min-w-0 border-0 p-0 m-0"
      onFocus={() => {
        hasFocusRef.current = true;
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          hasFocusRef.current = false;
          setLintedValue(rawValue);
        }
      }}
    >
      {hasWhitespace && (
        <div
          className="px-2 py-2 rounded border border-warn/30 bg-warn/10 text-warn text-xs"
          role="alert"
        >
          Some entries have leading or trailing spaces — remove them to avoid lookup failures
        </div>
      )}
      {unresolvedRefs.length > 0 && (
        <div
          className="px-2 py-2 rounded border border-warn/30 bg-warn/10 text-warn text-xs"
          role="alert"
        >
          {unresolvedRefs.length} unresolvable{" "}
          {unresolvedRefs.length === 1 ? "reference" : "references"}:{" "}
          {unresolvedRefs.map((v) => `%${v}%`).join(", ")}
        </div>
      )}
      {invalidCount > 0 && (
        <div
          className="px-2 py-2 rounded border border-warn/30 bg-warn/10 text-warn text-xs"
          role="alert"
        >
          {invalidCount} path{invalidCount > 1 ? "s" : ""} not found on disk
        </div>
      )}
      <SortableListEditor
        separator=";"
        entries={entries}
        onEntriesChange={handleEntriesChange}
        onBeforeChange={onBeforeReorder}
        onBrowseEntry={readOnly || !allowFolderBrowse ? undefined : handleBrowseEntry}
        onBrowseNewEntry={readOnly || !allowFolderBrowse ? undefined : handleBrowseNewEntry}
        readOnly={readOnly}
        addPlaceholder="Add new path…"
      />
    </fieldset>
  );
}

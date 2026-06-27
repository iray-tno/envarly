import { useEffect, useState } from "react";
import { api } from "../../api";
import type { ListEntry } from "../ListEditor/SortableListEditor";
import { SortableListEditor } from "../ListEditor/SortableListEditor";

export type PathEntry = ListEntry;

interface Props {
  rawValue: string;
  onChange: (newValue: string) => void;
  readOnly?: boolean;
}

export function PathEditor({ rawValue, onChange, readOnly = false }: Props) {
  const [entries, setEntries] = useState<ListEntry[]>([]);

  // Parse rawValue → entries. Guard prevents reset when the change originated here.
  useEffect(() => {
    const current = entries.map((e) => e.value).join(";");
    if (current === rawValue) return;
    const parts = rawValue.split(";").filter((p) => p.trim().length > 0);
    setEntries(parts.map((value, i) => ({ id: `${i}-${value}`, value, exists: null })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawValue]);

  // Validate paths when new entries appear with exists === null.
  useEffect(() => {
    if (entries.length === 0) return;
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
  }, [entries]);

  const handleEntriesChange = (next: ListEntry[]) => {
    setEntries(next);
    onChange(next.map((e) => e.value).join(";"));
  };

  const invalidCount = entries.filter((e) => e.exists === false).length;

  return (
    <div className="flex flex-col gap-2">
      {invalidCount > 0 && (
        <div className="px-2.5 py-1.5 rounded border border-warn/30 bg-warn/10 text-warn text-xs" role="alert">
          {invalidCount} path{invalidCount > 1 ? "s" : ""} not found on disk
        </div>
      )}
      <SortableListEditor
        separator=";"
        entries={entries}
        onEntriesChange={handleEntriesChange}
        readOnly={readOnly}
        addPlaceholder="Add new path…"
      />
    </div>
  );
}

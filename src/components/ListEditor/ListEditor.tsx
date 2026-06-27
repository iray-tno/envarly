import { useEffect, useState } from "react";
import type { ListEntry } from "./SortableListEditor";
import { SortableListEditor } from "./SortableListEditor";

interface Props {
  separator: ";" | ",";
  rawValue: string;
  onChange: (newValue: string) => void;
  readOnly?: boolean;
}

export function ListEditor({ separator, rawValue, onChange, readOnly = false }: Props) {
  const [entries, setEntries] = useState<ListEntry[]>([]);

  useEffect(() => {
    const current = entries.map((e) => e.value).join(separator);
    if (current === rawValue) return;
    const parts = rawValue.split(separator).filter((p) => p.trim().length > 0);
    setEntries(parts.map((value, i) => ({ id: `${i}-${value}`, value })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawValue, separator]);

  const handleEntriesChange = (next: ListEntry[]) => {
    setEntries(next);
    onChange(next.map((e) => e.value).join(separator));
  };

  return (
    <SortableListEditor
      separator={separator}
      entries={entries}
      onEntriesChange={handleEntriesChange}
      readOnly={readOnly}
      addPlaceholder={separator === "," ? "Add entry…" : "Add new path…"}
    />
  );
}

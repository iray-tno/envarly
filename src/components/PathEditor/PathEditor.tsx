import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import { api } from "../../api";
import { cn } from "../../lib/cn";

export interface PathEntry {
  id: string;
  value: string;
  exists: boolean | null;
}

interface SortableItemProps {
  entry: PathEntry;
  onRemove: () => void;
  onEdit: (val: string) => void;
}

function SortablePathItem({ entry, onRemove, onEdit }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.id });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.value);

  const commitEdit = () => {
    onEdit(draft);
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1.5 rounded border transition-colors",
        isDragging ? "opacity-50" : "opacity-100",
        entry.exists === false
          ? "border-danger/40 bg-danger/5"
          : "border-rim-subtle bg-surface",
      )}
    >
      <span
        {...attributes}
        {...listeners}
        className="text-dim cursor-grab active:cursor-grabbing select-none text-sm leading-none shrink-0"
      >
        ⠿
      </span>

      {editing ? (
        <input
          autoFocus
          className="flex-1 bg-transparent border-b border-accent text-fg font-mono text-[11px] px-0.5 outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") setEditing(false);
          }}
        />
      ) : (
        <span
          className="flex-1 font-mono text-[11px] text-fg truncate cursor-default"
          onDoubleClick={() => {
            setDraft(entry.value);
            setEditing(true);
          }}
          title={entry.value}
        >
          {entry.value}
          {entry.exists === false && (
            <span className="ml-1.5 text-[10px] text-danger bg-danger/10 px-1 py-0.5 rounded">
              ✗ not found
            </span>
          )}
        </span>
      )}

      <button
        onClick={onRemove}
        className="text-dim hover:text-danger text-base leading-none px-0.5 shrink-0 transition-colors"
        title="Remove"
      >
        ×
      </button>
    </div>
  );
}

interface Props {
  rawValue: string;
  onChange: (newValue: string) => void;
  readOnly?: boolean;
}

export function PathEditor({ rawValue, onChange, readOnly = false }: Props) {
  const [entries, setEntries] = useState<PathEntry[]>([]);
  const [newPath, setNewPath] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    const parts = rawValue.split(";").filter((p) => p.trim().length > 0);
    setEntries(parts.map((value, i) => ({ id: `${i}-${value}`, value, exists: null })));
  }, [rawValue]);

  // Re-validate whenever an entry's exists field is null (new/changed entries)
  useEffect(() => {
    if (entries.length === 0) return;
    if (entries.every((e) => e.exists !== null)) return;
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

  const emit = (updated: PathEntry[]) => onChange(updated.map((e) => e.value).join(";"));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setEntries((prev) => {
      const next = arrayMove(
        prev,
        prev.findIndex((e) => e.id === active.id),
        prev.findIndex((e) => e.id === over.id),
      );
      emit(next);
      return next;
    });
  };

  const removeEntry = (id: string) =>
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      emit(next);
      return next;
    });

  const editEntry = (id: string, val: string) =>
    setEntries((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, value: val } : e));
      emit(next);
      return next;
    });

  const addEntry = () => {
    if (!newPath.trim()) return;
    // exists: null triggers the validation effect
    const entry: PathEntry = { id: `new-${Date.now()}`, value: newPath.trim(), exists: null };
    setEntries((prev) => {
      const next = [...prev, entry];
      emit(next);
      return next;
    });
    setNewPath("");
  };

  const invalidCount = entries.filter((e) => e.exists === false).length;

  return (
    <div className="flex flex-col gap-1">
      {invalidCount > 0 && (
        <div className="px-2.5 py-1.5 rounded border border-warn/30 bg-warn/10 text-warn text-xs">
          {invalidCount} path{invalidCount > 1 ? "s" : ""} not found on disk
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1">
            {entries.map((entry) => (
              <SortablePathItem
                key={entry.id}
                entry={entry}
                onRemove={() => removeEntry(entry.id)}
                onEdit={(val) => editEntry(entry.id, val)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {!readOnly && (
        <div className="flex gap-2 mt-1">
          <input
            className="flex-1 px-2.5 py-1.5 bg-surface border border-rim rounded font-mono text-xs text-fg placeholder:text-dim focus:border-accent focus:outline-none transition-colors"
            placeholder="Add new path…"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEntry()}
          />
          <button
            onClick={addEntry}
            className="px-3 py-1.5 rounded bg-accent text-canvas text-xs font-medium hover:bg-accent-hi transition-colors"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

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
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";

export interface PathEntry {
  id: string;
  value: string;
  exists: boolean | null;
}

interface PathRowProps {
  entry: PathEntry;
  onRemove: () => void;
  onEdit: (val: string) => void;
}

function SortablePathRow({ entry, onRemove, onEdit }: PathRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center border-b border-rim-subtle last:border-0 transition-colors",
        isDragging ? "opacity-50 bg-hover" : "bg-canvas",
        entry.exists === false && "bg-danger/5",
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        title="Drag to reorder"
        className={cn(
          "w-8 flex items-center justify-center shrink-0 self-stretch text-dim",
          "cursor-grab active:cursor-grabbing select-none",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
        )}
      >
        ⠿
      </button>

      {/* Path input */}
      <div className="flex-1 py-1.5 pr-2">
        <input
          aria-label={`Path entry: ${entry.value}`}
          value={entry.value}
          onChange={(e) => onEdit(e.target.value)}
          spellCheck={false}
          className="w-full bg-transparent font-mono text-[11px] text-fg focus:outline-none"
        />
      </div>

      {/* Status */}
      <div className="w-6 flex items-center justify-center shrink-0 text-xs">
        {entry.exists === false && (
          <span
            aria-hidden="true"
            title="Not found on disk"
            className="text-danger leading-none"
          >
            ✗
          </span>
        )}
        {entry.exists === true && (
          <span
            aria-hidden="true"
            title="Path exists"
            className="text-success leading-none"
          >
            ✓
          </span>
        )}
      </div>

      {/* Remove */}
      <div className="w-7 flex items-center justify-center shrink-0">
        <IconButton
          icon="×"
          aria-label={`Remove ${entry.value}`}
          variant="danger"
          onClick={onRemove}
        />
      </div>
    </li>
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
    return () => {
      cancelled = true;
    };
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
      const next = prev.map((e) => (e.id === id ? { ...e, value: val, exists: null } : e));
      emit(next);
      return next;
    });

  const addEntry = () => {
    if (!newPath.trim()) return;
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
    <div className="flex flex-col gap-2">
      {invalidCount > 0 && (
        <div className="px-2.5 py-1.5 rounded border border-warn/30 bg-warn/10 text-warn text-xs" role="alert">
          {invalidCount} path{invalidCount > 1 ? "s" : ""} not found on disk
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <ol
            aria-label="PATH entries"
            className="border border-rim rounded overflow-hidden"
          >
            {entries.map((entry) => (
              <SortablePathRow
                key={entry.id}
                entry={entry}
                onRemove={() => removeEntry(entry.id)}
                onEdit={(val) => editEntry(entry.id, val)}
              />
            ))}
            {entries.length === 0 && (
              <li className="px-4 py-3 text-xs text-dim text-center">No entries</li>
            )}
          </ol>
        </SortableContext>
      </DndContext>

      {!readOnly && (
        <div className="flex gap-2">
          <input
            aria-label="New path entry"
            className={cn(
              "flex-1 px-2.5 py-1.5 bg-surface border border-rim rounded font-mono text-xs text-fg",
              "placeholder:text-dim transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas focus:border-accent",
            )}
            placeholder="Add new path…"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEntry()}
          />
          <Button variant="primary" onClick={addEntry}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
}

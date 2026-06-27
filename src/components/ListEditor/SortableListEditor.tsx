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
import { useState } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";

export interface ListEntry {
  id: string;
  value: string;
  /** Optional: true = exists on disk, false = missing, null/undefined = unchecked */
  exists?: boolean | null;
}

interface RowProps {
  entry: ListEntry;
  onRemove: () => void;
  onEdit: (val: string) => void;
}

function SortableRow({ entry, onRemove, onEdit }: RowProps) {
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

      <div className="flex-1 py-1.5 pr-2">
        <input
          aria-label={`Entry: ${entry.value}`}
          value={entry.value}
          onChange={(e) => onEdit(e.target.value)}
          spellCheck={false}
          className="w-full bg-transparent font-mono text-[11px] text-fg focus:outline-none"
        />
      </div>

      {entry.exists !== undefined && (
        <div className="w-6 flex items-center justify-center shrink-0 text-xs">
          {entry.exists === false && (
            <span aria-hidden="true" title="Not found on disk" className="text-danger leading-none">✗</span>
          )}
          {entry.exists === true && (
            <span aria-hidden="true" title="Exists" className="text-success leading-none">✓</span>
          )}
        </div>
      )}

      <div className="w-7 flex items-center justify-center shrink-0">
        <IconButton icon="×" aria-label={`Remove ${entry.value}`} variant="danger" onClick={onRemove} />
      </div>
    </li>
  );
}

interface Props {
  separator: ";" | ",";
  entries: ListEntry[];
  onEntriesChange: (entries: ListEntry[]) => void;
  readOnly?: boolean;
  addPlaceholder?: string;
}

export function SortableListEditor({
  separator,
  entries,
  onEntriesChange,
  readOnly = false,
  addPlaceholder = "Add entry…",
}: Props) {
  const [newValue, setNewValue] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const next = arrayMove(
      entries,
      entries.findIndex((e) => e.id === active.id),
      entries.findIndex((e) => e.id === over.id),
    );
    onEntriesChange(next);
  };

  const removeEntry = (id: string) =>
    onEntriesChange(entries.filter((e) => e.id !== id));

  const editEntry = (id: string, val: string) =>
    onEntriesChange(entries.map((e) => (e.id === id ? { ...e, value: val, exists: null } : e)));

  const addEntry = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const parts = trimmed.split(separator).map((s) => s.trim()).filter(Boolean);
    const newEntries = parts.map((value) => ({ id: `new-${Date.now()}-${value}`, value, exists: null }));
    onEntriesChange([...entries, ...newEntries]);
    setNewValue("");
  };

  /** Smart paste: if pasted text contains the separator, split into multiple entries. */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (!text.includes(separator)) return;
    e.preventDefault();
    addEntry(text);
  };

  return (
    <div className="flex flex-col gap-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <ol aria-label="List entries" className="border border-rim rounded overflow-hidden">
            {entries.map((entry) => (
              <SortableRow
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
            aria-label="New entry"
            className={cn(
              "flex-1 px-2.5 py-1.5 bg-surface border border-rim rounded font-mono text-xs text-fg",
              "placeholder:text-dim transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas focus:border-accent",
            )}
            placeholder={addPlaceholder}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEntry(newValue)}
            onPaste={handlePaste}
          />
          <Button variant="primary" onClick={() => addEntry(newValue)}>Add</Button>
        </div>
      )}
    </div>
  );
}

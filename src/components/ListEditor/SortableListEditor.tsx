import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";

export interface ListEntry {
  id: string;
  value: string;
  /** Optional: true = exists on disk, false = missing, null/undefined = unchecked */
  exists?: boolean | null;
}

interface RowProps {
  index: number;
  entry: ListEntry;
  inputRef: (el: HTMLInputElement | null) => void;
  readOnly: boolean;
  onRemove: () => void;
  onEdit: (val: string) => void;
  onBrowse?: () => void;
  onFocusEntry: (index: number) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SortableRow({
  index,
  entry,
  inputRef,
  readOnly,
  onRemove,
  onEdit,
  onBrowse,
  onFocusEntry,
  onMoveUp,
  onMoveDown,
}: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center border-b border-rim-subtle last:border-0 transition-colors",
        "focus-within:ring-2 focus-within:ring-accent focus-within:ring-inset",
        isDragging ? "opacity-50 bg-hover" : "bg-canvas",
        entry.exists === false && "bg-danger/5",
      )}
    >
      <button
        type="button"
        {...(readOnly ? {} : attributes)}
        {...(readOnly ? {} : listeners)}
        aria-label="Drag to reorder"
        title="Drag to reorder"
        disabled={readOnly}
        className={cn(
          "w-8 flex items-center justify-center shrink-0 self-stretch text-dim",
          readOnly ? "cursor-default opacity-40" : "cursor-grab active:cursor-grabbing",
          "select-none",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
        )}
      >
        <Icon name="grip" size={16} />
      </button>

      <div className="flex-1 py-1.5 pr-2">
        <input
          ref={inputRef}
          aria-label={`Entry: ${entry.value}`}
          value={entry.value}
          onChange={(e) => onEdit(e.target.value)}
          onKeyDown={(e) => {
            if (readOnly) return;
            if (e.altKey && e.key === "ArrowUp") {
              e.preventDefault();
              onMoveUp();
              return;
            }
            if (e.altKey && e.key === "ArrowDown") {
              e.preventDefault();
              onMoveDown();
              return;
            }
            if (!e.altKey && e.key === "ArrowUp") {
              e.preventDefault();
              onFocusEntry(index - 1);
            }
            if (!e.altKey && e.key === "ArrowDown") {
              e.preventDefault();
              onFocusEntry(index + 1);
            }
          }}
          readOnly={readOnly}
          spellCheck={false}
          title="Alt+↑/↓ to reorder"
          className={cn(
            "w-full bg-transparent font-mono text-[11px] text-fg focus:outline-none",
            readOnly && "cursor-default",
          )}
        />
      </div>

      {entry.exists !== undefined && (
        <div className="w-6 flex items-center justify-center shrink-0 text-xs">
          {entry.exists === false && (
            <span title="Not found on disk">
              <Icon name="x" size={14} className="text-danger" />
            </span>
          )}
          {entry.exists === true && (
            <span title="Exists">
              <Icon name="check" size={14} className="text-success" />
            </span>
          )}
        </div>
      )}

      {onBrowse && (
        <div className="w-7 flex items-center justify-center shrink-0">
          <IconButton
            icon="folder"
            aria-label={`Browse folder for ${entry.value}`}
            title="Browse for folder"
            onClick={onBrowse}
          />
        </div>
      )}

      {!readOnly && (
        <div className="w-7 flex items-center justify-center shrink-0">
          <IconButton
            icon="x"
            aria-label={`Remove ${entry.value}`}
            variant="danger"
            onClick={onRemove}
          />
        </div>
      )}
    </li>
  );
}

interface Props {
  separator: ";" | ",";
  entries: ListEntry[];
  onEntriesChange: (entries: ListEntry[]) => void;
  /** Called before structural changes (drag, remove, add) so callers can snapshot state. */
  onBeforeChange?: () => void;
  onBrowseEntry?: (entry: ListEntry) => Promise<string | null>;
  onBrowseNewEntry?: (currentValue: string) => Promise<string | null>;
  readOnly?: boolean;
  addPlaceholder?: string;
}

export function SortableListEditor({
  separator,
  entries,
  onEntriesChange,
  onBeforeChange,
  onBrowseEntry,
  onBrowseNewEntry,
  readOnly = false,
  addPlaceholder = "Add entry…",
}: Props) {
  const [newValue, setNewValue] = useState("");
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const dupCount = useMemo(() => {
    const seen = new Set<string>();
    let count = 0;
    for (const e of entries) {
      const key = e.value.toLowerCase().trim();
      if (key === "") continue;
      if (seen.has(key)) count++;
      else seen.add(key);
    }
    return count;
  }, [entries]);

  const handleDedup = () => {
    if (readOnly) return;
    onBeforeChange?.();
    const seen = new Set<string>();
    onEntriesChange(
      entries.filter((e) => {
        const key = e.value.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (readOnly) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onBeforeChange?.();
    const next = arrayMove(
      entries,
      entries.findIndex((e) => e.id === active.id),
      entries.findIndex((e) => e.id === over.id),
    );
    onEntriesChange(next);
  };

  const removeEntry = (id: string) => {
    if (readOnly) return;
    onBeforeChange?.();
    onEntriesChange(entries.filter((e) => e.id !== id));
  };

  const editEntry = (id: string, val: string) => {
    if (readOnly) return;
    onEntriesChange(entries.map((e) => (e.id === id ? { ...e, value: val, exists: null } : e)));
  };

  const browseEntry = async (entry: ListEntry) => {
    if (readOnly) return;
    if (!onBrowseEntry) return;
    const selected = await onBrowseEntry(entry);
    if (selected === null) return;
    editEntry(entry.id, selected);
  };

  const browseNewEntry = async () => {
    if (readOnly) return;
    if (!onBrowseNewEntry) return;
    const selected = await onBrowseNewEntry(newValue);
    if (selected === null) return;
    addEntry(selected);
  };

  const focusEntry = (index: number) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const moveEntry = (id: string, dir: -1 | 1) => {
    if (readOnly) return;
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) return;
    const next = idx + dir;
    if (next < 0 || next >= entries.length) return;
    onBeforeChange?.();
    onEntriesChange(arrayMove(entries, idx, next));
  };

  const addEntry = (raw: string) => {
    if (readOnly) return;
    const trimmed = raw.trim();
    if (!trimmed) return;
    onBeforeChange?.();
    const parts = trimmed
      .split(separator)
      .map((s) => s.trim())
      .filter(Boolean);
    const newEntries = parts.map((value) => ({
      id: `new-${Date.now()}-${value}`,
      value,
      exists: null,
    }));
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
      {!readOnly && dupCount > 0 && (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded border border-warn/30 bg-warn/10 text-warn text-xs">
          <span>
            {dupCount} duplicate {dupCount === 1 ? "entry" : "entries"}
          </span>
          <Button variant="link" size="xs" onClick={handleDedup}>
            Remove
          </Button>
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <ol aria-label="List entries" className="border border-rim rounded overflow-hidden">
            {entries.map((entry, index) => (
              <SortableRow
                key={entry.id}
                index={index}
                entry={entry}
                inputRef={(el) => {
                  inputRefs.current[index] = el;
                }}
                readOnly={readOnly}
                onRemove={() => removeEntry(entry.id)}
                onEdit={(val) => editEntry(entry.id, val)}
                onBrowse={onBrowseEntry ? () => void browseEntry(entry) : undefined}
                onFocusEntry={focusEntry}
                onMoveUp={() => moveEntry(entry.id, -1)}
                onMoveDown={() => moveEntry(entry.id, 1)}
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
          <div className="relative flex-1">
            <input
              aria-label="New entry"
              className={cn(
                "w-full px-2.5 py-1.5 bg-surface border border-rim rounded font-mono text-xs text-fg",
                onBrowseNewEntry && "pr-9",
                "placeholder:text-muted transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas focus:border-accent",
              )}
              placeholder={addPlaceholder}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEntry(newValue)}
              onPaste={handlePaste}
            />
            {onBrowseNewEntry && (
              <IconButton
                icon="folder"
                aria-label="Browse folder to add"
                title="Browse folder to add"
                onClick={() => void browseNewEntry()}
                className="absolute right-1 top-1/2 -translate-y-1/2 size-6"
              />
            )}
          </div>
          <Button variant="primary" icon="plus" onClick={() => addEntry(newValue)}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
}

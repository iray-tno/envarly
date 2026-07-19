import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
import { useSortableListEditor } from "./useSortableListEditor";

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
  rowRef: (el: HTMLLIElement | null) => void;
  keyboardOffset?: number;
  readOnly: boolean;
  onRemove: () => void;
  onEdit: (val: string) => void;
  onBrowse?: () => void;
  onFocusEntry: (index: number) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  reducedMotion: boolean;
}

function SortableRow({
  index,
  entry,
  inputRef,
  rowRef,
  keyboardOffset,
  readOnly,
  onRemove,
  onEdit,
  onBrowse,
  onFocusEntry,
  onMoveUp,
  onMoveDown,
  reducedMotion,
}: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
    transition: reducedMotion
      ? null
      : {
          duration: 160,
          easing: "cubic-bezier(0.2, 0, 0, 1)",
        },
  });

  return (
    <li
      ref={(el) => {
        setNodeRef(el);
        rowRef(el);
      }}
      style={{
        transform:
          keyboardOffset === undefined
            ? CSS.Transform.toString(transform)
            : `translateY(${keyboardOffset}px)`,
        transition:
          keyboardOffset === undefined
            ? transition
            : keyboardOffset === 0
              ? "transform 160ms cubic-bezier(0.2, 0, 0, 1)"
              : "none",
      }}
      className={cn(
        "motion-sortable-row flex items-center border-b border-rim-subtle last:border-0 transition-colors",
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

      <div className="flex-1 py-2 pr-2">
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
  const {
    newValue,
    setNewValue,
    inputRefs,
    rowRefs,
    keyboardOffsets,
    dupCount,
    reducedMotion,
    handleDedup,
    handleDragEnd,
    removeEntry,
    editEntry,
    browseEntry,
    browseNewEntry,
    focusEntry,
    moveEntry,
    addEntry,
    handlePaste,
  } = useSortableListEditor({
    separator,
    entries,
    onEntriesChange,
    onBeforeChange,
    onBrowseEntry,
    onBrowseNewEntry,
    readOnly,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  return (
    <div className="flex flex-col gap-2">
      {!readOnly && dupCount > 0 && (
        <div className="flex items-center justify-between px-2 py-2 rounded border border-warn/30 bg-warn/10 text-warn text-xs">
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
                rowRef={(el) => {
                  if (el) rowRefs.current.set(entry.id, el);
                  else rowRefs.current.delete(entry.id);
                }}
                keyboardOffset={keyboardOffsets.get(entry.id)}
                readOnly={readOnly}
                onRemove={() => removeEntry(entry.id)}
                onEdit={(val) => editEntry(entry.id, val)}
                onBrowse={onBrowseEntry ? () => void browseEntry(entry) : undefined}
                onFocusEntry={focusEntry}
                onMoveUp={() => moveEntry(entry.id, -1)}
                onMoveDown={() => moveEntry(entry.id, 1)}
                reducedMotion={reducedMotion}
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
          <div className="relative flex flex-1">
            <input
              aria-label="New entry"
              className={cn(
                "h-full min-h-10 w-full px-2 py-2 bg-surface border border-rim rounded font-mono text-xs text-fg",
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
                className="absolute right-1.5 top-1/2 -translate-y-1/2"
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

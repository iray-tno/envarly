import React, { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api';

interface PathEntry {
  id: string;
  value: string;
  exists: boolean | null;
}

interface Props {
  rawValue: string;
  onChange: (newValue: string) => void;
  disabled?: boolean;
}

function SortablePathItem({
  entry,
  onRemove,
  onEdit,
}: {
  entry: PathEntry;
  onRemove: () => void;
  onEdit: (val: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.value);

  const commitEdit = () => {
    onEdit(draft);
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`path-entry ${entry.exists === false ? 'path-entry--invalid' : ''}`}
    >
      <span className="path-drag-handle" {...attributes} {...listeners}>
        ⠿
      </span>
      {editing ? (
        <input
          className="path-entry-input"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      ) : (
        <span
          className="path-entry-value"
          onDoubleClick={() => {
            setDraft(entry.value);
            setEditing(true);
          }}
          title={entry.exists === false ? 'Path does not exist' : entry.value}
        >
          {entry.value}
          {entry.exists === false && (
            <span className="path-entry-badge path-entry-badge--invalid">✗ not found</span>
          )}
        </span>
      )}
      <button className="path-entry-remove" onClick={onRemove} title="Remove">
        ×
      </button>
    </div>
  );
}

export function PathEditor({ rawValue, onChange, disabled }: Props) {
  const [entries, setEntries] = useState<PathEntry[]>([]);
  const [newPath, setNewPath] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Parse raw PATH into entries
  useEffect(() => {
    const parts = rawValue.split(';').filter((p) => p.trim().length > 0);
    setEntries(
      parts.map((value, i) => ({ id: `${i}-${value}`, value, exists: null })),
    );
  }, [rawValue]);

  // Validate paths after entries change
  useEffect(() => {
    if (entries.length === 0) return;
    const paths = entries.map((e) => e.value);
    api.validatePaths(paths).then((results) => {
      setEntries((prev) =>
        prev.map((e, i) => ({ ...e, exists: results[i] ?? null })),
      );
    });
  }, [entries.map((e) => e.value).join(';')]);

  const emit = (updated: PathEntry[]) => {
    onChange(updated.map((e) => e.value).join(';'));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setEntries((prev) => {
      const oldIdx = prev.findIndex((e) => e.id === active.id);
      const newIdx = prev.findIndex((e) => e.id === over.id);
      const next = arrayMove(prev, oldIdx, newIdx);
      emit(next);
      return next;
    });
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      emit(next);
      return next;
    });
  };

  const editEntry = (id: string, val: string) => {
    setEntries((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, value: val } : e));
      emit(next);
      return next;
    });
  };

  const addEntry = () => {
    if (!newPath.trim()) return;
    const entry: PathEntry = {
      id: `new-${Date.now()}`,
      value: newPath.trim(),
      exists: null,
    };
    setEntries((prev) => {
      const next = [...prev, entry];
      emit(next);
      return next;
    });
    setNewPath('');
  };

  const invalidCount = entries.filter((e) => e.exists === false).length;

  return (
    <div className="path-editor">
      {invalidCount > 0 && (
        <div className="path-editor-warning">
          {invalidCount} path{invalidCount > 1 ? 's' : ''} not found on disk
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={entries.map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          {entries.map((entry) => (
            <SortablePathItem
              key={entry.id}
              entry={entry}
              onRemove={() => removeEntry(entry.id)}
              onEdit={(val) => editEntry(entry.id, val)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {!disabled && (
        <div className="path-add-row">
          <input
            className="path-add-input"
            placeholder="Add new path..."
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addEntry()}
          />
          <button className="btn btn--primary" onClick={addEntry}>
            Add
          </button>
        </div>
      )}
    </div>
  );
}

import { type DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import type { ListEntry } from "./SortableListEditor";

interface Options {
  separator: ";" | ",";
  entries: ListEntry[];
  onEntriesChange: (entries: ListEntry[]) => void;
  onBeforeChange?: () => void;
  onBrowseEntry?: (entry: ListEntry) => Promise<string | null>;
  onBrowseNewEntry?: (currentValue: string) => Promise<string | null>;
  readOnly: boolean;
}

export function useSortableListEditor({
  separator,
  entries,
  onEntriesChange,
  onBeforeChange,
  onBrowseEntry,
  onBrowseNewEntry,
  readOnly,
}: Options) {
  const [newValue, setNewValue] = useState("");
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const keyboardLayoutRef = useRef<Map<string, number> | null>(null);
  const [keyboardOffsets, setKeyboardOffsets] = useState(new Map<string, number>());
  const keyboardFrameRef = useRef<number | null>(null);
  const keyboardTimerRef = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const previousLayout = keyboardLayoutRef.current;
    keyboardLayoutRef.current = null;
    if (!previousLayout || reducedMotion) return;

    const offsets = new Map<string, number>();
    for (const entry of entries) {
      const row = rowRefs.current.get(entry.id);
      const previousTop = previousLayout.get(entry.id);
      if (!row || previousTop === undefined) continue;
      const offset = previousTop - row.getBoundingClientRect().top;
      if (offset !== 0) offsets.set(entry.id, offset);
    }

    if (offsets.size === 0) return;
    if (keyboardFrameRef.current !== null) cancelAnimationFrame(keyboardFrameRef.current);
    if (keyboardTimerRef.current !== null) window.clearTimeout(keyboardTimerRef.current);

    setKeyboardOffsets(offsets);
    keyboardFrameRef.current = requestAnimationFrame(() => {
      setKeyboardOffsets(new Map([...offsets.keys()].map((id) => [id, 0])));
      keyboardTimerRef.current = window.setTimeout(() => {
        setKeyboardOffsets(new Map());
        keyboardTimerRef.current = null;
      }, 160);
      keyboardFrameRef.current = null;
    });
  }, [entries, reducedMotion]);

  useLayoutEffect(
    () => () => {
      if (keyboardFrameRef.current !== null) cancelAnimationFrame(keyboardFrameRef.current);
      if (keyboardTimerRef.current !== null) window.clearTimeout(keyboardTimerRef.current);
    },
    [],
  );

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

  const handleDragEnd = (event: DragEndEvent) => {
    if (readOnly) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onBeforeChange?.();
    onEntriesChange(
      arrayMove(
        entries,
        entries.findIndex((e) => e.id === active.id),
        entries.findIndex((e) => e.id === over.id),
      ),
    );
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
    if (readOnly || !onBrowseEntry) return;
    const selected = await onBrowseEntry(entry);
    if (selected !== null) editEntry(entry.id, selected);
  };

  const browseNewEntry = async () => {
    if (readOnly || !onBrowseNewEntry) return;
    const selected = await onBrowseNewEntry(newValue);
    if (selected !== null) addEntry(selected);
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
    keyboardLayoutRef.current = reducedMotion
      ? null
      : new Map(
          entries.flatMap((entry) => {
            const row = rowRefs.current.get(entry.id);
            return row ? [[entry.id, row.getBoundingClientRect().top] as const] : [];
          }),
        );
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
    onEntriesChange([
      ...entries,
      ...parts.map((value) => ({ id: `new-${Date.now()}-${value}`, value, exists: null })),
    ]);
    setNewValue("");
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (!text.includes(separator)) return;
    e.preventDefault();
    addEntry(text);
  };

  return {
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
  };
}

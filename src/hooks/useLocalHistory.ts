import { useCallback, useEffect, useRef, useState } from "react";

interface UseLocalHistoryResult {
  value: string;
  dirty: boolean;
  onChange: (newVal: string) => void;
  discard: () => void;
  onBeforeStructuralChange: () => void;
  reset: (newValue: string) => void;
}

/**
 * Manages a local edit history for a single string value.
 * Tracks two kinds of changes:
 *   - Structural (drag/add/remove): pushed as checkpoints via onBeforeStructuralChange → onChange.
 *   - Text edits: live, no checkpoint. Discard reverts to the last checkpoint or original.
 */
export function useLocalHistory(originalValue: string): UseLocalHistoryResult {
  const [value, setValue] = useState(originalValue);
  const [dirty, setDirty] = useState(false);
  const localHistory = useRef<string[]>([]);
  const valueRef = useRef(originalValue);
  const structuralChangeRef = useRef(false);
  const preOpValueRef = useRef("");

  useEffect(() => {
    setValue(originalValue);
    valueRef.current = originalValue;
    setDirty(false);
    localHistory.current = [];
  }, [originalValue]);

  const onChange = useCallback((newVal: string) => {
    if (structuralChangeRef.current) {
      const preOp = preOpValueRef.current;
      const top = localHistory.current[localHistory.current.length - 1];
      const next = [...localHistory.current];
      if (preOp !== originalValue && preOp !== top) next.push(preOp);
      next.push(newVal);
      localHistory.current = next;
      structuralChangeRef.current = false;
    }
    setValue(newVal);
    valueRef.current = newVal;
    setDirty(newVal !== originalValue);
  }, [originalValue]);

  const discard = useCallback(() => {
    const current = valueRef.current;
    if (localHistory.current.length === 0) {
      setValue(originalValue);
      valueRef.current = originalValue;
      setDirty(false);
      return;
    }
    const lastCheckpoint = localHistory.current[localHistory.current.length - 1];
    if (current !== lastCheckpoint) {
      setValue(lastCheckpoint);
      valueRef.current = lastCheckpoint;
      setDirty(lastCheckpoint !== originalValue);
    } else {
      localHistory.current = localHistory.current.slice(0, -1);
      const prev = localHistory.current.length > 0
        ? localHistory.current[localHistory.current.length - 1]
        : originalValue;
      setValue(prev);
      valueRef.current = prev;
      setDirty(prev !== originalValue);
    }
  }, [originalValue]);

  const onBeforeStructuralChange = useCallback(() => {
    structuralChangeRef.current = true;
    preOpValueRef.current = valueRef.current;
  }, []);

  const reset = useCallback((newValue: string) => {
    setValue(newValue);
    valueRef.current = newValue;
    setDirty(newValue !== originalValue);
    localHistory.current = [];
  }, [originalValue]);

  return { value, dirty, onChange, discard, onBeforeStructuralChange, reset };
}

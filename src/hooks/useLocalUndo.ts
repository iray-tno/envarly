import { useCallback, useRef } from "react";

export function useLocalUndo() {
  const localUndoRef = useRef<(() => void) | null>(null);
  const handleRegisterLocalUndo = useCallback((fn: (() => void) | null) => {
    localUndoRef.current = fn;
  }, []);
  return { localUndoRef, handleRegisterLocalUndo };
}

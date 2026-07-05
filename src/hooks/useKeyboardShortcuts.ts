import { useEffect } from "react";
import type { RefObject } from "react";

export function useKeyboardShortcuts(
  undo: () => void,
  redo: () => void,
  localUndoRef: RefObject<(() => void) | null>,
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      if (e.key === "z" && !e.shiftKey && localUndoRef.current) {
        e.preventDefault();
        localUndoRef.current();
        return;
      }
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === "y" || (e.key === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);
}

import { createContext, useContext, type ReactNode } from "react";
import { useUndoStack, type Command } from "../hooks/useUndoStack";

export type { Command };

interface UndoContextValue {
  push: (cmd: Command) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const UndoContext = createContext<UndoContextValue | null>(null);

export function UndoProvider({ children }: { children: ReactNode }) {
  const stack = useUndoStack();
  return <UndoContext.Provider value={stack}>{children}</UndoContext.Provider>;
}

export function useUndo(): UndoContextValue {
  const ctx = useContext(UndoContext);
  if (!ctx) throw new Error("useUndo must be used inside UndoProvider");
  return ctx;
}

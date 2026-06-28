import { useCallback, useRef, useState } from "react";

export interface Command {
  label?: string;
  undo: () => void;
  redo: () => void;
}

const MAX_STACK = 50;

export function useUndoStack() {
  const past = useRef<Command[]>([]);
  const future = useRef<Command[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const push = useCallback((cmd: Command) => {
    past.current = [...past.current.slice(-(MAX_STACK - 1)), cmd];
    future.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    const cmd = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    future.current = [cmd, ...future.current];
    cmd.undo();
    setCanUndo(past.current.length > 0);
    setCanRedo(true);
  }, []);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    const cmd = future.current[0];
    future.current = future.current.slice(1);
    past.current = [...past.current, cmd];
    cmd.redo();
    setCanUndo(true);
    setCanRedo(future.current.length > 0);
  }, []);

  return { push, undo, redo, canUndo, canRedo };
}

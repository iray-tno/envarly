import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useUndoStack } from "./useUndoStack";

describe("useUndoStack", () => {
  it("starts with empty stacks — canUndo and canRedo are false", () => {
    const { result } = renderHook(() => useUndoStack());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("push enables canUndo and resets canRedo", () => {
    const { result } = renderHook(() => useUndoStack());
    act(() => {
      result.current.push({ undo: vi.fn(), redo: vi.fn() });
    });
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it("undo calls the undo fn, disables canUndo, enables canRedo", () => {
    const { result } = renderHook(() => useUndoStack());
    const undoFn = vi.fn();
    act(() => {
      result.current.push({ undo: undoFn, redo: vi.fn() });
    });
    act(() => {
      result.current.undo();
    });
    expect(undoFn).toHaveBeenCalledOnce();
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it("redo calls the redo fn, re-enables canUndo, disables canRedo", () => {
    const { result } = renderHook(() => useUndoStack());
    const redoFn = vi.fn();
    act(() => {
      result.current.push({ undo: vi.fn(), redo: redoFn });
    });
    act(() => {
      result.current.undo();
    });
    act(() => {
      result.current.redo();
    });
    expect(redoFn).toHaveBeenCalledOnce();
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it("new push clears the redo stack", () => {
    const { result } = renderHook(() => useUndoStack());
    act(() => {
      result.current.push({ undo: vi.fn(), redo: vi.fn() });
    });
    act(() => {
      result.current.undo();
    });
    expect(result.current.canRedo).toBe(true);
    act(() => {
      result.current.push({ undo: vi.fn(), redo: vi.fn() });
    });
    expect(result.current.canRedo).toBe(false);
  });

  it("undo is a no-op when past is empty", () => {
    const { result } = renderHook(() => useUndoStack());
    expect(() =>
      act(() => {
        result.current.undo();
      }),
    ).not.toThrow();
    expect(result.current.canUndo).toBe(false);
  });

  it("redo is a no-op when future is empty", () => {
    const { result } = renderHook(() => useUndoStack());
    expect(() =>
      act(() => {
        result.current.redo();
      }),
    ).not.toThrow();
    expect(result.current.canRedo).toBe(false);
  });

  it("executes operations in the correct LIFO / FIFO order", () => {
    const { result } = renderHook(() => useUndoStack());
    const log: string[] = [];
    act(() => {
      result.current.push({ undo: () => log.push("u1"), redo: () => log.push("r1") });
    });
    act(() => {
      result.current.push({ undo: () => log.push("u2"), redo: () => log.push("r2") });
    });
    act(() => {
      result.current.undo();
    }); // u2 (most recent first)
    act(() => {
      result.current.undo();
    }); // u1
    act(() => {
      result.current.redo();
    }); // r1 (oldest first)
    expect(log).toEqual(["u2", "u1", "r1"]);
  });

  it("canUndo tracks stack depth accurately across multiple operations", () => {
    const { result } = renderHook(() => useUndoStack());
    act(() => {
      result.current.push({ undo: vi.fn(), redo: vi.fn() });
    });
    act(() => {
      result.current.push({ undo: vi.fn(), redo: vi.fn() });
    });
    act(() => {
      result.current.undo();
    });
    expect(result.current.canUndo).toBe(true);
    act(() => {
      result.current.undo();
    });
    expect(result.current.canUndo).toBe(false);
  });
});

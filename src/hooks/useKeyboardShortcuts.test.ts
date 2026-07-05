import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRef } from "react";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

function fire(key: string, opts: Partial<KeyboardEventInit> = {}) {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, ctrlKey: true, bubbles: true, ...opts }));
}

describe("useKeyboardShortcuts", () => {
  it("Ctrl+Z calls undo", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    renderHook(() => useKeyboardShortcuts(undo, redo, { current: null }));
    fire("z");
    expect(undo).toHaveBeenCalledTimes(1);
    expect(redo).not.toHaveBeenCalled();
  });

  it("Ctrl+Y calls redo", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    renderHook(() => useKeyboardShortcuts(undo, redo, { current: null }));
    fire("y");
    expect(redo).toHaveBeenCalledTimes(1);
    expect(undo).not.toHaveBeenCalled();
  });

  it("Ctrl+Shift+Z calls redo", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    renderHook(() => useKeyboardShortcuts(undo, redo, { current: null }));
    fire("z", { shiftKey: true });
    expect(redo).toHaveBeenCalledTimes(1);
    expect(undo).not.toHaveBeenCalled();
  });

  it("Ctrl+Z calls localUndo instead of undo when localUndoRef has a function", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const localUndo = vi.fn();
    renderHook(() => useKeyboardShortcuts(undo, redo, { current: localUndo }));
    fire("z");
    expect(localUndo).toHaveBeenCalledTimes(1);
    expect(undo).not.toHaveBeenCalled();
  });

  it("non-ctrl keys are ignored", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    renderHook(() => useKeyboardShortcuts(undo, redo, { current: null }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", bubbles: true }));
    expect(undo).not.toHaveBeenCalled();
  });

  it("Ctrl+Z in an input field does not call undo", () => {
    const undo = vi.fn();
    renderHook(() => useKeyboardShortcuts(undo, vi.fn(), { current: null }));
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    fire("z");
    expect(undo).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("removes the event listener on unmount", () => {
    const undo = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcuts(undo, vi.fn(), { current: null }));
    unmount();
    fire("z");
    expect(undo).not.toHaveBeenCalled();
  });
});

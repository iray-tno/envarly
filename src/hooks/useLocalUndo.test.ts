import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useLocalUndo } from "./useLocalUndo";

describe("useLocalUndo", () => {
  it("starts with null ref", () => {
    const { result } = renderHook(() => useLocalUndo());
    expect(result.current.localUndoRef.current).toBeNull();
  });

  it("handleRegisterLocalUndo sets the ref", () => {
    const { result } = renderHook(() => useLocalUndo());
    const fn = vi.fn();
    act(() => { result.current.handleRegisterLocalUndo(fn); });
    expect(result.current.localUndoRef.current).toBe(fn);
  });

  it("handleRegisterLocalUndo clears the ref when passed null", () => {
    const { result } = renderHook(() => useLocalUndo());
    act(() => { result.current.handleRegisterLocalUndo(vi.fn()); });
    act(() => { result.current.handleRegisterLocalUndo(null); });
    expect(result.current.localUndoRef.current).toBeNull();
  });
});

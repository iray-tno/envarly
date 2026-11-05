import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { clampWidth, useResizableWidth } from "./useResizableWidth";

describe("clampWidth", () => {
  it("clamps values below min", () => {
    expect(clampWidth(100, 260, 480)).toBe(260);
  });

  it("clamps values above max", () => {
    expect(clampWidth(900, 260, 480)).toBe(480);
  });

  it("passes through in-range values", () => {
    expect(clampWidth(300, 260, 480)).toBe(300);
  });
});

describe("useResizableWidth", () => {
  const opts = { storageKey: "envarly-test-width", defaultWidth: 300, min: 260, max: 480 } as const;

  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to defaultWidth when nothing is stored", () => {
    const { result } = renderHook(() => useResizableWidth(opts));
    expect(result.current.width).toBe(300);
  });

  it("reads a stored width", () => {
    localStorage.setItem("envarly-test-width", "350");
    const { result } = renderHook(() => useResizableWidth(opts));
    expect(result.current.width).toBe(350);
  });

  it("clamps a stored width that is now out of range", () => {
    localStorage.setItem("envarly-test-width", "50");
    const { result } = renderHook(() => useResizableWidth(opts));
    expect(result.current.width).toBe(260);
  });

  it("passes its bounds and width to the splitter", () => {
    const { result } = renderHook(() => useResizableWidth(opts));
    expect(result.current.splitterProps).toMatchObject({ min: 260, max: 480, size: 300 });
  });

  it("sets isDragging while a size change is uncommitted and clears it on commit", () => {
    const { result } = renderHook(() => useResizableWidth(opts));
    act(() => result.current.splitterProps.onSizeChange(350));
    expect(result.current.isDragging).toBe(true);
    expect(result.current.width).toBe(350);
    act(() => result.current.splitterProps.onSizeCommit(350));
    expect(result.current.isDragging).toBe(false);
  });

  it("clears isDragging when the drag is cancelled", () => {
    const { result } = renderHook(() => useResizableWidth(opts));
    act(() => result.current.splitterProps.onSizeChange(350));
    act(() => {
      result.current.splitterProps.onSizeChange(300);
      result.current.splitterProps.onSizeCancel();
    });
    expect(result.current.isDragging).toBe(false);
    expect(result.current.width).toBe(300);
  });

  it("does not persist width to localStorage while dragging, only after", () => {
    const { result } = renderHook(() => useResizableWidth(opts));
    act(() => result.current.splitterProps.onSizeChange(350));
    expect(localStorage.getItem("envarly-test-width")).toBe("300");
    act(() => result.current.splitterProps.onSizeCommit(350));
    expect(localStorage.getItem("envarly-test-width")).toBe("350");
  });
});

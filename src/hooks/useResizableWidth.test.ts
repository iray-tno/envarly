import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clampWidth, useResizableWidth } from "./useResizableWidth";

function fakePointerEvent(clientX: number) {
  return {
    pointerId: 1,
    clientX,
    currentTarget: {
      setPointerCapture: vi.fn(),
      hasPointerCapture: () => true,
      releasePointerCapture: vi.fn(),
    },
  } as unknown as React.PointerEvent<HTMLDivElement>;
}

function fakeKeyEvent(key: string, shiftKey = false) {
  return {
    key,
    shiftKey,
    preventDefault: vi.fn(),
  } as unknown as React.KeyboardEvent<HTMLDivElement>;
}

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
    const { result } = renderHook(() => useResizableWidth({ ...opts, side: "left" }));
    expect(result.current.width).toBe(300);
  });

  it("reads a stored width", () => {
    localStorage.setItem("envarly-test-width", "350");
    const { result } = renderHook(() => useResizableWidth({ ...opts, side: "left" }));
    expect(result.current.width).toBe(350);
  });

  it("clamps a stored width that is now out of range", () => {
    localStorage.setItem("envarly-test-width", "50");
    const { result } = renderHook(() => useResizableWidth({ ...opts, side: "left" }));
    expect(result.current.width).toBe(260);
  });

  it("grows on drag right for a left-docked panel", () => {
    const { result } = renderHook(() => useResizableWidth({ ...opts, side: "left" }));
    act(() => result.current.handleProps.onPointerDown(fakePointerEvent(100)));
    act(() => result.current.handleProps.onPointerMove(fakePointerEvent(150)));
    expect(result.current.width).toBe(350);
  });

  it("shrinks on drag right for a right-docked panel", () => {
    const { result } = renderHook(() => useResizableWidth({ ...opts, side: "right" }));
    act(() => result.current.handleProps.onPointerDown(fakePointerEvent(100)));
    act(() => result.current.handleProps.onPointerMove(fakePointerEvent(130)));
    expect(result.current.width).toBe(270);
  });

  it("clamps during drag", () => {
    const { result } = renderHook(() => useResizableWidth({ ...opts, side: "left" }));
    act(() => result.current.handleProps.onPointerDown(fakePointerEvent(100)));
    act(() => result.current.handleProps.onPointerMove(fakePointerEvent(1000)));
    expect(result.current.width).toBe(480);
  });

  it("sets isDragging during drag and clears it on pointer up", () => {
    const { result } = renderHook(() => useResizableWidth({ ...opts, side: "left" }));
    act(() => result.current.handleProps.onPointerDown(fakePointerEvent(100)));
    expect(result.current.isDragging).toBe(true);
    act(() => result.current.handleProps.onPointerUp(fakePointerEvent(150)));
    expect(result.current.isDragging).toBe(false);
  });

  it("does not persist width to localStorage while dragging, only after", () => {
    const { result } = renderHook(() => useResizableWidth({ ...opts, side: "left" }));
    act(() => result.current.handleProps.onPointerDown(fakePointerEvent(100)));
    act(() => result.current.handleProps.onPointerMove(fakePointerEvent(150)));
    expect(localStorage.getItem("envarly-test-width")).toBe("300");
    act(() => result.current.handleProps.onPointerUp(fakePointerEvent(150)));
    expect(localStorage.getItem("envarly-test-width")).toBe("350");
  });

  it("ArrowRight grows a left-docked panel", () => {
    const { result } = renderHook(() => useResizableWidth({ ...opts, side: "left" }));
    act(() => result.current.handleProps.onKeyDown(fakeKeyEvent("ArrowRight")));
    expect(result.current.width).toBe(308);
  });

  it("ArrowRight with shift takes a larger step", () => {
    const { result } = renderHook(() => useResizableWidth({ ...opts, side: "left" }));
    act(() => result.current.handleProps.onKeyDown(fakeKeyEvent("ArrowRight", true)));
    expect(result.current.width).toBe(332);
  });

  it("Home jumps to min, End jumps to max", () => {
    const { result } = renderHook(() => useResizableWidth({ ...opts, side: "left" }));
    act(() => result.current.handleProps.onKeyDown(fakeKeyEvent("End")));
    expect(result.current.width).toBe(480);
    act(() => result.current.handleProps.onKeyDown(fakeKeyEvent("Home")));
    expect(result.current.width).toBe(260);
  });
});

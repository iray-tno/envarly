import { act, renderHook } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { useOnClickOutside } from "./useOnClickOutside";

function clickAt(target: EventTarget) {
  const event = new MouseEvent("mousedown", { bubbles: true });
  Object.defineProperty(event, "target", { value: target, enumerable: true });
  document.dispatchEvent(event);
}

function setup(enabled = true) {
  const handler = vi.fn();
  const outside = document.createElement("div");
  document.body.appendChild(outside);

  const { result, unmount } = renderHook(() => {
    const ref = useRef<HTMLDivElement | null>(null);
    useOnClickOutside(ref, handler, enabled);
    return ref;
  });

  // Attach the ref's element to the DOM so `.contains()` checks work.
  const inside = document.createElement("div");
  act(() => {
    result.current.current = inside;
  });
  document.body.appendChild(inside);

  return { handler, inside, outside, unmount };
}

describe("useOnClickOutside", () => {
  it("calls the handler on a mousedown outside the ref'd element", () => {
    const { handler, outside } = setup();
    clickAt(outside);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("does not call the handler on a mousedown inside the ref'd element", () => {
    const { handler, inside } = setup();
    clickAt(inside);
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not attach a listener when disabled", () => {
    const { handler, outside } = setup(false);
    clickAt(outside);
    expect(handler).not.toHaveBeenCalled();
  });

  it("removes its listener on unmount", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = setup();
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));
    removeSpy.mockRestore();
  });
});

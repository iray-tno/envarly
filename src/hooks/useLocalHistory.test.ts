import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLocalHistory } from "./useLocalHistory";

describe("useLocalHistory", () => {
  it("starts with the original value, not dirty", () => {
    const { result } = renderHook(() => useLocalHistory("hello"));
    expect(result.current.value).toBe("hello");
    expect(result.current.dirty).toBe(false);
  });

  it("onChange updates value and marks dirty", () => {
    const { result } = renderHook(() => useLocalHistory("hello"));
    act(() => {
      result.current.onChange("world");
    });
    expect(result.current.value).toBe("world");
    expect(result.current.dirty).toBe(true);
  });

  it("onChange back to original clears dirty", () => {
    const { result } = renderHook(() => useLocalHistory("hello"));
    act(() => {
      result.current.onChange("world");
    });
    act(() => {
      result.current.onChange("hello");
    });
    expect(result.current.dirty).toBe(false);
  });

  it("discard with no checkpoints reverts to originalValue", () => {
    const { result } = renderHook(() => useLocalHistory("hello"));
    act(() => {
      result.current.onChange("world");
    });
    act(() => {
      result.current.discard();
    });
    expect(result.current.value).toBe("hello");
    expect(result.current.dirty).toBe(false);
  });

  it("discard from current text edit reverts to last checkpoint, not originalValue", () => {
    const { result } = renderHook(() => useLocalHistory("a"));
    act(() => {
      result.current.onBeforeStructuralChange();
      result.current.onChange("b");
    });
    act(() => {
      result.current.onChange("c");
    });
    act(() => {
      result.current.discard();
    });
    expect(result.current.value).toBe("b");
    expect(result.current.dirty).toBe(true);
  });

  it("second discard from checkpoint reverts to originalValue", () => {
    const { result } = renderHook(() => useLocalHistory("a"));
    act(() => {
      result.current.onBeforeStructuralChange();
      result.current.onChange("b");
    });
    act(() => {
      result.current.discard();
    });
    act(() => {
      result.current.discard();
    });
    expect(result.current.value).toBe("a");
    expect(result.current.dirty).toBe(false);
  });

  it("structural change pushes pre-op value as checkpoint", () => {
    const { result } = renderHook(() => useLocalHistory("a"));
    act(() => {
      result.current.onChange("b");
    });
    act(() => {
      result.current.onBeforeStructuralChange();
      result.current.onChange("c");
    });
    act(() => {
      result.current.discard();
    });
    expect(result.current.value).toBe("b");
  });

  it("does not push duplicate checkpoints", () => {
    const { result } = renderHook(() => useLocalHistory("a"));
    act(() => {
      result.current.onBeforeStructuralChange();
      result.current.onChange("b");
    });
    act(() => {
      result.current.onBeforeStructuralChange();
      result.current.onChange("c");
    });
    act(() => {
      result.current.discard();
    });
    act(() => {
      result.current.discard();
    });
    expect(result.current.value).toBe("a");
    expect(result.current.dirty).toBe(false);
  });

  it("reset sets a new value and clears history", () => {
    const { result } = renderHook(() => useLocalHistory("a"));
    act(() => {
      result.current.onBeforeStructuralChange();
      result.current.onChange("b");
    });
    act(() => {
      result.current.reset("z");
    });
    expect(result.current.value).toBe("z");
    expect(result.current.dirty).toBe(true); // "z" differs from the original value "a"
    act(() => {
      result.current.discard();
    });
    // reset cleared the "b" checkpoint, so discard falls back to the original value
    expect(result.current.value).toBe("a");
  });

  it("reset to originalValue clears dirty", () => {
    const { result } = renderHook(() => useLocalHistory("a"));
    act(() => {
      result.current.onChange("b");
    });
    act(() => {
      result.current.reset("a");
    });
    expect(result.current.dirty).toBe(false);
  });

  it("resets all state when originalValue changes", () => {
    const { result, rerender } = renderHook(({ v }) => useLocalHistory(v), {
      initialProps: { v: "a" },
    });
    act(() => {
      result.current.onChange("b");
    });
    rerender({ v: "x" });
    expect(result.current.value).toBe("x");
    expect(result.current.dirty).toBe(false);
    act(() => {
      result.current.discard();
    });
    expect(result.current.value).toBe("x");
  });
});

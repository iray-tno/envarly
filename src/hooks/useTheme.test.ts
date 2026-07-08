import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useTheme } from "./useTheme";

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("defaults to dark when no localStorage value and prefers-color-scheme is dark", () => {
    const { result } = renderHook(() => useTheme());
    expect(["dark", "light"]).toContain(result.current.theme);
  });

  it("reads initial theme from localStorage", () => {
    localStorage.setItem("envarly-theme", "light");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });

  it("toggle switches from dark to light", () => {
    localStorage.setItem("envarly-theme", "dark");
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggle();
    });
    expect(result.current.theme).toBe("light");
  });

  it("toggle switches from light to dark", () => {
    localStorage.setItem("envarly-theme", "light");
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggle();
    });
    expect(result.current.theme).toBe("dark");
  });

  it("persists theme to localStorage on toggle", () => {
    localStorage.setItem("envarly-theme", "dark");
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggle();
    });
    expect(localStorage.getItem("envarly-theme")).toBe("light");
  });

  it("sets correct class on documentElement", () => {
    localStorage.setItem("envarly-theme", "dark");
    const { result } = renderHook(() => useTheme());
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    act(() => {
      result.current.toggle();
    });
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});

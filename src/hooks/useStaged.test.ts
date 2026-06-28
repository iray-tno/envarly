import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useStaged, stagedKey } from "./useStaged";
import type { EnvVar } from "../types";

const vars: EnvVar[] = [
  { name: "PATH",      scope: "User",   value: "C:\\bin",     listSeparator: ";" },
  { name: "JAVA_HOME", scope: "User",   value: "C:\\jdk21",   listSeparator: null },
  { name: "WINDIR",    scope: "System", value: "C:\\Windows", listSeparator: null },
];

describe("stagedKey", () => {
  it("formats as Scope:name", () => {
    expect(stagedKey("PATH", "User")).toBe("User:PATH");
    expect(stagedKey("WINDIR", "System")).toBe("System:WINDIR");
  });
});

describe("useStaged — stageSet", () => {
  it("starts with an empty staged map", () => {
    const { result } = renderHook(() => useStaged(vars));
    expect(result.current.staged.size).toBe(0);
  });

  it("adds a set change with the correct originalValue and newValue", () => {
    const { result } = renderHook(() => useStaged(vars));
    act(() => { result.current.stageSet("JAVA_HOME", "User", "C:\\jdk22"); });
    const change = result.current.staged.get("User:JAVA_HOME");
    expect(change?.kind).toBe("set");
    expect(change?.originalValue).toBe("C:\\jdk21");
    expect(change?.newValue).toBe("C:\\jdk22");
  });

  it("removes the entry when new value matches the original (auto-unstage)", () => {
    const { result } = renderHook(() => useStaged(vars));
    act(() => { result.current.stageSet("JAVA_HOME", "User", "C:\\jdk22"); });
    expect(result.current.staged.size).toBe(1);
    act(() => { result.current.stageSet("JAVA_HOME", "User", "C:\\jdk21"); });
    expect(result.current.staged.size).toBe(0);
  });

  it("uses null originalValue for a brand-new variable", () => {
    const { result } = renderHook(() => useStaged(vars));
    act(() => { result.current.stageSet("NEW_VAR", "User", "hello"); });
    const change = result.current.staged.get("User:NEW_VAR");
    expect(change?.originalValue).toBeNull();
    expect(change?.newValue).toBe("hello");
  });
});

describe("useStaged — stageDelete", () => {
  it("stages a deletion with correct originalValue", () => {
    const { result } = renderHook(() => useStaged(vars));
    act(() => { result.current.stageDelete("JAVA_HOME", "User"); });
    const change = result.current.staged.get("User:JAVA_HOME");
    expect(change?.kind).toBe("delete");
    expect(change?.originalValue).toBe("C:\\jdk21");
    expect(change?.newValue).toBeNull();
  });

  it("is a no-op for variables not in the registry", () => {
    const { result } = renderHook(() => useStaged(vars));
    act(() => { result.current.stageDelete("DOES_NOT_EXIST", "User"); });
    expect(result.current.staged.size).toBe(0);
  });
});

describe("useStaged — unstage / clearStaged", () => {
  it("unstage removes only the specified entry", () => {
    const { result } = renderHook(() => useStaged(vars));
    act(() => {
      result.current.stageSet("JAVA_HOME", "User", "C:\\jdk22");
      result.current.stageSet("WINDIR", "System", "C:\\Win11");
    });
    expect(result.current.staged.size).toBe(2);
    act(() => { result.current.unstage("JAVA_HOME", "User"); });
    expect(result.current.staged.size).toBe(1);
    expect(result.current.staged.has("User:JAVA_HOME")).toBe(false);
    expect(result.current.staged.has("System:WINDIR")).toBe(true);
  });

  it("clearStaged empties the map", () => {
    const { result } = renderHook(() => useStaged(vars));
    act(() => {
      result.current.stageSet("JAVA_HOME", "User", "C:\\jdk22");
      result.current.stageSet("WINDIR", "System", "C:\\Win11");
    });
    act(() => { result.current.clearStaged(); });
    expect(result.current.staged.size).toBe(0);
  });
});

describe("useStaged — effectiveVars", () => {
  it("reflects staged set changes in the merged view", () => {
    const { result } = renderHook(() => useStaged(vars));
    act(() => { result.current.stageSet("JAVA_HOME", "User", "C:\\jdk22"); });
    const javaHome = result.current.effectiveVars.find((v) => v.name === "JAVA_HOME");
    expect(javaHome?.value).toBe("C:\\jdk22");
  });

  it("keeps staged-deleted vars visible (for sidebar D marker)", () => {
    const { result } = renderHook(() => useStaged(vars));
    act(() => { result.current.stageDelete("JAVA_HOME", "User"); });
    const names = result.current.effectiveVars.map((v) => v.name);
    expect(names).toContain("JAVA_HOME");
  });

  it("includes brand-new staged vars not yet in the registry", () => {
    const { result } = renderHook(() => useStaged(vars));
    act(() => { result.current.stageSet("NEW_VAR", "User", "hello"); });
    const names = result.current.effectiveVars.map((v) => v.name);
    expect(names).toContain("NEW_VAR");
  });

  it("is sorted by scope then name", () => {
    const { result } = renderHook(() => useStaged(vars));
    const keys = result.current.effectiveVars.map((v) => `${v.scope}:${v.name}`);
    expect(keys).toEqual([...keys].sort());
  });

  it("infers semicolon separator for PATH and PATHEXT names", () => {
    const { result } = renderHook(() => useStaged([]));
    act(() => { result.current.stageSet("PATHEXT", "User", ".COM;.EXE"); });
    const pathext = result.current.effectiveVars.find((v) => v.name === "PATHEXT");
    expect(pathext?.listSeparator).toBe(";");
  });
});

describe("useStaged — stageImport", () => {
  it("stages multiple set changes at once", () => {
    const { result } = renderHook(() => useStaged(vars));
    act(() => {
      result.current.stageImport([
        { name: "JAVA_HOME", scope: "User", value: "C:\\jdk22" },
        { name: "NEW_VAR",   scope: "User", value: "new" },
      ]);
    });
    expect(result.current.staged.size).toBe(2);
    expect(result.current.staged.get("User:JAVA_HOME")?.newValue).toBe("C:\\jdk22");
    expect(result.current.staged.get("User:NEW_VAR")?.newValue).toBe("new");
  });

  it("skips entries whose value matches the original (no-op diff)", () => {
    const { result } = renderHook(() => useStaged(vars));
    act(() => {
      result.current.stageImport([
        { name: "JAVA_HOME", scope: "User", value: "C:\\jdk21" }, // same as registry
      ]);
    });
    expect(result.current.staged.size).toBe(0);
  });

  it("stages deletes when provided alongside sets", () => {
    const { result } = renderHook(() => useStaged(vars));
    act(() => {
      result.current.stageImport(
        [{ name: "JAVA_HOME", scope: "User", value: "C:\\jdk22" }],
        [{ name: "WINDIR", scope: "System" }],
      );
    });
    expect(result.current.staged.get("User:JAVA_HOME")?.kind).toBe("set");
    expect(result.current.staged.get("System:WINDIR")?.kind).toBe("delete");
  });
});

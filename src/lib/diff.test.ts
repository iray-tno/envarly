import { describe, expect, it } from "vitest";
import { applyAccepted, computeDiff, snapshotsEqual } from "./diff";
import type { EnvSnapshot } from "../types";

const empty: EnvSnapshot = { user: {}, system: {} };

const base: EnvSnapshot = {
  user: { PATH: "C:\\old", JAVA_HOME: "C:\\jdk17" },
  system: { WINDIR: "C:\\Windows", OS: "Windows_NT" },
};

describe("computeDiff", () => {
  it("returns empty for identical snapshots", () => {
    expect(computeDiff(base, base)).toEqual([]);
  });

  it("detects user variable added", () => {
    const cur = { ...base, user: { ...base.user, NEW_VAR: "hello" } };
    const diff = computeDiff(base, cur);
    expect(diff).toContainEqual({ kind: "added", name: "NEW_VAR", scope: "User", value: "hello" });
  });

  it("detects user variable removed", () => {
    const { JAVA_HOME: _, ...rest } = base.user;
    const cur = { ...base, user: rest };
    const diff = computeDiff(base, cur);
    expect(diff).toContainEqual({
      kind: "removed",
      name: "JAVA_HOME",
      scope: "User",
      value: "C:\\jdk17",
    });
  });

  it("detects user variable changed", () => {
    const cur = { ...base, user: { ...base.user, JAVA_HOME: "C:\\jdk21" } };
    const diff = computeDiff(base, cur);
    expect(diff).toContainEqual({
      kind: "changed",
      name: "JAVA_HOME",
      scope: "User",
      oldValue: "C:\\jdk17",
      newValue: "C:\\jdk21",
    });
  });

  it("detects system variable added", () => {
    const cur = { ...base, system: { ...base.system, NEW_SYS: "val" } };
    const diff = computeDiff(base, cur);
    expect(diff).toContainEqual({
      kind: "added",
      name: "NEW_SYS",
      scope: "System",
      value: "val",
    });
  });

  it("detects system variable removed", () => {
    const { OS: _, ...rest } = base.system;
    const cur = { ...base, system: rest };
    const diff = computeDiff(base, cur);
    expect(diff).toContainEqual({ kind: "removed", name: "OS", scope: "System", value: "Windows_NT" });
  });

  it("handles multiple changes at once", () => {
    const cur: EnvSnapshot = {
      user: { PATH: "C:\\new" }, // JAVA_HOME removed, PATH changed
      system: { WINDIR: "C:\\Windows", OS: "Windows_NT", SYS_NEW: "x" },
    };
    const diff = computeDiff(base, cur);
    expect(diff.length).toBe(3); // PATH changed, JAVA_HOME removed, SYS_NEW added
  });

  it("sorts output by scope then name", () => {
    const cur: EnvSnapshot = {
      user: { PATH: "C:\\old", JAVA_HOME: "C:\\jdk17", ZZZ: "z", AAA: "a" },
      system: { WINDIR: "C:\\Windows", OS: "Windows_NT" },
    };
    const diff = computeDiff(base, cur);
    const names = diff.map((d) => d.name);
    expect(names).toEqual([...names].sort());
  });
});

describe("snapshotsEqual", () => {
  it("returns true for equal snapshots", () => {
    expect(snapshotsEqual(base, { ...base, user: { ...base.user } })).toBe(true);
  });

  it("returns false when value differs", () => {
    const cur = { ...base, user: { ...base.user, PATH: "C:\\different" } };
    expect(snapshotsEqual(base, cur)).toBe(false);
  });

  it("returns true for two empty snapshots", () => {
    expect(snapshotsEqual(empty, empty)).toBe(true);
  });
});

describe("applyAccepted", () => {
  it("adds accepted-added variable to baseline", () => {
    const result = applyAccepted(base, [
      { kind: "added", name: "NEW_VAR", scope: "User", value: "hello" },
    ]);
    expect(result.user.NEW_VAR).toBe("hello");
  });

  it("removes accepted-removed variable from baseline", () => {
    const result = applyAccepted(base, [
      { kind: "removed", name: "JAVA_HOME", scope: "User", value: "C:\\jdk17" },
    ]);
    expect("JAVA_HOME" in result.user).toBe(false);
  });

  it("updates accepted-changed variable in baseline", () => {
    const result = applyAccepted(base, [
      { kind: "changed", name: "JAVA_HOME", scope: "User", oldValue: "C:\\jdk17", newValue: "C:\\jdk21" },
    ]);
    expect(result.user.JAVA_HOME).toBe("C:\\jdk21");
  });

  it("does not mutate the original baseline", () => {
    const original = JSON.parse(JSON.stringify(base));
    applyAccepted(base, [{ kind: "added", name: "X", scope: "User", value: "y" }]);
    expect(base).toEqual(original);
  });

  it("handles system scope correctly", () => {
    const result = applyAccepted(base, [
      { kind: "added", name: "SYS_NEW", scope: "System", value: "val" },
    ]);
    expect(result.system.SYS_NEW).toBe("val");
    expect(result.user).toEqual(base.user);
  });
});

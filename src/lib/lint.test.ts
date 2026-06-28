import { describe, expect, it } from "vitest";
import { lintPathValue } from "./lint";
import type { EnvVar } from "../types";

const vars: EnvVar[] = [
  { name: "SystemRoot", scope: "System", value: "C:\\Windows", listSeparator: null },
  { name: "ProgramFiles", scope: "System", value: "C:\\Program Files", listSeparator: null },
  { name: "USERPROFILE", scope: "User", value: "C:\\Users\\bob", listSeparator: null },
];

describe("lintPathValue", () => {
  it("returns no diagnostics for a plain path with no %VAR% references", () => {
    expect(lintPathValue("C:\\Windows\\system32", vars)).toEqual([]);
  });

  it("returns no diagnostics when all %VAR% references are resolvable", () => {
    expect(lintPathValue("%SystemRoot%\\system32;%ProgramFiles%\\node", vars)).toEqual([]);
  });

  it("returns a diagnostic for a single unresolvable reference", () => {
    expect(lintPathValue("%CustomSdk%\\bin", vars)).toEqual([
      { kind: "unresolved-ref", varName: "CustomSdk", entryIndex: 0 },
    ]);
  });

  it("is case-insensitive when matching known variable names", () => {
    expect(lintPathValue("%systemroot%\\system32", vars)).toEqual([]);
    expect(lintPathValue("%SYSTEMROOT%\\system32", vars)).toEqual([]);
  });

  it("reports diagnostics for multiple entries at correct indices", () => {
    const raw = "%SystemRoot%\\bin;%GhostTool%\\bin;%USERPROFILE%\\apps;%PhantomApp%\\x64";
    const result = lintPathValue(raw, vars);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ varName: "GhostTool", entryIndex: 1 });
    expect(result[1]).toMatchObject({ varName: "PhantomApp", entryIndex: 3 });
  });

  it("reports multiple unresolved refs within a single entry", () => {
    const result = lintPathValue("%SDK%\\%VERSION%\\bin", vars);
    expect(result).toHaveLength(2);
    expect(result.map((d) => d.varName)).toEqual(["SDK", "VERSION"]);
    expect(result.every((d) => d.entryIndex === 0)).toBe(true);
  });

  it("ignores empty entries when computing entryIndex", () => {
    // Leading/trailing semicolons create empty entries that should be skipped
    const result = lintPathValue(";%Unknown%;", vars);
    expect(result).toEqual([{ kind: "unresolved-ref", varName: "Unknown", entryIndex: 0 }]);
  });

  it("returns no diagnostics for an empty value", () => {
    expect(lintPathValue("", vars)).toEqual([]);
  });

  it("does not report Windows built-in volatile variables as unresolved", () => {
    const empty: EnvVar[] = [];
    expect(lintPathValue("%USERPROFILE%\\tools", empty)).toEqual([]);
    expect(lintPathValue("%APPDATA%\\bin;%LOCALAPPDATA%\\bin", empty)).toEqual([]);
    expect(lintPathValue("%SYSTEMROOT%\\system32;%WINDIR%\\bin", empty)).toEqual([]);
    expect(lintPathValue("%TEMP%\\scratch", empty)).toEqual([]);
  });
});

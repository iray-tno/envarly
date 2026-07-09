import { describe, expect, it, vi } from "vitest";
import type { EnvVar } from "../types";
import { diagnoseEnvironment } from "./environmentDiagnostics";

function env(
  name: string,
  value: string,
  scope: "User" | "System" = "User",
  valueKind: "String" | "ExpandString" = "String",
): EnvVar {
  return { name, value, scope, valueKind, listSeparator: null };
}

describe("diagnoseEnvironment", () => {
  it("returns nothing for a healthy plain variable", async () => {
    expect(await diagnoseEnvironment([env("JAVA_HOME", "C:\\jdk")], [], vi.fn())).toEqual([]);
  });

  it("suggests changing REG_SZ with a defined reference to ExpandString", async () => {
    const diagnostics = await diagnoseEnvironment(
      [env("TOOLS", "%USERPROFILE%\\tools")],
      [],
      vi.fn(),
    );
    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        kind: "expandable-stored-as-string",
        action: { kind: "set-type", valueKind: "ExpandString" },
      }),
    );
  });

  it("reports undefined references", async () => {
    const diagnostics = await diagnoseEnvironment(
      [env("TOOLS", "%MISSING_SDK%\\bin", "User", "ExpandString")],
      [],
      vi.fn(),
    );
    expect(diagnostics).toContainEqual(
      expect.objectContaining({ kind: "undefined-reference", detail: "MISSING_SDK" }),
    );
  });

  it("reports Windows-generated overrides with a staged deletion", async () => {
    const diagnostics = await diagnoseEnvironment(
      [env("USERPROFILE", "D:\\Users\\me")],
      [],
      vi.fn(),
    );
    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        kind: "windows-generated-override",
        action: { kind: "delete" },
      }),
    );
  });

  it("reports unsupported registry values", async () => {
    const diagnostics = await diagnoseEnvironment(
      [env("OK", "value")],
      [{ name: "BINARY", scope: "User", registryType: "REG_BINARY" }],
      vi.fn(),
    );
    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        kind: "unsupported-registry-type",
        name: "BINARY",
        detail: "REG_BINARY",
      }),
    );
  });

  it("reports and offers cleanup for duplicate PATH entries", async () => {
    const validate = vi.fn().mockResolvedValue([true, true, true]);
    const diagnostics = await diagnoseEnvironment(
      [env("Path", "C:\\bin;C:\\tools;c:\\BIN", "User", "ExpandString")],
      [],
      validate,
    );
    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        kind: "duplicate-path-entry",
        action: { kind: "set-value", value: "C:\\bin;C:\\tools" },
      }),
    );
  });

  it("reports missing PATH and TEMP directories", async () => {
    const validate = vi.fn().mockResolvedValue([true, false, false]);
    const diagnostics = await diagnoseEnvironment(
      [
        env("Path", "C:\\Windows;C:\\missing", "User", "ExpandString"),
        env("TEMP", "C:\\missing-temp", "User", "ExpandString"),
      ],
      [],
      validate,
    );
    expect(diagnostics.map((item) => item.kind)).toEqual(
      expect.arrayContaining(["missing-path-entry", "missing-temp-directory"]),
    );
  });

  it("reports system references to user-only variables", async () => {
    const diagnostics = await diagnoseEnvironment(
      [
        env("SDK_HOME", "C:\\sdk", "User"),
        env("TOOLS", "%SDK_HOME%\\bin", "System", "ExpandString"),
      ],
      [],
      vi.fn(),
    );
    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        kind: "system-references-user-variable",
        detail: "SDK_HOME",
      }),
    );
  });

  it("keeps non-path diagnostics when path validation fails", async () => {
    const diagnostics = await diagnoseEnvironment(
      [env("USERPROFILE", "D:\\Users\\me"), env("Path", "C:\\Windows", "User", "ExpandString")],
      [],
      vi.fn().mockRejectedValue(new Error("validation unavailable")),
    );
    expect(diagnostics).toContainEqual(
      expect.objectContaining({ kind: "windows-generated-override" }),
    );
  });
});

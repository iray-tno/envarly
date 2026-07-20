import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api";
import type { DiffEntry } from "../lib/diff";
import { useDiff } from "./useDiff";

vi.mock("../api", () => ({
  api: {
    getRegistrySnapshot: vi.fn(),
    setEnvVar: vi.fn(),
    deleteEnvVar: vi.fn(),
  },
}));

describe("useDiff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.setEnvVar).mockResolvedValue(undefined);
    vi.mocked(api.deleteEnvVar).mockResolvedValue(undefined);
  });

  it("closes the dialog only after refresh resolves", async () => {
    const callOrder: string[] = [];
    const refresh = vi.fn().mockImplementation(async () => {
      callOrder.push("refresh");
    });
    const setDialog = vi.fn().mockImplementation(() => {
      callOrder.push("setDialog");
    });
    const { result } = renderHook(() => useDiff(refresh, setDialog));

    await act(async () => {
      await result.current.handleDiffApply([], []);
    });

    expect(callOrder).toEqual(["refresh", "setDialog"]);
    expect(setDialog).toHaveBeenCalledWith(null);
  });

  it("reverts added entries by deleting them", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const setDialog = vi.fn();
    const { result } = renderHook(() => useDiff(refresh, setDialog));

    const added: DiffEntry = { kind: "added", name: "NEW_VAR", scope: "User", value: "x", valueKind: "String" };
    await act(async () => {
      await result.current.handleDiffApply([], [added]);
    });

    expect(api.deleteEnvVar).toHaveBeenCalledWith("NEW_VAR", "User");
  });

  it("reverts removed entries by restoring the old value", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const setDialog = vi.fn();
    const { result } = renderHook(() => useDiff(refresh, setDialog));

    const removed: DiffEntry = {
      kind: "removed",
      name: "OLD_VAR",
      scope: "System",
      value: "gone",
      valueKind: "String",
    };
    await act(async () => {
      await result.current.handleDiffApply([], [removed]);
    });

    expect(api.setEnvVar).toHaveBeenCalledWith("OLD_VAR", "gone", "String", "System");
  });

  it("keeps the dialog open and exposes the error when reverting fails", async () => {
    vi.mocked(api.deleteEnvVar).mockRejectedValue(new Error("access denied"));
    const refresh = vi.fn().mockResolvedValue(undefined);
    const setDialog = vi.fn();
    const { result } = renderHook(() => useDiff(refresh, setDialog));

    const added: DiffEntry = { kind: "added", name: "NEW_VAR", scope: "User", value: "x", valueKind: "String" };
    await act(async () => {
      await result.current.handleDiffApply([], [added]);
    });

    expect(setDialog).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(result.current.applyError).toBe("Error: access denied");
  });

  it("checkForExternalChanges populates diffEntries when the registry differs from baseline", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const setDialog = vi.fn();
    const { result } = renderHook(() => useDiff(refresh, setDialog));

    result.current.baselineRef.current = { user: {}, system: {} };
    vi.mocked(api.getRegistrySnapshot).mockResolvedValue({
      user: { FOO: { value: "bar", kind: "String" } },
      system: {},
    });

    await act(async () => {
      await result.current.checkForExternalChanges();
    });

    expect(result.current.diffEntries).toEqual([
      { kind: "added", name: "FOO", scope: "User", value: "bar", valueKind: "String" },
    ]);
    expect(setDialog).toHaveBeenCalledWith("changes");
  });

  it("handleDiffDismiss clears diff entries and error, and closes the dialog", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const setDialog = vi.fn();
    const { result } = renderHook(() => useDiff(refresh, setDialog));

    result.current.baselineRef.current = { user: {}, system: {} };
    vi.mocked(api.getRegistrySnapshot).mockResolvedValue({
      user: { FOO: { value: "bar", kind: "String" } },
      system: {},
    });
    await act(async () => {
      await result.current.checkForExternalChanges();
    });
    expect(result.current.diffEntries.length).toBe(1);

    act(() => {
      result.current.handleDiffDismiss();
    });

    expect(result.current.diffEntries).toEqual([]);
    expect(result.current.applyError).toBeNull();
    expect(setDialog).toHaveBeenCalledWith(null);
  });
});

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useApplyStaged } from "./useApplyStaged";
import { api } from "../api";
import type { StagedChange } from "./useStaged";

vi.mock("../api", () => ({
  api: {
    setEnvVar: vi.fn(),
    deleteEnvVar: vi.fn(),
    createSnapshot: vi.fn(),
    getRegistrySnapshot: vi.fn(),
  },
}));

function makeStaged(entries: Array<[string, StagedChange]> = []): Map<string, StagedChange> {
  return new Map(entries);
}

function makeParams(overrides: Partial<Parameters<typeof useApplyStaged>[0]> = {}) {
  return {
    staged: makeStaged(),
    clearStaged: vi.fn(),
    refresh: vi.fn().mockResolvedValue(undefined),
    refreshPathStatus: vi.fn().mockResolvedValue(undefined),
    baselineRef: { current: null },
    setDialog: vi.fn(),
    ...overrides,
  };
}

describe("useApplyStaged", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.setEnvVar).mockResolvedValue(undefined);
    vi.mocked(api.deleteEnvVar).mockResolvedValue(undefined);
    vi.mocked(api.createSnapshot).mockResolvedValue(undefined);
    vi.mocked(api.getRegistrySnapshot).mockResolvedValue({ user: {}, system: {} });
  });

  it("calls setEnvVar for each set change", async () => {
    const change: StagedChange = { kind: "set", name: "A", scope: "User", originalValue: null, newValue: "1" };
    const params = makeParams({ staged: makeStaged([["User:A", change]]) });
    const { result } = renderHook(() => useApplyStaged(params));
    await act(async () => { await result.current.handleApplyStaged(false); });
    expect(api.setEnvVar).toHaveBeenCalledWith("A", "1", "User");
  });

  it("calls deleteEnvVar for each delete change", async () => {
    const change: StagedChange = { kind: "delete", name: "B", scope: "System", originalValue: "old", newValue: null };
    const params = makeParams({ staged: makeStaged([["System:B", change]]) });
    const { result } = renderHook(() => useApplyStaged(params));
    await act(async () => { await result.current.handleApplyStaged(false); });
    expect(api.deleteEnvVar).toHaveBeenCalledWith("B", "System");
  });

  it("calls createSnapshot when takeSnapshot is true", async () => {
    const params = makeParams();
    const { result } = renderHook(() => useApplyStaged(params));
    await act(async () => { await result.current.handleApplyStaged(true); });
    expect(api.createSnapshot).toHaveBeenCalledWith("auto: before apply");
  });

  it("does not call createSnapshot when takeSnapshot is false", async () => {
    const params = makeParams();
    const { result } = renderHook(() => useApplyStaged(params));
    await act(async () => { await result.current.handleApplyStaged(false); });
    expect(api.createSnapshot).not.toHaveBeenCalled();
  });

  it("calls clearStaged and closes dialog on success", async () => {
    const params = makeParams();
    const { result } = renderHook(() => useApplyStaged(params));
    await act(async () => { await result.current.handleApplyStaged(false); });
    expect(params.clearStaged).toHaveBeenCalledTimes(1);
    expect(params.setDialog).toHaveBeenCalledWith(null);
  });

  it("busy is true during apply and false after", async () => {
    let resolveFn!: () => void;
    vi.mocked(api.setEnvVar).mockReturnValue(new Promise<void>(r => { resolveFn = r; }));
    const change: StagedChange = { kind: "set", name: "A", scope: "User", originalValue: null, newValue: "v" };
    const params = makeParams({ staged: makeStaged([["User:A", change]]) });
    const { result } = renderHook(() => useApplyStaged(params));

    let applyPromise: Promise<void>;
    act(() => { applyPromise = result.current.handleApplyStaged(false); });
    expect(result.current.busy).toBe(true);

    await act(async () => { resolveFn(); await applyPromise; });
    expect(result.current.busy).toBe(false);
  });
});

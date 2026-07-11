import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api";
import { useApplyStaged } from "./useApplyStaged";
import type { StagedChange } from "./useStaged";

vi.mock("../api", () => ({
  api: {
    setEnvVar: vi.fn(),
    deleteEnvVar: vi.fn(),
    applyEnvChanges: vi.fn(),
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
    vi.mocked(api.applyEnvChanges).mockResolvedValue(undefined);
    vi.mocked(api.createSnapshot).mockResolvedValue(undefined);
    vi.mocked(api.getRegistrySnapshot).mockResolvedValue({ user: {}, system: {} });
  });

  it("sends all staged changes through the atomic apply command", async () => {
    const change: StagedChange = {
      kind: "set",
      name: "A",
      scope: "User",
      originalValue: null,
      originalValueKind: null,
      newValue: "1",
      newValueKind: "String",
    };
    const params = makeParams({ staged: makeStaged([["User:A", change]]) });
    const { result } = renderHook(() => useApplyStaged(params));
    await act(async () => {
      await result.current.handleApplyStaged(false);
    });
    expect(api.applyEnvChanges).toHaveBeenCalledWith([
      {
        changeType: "set",
        name: "A",
        value: "1",
        valueKind: "String",
        scope: "User",
      },
    ]);
  });

  it("calls deleteEnvVar for each delete change", async () => {
    const change: StagedChange = {
      kind: "delete",
      name: "B",
      scope: "System",
      originalValue: "old",
      originalValueKind: "String",
      newValue: null,
    };
    const params = makeParams({ staged: makeStaged([["System:B", change]]) });
    const { result } = renderHook(() => useApplyStaged(params));
    await act(async () => {
      await result.current.handleApplyStaged(false);
    });
    expect(api.applyEnvChanges).toHaveBeenCalledWith([
      { changeType: "delete", name: "B", scope: "System" },
    ]);
  });

  it("does not create snapshots in the frontend because atomic apply does it", async () => {
    const params = makeParams();
    const { result } = renderHook(() => useApplyStaged(params));
    await act(async () => {
      await result.current.handleApplyStaged(true);
    });
    expect(api.createSnapshot).not.toHaveBeenCalled();
  });

  it("calls clearStaged and closes dialog on success", async () => {
    const params = makeParams();
    const { result } = renderHook(() => useApplyStaged(params));
    await act(async () => {
      await result.current.handleApplyStaged(false);
    });
    expect(params.clearStaged).toHaveBeenCalledTimes(1);
    expect(params.setDialog).toHaveBeenCalledWith(null);
  });

  it("keeps the modal open and exposes the error when apply fails", async () => {
    vi.mocked(api.applyEnvChanges).mockRejectedValue("Registry error: access denied");
    const params = makeParams();
    const { result } = renderHook(() => useApplyStaged(params));

    await act(async () => {
      await result.current.handleApplyStaged(false);
    });

    expect(params.clearStaged).not.toHaveBeenCalled();
    expect(params.setDialog).not.toHaveBeenCalled();
    expect(result.current.error).toBe("Registry error: access denied");
  });

  it("busy is true during apply and false after", async () => {
    let resolveFn!: () => void;
    vi.mocked(api.applyEnvChanges).mockReturnValue(
      new Promise<void>((r) => {
        resolveFn = r;
      }),
    );
    const change: StagedChange = {
      kind: "set",
      name: "A",
      scope: "User",
      originalValue: null,
      originalValueKind: null,
      newValue: "v",
      newValueKind: "String",
    };
    const params = makeParams({ staged: makeStaged([["User:A", change]]) });
    const { result } = renderHook(() => useApplyStaged(params));

    let applyPromise: Promise<void>;
    act(() => {
      applyPromise = result.current.handleApplyStaged(false);
    });
    expect(result.current.busy).toBe(true);

    await act(async () => {
      resolveFn();
      await applyPromise;
    });
    expect(result.current.busy).toBe(false);
  });
});

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAppInit } from "./useAppInit";
import { api } from "../api";

vi.mock("../api", () => ({
  api: {
    getRegistrySnapshot: vi.fn(),
    isElevated: vi.fn(),
  },
}));

function makeParams(overrides: Partial<Parameters<typeof useAppInit>[0]> = {}) {
  return {
    baselineRef: { current: null },
    setElevated: vi.fn(),
    refreshPathStatus: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn(),
    checkForExternalChanges: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("useAppInit", () => {
  beforeEach(() => {
    vi.mocked(api.getRegistrySnapshot).mockResolvedValue({ user: {}, system: {} });
    vi.mocked(api.isElevated).mockResolvedValue(false);
  });

  it("calls getRegistrySnapshot and stores result in baselineRef on mount", async () => {
    const snapshot = { user: { FOO: "bar" }, system: {} };
    vi.mocked(api.getRegistrySnapshot).mockResolvedValue(snapshot);
    const params = makeParams();
    renderHook(() => useAppInit(params));
    await waitFor(() => expect(api.getRegistrySnapshot).toHaveBeenCalledTimes(1));
    expect(params.baselineRef.current).toEqual(snapshot);
  });

  it("calls isElevated and passes result to setElevated on mount", async () => {
    vi.mocked(api.isElevated).mockResolvedValue(true);
    const params = makeParams();
    renderHook(() => useAppInit(params));
    await waitFor(() => expect(params.setElevated).toHaveBeenCalledWith(true));
  });

  it("calls refreshPathStatus and refresh on mount", async () => {
    const params = makeParams();
    renderHook(() => useAppInit(params));
    await waitFor(() => expect(params.refresh).toHaveBeenCalled());
    expect(params.refreshPathStatus).toHaveBeenCalledTimes(1);
  });

  it("handleRefresh calls refresh and checkForExternalChanges", async () => {
    const params = makeParams();
    const { result } = renderHook(() => useAppInit(params));
    await act(async () => { await result.current.handleRefresh(); });
    expect(params.refresh).toHaveBeenCalled();
    expect(params.checkForExternalChanges).toHaveBeenCalledTimes(1);
  });

  it("continues mount sequence even if getRegistrySnapshot throws", async () => {
    vi.mocked(api.getRegistrySnapshot).mockRejectedValue(new Error("fail"));
    const params = makeParams();
    renderHook(() => useAppInit(params));
    await waitFor(() => expect(params.refresh).toHaveBeenCalled());
    expect(params.setElevated).toHaveBeenCalled();
  });
});

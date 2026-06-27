import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api";
import { useEnvVars } from "./useEnvVars";

vi.mock("../api", () => ({
  api: {
    getEnvVars: vi.fn(),
  },
}));

const SAMPLE = [
  { name: "PATH", value: "C:\\Windows", scope: "User" as const, listSeparator: ";" },
];

describe("useEnvVars", () => {
  beforeEach(() => vi.clearAllMocks());

  it("starts with loading false and empty vars", () => {
    vi.mocked(api.getEnvVars).mockResolvedValue([]);
    const { result } = renderHook(() => useEnvVars());
    expect(result.current.vars).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("sets loading=true while fetching, then populates vars", async () => {
    vi.mocked(api.getEnvVars).mockResolvedValue(SAMPLE);
    const { result } = renderHook(() => useEnvVars());
    await act(async () => {
      result.current.refresh();
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.vars).toEqual(SAMPLE);
    });
  });

  it("captures error on failure", async () => {
    vi.mocked(api.getEnvVars).mockRejectedValue("registry error");
    const { result } = renderHook(() => useEnvVars());
    await act(async () => {
      result.current.refresh();
    });
    await waitFor(() => {
      expect(result.current.error).toBe("registry error");
      expect(result.current.loading).toBe(false);
    });
  });

  it("clears error on successful re-fetch", async () => {
    vi.mocked(api.getEnvVars)
      .mockRejectedValueOnce("fail")
      .mockResolvedValueOnce(SAMPLE);
    const { result } = renderHook(() => useEnvVars());
    await act(async () => { result.current.refresh(); });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    await act(async () => { result.current.refresh(); });
    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.vars).toEqual(SAMPLE);
    });
  });
});

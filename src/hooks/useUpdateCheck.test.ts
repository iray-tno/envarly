import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api";
import { useUpdateCheck } from "./useUpdateCheck";

vi.mock("../api", () => ({
  api: {
    checkForUpdate: vi.fn(),
  },
}));

const STORAGE_KEY = "envarly.lastUpdateCheck";
const DAY_MS = 24 * 60 * 60 * 1000;

describe("useUpdateCheck", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.checkForUpdate).mockReset();
  });

  it("checks for an update when never checked before", async () => {
    vi.mocked(api.checkForUpdate).mockResolvedValue({
      version: "9.9.9",
      url: "https://example.com/release",
    });

    const { result } = renderHook(() => useUpdateCheck());

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toEqual({ version: "9.9.9", url: "https://example.com/release" });
    expect(api.checkForUpdate).toHaveBeenCalledTimes(1);
  });

  it("records the check time so it isn't repeated within 24 hours", async () => {
    vi.mocked(api.checkForUpdate).mockResolvedValue(null);

    renderHook(() => useUpdateCheck());

    await waitFor(() => expect(api.checkForUpdate).toHaveBeenCalledTimes(1));
    expect(Number(localStorage.getItem(STORAGE_KEY))).toBeGreaterThan(0);
  });

  it("does not check again if the last check was less than 24 hours ago", () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now() - DAY_MS / 2));

    renderHook(() => useUpdateCheck());

    expect(api.checkForUpdate).not.toHaveBeenCalled();
  });

  it("checks again if the last check was more than 24 hours ago", async () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now() - DAY_MS * 2));
    vi.mocked(api.checkForUpdate).mockResolvedValue(null);

    renderHook(() => useUpdateCheck());

    await waitFor(() => expect(api.checkForUpdate).toHaveBeenCalledTimes(1));
  });

  it("stays null when there is no newer version", async () => {
    vi.mocked(api.checkForUpdate).mockResolvedValue(null);

    const { result } = renderHook(() => useUpdateCheck());

    await waitFor(() => expect(api.checkForUpdate).toHaveBeenCalledTimes(1));
    expect(result.current).toBeNull();
  });

  it("does not throw when the update check fails", async () => {
    vi.mocked(api.checkForUpdate).mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useUpdateCheck());

    await waitFor(() => expect(api.checkForUpdate).toHaveBeenCalledTimes(1));
    expect(result.current).toBeNull();
  });
});

import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, withTimeout } from "./api";
import type { ApplyProgressEvent } from "./types";

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(),
}));

describe("api runtime detection", () => {
  beforeEach(() => {
    vi.mocked(isTauri).mockReturnValue(false);
  });

  it("explains how to start the app when opened without Tauri", async () => {
    await expect(api.getEnvVars()).rejects.toThrow(
      "Tauri runtime unavailable. Start Envarly with `npm run dev`.",
    );
  });
});

describe("withTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves with the real value if it arrives before the timeout", async () => {
    const promise = withTimeout(Promise.resolve("real"), 3000, "fallback");
    await expect(promise).resolves.toBe("real");
  });

  it("resolves with the fallback if the promise never settles", async () => {
    const never = new Promise<string>(() => {});
    const promise = withTimeout(never, 3000, "fallback");

    await vi.advanceTimersByTimeAsync(3000);

    await expect(promise).resolves.toBe("fallback");
  });

  it("resolves with the fallback if the promise rejects", async () => {
    const promise = withTimeout(Promise.reject(new Error("boom")), 3000, "fallback");
    await expect(promise).resolves.toBe("fallback");
  });
});

describe("api.onApplyProgress", () => {
  beforeEach(() => {
    vi.mocked(isTauri).mockReturnValue(true);
    vi.mocked(invoke).mockImplementation(async (cmd: string) => {
      if (cmd === "get_launch_options") return { demo: false, demoFixture: null };
      return undefined;
    });
  });

  it("subscribes via listen and forwards event payloads to the callback", async () => {
    const unlisten = vi.fn();
    vi.mocked(listen).mockResolvedValue(unlisten);

    const callback = vi.fn();
    const unsubscribe = await api.onApplyProgress(callback);

    expect(listen).toHaveBeenCalledWith("apply-progress", expect.any(Function));

    const event: ApplyProgressEvent = {
      index: 0,
      total: 1,
      name: "FOO",
      scope: "User",
      action: "set",
      success: true,
      error: null,
    };
    const [, handler] = vi.mocked(listen).mock.calls[0];
    handler({ event: "apply-progress", id: 1, payload: event });
    expect(callback).toHaveBeenCalledWith(event);

    unsubscribe();
    expect(unlisten).toHaveBeenCalledTimes(1);
  });
});

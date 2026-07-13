import { isTauri } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

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

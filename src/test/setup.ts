import "@testing-library/jest-dom";

// Mock Tauri's invoke — components never call it directly (they go through api.ts)
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

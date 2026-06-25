import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../api";
import type { EnvSnapshot, SnapshotMeta } from "../../types";
import { SnapshotPanel } from "./SnapshotPanel";

vi.mock("../../api", () => ({
  api: {
    listSnapshots: vi.fn(),
    createSnapshot: vi.fn(),
    deleteSnapshot: vi.fn(),
    restoreSnapshot: vi.fn(),
    getRegistrySnapshot: vi.fn(),
  },
}));

const CURRENT: EnvSnapshot = { user: { PATH: "C:\\current" }, system: {} };

const MOCK_SNAPSHOT: SnapshotMeta = {
  id: "20240101T120000Z",
  createdAt: "2024-01-01T12:00:00Z",
  label: "Before Node update",
  snapshot: { user: { PATH: "C:\\old", JAVA_HOME: "C:\\jdk21" }, system: {} },
};

describe("SnapshotPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listSnapshots).mockResolvedValue([MOCK_SNAPSHOT]);
    vi.mocked(api.createSnapshot).mockResolvedValue(MOCK_SNAPSHOT);
    vi.mocked(api.deleteSnapshot).mockResolvedValue(undefined);
    vi.mocked(api.restoreSnapshot).mockResolvedValue(undefined);
    vi.mocked(api.getRegistrySnapshot).mockResolvedValue(CURRENT);
  });

  it("loads and renders snapshots on mount", async () => {
    render(<SnapshotPanel onRestored={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Before Node update")).toBeInTheDocument();
    });
    expect(api.listSnapshots).toHaveBeenCalledTimes(1);
  });

  it("creates a snapshot with label", async () => {
    const user = userEvent.setup();
    render(<SnapshotPanel onRestored={vi.fn()} />);
    await user.type(screen.getByPlaceholderText(/label/i), "My snapshot");
    await user.click(screen.getByRole("button", { name: /save snapshot/i }));
    await waitFor(() => {
      expect(api.createSnapshot).toHaveBeenCalledWith("My snapshot");
    });
  });

  it("shows success message after creating snapshot", async () => {
    const user = userEvent.setup();
    render(<SnapshotPanel onRestored={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /save snapshot/i }));
    await waitFor(() => {
      expect(screen.getByText("Snapshot saved.")).toBeInTheDocument();
    });
  });

  it("Preview button shows diff against current state", async () => {
    const user = userEvent.setup();
    render(<SnapshotPanel onRestored={vi.fn()} />);
    await screen.findByText("Before Node update");
    await user.click(screen.getByRole("button", { name: /preview/i }));
    await waitFor(() => {
      // JAVA_HOME is added (in snapshot, not in current)
      expect(screen.getByText("JAVA_HOME")).toBeInTheDocument();
      // PATH changed
      expect(screen.getByText("PATH")).toBeInTheDocument();
    });
  });

  it("calls restoreSnapshot and onRestored after preview → restore", async () => {
    const user = userEvent.setup();
    const onRestored = vi.fn();
    render(<SnapshotPanel onRestored={onRestored} />);
    await screen.findByText("Before Node update");
    await user.click(screen.getByRole("button", { name: /preview/i }));
    await waitFor(() => screen.getByRole("button", { name: /restore this snapshot/i }));
    await user.click(screen.getByRole("button", { name: /restore this snapshot/i }));
    await waitFor(() => {
      expect(api.restoreSnapshot).toHaveBeenCalledWith("20240101T120000Z");
      expect(onRestored).toHaveBeenCalled();
    });
  });

  it("calls deleteSnapshot after confirming delete", async () => {
    const user = userEvent.setup();
    render(<SnapshotPanel onRestored={vi.fn()} />);
    await screen.findByText("Before Node update");
    // First click shows inline confirm
    await user.click(screen.getByRole("button", { name: "×" }));
    await waitFor(() => screen.getByRole("button", { name: /^delete$/i }));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await waitFor(() => {
      expect(api.deleteSnapshot).toHaveBeenCalledWith("20240101T120000Z");
    });
  });

  it("shows empty state when no snapshots", async () => {
    vi.mocked(api.listSnapshots).mockResolvedValueOnce([]);
    render(<SnapshotPanel onRestored={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/no snapshots yet/i)).toBeInTheDocument();
    });
  });

  it("Back button from preview returns to list", async () => {
    const user = userEvent.setup();
    render(<SnapshotPanel onRestored={vi.fn()} />);
    await screen.findByText("Before Node update");
    await user.click(screen.getByRole("button", { name: /preview/i }));
    await waitFor(() => screen.getByRole("button", { name: /← back/i }));
    await user.click(screen.getByRole("button", { name: /← back/i }));
    expect(screen.getByText("Before Node update")).toBeInTheDocument();
  });
});

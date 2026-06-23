import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../api";
import type { SnapshotMeta } from "../../types";
import { SnapshotPanel } from "./SnapshotPanel";

// vi.mock is hoisted — cannot reference module-level variables inside the factory
vi.mock("../../api", () => ({
  api: {
    listSnapshots: vi.fn(),
    createSnapshot: vi.fn(),
    deleteSnapshot: vi.fn(),
    restoreSnapshot: vi.fn(),
  },
}));

const MOCK_SNAPSHOT: SnapshotMeta = {
  id: "20240101T120000Z",
  createdAt: "2024-01-01T12:00:00Z",
  label: "Before Node update",
  snapshot: { user: { PATH: "C:\\old" }, system: {} },
};

describe("SnapshotPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listSnapshots).mockResolvedValue([MOCK_SNAPSHOT]);
    vi.mocked(api.createSnapshot).mockResolvedValue(MOCK_SNAPSHOT);
    vi.mocked(api.deleteSnapshot).mockResolvedValue(undefined);
    vi.mocked(api.restoreSnapshot).mockResolvedValue(undefined);
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
    await user.click(screen.getByRole("button", { name: /create snapshot/i }));
    await waitFor(() => {
      expect(api.createSnapshot).toHaveBeenCalledWith("My snapshot");
    });
  });

  it("shows success message after creating snapshot", async () => {
    const user = userEvent.setup();
    render(<SnapshotPanel onRestored={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /create snapshot/i }));
    await waitFor(() => {
      expect(screen.getByText("Snapshot saved.")).toBeInTheDocument();
    });
  });

  it("calls restoreSnapshot and onRestored on restore", async () => {
    const user = userEvent.setup();
    const onRestored = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<SnapshotPanel onRestored={onRestored} />);
    await screen.findByText("Before Node update");
    await user.click(screen.getByRole("button", { name: /restore/i }));
    await waitFor(() => {
      expect(api.restoreSnapshot).toHaveBeenCalledWith("20240101T120000Z");
      expect(onRestored).toHaveBeenCalled();
    });
  });

  it("calls deleteSnapshot on delete", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<SnapshotPanel onRestored={vi.fn()} />);
    await screen.findByText("Before Node update");
    await user.click(screen.getByRole("button", { name: "×" }));
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
});

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
    getRegistrySnapshot: vi.fn(),
    renameSnapshot: vi.fn(),
  },
}));

const CURRENT: EnvSnapshot = {
  user: { PATH: { value: "C:\\current", kind: "ExpandString" } },
  system: {},
};

const MOCK_SNAPSHOT: SnapshotMeta = {
  version: 2,
  id: "20240101T120000Z",
  createdAt: "2024-01-01T12:00:00Z",
  label: "Before Node update",
  snapshot: {
    user: {
      PATH: { value: "C:\\old", kind: "ExpandString" },
      JAVA_HOME: { value: "C:\\jdk21", kind: "String" },
    },
    system: {},
  },
};

const SECOND_SNAPSHOT: SnapshotMeta = {
  ...MOCK_SNAPSHOT,
  id: "20240102T120000Z",
  createdAt: "2024-01-02T12:00:00Z",
  label: "After Node update",
  snapshot: {
    user: {
      PATH: { value: "C:\\new", kind: "ExpandString" },
    },
    system: {},
  },
};

describe("SnapshotPanel", () => {
  const onStageSnapshot = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listSnapshots).mockResolvedValue([MOCK_SNAPSHOT]);
    vi.mocked(api.createSnapshot).mockResolvedValue(MOCK_SNAPSHOT);
    vi.mocked(api.deleteSnapshot).mockResolvedValue(undefined);
    vi.mocked(api.getRegistrySnapshot).mockResolvedValue(CURRENT);
    vi.mocked(api.renameSnapshot).mockImplementation(async (id, label) => ({
      ...MOCK_SNAPSHOT,
      id,
      label,
    }));
  });

  it("loads and renders snapshots on mount", async () => {
    render(<SnapshotPanel onStageSnapshot={onStageSnapshot} />);
    await waitFor(() => {
      expect(screen.getByText("Before Node update")).toBeInTheDocument();
    });
    expect(api.listSnapshots).toHaveBeenCalledTimes(1);
  });

  it("creates a snapshot with label", async () => {
    const user = userEvent.setup();
    render(<SnapshotPanel onStageSnapshot={onStageSnapshot} />);
    await user.type(screen.getByPlaceholderText(/label/i), "My snapshot");
    await user.click(screen.getByRole("button", { name: /save snapshot/i }));
    await waitFor(() => {
      expect(api.createSnapshot).toHaveBeenCalledWith("My snapshot");
    });
  });

  it("shows success message after creating snapshot", async () => {
    const user = userEvent.setup();
    render(<SnapshotPanel onStageSnapshot={onStageSnapshot} />);
    await user.click(screen.getByRole("button", { name: /save snapshot/i }));
    await waitFor(() => {
      expect(screen.getByText("Snapshot saved.")).toBeInTheDocument();
    });
  });

  it("Preview button shows diff against current state", async () => {
    const user = userEvent.setup();
    render(<SnapshotPanel onStageSnapshot={onStageSnapshot} />);
    await screen.findByText("Before Node update");
    await user.click(screen.getByRole("button", { name: /preview/i }));
    await waitFor(() => {
      expect(screen.getByText("JAVA_HOME")).toBeInTheDocument();
      expect(screen.getByText("PATH")).toBeInTheDocument();
    });
  });

  it("stages snapshot changes and calls onStageSnapshot after preview → stage restore", async () => {
    const user = userEvent.setup();
    render(<SnapshotPanel onStageSnapshot={onStageSnapshot} />);
    await screen.findByText("Before Node update");
    await user.click(screen.getByRole("button", { name: /preview/i }));
    await waitFor(() => screen.getByRole("button", { name: /stage restore/i }));
    await user.click(screen.getByRole("button", { name: /stage restore/i }));
    expect(onStageSnapshot).toHaveBeenCalledWith(MOCK_SNAPSHOT.snapshot);
  });

  it("calls deleteSnapshot after confirming delete", async () => {
    const user = userEvent.setup();
    render(<SnapshotPanel onStageSnapshot={onStageSnapshot} />);
    await screen.findByText("Before Node update");
    await user.click(screen.getByRole("button", { name: "Delete snapshot" }));
    await waitFor(() => screen.getByRole("button", { name: /^delete$/i }));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await waitFor(() => {
      expect(api.deleteSnapshot).toHaveBeenCalledWith("20240101T120000Z");
    });
  });

  it("renames a snapshot inline and updates the displayed label", async () => {
    const user = userEvent.setup();
    render(<SnapshotPanel onStageSnapshot={onStageSnapshot} />);
    await screen.findByText("Before Node update");

    await user.click(screen.getByRole("button", { name: "Rename snapshot" }));
    const input = screen.getByRole("textbox", { name: "Snapshot name" });
    await user.clear(input);
    await user.type(input, "After Node update");
    await user.click(screen.getByRole("button", { name: "Save snapshot name" }));

    await waitFor(() => {
      expect(api.renameSnapshot).toHaveBeenCalledWith("20240101T120000Z", "After Node update");
    });
    expect(screen.getByText("After Node update")).toBeInTheDocument();
    expect(screen.getByText("Snapshot renamed.")).toBeInTheDocument();
  });

  it("cancels renaming with Escape", async () => {
    const user = userEvent.setup();
    render(<SnapshotPanel onStageSnapshot={onStageSnapshot} />);
    await screen.findByText("Before Node update");

    await user.click(screen.getByRole("button", { name: "Rename snapshot" }));
    const input = screen.getByRole("textbox", { name: "Snapshot name" });
    await user.type(input, " changed");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("textbox", { name: "Snapshot name" })).not.toBeInTheDocument();
    expect(screen.getByText("Before Node update")).toBeInTheDocument();
    expect(api.renameSnapshot).not.toHaveBeenCalled();
  });

  it("shows empty state when no snapshots", async () => {
    vi.mocked(api.listSnapshots).mockResolvedValueOnce([]);
    render(<SnapshotPanel onStageSnapshot={onStageSnapshot} />);
    await waitFor(() => {
      expect(screen.getByText(/no snapshots yet/i)).toBeInTheDocument();
    });
  });

  it("opens preview in a modal and returns to the list when closed", async () => {
    const user = userEvent.setup();
    render(<SnapshotPanel onStageSnapshot={onStageSnapshot} />);
    await screen.findByText("Before Node update");
    await user.click(screen.getByRole("button", { name: /preview/i }));

    const dialog = await screen.findByRole("dialog", { name: "Snapshot preview" });
    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(screen.getByText("Before Node update")).toBeInTheDocument();
  });

  it("opens snapshot comparison in a modal", async () => {
    vi.mocked(api.listSnapshots).mockResolvedValueOnce([MOCK_SNAPSHOT, SECOND_SNAPSHOT]);
    const user = userEvent.setup();
    render(<SnapshotPanel onStageSnapshot={onStageSnapshot} />);
    await screen.findByText("Before Node update");

    const compareButtons = screen.getAllByRole("button", { name: "Compare" });
    await user.click(compareButtons[0]);
    await user.click(screen.getByRole("button", { name: "Compare with" }));

    expect(await screen.findByRole("dialog", { name: "Compare snapshots" })).toBeInTheDocument();
    expect(screen.getByText("After Node update")).toBeInTheDocument();
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../api";
import type { CheckCommandResult } from "../../types";
import { CheckCommandPanel } from "./CheckCommandPanel";

vi.mock("../../api");

beforeEach(() => {
  vi.clearAllMocks();
});

function activeResult(): CheckCommandResult {
  return {
    input: "node",
    queriedName: "node.EXE",
    hadExtension: false,
    hits: [{ directory: "C:\\Tools", matchedFile: "node.EXE", source: "System" }],
    fullPathStatus: null,
  };
}

function shadowedResult(): CheckCommandResult {
  return {
    input: "node",
    queriedName: "node.EXE",
    hadExtension: false,
    hits: [
      { directory: "C:\\Sys", matchedFile: "node.EXE", source: "System" },
      { directory: "C:\\User", matchedFile: "node.EXE", source: "User" },
    ],
    fullPathStatus: null,
  };
}

function notFoundResult(): CheckCommandResult {
  return {
    input: "ghost",
    queriedName: "ghost.EXE",
    hadExtension: false,
    hits: [],
    fullPathStatus: null,
  };
}

describe("CheckCommandPanel", () => {
  it("does not call api.checkCommand while typing", async () => {
    const user = userEvent.setup();
    render(<CheckCommandPanel />);
    await user.type(screen.getByPlaceholderText(/e.g. node/i), "node");
    expect(api.checkCommand).not.toHaveBeenCalled();
  });

  it("calls api.checkCommand with the trimmed input on button click", async () => {
    vi.mocked(api.checkCommand).mockResolvedValue(activeResult());
    const user = userEvent.setup();
    render(<CheckCommandPanel />);
    await user.type(screen.getByPlaceholderText(/e.g. node/i), "  node  ");
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(api.checkCommand).toHaveBeenCalledWith("node");
  });

  it("calls api.checkCommand on Enter", async () => {
    vi.mocked(api.checkCommand).mockResolvedValue(activeResult());
    const user = userEvent.setup();
    render(<CheckCommandPanel />);
    await user.type(screen.getByPlaceholderText(/e.g. node/i), "node{Enter}");
    expect(api.checkCommand).toHaveBeenCalledWith("node");
  });

  it("renders the active hit and no shadowed row for a single hit", async () => {
    vi.mocked(api.checkCommand).mockResolvedValue(activeResult());
    const user = userEvent.setup();
    render(<CheckCommandPanel />);
    await user.type(screen.getByPlaceholderText(/e.g. node/i), "node{Enter}");
    await waitFor(() => expect(screen.getByText("Active — runs")).toBeInTheDocument());
    expect(screen.queryByText("Shadowed")).not.toBeInTheDocument();
  });

  it("renders one active row and one shadowed row when there are two hits", async () => {
    vi.mocked(api.checkCommand).mockResolvedValue(shadowedResult());
    const user = userEvent.setup();
    render(<CheckCommandPanel />);
    await user.type(screen.getByPlaceholderText(/e.g. node/i), "node{Enter}");
    await waitFor(() => expect(screen.getByText("Active — runs")).toBeInTheDocument());
    expect(screen.getByText("Shadowed")).toBeInTheDocument();
  });

  it("renders a not-found message distinct from the shadowed/active states", async () => {
    vi.mocked(api.checkCommand).mockResolvedValue(notFoundResult());
    const user = userEvent.setup();
    render(<CheckCommandPanel />);
    await user.type(screen.getByPlaceholderText(/e.g. node/i), "ghost{Enter}");
    await waitFor(() =>
      expect(screen.getByText("Not found anywhere on PATH.")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Active — runs")).not.toBeInTheDocument();
  });

  it("renders the full-path active message", async () => {
    vi.mocked(api.checkCommand).mockResolvedValue({
      ...activeResult(),
      fullPathStatus: { status: "active" },
    });
    const user = userEvent.setup();
    render(<CheckCommandPanel />);
    await user.type(screen.getByPlaceholderText(/e.g. node/i), "C:\\Tools\\node.exe{Enter}");
    await waitFor(() =>
      expect(screen.getByText("This exact file is the one that runs.")).toBeInTheDocument(),
    );
  });

  it("renders the full-path shadowed message with the shadowing location", async () => {
    vi.mocked(api.checkCommand).mockResolvedValue({
      ...shadowedResult(),
      fullPathStatus: {
        status: "shadowed",
        shadowedBy: { directory: "C:\\Sys", matchedFile: "node.EXE", source: "System" },
      },
    });
    const user = userEvent.setup();
    render(<CheckCommandPanel />);
    await user.type(screen.getByPlaceholderText(/e.g. node/i), "C:\\User\\node.exe{Enter}");
    await waitFor(() =>
      expect(
        screen.getByText("This file exists but is shadowed by C:\\Sys\\node.EXE."),
      ).toBeInTheDocument(),
    );
  });

  it("renders a distinct message for a full path not on the effective PATH", async () => {
    vi.mocked(api.checkCommand).mockResolvedValue({
      ...activeResult(),
      fullPathStatus: { status: "notOnEffectivePath" },
    });
    const user = userEvent.setup();
    render(<CheckCommandPanel />);
    await user.type(screen.getByPlaceholderText(/e.g. node/i), "C:\\Elsewhere\\node.exe{Enter}");
    await waitFor(() =>
      expect(screen.getByText(/isn't on the effective PATH/)).toBeInTheDocument(),
    );
    expect(screen.queryByText("This exact file is the one that runs.")).not.toBeInTheDocument();
    expect(screen.queryByText(/^This file exists but is shadowed/)).not.toBeInTheDocument();
  });

  it("surfaces an error when the check rejects", async () => {
    vi.mocked(api.checkCommand).mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(<CheckCommandPanel />);
    await user.type(screen.getByPlaceholderText(/e.g. node/i), "node{Enter}");
    await waitFor(() => expect(screen.getByText(/boom/)).toBeInTheDocument());
  });
});

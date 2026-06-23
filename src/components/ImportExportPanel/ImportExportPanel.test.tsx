import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../api";
import { ImportExportPanel } from "./ImportExportPanel";

vi.mock("../../api");

const MOCK_SNAPSHOT = {
  user: { JAVA_HOME: "C:\\jdk21", MY_VAR: "hello" },
  system: { WINDIR: "C:\\Windows" },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.exportVars).mockResolvedValue('{"user":{},"system":{}}');
  vi.mocked(api.parseImport).mockResolvedValue(MOCK_SNAPSHOT);
  vi.mocked(api.setEnvVar).mockResolvedValue(undefined);
});

describe("ImportExportPanel — Export tab", () => {
  it("renders scope and format controls", () => {
    render(<ImportExportPanel onApplied={vi.fn()} />);
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "User" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "System" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ".json" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ".reg" })).toBeInTheDocument();
  });

  it("calls exportVars with selected scope and format", async () => {
    const user = userEvent.setup();
    render(<ImportExportPanel onApplied={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "User" }));
    await user.click(screen.getByRole("button", { name: ".reg" }));
    // The action button label is "Export User → .reg"
    await user.click(screen.getByRole("button", { name: /export user/i }));
    expect(api.exportVars).toHaveBeenCalledWith("User", "reg");
  });

  it("shows success status after export", async () => {
    const user = userEvent.setup();
    render(<ImportExportPanel onApplied={vi.fn()} />);
    // The action button label is "Export All → .json"
    await user.click(screen.getByRole("button", { name: /export all/i }));
    await waitFor(() => {
      expect(screen.getByText(/exported/i)).toBeInTheDocument();
    });
  });
});

describe("ImportExportPanel — Import tab", () => {
  function switchToImport() {
    return userEvent.setup().click(screen.getByRole("button", { name: /import/i }));
  }

  it("shows textarea and Parse button on import tab", async () => {
    render(<ImportExportPanel onApplied={vi.fn()} />);
    await switchToImport();
    expect(screen.getByPlaceholderText(/paste file contents/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^parse$/i })).toBeInTheDocument();
  });

  it("calls parseImport with text content and format", async () => {
    const user = userEvent.setup();
    render(<ImportExportPanel onApplied={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /import/i }));
    fireEvent.change(screen.getByPlaceholderText(/paste file contents/i), {
      target: { value: '{"user":{},"system":{}}' },
    });
    await user.click(screen.getByRole("button", { name: /^parse$/i }));
    expect(api.parseImport).toHaveBeenCalledWith('{"user":{},"system":{}}', "json");
  });

  it("shows preview table after successful parse", async () => {
    const user = userEvent.setup();
    render(<ImportExportPanel onApplied={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /import/i }));
    fireEvent.change(screen.getByPlaceholderText(/paste file contents/i), {
      target: { value: "{}" },
    });
    await user.click(screen.getByRole("button", { name: /^parse$/i }));
    await waitFor(() => {
      expect(screen.getByText("JAVA_HOME")).toBeInTheDocument();
      expect(screen.getByText("MY_VAR")).toBeInTheDocument();
      expect(screen.getByText("WINDIR")).toBeInTheDocument();
    });
  });

  it("calls setEnvVar for each selected var on Apply", async () => {
    const onApplied = vi.fn();
    const user = userEvent.setup();
    render(<ImportExportPanel onApplied={onApplied} />);
    await user.click(screen.getByRole("button", { name: /import/i }));
    fireEvent.change(screen.getByPlaceholderText(/paste file contents/i), {
      target: { value: "{}" },
    });
    await user.click(screen.getByRole("button", { name: /^parse$/i }));
    await waitFor(() => screen.getByText("JAVA_HOME"));
    await user.click(screen.getByRole("button", { name: /apply/i }));
    await waitFor(() => expect(api.setEnvVar).toHaveBeenCalledTimes(3));
    expect(onApplied).toHaveBeenCalled();
  });

  it("Parse button disabled when textarea is empty", async () => {
    const user = userEvent.setup();
    render(<ImportExportPanel onApplied={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /import/i }));
    expect(screen.getByRole("button", { name: /^parse$/i })).toBeDisabled();
  });

  it("shows error status when parseImport fails", async () => {
    vi.mocked(api.parseImport).mockRejectedValueOnce(new Error("bad format"));
    const user = userEvent.setup();
    render(<ImportExportPanel onApplied={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /import/i }));
    fireEvent.change(screen.getByPlaceholderText(/paste file contents/i), {
      target: { value: "not valid" },
    });
    await user.click(screen.getByRole("button", { name: /^parse$/i }));
    await waitFor(() => {
      expect(screen.getByText(/parse failed/i)).toBeInTheDocument();
    });
  });
});

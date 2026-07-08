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

const MOCK_VARS = [
  { name: "JAVA_HOME", value: "C:\\jdk21", scope: "User", listSeparator: null },
  { name: "MY_VAR", value: "hello", scope: "User", listSeparator: null },
  { name: "WINDIR", value: "C:\\Windows", scope: "System", listSeparator: null },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.exportVars).mockResolvedValue("C:\\Users\\zigza\\envarly-20260624.json");
  vi.mocked(api.exportCustomVars).mockResolvedValue(
    "C:\\Users\\zigza\\envarly-custom-20260624.json",
  );
  vi.mocked(api.getEnvVars).mockResolvedValue(MOCK_VARS as never);
  vi.mocked(api.parseImport).mockResolvedValue(MOCK_SNAPSHOT);
  vi.mocked(api.setEnvVar).mockResolvedValue(undefined);
  vi.mocked(api.deleteEnvVar).mockResolvedValue(undefined);
  vi.mocked(api.getRegistrySnapshot).mockResolvedValue(MOCK_SNAPSHOT);
});

describe("ImportExportPanel — Export tab", () => {
  it("renders scope and format controls", () => {
    render(<ImportExportPanel onStage={vi.fn()} />);
    expect(screen.getByRole("radio", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "User" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "System" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Custom…" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: ".json" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: ".reg" })).toBeInTheDocument();
  });

  it("exports directly without confirmation when no secrets in scope", async () => {
    // Default mock: JAVA_HOME, MY_VAR, WINDIR — none are secrets
    const user = userEvent.setup();
    render(<ImportExportPanel onStage={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /export all/i }));
    await waitFor(() => expect(api.exportVars).toHaveBeenCalledWith("All", "json"));
    expect(screen.queryByRole("button", { name: /export anyway/i })).not.toBeInTheDocument();
  });

  it("shows service names in confirmation when secrets are present", async () => {
    vi.mocked(api.getEnvVars).mockResolvedValue([
      { name: "AWS_SECRET_ACCESS_KEY", value: "abc", scope: "User", listSeparator: null },
      { name: "GITHUB_TOKEN", value: "xyz", scope: "System", listSeparator: null },
    ] as never);
    const user = userEvent.setup();
    render(<ImportExportPanel onStage={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /export all/i }));
    await waitFor(() => {
      expect(screen.getByText(/aws/i)).toBeInTheDocument();
      expect(screen.getByText(/github/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /export anyway/i })).toBeInTheDocument();
    });
  });

  it("calls exportVars with selected scope and format after confirming", async () => {
    vi.mocked(api.getEnvVars).mockResolvedValue([
      { name: "AWS_SECRET_ACCESS_KEY", value: "abc", scope: "User", listSeparator: null },
    ] as never);
    const user = userEvent.setup();
    render(<ImportExportPanel onStage={vi.fn()} />);
    await user.click(screen.getByRole("radio", { name: "User" }));
    await user.click(screen.getByRole("radio", { name: ".reg" }));
    await user.click(screen.getByRole("button", { name: /export user/i }));
    await waitFor(() => screen.getByRole("button", { name: /export anyway/i }));
    await user.click(screen.getByRole("button", { name: /export anyway/i }));
    expect(api.exportVars).toHaveBeenCalledWith("User", "reg");
  });

  it("cancelling confirmation keeps the export button visible", async () => {
    vi.mocked(api.getEnvVars).mockResolvedValue([
      { name: "GITHUB_TOKEN", value: "ghp_xxxx", scope: "User", listSeparator: null },
    ] as never);
    const user = userEvent.setup();
    render(<ImportExportPanel onStage={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /export all/i }));
    await waitFor(() => screen.getByRole("button", { name: /cancel/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.getByRole("button", { name: /export all/i })).toBeInTheDocument();
    expect(api.exportVars).not.toHaveBeenCalled();
  });

  it("shows success status after export", async () => {
    // No secrets in default mock → direct export
    const user = userEvent.setup();
    render(<ImportExportPanel onStage={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /export all/i }));
    await waitFor(() => {
      expect(screen.getByText(/saved to/i)).toBeInTheDocument();
    });
  });

  it("loads variables and calls exportCustomVars when Custom scope selected", async () => {
    const user = userEvent.setup();
    render(<ImportExportPanel onStage={vi.fn()} />);
    await user.click(screen.getByRole("radio", { name: "Custom…" }));
    await waitFor(() => expect(screen.getByText("JAVA_HOME")).toBeInTheDocument());
    // Test data (JAVA_HOME) has no secrets → no confirmation step
    await user.click(screen.getByRole("button", { name: /export \d+ selected/i }));
    await waitFor(() => expect(api.exportCustomVars).toHaveBeenCalled());
  });

  it("shows secret warning when secret var is selected in Custom mode", async () => {
    vi.mocked(api.getEnvVars).mockResolvedValue([
      { name: "AWS_SECRET_ACCESS_KEY", value: "abc", scope: "User", listSeparator: null },
    ] as never);
    const user = userEvent.setup();
    render(<ImportExportPanel onStage={vi.fn()} />);
    await user.click(screen.getByRole("radio", { name: "Custom…" }));
    await waitFor(() => expect(screen.getByText(/sensitive data/i)).toBeInTheDocument());
  });
});

describe("ImportExportPanel — Import tab", () => {
  function switchToImport() {
    return userEvent.setup().click(screen.getByRole("radio", { name: /^import$/i }));
  }

  it("shows textarea and Parse button on import tab", async () => {
    render(<ImportExportPanel onStage={vi.fn()} />);
    await switchToImport();
    expect(screen.getByPlaceholderText(/paste file contents/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^parse$/i })).toBeInTheDocument();
  });

  it("calls parseImport with text content and format", async () => {
    const user = userEvent.setup();
    render(<ImportExportPanel onStage={vi.fn()} />);
    await user.click(screen.getByRole("radio", { name: /^import$/i }));
    fireEvent.change(screen.getByPlaceholderText(/paste file contents/i), {
      target: { value: '{"user":{},"system":{}}' },
    });
    await user.click(screen.getByRole("button", { name: /^parse$/i }));
    expect(api.parseImport).toHaveBeenCalledWith('{"user":{},"system":{}}', "json");
  });

  it("shows preview table after successful parse", async () => {
    const user = userEvent.setup();
    render(<ImportExportPanel onStage={vi.fn()} />);
    await user.click(screen.getByRole("radio", { name: /^import$/i }));
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

  it("shows Merge and Replace strategy options after parse", async () => {
    const user = userEvent.setup();
    render(<ImportExportPanel onStage={vi.fn()} />);
    await user.click(screen.getByRole("radio", { name: /^import$/i }));
    fireEvent.change(screen.getByPlaceholderText(/paste file contents/i), {
      target: { value: "{}" },
    });
    await user.click(screen.getByRole("button", { name: /^parse$/i }));
    await waitFor(() => screen.getByText("JAVA_HOME"));
    expect(screen.getByRole("radio", { name: "Merge" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Replace" })).toBeInTheDocument();
  });

  it("shows danger warning when Replace strategy selected", async () => {
    const user = userEvent.setup();
    render(<ImportExportPanel onStage={vi.fn()} />);
    await user.click(screen.getByRole("radio", { name: /^import$/i }));
    fireEvent.change(screen.getByPlaceholderText(/paste file contents/i), {
      target: { value: "{}" },
    });
    await user.click(screen.getByRole("button", { name: /^parse$/i }));
    await waitFor(() => screen.getByText("JAVA_HOME"));
    await user.click(screen.getByRole("radio", { name: "Replace" }));
    expect(screen.getByText(/replace will delete/i)).toBeInTheDocument();
  });

  it("calls onStage with all selected vars on Merge stage", async () => {
    const onStage = vi.fn();
    const user = userEvent.setup();
    render(<ImportExportPanel onStage={onStage} />);
    await user.click(screen.getByRole("radio", { name: /^import$/i }));
    fireEvent.change(screen.getByPlaceholderText(/paste file contents/i), {
      target: { value: "{}" },
    });
    await user.click(screen.getByRole("button", { name: /^parse$/i }));
    await waitFor(() => screen.getByText("JAVA_HOME"));
    await user.click(screen.getByRole("button", { name: /stage/i }));
    await waitFor(() => expect(onStage).toHaveBeenCalledTimes(1));
    const [sets] = onStage.mock.calls[0];
    expect(sets).toHaveLength(3);
  });

  it("Parse button disabled when textarea is empty", async () => {
    const user = userEvent.setup();
    render(<ImportExportPanel onStage={vi.fn()} />);
    await user.click(screen.getByRole("radio", { name: /^import$/i }));
    expect(screen.getByRole("button", { name: /^parse$/i })).toBeDisabled();
  });

  it("shows error status when parseImport fails", async () => {
    vi.mocked(api.parseImport).mockRejectedValueOnce(new Error("bad format"));
    const user = userEvent.setup();
    render(<ImportExportPanel onStage={vi.fn()} />);
    await user.click(screen.getByRole("radio", { name: /^import$/i }));
    fireEvent.change(screen.getByPlaceholderText(/paste file contents/i), {
      target: { value: "not valid" },
    });
    await user.click(screen.getByRole("button", { name: /^parse$/i }));
    await waitFor(() => expect(screen.getByText(/parse failed/i)).toBeInTheDocument());
  });

  it("shows secret warning in import preview when secrets present", async () => {
    vi.mocked(api.parseImport).mockResolvedValueOnce({
      user: { AWS_SECRET_ACCESS_KEY: "abc123" },
      system: {},
    });
    const user = userEvent.setup();
    render(<ImportExportPanel onStage={vi.fn()} />);
    await user.click(screen.getByRole("radio", { name: /^import$/i }));
    fireEvent.change(screen.getByPlaceholderText(/paste file contents/i), {
      target: { value: "{}" },
    });
    await user.click(screen.getByRole("button", { name: /^parse$/i }));
    await waitFor(() => expect(screen.getByText(/sensitive data/i)).toBeInTheDocument());
  });
});

import { open } from "@tauri-apps/plugin-dialog";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../api";
import type { StagedChange } from "../../hooks/useStaged";
import type { EnvVar } from "../../types";
import { DetailPanel } from "./DetailPanel";

vi.mock("../../api", () => ({
  api: { validatePaths: vi.fn() },
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}));

const noStaged = new Map<string, StagedChange>();

const simpleVar: EnvVar = {
  name: "JAVA_HOME",
  value: "C:\\Program Files\\Java\\jdk-21",
  scope: "User",
  listSeparator: null,
};

const pathVar: EnvVar = {
  name: "PATH",
  value: "C:\\Windows\\System32;C:\\Windows",
  scope: "User",
  listSeparator: ";",
};

const pathExtVar: EnvVar = {
  name: "PATHEXT",
  value: ".COM;.EXE;.BAT",
  scope: "User",
  listSeparator: ";",
};

describe("DetailPanel", () => {
  const onStage = vi.fn();
  const onStageDelete = vi.fn();
  const onUnstage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.validatePaths).mockResolvedValue([true]);
    vi.mocked(open).mockResolvedValue(null);
  });

  const render_ = (variable: EnvVar | null, elevated = true, staged = noStaged) =>
    render(
      <DetailPanel
        variable={variable}
        elevated={elevated}
        userPathInEnv={true}
        systemPathInEnv={true}
        staged={staged}
        onStage={onStage}
        onStageDelete={onStageDelete}
        onUnstage={onUnstage}
      />,
    );

  it("shows empty state when no variable selected", () => {
    render_(null);
    expect(screen.getByText(/select a variable/i)).toBeInTheDocument();
  });

  it("renders variable name", () => {
    render_(simpleVar);
    expect(screen.getByRole("heading", { name: "JAVA_HOME" })).toBeInTheDocument();
  });

  it("renders scope badge", () => {
    render_(simpleVar);
    const badge = screen.getAllByText("User")[0];
    expect(badge).toHaveClass("rounded-full");
  });

  it("shows Stage button after editing value", async () => {
    const user = userEvent.setup();
    render_(simpleVar);
    const textarea = screen.getByRole("textbox");
    await user.clear(textarea);
    await user.type(textarea, "NewValue");
    expect(screen.getByRole("button", { name: /^stage$/i })).toBeInTheDocument();
  });

  it("calls onStage with new value on Stage click", async () => {
    const user = userEvent.setup();
    render_(simpleVar);
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "NewValue");
    await user.click(screen.getByRole("button", { name: /^stage$/i }));
    expect(onStage).toHaveBeenCalledWith("JAVA_HOME", "User", "NewValue");
  });

  it("shows a folder picker button for path-like single values", () => {
    render_(simpleVar);
    expect(screen.getByRole("button", { name: /browse for folder/i })).toBeInTheDocument();
  });

  it("updates the value with the selected folder path", async () => {
    const user = userEvent.setup();
    vi.mocked(open).mockResolvedValue("C:\\Program Files\\Java\\jdk-22");
    render_(simpleVar);

    await user.click(screen.getByRole("button", { name: /browse for folder/i }));
    await user.click(screen.getByRole("button", { name: /^stage$/i }));

    expect(open).toHaveBeenCalledWith({
      directory: true,
      multiple: false,
      defaultPath: simpleVar.value,
    });
    expect(onStage).toHaveBeenCalledWith("JAVA_HOME", "User", "C:\\Program Files\\Java\\jdk-22");
  });

  it("does not show a folder picker button for non-path single values", () => {
    render_({ ...simpleVar, name: "NODE_ENV", value: "development" });
    expect(screen.queryByRole("button", { name: /browse for folder/i })).not.toBeInTheDocument();
  });

  it("shows PATH editor for path-like variable", () => {
    render_(pathVar);
    expect(screen.getByText(/drag to reorder/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /browse folder for/i })).toHaveLength(2);
  });

  it("does not show folder picker buttons for PATHEXT entries", () => {
    render_(pathExtVar);
    expect(screen.getByText(/drag to reorder/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /browse folder for/i })).not.toBeInTheDocument();
  });

  it("switches a list variable back to plain text editing", async () => {
    const user = userEvent.setup();
    render_(pathVar);

    expect(screen.getByText(/drag to reorder/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /plain text/i }));

    expect(screen.getByRole("textbox", { name: /value/i })).toHaveValue(pathVar.value);
    expect(screen.queryByText(/drag to reorder/i)).not.toBeInTheDocument();
  });

  it("shows Delete button when not dirty and not staged", () => {
    render_(simpleVar);
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("calls onStageDelete when Delete confirmed", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render_(simpleVar);
    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onStageDelete).toHaveBeenCalledWith("JAVA_HOME", "User");
  });

  it("hides edit controls for System variable when not elevated", () => {
    const sysVar: EnvVar = { ...simpleVar, scope: "System" };
    render_(sysVar, false);
    expect(screen.getByText(/restart as admin/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /browse for folder/i })).not.toBeInTheDocument();
  });

  it("shows staged badge and Unstage button when var is staged for set", () => {
    const stagedMap = new Map<string, StagedChange>([
      [
        "User:JAVA_HOME",
        {
          kind: "set",
          name: "JAVA_HOME",
          scope: "User",
          originalValue: "C:\\old",
          newValue: simpleVar.value,
        },
      ],
    ]);
    render_(simpleVar, true, stagedMap);
    expect(screen.getByText("staged")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /unstage/i })).toBeInTheDocument();
  });

  it("calls onUnstage when Unstage clicked on staged-set var", async () => {
    const user = userEvent.setup();
    const stagedMap = new Map<string, StagedChange>([
      [
        "User:JAVA_HOME",
        {
          kind: "set",
          name: "JAVA_HOME",
          scope: "User",
          originalValue: "C:\\old",
          newValue: simpleVar.value,
        },
      ],
    ]);
    render_(simpleVar, true, stagedMap);
    await user.click(screen.getByRole("button", { name: /unstage/i }));
    expect(onUnstage).toHaveBeenCalledWith("JAVA_HOME", "User");
  });

  it("shows staged-delete overlay when var is staged for delete", () => {
    const deletedVar: EnvVar = { ...simpleVar, value: "C:\\Program Files\\Java\\jdk-21" };
    const stagedMap = new Map<string, StagedChange>([
      [
        "User:JAVA_HOME",
        {
          kind: "delete",
          name: "JAVA_HOME",
          scope: "User",
          originalValue: deletedVar.value,
          newValue: null,
        },
      ],
    ]);
    render_(deletedVar, true, stagedMap);
    expect(screen.getByText(/staged for deletion/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /unstage/i })).toBeInTheDocument();
  });
});

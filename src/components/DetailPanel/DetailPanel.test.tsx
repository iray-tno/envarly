import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../api";
import type { EnvVar } from "../../types";
import { DetailPanel } from "./DetailPanel";

vi.mock("../../api", () => ({
  api: {
    setEnvVar: vi.fn(),
    deleteEnvVar: vi.fn(),
    validatePaths: vi.fn(),
  },
}));

const simpleVar: EnvVar = {
  name: "JAVA_HOME",
  value: "C:\\Program Files\\Java\\jdk-21",
  scope: "User",
  isPathLike: false,
};

const pathVar: EnvVar = {
  name: "PATH",
  value: "C:\\Windows\\System32;C:\\Windows",
  scope: "User",
  isPathLike: true,
};

describe("DetailPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.setEnvVar).mockResolvedValue(undefined);
    vi.mocked(api.deleteEnvVar).mockResolvedValue(undefined);
    vi.mocked(api.validatePaths).mockResolvedValue([true]);
  });

  const render_ = (variable: EnvVar | null, elevated = true) =>
    render(<DetailPanel variable={variable} elevated={elevated} onSaved={vi.fn()} onDeleted={vi.fn()} />);

  it("shows empty state when no variable selected", () => {
    render_( null);
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

  it("shows Apply button after editing value", async () => {
    const user = userEvent.setup();
    render_(simpleVar);
    const textarea = screen.getByRole("textbox");
    await user.clear(textarea);
    await user.type(textarea, "NewValue");
    expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();
  });

  it("calls api.setEnvVar on apply", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<DetailPanel variable={simpleVar} elevated onSaved={onSaved} onDeleted={vi.fn()} />);
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "NewValue");
    await user.click(screen.getByRole("button", { name: /apply/i }));
    await waitFor(() => {
      expect(api.setEnvVar).toHaveBeenCalledWith("JAVA_HOME", "NewValue", "User");
      expect(onSaved).toHaveBeenCalled();
    });
  });

  it("shows PathEditor for PATH variable", () => {
    render_(pathVar);
    expect(screen.getByText(/drag to reorder/i)).toBeInTheDocument();
  });

  it("shows success message after apply", async () => {
    const user = userEvent.setup();
    render_(simpleVar);
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "changed");
    await user.click(screen.getByRole("button", { name: /apply/i }));
    await waitFor(() =>
      expect(screen.getByText(/saved and broadcast/i)).toBeInTheDocument(),
    );
  });

  it("hides edit controls for System variable when not elevated", () => {
    const sysVar: EnvVar = { ...simpleVar, scope: "System" };
    render(<DetailPanel variable={sysVar} elevated={false} onSaved={vi.fn()} onDeleted={vi.fn()} />);
    expect(screen.getByText(/requires admin/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });
});

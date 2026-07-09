import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { EnvironmentDiagnostic } from "../../lib/environmentDiagnostics";
import { DiagnosticsPanel } from "./DiagnosticsPanel";

const diagnostic: EnvironmentDiagnostic = {
  id: "generated:User:USERPROFILE",
  kind: "windows-generated-override",
  severity: "attention",
  name: "USERPROFILE",
  scope: "User",
  action: { kind: "delete" },
};

describe("DiagnosticsPanel", () => {
  it("renders nothing when there are no diagnostics", () => {
    const { container } = render(
      <DiagnosticsPanel diagnostics={[]} elevated={false} onStageAction={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("stages a suggested action without applying it directly", async () => {
    const onStageAction = vi.fn();
    render(
      <DiagnosticsPanel
        diagnostics={[diagnostic]}
        elevated={false}
        onStageAction={onStageAction}
      />,
    );
    await userEvent.click(screen.getByText("Stage deletion"));
    expect(onStageAction).toHaveBeenCalledWith(diagnostic, diagnostic.action);
  });

  it("does not offer a system action when the app is not elevated", () => {
    render(
      <DiagnosticsPanel
        diagnostics={[{ ...diagnostic, scope: "System" }]}
        elevated={false}
        onStageAction={vi.fn()}
      />,
    );
    expect(screen.queryByText("Stage deletion")).not.toBeInTheDocument();
  });
});

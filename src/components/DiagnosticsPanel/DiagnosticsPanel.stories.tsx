import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { DiagnosticsPanel } from "./DiagnosticsPanel";

const meta: Meta<typeof DiagnosticsPanel> = {
  title: "Components/DiagnosticsPanel",
  component: DiagnosticsPanel,
  parameters: { layout: "fullscreen" },
  args: {
    elevated: true,
    onStageAction: fn(),
    diagnostics: [
      {
        id: "type:User:TOOLS",
        kind: "expandable-stored-as-string",
        severity: "attention",
        name: "TOOLS",
        scope: "User",
        action: { kind: "set-type", valueKind: "ExpandString" },
      },
      {
        id: "missing:System:Path",
        kind: "missing-path-entry",
        severity: "info",
        name: "Path",
        scope: "System",
        detail: "C:\\OldTools",
        action: { kind: "set-value", value: "C:\\Windows\\System32" },
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof DiagnosticsPanel>;

export const Default: Story = {};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { api } from "../../api";
import type { SnapshotMeta } from "../../types";
import { SnapshotPanelDock } from "./SnapshotPanelDock";

const storySnapshots: SnapshotMeta[] = [
  {
    version: 2,
    id: "snapshot-clean-dev",
    createdAt: "2026-07-12T09:00:00.000Z",
    label: "Clean developer setup",
    snapshot: { user: { PATH: { value: "C:\\Tools", kind: "ExpandString" } }, system: {} },
  },
];

const meta: Meta<typeof SnapshotPanelDock> = {
  title: "Components/SnapshotPanelDock",
  component: SnapshotPanelDock,
  parameters: { layout: "fullscreen" },
  args: { open: true, onClose: () => {}, onStageSnapshot: () => {} },
  decorators: [
    (Story) => {
      api.listSnapshots = async () => storySnapshots.map((s) => ({ ...s }));
      api.getRegistrySnapshot = async () => ({ user: {}, system: {} });
      return (
        <div className="h-[700px] flex justify-end overflow-hidden bg-canvas">
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof SnapshotPanelDock>;

export const Default: Story = {};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { SnapshotPanel } from "./SnapshotPanel";

const meta: Meta<typeof SnapshotPanel> = {
  title: "Components/SnapshotPanel",
  component: SnapshotPanel,
  parameters: { layout: "fullscreen" },
  args: { onStageSnapshot: () => {} },
};

export default meta;
type Story = StoryObj<typeof SnapshotPanel>;

export const Default: Story = {};

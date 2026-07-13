import type { Meta, StoryObj } from "@storybook/react-vite";
import { api } from "../../api";
import type { EnvSnapshot, SnapshotMeta } from "../../types";
import { SnapshotPanel } from "./SnapshotPanel";

const storySnapshots: SnapshotMeta[] = [
  {
    version: 2,
    id: "snapshot-clean-dev",
    createdAt: "2026-07-12T09:00:00.000Z",
    label: "Clean developer setup before upgrading Node and Java toolchains",
    snapshot: {
      user: { PATH: { value: "C:\\Tools", kind: "ExpandString" } },
      system: {},
    },
  },
  {
    version: 2,
    id: "snapshot-before-path",
    createdAt: "2026-07-10T15:30:00.000Z",
    label: "Before PATH cleanup",
    snapshot: {
      user: { PATH: { value: "C:\\OldTools;C:\\Tools", kind: "ExpandString" } },
      system: {},
    },
  },
];

const currentSnapshot: EnvSnapshot = {
  user: { PATH: { value: "C:\\Tools", kind: "ExpandString" } },
  system: {},
};

const meta: Meta<typeof SnapshotPanel> = {
  title: "Components/SnapshotPanel",
  component: SnapshotPanel,
  parameters: { layout: "fullscreen" },
  args: { onStageSnapshot: () => {} },
  decorators: [
    (Story) => {
      let snapshots = storySnapshots.map((snapshot) => ({ ...snapshot }));
      api.listSnapshots = async () => snapshots.map((snapshot) => ({ ...snapshot }));
      api.createSnapshot = async (label) => {
        const created = { ...storySnapshots[0], id: "snapshot-new", label };
        snapshots = [created, ...snapshots];
        return created;
      };
      api.renameSnapshot = async (id, label) => {
        const snapshotToRename = snapshots.find((snapshot) => snapshot.id === id);
        if (!snapshotToRename) throw new Error(`Snapshot not found: ${id}`);
        const renamed = { ...snapshotToRename, label };
        snapshots = snapshots.map((snapshot) => (snapshot.id === id ? renamed : snapshot));
        return renamed;
      };
      api.deleteSnapshot = async (id) => {
        snapshots = snapshots.filter((snapshot) => snapshot.id !== id);
      };
      api.getRegistrySnapshot = async () => currentSnapshot;
      return (
        <div className="h-[700px] w-[420px] bg-panel">
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof SnapshotPanel>;

export const Default: Story = {};

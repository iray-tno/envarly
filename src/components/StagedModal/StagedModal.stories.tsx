import type { Meta, StoryObj } from "@storybook/react-vite";
import type { DiffEntry } from "../../lib/diff";
import { StagedModal } from "./StagedModal";

const added: DiffEntry = { kind: "added", name: "NEW_VAR", scope: "User", value: "hello" };
const removed: DiffEntry = { kind: "removed", name: "OLD_VAR", scope: "User", value: "bye" };
const changed: DiffEntry = {
  kind: "changed",
  name: "PATH",
  scope: "User",
  oldValue: "C:\\old",
  newValue: "C:\\old;C:\\new",
};
const critical: DiffEntry = {
  kind: "changed",
  name: "SYSTEMROOT",
  scope: "System",
  oldValue: "C:\\Windows",
  newValue: "D:\\Windows",
};
const pathChange: DiffEntry = {
  kind: "changed",
  name: "PATH",
  scope: "System",
  oldValue: "C:\\Windows\\System32;C:\\Program Files\\Git\\bin",
  newValue: "C:\\Windows\\System32;C:\\Program Files\\Git\\bin;C:\\Users\\dev\\.cargo\\bin",
};

const meta: Meta<typeof StagedModal> = {
  title: "Components/StagedModal",
  component: StagedModal,
  tags: ["autodocs"],
  args: { busy: false, progress: null, log: [] },
  argTypes: { busy: { control: "boolean" } },
};
export default meta;
type Story = StoryObj<typeof StagedModal>;

export const MixedChanges: Story = {
  args: { diff: [added, removed, changed] },
};

export const PathListChange: Story = {
  args: { diff: [pathChange] },
};

export const CriticalVar: Story = {
  args: { diff: [critical, added] },
};

export const Busy: Story = {
  args: {
    diff: [added, changed],
    busy: true,
    progress: { index: 1, total: 2 },
    log: [
      {
        index: 0,
        total: 2,
        name: "NEW_VAR",
        scope: "User",
        action: "set",
        success: true,
        error: null,
      },
      {
        index: 1,
        total: 2,
        name: "PATH",
        scope: "User",
        action: "set",
        success: false,
        error: "registry verification failed",
      },
    ],
  },
};

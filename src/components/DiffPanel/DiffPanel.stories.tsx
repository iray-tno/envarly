import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { DiffPanel } from "./DiffPanel";
import type { DiffEntry } from "../../lib/diff";

const meta = {
  title: "Components/DiffPanel",
  component: DiffPanel,
  args: {
    onApply: fn(),
    onDismiss: fn(),
  },
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="w-[520px] h-[600px] bg-panel flex flex-col">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DiffPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const addedEntry: DiffEntry = {
  kind: "added",
  name: "OPENAI_API_KEY",
  scope: "User",
  value: "sk-proj-abc123xyz",
};

const removedEntry: DiffEntry = {
  kind: "removed",
  name: "DEPRECATED_VAR",
  scope: "User",
  value: "old_value",
};

const changedSimple: DiffEntry = {
  kind: "changed",
  name: "JAVA_HOME",
  scope: "User",
  oldValue: "C:\\Program Files\\Java\\jdk-17",
  newValue: "C:\\Program Files\\Java\\jdk-21",
};

const changedPath: DiffEntry = {
  kind: "changed",
  name: "PATH",
  scope: "User",
  oldValue:
    "C:\\Windows\\system32;C:\\Windows;C:\\Program Files\\Git\\bin;C:\\Users\\user\\.cargo\\bin",
  newValue:
    "C:\\Windows\\system32;C:\\Windows;C:\\Program Files\\Git\\bin;C:\\Users\\user\\.cargo\\bin;C:\\Users\\user\\.deno\\bin",
};

const systemAdded: DiffEntry = {
  kind: "added",
  name: "COMPANY_ENV",
  scope: "System",
  value: "production",
};

export const AllKinds: Story = {
  args: {
    entries: [addedEntry, removedEntry, changedSimple],
  },
};

export const WithPathDiff: Story = {
  args: {
    entries: [changedPath, changedSimple, addedEntry],
  },
};

export const OnlyAdded: Story = {
  args: {
    entries: [addedEntry, systemAdded],
  },
};

export const OnlyChanged: Story = {
  args: {
    entries: [changedSimple, changedPath],
  },
};

export const SingleEntry: Story = {
  args: {
    entries: [changedSimple],
  },
};

export const ManyEntries: Story = {
  args: {
    entries: [
      addedEntry,
      removedEntry,
      changedSimple,
      changedPath,
      systemAdded,
      { kind: "changed", name: "NODE_ENV", scope: "User", oldValue: "development", newValue: "production" },
      { kind: "removed", name: "OLD_DB_URL", scope: "System", value: "postgres://localhost/dev" },
    ],
  },
};

export const Busy: Story = {
  args: {
    entries: [addedEntry, removedEntry, changedSimple],
    busy: true,
  },
};

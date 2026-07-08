import type { Meta, StoryObj } from "@storybook/react-vite";
import type { StagedChange } from "../../hooks/useStaged";
import { DetailPanel } from "./DetailPanel";

const noStaged = new Map<string, StagedChange>();

const stagedSet = new Map<string, StagedChange>([
  [
    "User:JAVA_HOME",
    {
      kind: "set",
      name: "JAVA_HOME",
      scope: "User",
      originalValue: "C:\\Program Files\\Java\\jdk-17",
      newValue: "C:\\Program Files\\Java\\jdk-21",
    },
  ],
]);

const stagedDelete = new Map<string, StagedChange>([
  [
    "User:JAVA_HOME",
    {
      kind: "delete",
      name: "JAVA_HOME",
      scope: "User",
      originalValue: "C:\\Program Files\\Java\\jdk-21",
      newValue: null,
    },
  ],
]);

const meta: Meta<typeof DetailPanel> = {
  title: "Components/DetailPanel",
  component: DetailPanel,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ height: "600px", display: "flex", flex: 1, overflow: "hidden" }}>
        <Story />
      </div>
    ),
  ],
  args: {
    staged: noStaged,
    onStage: () => {},
    onStageDelete: () => {},
    onUnstage: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof DetailPanel>;

export const Empty: Story = {
  args: { variable: null },
};

export const SimpleVariable: Story = {
  args: {
    variable: {
      name: "JAVA_HOME",
      value: "C:\\Program Files\\Java\\jdk-21",
      scope: "User",
      listSeparator: null,
    },
  },
};

export const PathVariable: Story = {
  args: {
    variable: {
      name: "PATH",
      value: [
        "C:\\Windows\\System32",
        "C:\\Windows",
        "C:\\Program Files\\nodejs",
        "C:\\Users\\dev\\.cargo\\bin",
      ].join(";"),
      scope: "User",
      listSeparator: ";",
    },
  },
};

export const SystemVariable: Story = {
  args: {
    variable: {
      name: "PROCESSOR_ARCHITECTURE",
      value: "AMD64",
      scope: "System",
      listSeparator: null,
    },
  },
};

export const StagedModified: Story = {
  args: {
    staged: stagedSet,
    variable: {
      name: "JAVA_HOME",
      value: "C:\\Program Files\\Java\\jdk-21",
      scope: "User",
      listSeparator: null,
    },
  },
};

export const StagedDeleted: Story = {
  args: {
    staged: stagedDelete,
    variable: {
      name: "JAVA_HOME",
      value: "C:\\Program Files\\Java\\jdk-21",
      scope: "User",
      listSeparator: null,
    },
  },
};

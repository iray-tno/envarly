import type { Meta, StoryObj } from "@storybook/react";
import { DetailPanel } from "./DetailPanel";

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
    onSaved: () => {},
    onDeleted: () => {},
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
      isPathLike: false,
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
      isPathLike: true,
    },
  },
};

export const SystemVariable: Story = {
  args: {
    variable: {
      name: "PROCESSOR_ARCHITECTURE",
      value: "AMD64",
      scope: "System",
      isPathLike: false,
    },
  },
};

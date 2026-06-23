import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { EnvVar } from "../../types";
import { Sidebar } from "./Sidebar";

const SAMPLE_VARS: EnvVar[] = [
  { name: "PATH", value: "C:\\Windows\\System32;C:\\Program Files\\nodejs", scope: "User", isPathLike: true },
  { name: "JAVA_HOME", value: "C:\\Program Files\\Java\\jdk-21", scope: "User", isPathLike: false },
  { name: "NODE_ENV", value: "development", scope: "User", isPathLike: false },
  { name: "WINDIR", value: "C:\\Windows", scope: "System", isPathLike: false },
  { name: "SystemRoot", value: "C:\\Windows", scope: "System", isPathLike: false },
  { name: "PROCESSOR_ARCHITECTURE", value: "AMD64", scope: "System", isPathLike: false },
];

const meta: Meta<typeof Sidebar> = {
  title: "Components/Sidebar",
  component: Sidebar,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ height: "600px", display: "flex" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  render: () => {
    const [selected, setSelected] = useState<EnvVar | null>(null);
    return (
      <Sidebar vars={SAMPLE_VARS} selected={selected} onSelect={setSelected} loading={false} />
    );
  },
};

export const Loading: Story = {
  args: { vars: [], selected: null, onSelect: () => {}, loading: true },
};

export const Empty: Story = {
  args: { vars: [], selected: null, onSelect: () => {}, loading: false },
};

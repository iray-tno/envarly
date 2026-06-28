import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { StagedChange } from "../../hooks/useStaged";
import type { EnvVar } from "../../types";
import { Sidebar } from "./Sidebar";

const noStaged = new Map<string, StagedChange>();

const withStaged = new Map<string, StagedChange>([
  ["User:JAVA_HOME", { kind: "set", name: "JAVA_HOME", scope: "User", originalValue: "C:\\jdk-17", newValue: "C:\\Program Files\\Java\\jdk-21" }],
  ["User:NODE_ENV",  { kind: "delete", name: "NODE_ENV", scope: "User", originalValue: "development", newValue: null }],
  ["System:NEW_VAR", { kind: "set", name: "NEW_VAR", scope: "System", originalValue: null, newValue: "hello" }],
]);

const SAMPLE_VARS: EnvVar[] = [
  { name: "PATH", value: "C:\\Windows\\System32;C:\\Program Files\\nodejs", scope: "User", listSeparator: ";" },
  { name: "JAVA_HOME", value: "C:\\Program Files\\Java\\jdk-21", scope: "User", listSeparator: null },
  { name: "NODE_ENV", value: "development", scope: "User", listSeparator: null },
  { name: "WINDIR", value: "C:\\Windows", scope: "System", listSeparator: null },
  { name: "SystemRoot", value: "C:\\Windows", scope: "System", listSeparator: null },
  { name: "PROCESSOR_ARCHITECTURE", value: "AMD64", scope: "System", listSeparator: null },
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
      <Sidebar vars={SAMPLE_VARS} selected={selected} onSelect={setSelected} onCreateNew={() => {}} loading={false} staged={noStaged} />
    );
  },
};

export const WithStagedChanges: Story = {
  render: () => {
    const [selected, setSelected] = useState<EnvVar | null>(null);
    return (
      <Sidebar vars={SAMPLE_VARS} selected={selected} onSelect={setSelected} onCreateNew={() => {}} loading={false} staged={withStaged} />
    );
  },
};

export const Loading: Story = {
  args: { vars: [], selected: null, onSelect: () => {}, onCreateNew: () => {}, loading: true, staged: noStaged },
};

export const Empty: Story = {
  args: { vars: [], selected: null, onSelect: () => {}, onCreateNew: () => {}, loading: false, staged: noStaged },
};

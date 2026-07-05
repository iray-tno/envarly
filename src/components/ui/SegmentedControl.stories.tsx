import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { SegmentedControl } from "./SegmentedControl";

const meta: Meta<typeof SegmentedControl> = {
  title: "Primitives/SegmentedControl",
  component: SegmentedControl,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof SegmentedControl>;

export const ScopeFilter: Story = {
  render: () => {
    const [scope, setScope] = useState("All");
    return (
      <SegmentedControl
        aria-label="Filter by scope"
        value={scope}
        onChange={setScope}
        options={[
          { value: "All", label: "All", count: 42 },
          { value: "User", label: "User", count: 18 },
          { value: "System", label: "System", count: 24 },
        ]}
      />
    );
  },
};

export const FormatPicker: Story = {
  render: () => {
    const [fmt, setFmt] = useState("json");
    return (
      <SegmentedControl
        aria-label="Export format"
        value={fmt}
        onChange={setFmt}
        options={[
          { value: "json", label: ".json" },
          { value: "reg", label: ".reg" },
        ]}
      />
    );
  },
};

export const ModePicker: Story = {
  render: () => {
    const [mode, setMode] = useState("export");
    return (
      <SegmentedControl
        aria-label="Mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: "export", label: "Export" },
          { value: "import", label: "Import" },
        ]}
      />
    );
  },
};

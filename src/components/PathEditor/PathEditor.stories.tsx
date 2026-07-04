import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { PathEditor } from "./PathEditor";

const meta: Meta<typeof PathEditor> = {
  title: "Components/PathEditor",
  component: PathEditor,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 700, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PathEditor>;

const SAMPLE_PATH = [
  "C:\\Windows\\System32",
  "C:\\Windows",
  "C:\\Program Files\\nodejs",
  "C:\\Users\\dev\\.cargo\\bin",
  "C:\\NonExistentPath\\bin",
].join(";");

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState(SAMPLE_PATH);
    return <PathEditor rawValue={value} onChange={setValue} />;
  },
};

export const Empty: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return <PathEditor rawValue={value} onChange={setValue} />;
  },
};

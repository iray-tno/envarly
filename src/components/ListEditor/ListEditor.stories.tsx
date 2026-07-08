import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ListEditor } from "./ListEditor";

const meta: Meta<typeof ListEditor> = {
  title: "Components/ListEditor",
  component: ListEditor,
  tags: ["autodocs"],
  argTypes: {
    separator: { control: "radio", options: [";", ","] },
    readOnly: { control: "boolean" },
  },
};
export default meta;
type Story = StoryObj<typeof ListEditor>;

const PATH_VALUE =
  "C:\\Windows\\System32;C:\\Program Files\\Git\\bin;C:\\Users\\dev\\.cargo\\bin;C:\\Users\\dev\\.local\\bin";

export const PathSemicolon: Story = {
  render: (args) => {
    const [value, setValue] = useState(PATH_VALUE);
    return <ListEditor {...args} rawValue={value} onChange={setValue} />;
  },
  args: { separator: ";" },
};

export const CommaSeparated: Story = {
  render: (args) => {
    const [value, setValue] = useState("production,staging,development");
    return <ListEditor {...args} rawValue={value} onChange={setValue} />;
  },
  args: { separator: "," },
};

export const ReadOnly: Story = {
  render: (args) => <ListEditor {...args} rawValue={PATH_VALUE} onChange={() => {}} />,
  args: { separator: ";", readOnly: true },
};

export const Empty: Story = {
  render: (args) => {
    const [value, setValue] = useState("");
    return <ListEditor {...args} rawValue={value} onChange={setValue} />;
  },
  args: { separator: ";" },
};

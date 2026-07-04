import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./Textarea";

const meta: Meta<typeof Textarea> = {
  title: "ui/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: { label: "Value", rows: 4 },
  argTypes: {
    labelHidden: { control: "boolean" },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    error: { control: "text" },
  },
};
export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = { args: { placeholder: "Enter value…" } };
export const LabelHidden: Story = { args: { labelHidden: true, placeholder: "Paste contents here…" } };
export const WithValue: Story = {
  args: { value: "C:\\Program Files\\Java\\jdk-21", readOnly: false },
};
export const ReadOnly: Story = {
  args: { value: "C:\\Windows\\System32", readOnly: true },
};
export const Disabled: Story = {
  args: { value: "SOME_VALUE", disabled: true },
};
export const WithError: Story = {
  args: { error: "Value cannot be empty" },
};

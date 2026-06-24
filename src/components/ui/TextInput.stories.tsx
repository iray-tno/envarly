import type { Meta, StoryObj } from "@storybook/react";
import { TextInput } from "./TextInput";

const meta: Meta<typeof TextInput> = {
  title: "ui/TextInput",
  component: TextInput,
  tags: ["autodocs"],
  args: { label: "Variable name", placeholder: "e.g. MY_VAR" },
  argTypes: {
    labelHidden: { control: "boolean" },
    disabled: { control: "boolean" },
    error: { control: "text" },
  },
};
export default meta;
type Story = StoryObj<typeof TextInput>;

export const Default: Story = {};
export const LabelHidden: Story = { args: { labelHidden: true } };
export const WithError: Story = { args: { error: "This field is required" } };
export const Disabled: Story = { args: { disabled: true, value: "JAVA_HOME" } };
export const WithValue: Story = { args: { value: "C:\\Program Files\\Java\\jdk-21" } };

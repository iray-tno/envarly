import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { NewVarModal } from "./NewVarModal";

const meta: Meta<typeof NewVarModal> = {
  title: "Components/NewVarModal",
  component: NewVarModal,
  tags: ["autodocs"],
  args: {
    vars: [],
    elevated: false,
    onStage: fn(),
    onClose: fn(),
  },
  argTypes: {
    elevated: { control: "boolean" },
  },
};
export default meta;
type Story = StoryObj<typeof NewVarModal>;

export const Default: Story = {};

export const Elevated: Story = {
  args: { elevated: true },
};

export const WithExistingVar: Story = {
  args: {
    vars: [
      {
        name: "MY_VAR",
        value: "hello",
        valueKind: "String",
        scope: "User",
        listSeparator: null,
      },
    ],
  },
};

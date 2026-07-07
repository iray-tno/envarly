import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton } from "./IconButton";

const meta: Meta<typeof IconButton> = {
  title: "Primitives/IconButton",
  component: IconButton,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "radio", options: ["ghost", "danger"] },
    disabled: { control: "boolean" },
  },
};
export default meta;
type Story = StoryObj<typeof IconButton>;

export const Remove: Story = {
  args: { icon: "x", "aria-label": "Remove item", variant: "danger" },
};
export const Refresh: Story = {
  args: { icon: "refresh", "aria-label": "Refresh", variant: "ghost" },
};
export const DragHandle: Story = {
  args: { icon: "grip", "aria-label": "Drag to reorder", variant: "ghost" },
};
export const Disabled: Story = {
  args: { icon: "x", "aria-label": "Remove item", variant: "danger", disabled: true },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-2">
      <IconButton icon="x" aria-label="Remove" variant="danger" />
      <IconButton icon="refresh" aria-label="Refresh" variant="ghost" />
      <IconButton icon="grip" aria-label="Drag to reorder" variant="ghost" />
    </div>
  ),
};

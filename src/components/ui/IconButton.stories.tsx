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
  args: { icon: "×", "aria-label": "Remove item", variant: "danger" },
};
export const Refresh: Story = {
  args: { icon: "↻", "aria-label": "Refresh", variant: "ghost" },
};
export const DragHandle: Story = {
  args: { icon: "⠿", "aria-label": "Drag to reorder", variant: "ghost" },
};
export const Disabled: Story = {
  args: { icon: "×", "aria-label": "Remove item", variant: "danger", disabled: true },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-2">
      <IconButton icon="×" aria-label="Remove" variant="danger" />
      <IconButton icon="↻" aria-label="Refresh" variant="ghost" />
      <IconButton icon="⠿" aria-label="Drag to reorder" variant="ghost" />
    </div>
  ),
};

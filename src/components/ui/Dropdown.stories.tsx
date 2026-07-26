import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dropdown } from "./Dropdown";
import { IconButton } from "./IconButton";

const meta: Meta<typeof Dropdown> = {
  title: "Components/Dropdown",
  component: Dropdown,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof Dropdown>;

export const Default: Story = {
  render: () => (
    <Dropdown
      aria-label="More options"
      trigger={(triggerProps) => (
        <IconButton {...triggerProps} icon="more" aria-label="More options" />
      )}
    >
      <button
        type="button"
        className="flex w-full items-center rounded px-2 py-1.5 text-left text-sm text-muted hover:bg-hover hover:text-fg"
      >
        First item
      </button>
      <button
        type="button"
        className="flex w-full items-center rounded px-2 py-1.5 text-left text-sm text-muted hover:bg-hover hover:text-fg"
      >
        Second item
      </button>
      <button
        type="button"
        className="flex w-full items-center rounded px-2 py-1.5 text-left text-sm text-muted hover:bg-hover hover:text-fg"
      >
        Third item
      </button>
    </Dropdown>
  ),
};

export const AlignLeft: Story = {
  render: () => (
    <Dropdown
      align="left"
      aria-label="More options"
      trigger={(triggerProps) => (
        <IconButton {...triggerProps} icon="more" aria-label="More options" />
      )}
    >
      <button
        type="button"
        className="flex w-full items-center rounded px-2 py-1.5 text-left text-sm text-muted hover:bg-hover hover:text-fg"
      >
        Item
      </button>
    </Dropdown>
  ),
};

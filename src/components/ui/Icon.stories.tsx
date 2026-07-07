import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon, iconNames } from "./Icon";

const meta: Meta<typeof Icon> = {
  title: "Primitives/Icon",
  component: Icon,
  tags: ["autodocs"],
  argTypes: {
    name: { control: "select", options: iconNames },
    size: { control: "select", options: [12, 14, 16, 18, 20, 24, 32, 48] },
  },
};
export default meta;
type Story = StoryObj<typeof Icon>;

export const Single: Story = {
  args: { name: "warning", size: 24 },
};

export const Gallery: Story = {
  render: () => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
      {iconNames.map((name) => (
        <div
          key={name}
          className="flex items-center gap-2 rounded border border-rim bg-panel px-3 py-2 text-muted"
        >
          <Icon name={name} size={18} className="text-fg" />
          <span className="font-mono text-[11px]">{name}</span>
        </div>
      ))}
    </div>
  ),
};

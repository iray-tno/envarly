import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "ui/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "User" },
  argTypes: {
    variant: {
      control: "select",
      options: ["user", "system", "warn", "muted", "readonly"],
    },
  },
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const User: Story = { args: { variant: "user", children: "User" } };
export const System: Story = { args: { variant: "system", children: "System" } };
export const Warn: Story = { args: { variant: "warn", children: "Warning" } };
export const Muted: Story = { args: { variant: "muted", children: "Inactive" } };
export const Readonly: Story = {
  args: { variant: "readonly", children: "read-only · requires admin" },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="user">User</Badge>
      <Badge variant="system">System</Badge>
      <Badge variant="warn">Warning</Badge>
      <Badge variant="muted">Muted</Badge>
      <Badge variant="readonly">read-only · requires admin</Badge>
    </div>
  ),
};

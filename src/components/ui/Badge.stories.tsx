import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "Primitives/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "User" },
  argTypes: {
    variant: {
      control: "select",
      options: ["user", "system", "otherUser", "warn", "muted", "readonly"],
    },
  },
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const User: Story = {
  args: { variant: "user", children: "User" },
  play: async ({ canvasElement }) => {
    const badge = within(canvasElement).getByText("User");
    await expect(getComputedStyle(badge).display).toBe("inline-flex");
  },
};
export const System: Story = { args: { variant: "system", children: "System" } };
export const OtherUser: Story = { args: { variant: "otherUser", children: "Other user" } };
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
      <Badge variant="otherUser">Other user</Badge>
      <Badge variant="warn">Warning</Badge>
      <Badge variant="muted">Muted</Badge>
      <Badge variant="readonly">read-only · requires admin</Badge>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const label of [
      "User",
      "System",
      "Other user",
      "Warning",
      "Muted",
      "read-only · requires admin",
    ]) {
      const badge = canvas.getByText(label);
      const style = getComputedStyle(badge);
      await expect(badge.tagName).toBe("SPAN");
      await expect(style.display).toBe("flex");
      await expect(style.paddingLeft).toBe("12px");
      await expect(style.paddingTop).toBe("4px");
    }
  },
};

export const CustomStyle: Story = {
  args: { variant: "user", children: "Custom", className: "px-2 normal-case text-danger" },
  play: async ({ canvasElement }) => {
    const badge = within(canvasElement).getByText("Custom");
    const style = getComputedStyle(badge);
    await expect(style.paddingLeft).toBe("8px");
    await expect(style.textTransform).toBe("none");
  },
};

export const LightTheme: Story = {
  args: { variant: "user", children: "User" },
  globals: { theme: "light" },
  play: async ({ canvasElement }) => {
    const style = getComputedStyle(within(canvasElement).getByText("User"));
    await expect(style.color).toBe("rgb(5, 80, 174)");
    await expect(style.backgroundColor).toMatch(/(?:, |\/ )0\.15\)$/);
  },
};

export const DarkTheme: Story = {
  args: { variant: "user", children: "User" },
  globals: { theme: "dark" },
  play: async ({ canvasElement }) => {
    const style = getComputedStyle(within(canvasElement).getByText("User"));
    await expect(style.color).toBe("rgb(88, 166, 255)");
    await expect(style.backgroundColor).toMatch(/(?:, |\/ )0\.15\)$/);
  },
};

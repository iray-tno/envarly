import type { Meta, StoryObj } from "@storybook/react-vite";
import { PathBanner } from "./PathBanner";

const meta: Meta<typeof PathBanner> = {
  title: "Components/PathBanner",
  component: PathBanner,
  tags: ["autodocs"],
  args: { scopeLabel: "User" },
};
export default meta;
type Story = StoryObj<typeof PathBanner>;

export const UserScope: Story = { args: { scopeLabel: "User" } };
export const SystemScope: Story = { args: { scopeLabel: "System" } };
export const OtherUserScope: Story = { args: { scopeLabel: "alice" } };

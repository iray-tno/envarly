import type { Meta, StoryObj } from "@storybook/react-vite";
import { PathBanner } from "./PathBanner";

const meta: Meta<typeof PathBanner> = {
  title: "Components/PathBanner",
  component: PathBanner,
  tags: ["autodocs"],
  args: { scope: "User" },
  argTypes: {
    scope: { control: "radio", options: ["User", "System"] },
  },
};
export default meta;
type Story = StoryObj<typeof PathBanner>;

export const UserScope: Story = { args: { scope: "User" } };
export const SystemScope: Story = { args: { scope: "System" } };

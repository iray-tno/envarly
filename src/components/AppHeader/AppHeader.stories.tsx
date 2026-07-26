import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { AppHeader } from "./AppHeader";

const meta: Meta<typeof AppHeader> = {
  title: "Components/AppHeader",
  component: AppHeader,
  tags: ["autodocs"],
  args: {
    loading: false,
    stagedCount: 0,
    diffCount: 0,
    elevated: false,
    snapshotsOpen: false,
    theme: "dark",
    updateInfo: null,
  },
  argTypes: {
    loading: { control: "boolean" },
    stagedCount: { control: "number" },
    diffCount: { control: "number" },
    elevated: { control: "boolean" },
    snapshotsOpen: { control: "boolean" },
    theme: { control: "radio", options: ["dark", "light"] },
  },
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof AppHeader>;

export const Default: Story = {};

export const WithStagedChanges: Story = {
  args: { stagedCount: 5 },
};

export const WithExternalChanges: Story = {
  args: { diffCount: 3 },
};

export const Elevated: Story = {
  args: { elevated: true },
};

export const SnapshotsOpen: Story = {
  args: { snapshotsOpen: true },
};

export const Loading: Story = {
  args: { loading: true },
};

export const UpdateAvailable: Story = {
  args: { updateInfo: { version: "1.3.0", url: "https://github.com/iray-tno/envarly/releases" } },
};

/** Forces the header below the lg (1024px) breakpoint, where GitHub/Language/
 * Theme/Licenses collapse into the "more options" dropdown, to verify neither
 * the always-visible items nor the collapsed group break at this width. */
export const Narrow: Story = {
  args: {
    stagedCount: 5,
    updateInfo: { version: "1.3.0", url: "https://github.com/iray-tno/envarly/releases" },
  },
  decorators: [
    (Story) => (
      <div className="w-[820px] overflow-hidden">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await waitFor(() => canvas.getByTestId("header-more-trigger"));
    trigger.click();
    const panel = await waitFor(() => canvas.getByRole("group"));
    // 3 buttons (GitHub, theme, licenses) + the language <select>.
    const buttons = within(panel).getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(within(panel).getByRole("combobox")).toBeVisible();
  },
};

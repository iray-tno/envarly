import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { LicensesPanel } from "./LicensesPanel";

const meta: Meta<typeof LicensesPanel> = {
  title: "Components/LicensesPanel",
  component: LicensesPanel,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="h-[600px] w-[700px] bg-panel flex flex-col">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof LicensesPanel>;

export const Envarly: Story = {};

export const ThirdParty: Story = {
  play: async ({ canvasElement }) => {
    const thirdPartyTab = await waitFor(() => {
      const button = Array.from(canvasElement.querySelectorAll("button")).find((btn) =>
        btn.textContent?.includes("Third-party"),
      );
      expect(button).toBeTruthy();
      return button;
    });
    thirdPartyTab?.click();

    await waitFor(() => {
      expect(canvasElement.querySelector("table")).toBeTruthy();
    });
  },
};

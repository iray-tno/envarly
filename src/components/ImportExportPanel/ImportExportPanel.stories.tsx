import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ImportExportPanel } from "./ImportExportPanel";

const meta = {
  title: "Components/ImportExportPanel",
  component: ImportExportPanel,
  args: { onStage: fn() },
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="w-[580px] h-[640px] bg-panel flex flex-col">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ImportExportPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ExportDefault: Story = {};

export const ImportEmpty: Story = {
  play: async ({ canvasElement }) => {
    const btn = canvasElement.querySelector("button[class*='import']");
    (btn as HTMLButtonElement | null)?.click();
  },
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { api } from "../../api";
import type { CheckCommandResult } from "../../types";
import { CheckCommandPanel } from "./CheckCommandPanel";

const meta = {
  title: "Components/CheckCommandPanel",
  component: CheckCommandPanel,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="w-[560px] h-[420px] bg-panel flex flex-col">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CheckCommandPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// Query elements using data-testid and data-status attributes to remain locale-independent.
async function typeAndCheck(canvasElement: HTMLElement, query: string) {
  const canvas = within(canvasElement);
  const input = await canvas.findByTestId("check-command-input");
  await userEvent.type(input, `${query}{Enter}`);
}

export const Empty: Story = {};

export const SingleHitActive: Story = {
  decorators: [
    (Story) => {
      api.checkCommand = async (): Promise<CheckCommandResult> => ({
        input: "node",
        queriedName: "node.EXE",
        hadExtension: false,
        hits: [
          { directory: "C:\\Program Files\\nodejs", matchedFile: "node.EXE", source: "System" },
        ],
        fullPathStatus: null,
      });
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    await typeAndCheck(canvasElement, "node");
    const canvas = within(canvasElement);
    await waitFor(async () =>
      expect(await canvas.findAllByTestId("check-command-hit")).toHaveLength(1),
    );
    const hits = canvas.getAllByTestId("check-command-hit");
    expect(hits[0]).toHaveAttribute("data-status", "active");
  },
};

export const ShadowedAcrossDirs: Story = {
  decorators: [
    (Story) => {
      api.checkCommand = async (): Promise<CheckCommandResult> => ({
        input: "node",
        queriedName: "node.EXE",
        hadExtension: false,
        hits: [
          { directory: "C:\\Windows\\System32", matchedFile: "node.EXE", source: "System" },
          { directory: "C:\\Program Files\\nodejs", matchedFile: "node.EXE", source: "User" },
          { directory: "C:\\Users\\dev\\.local\\bin", matchedFile: "node.EXE", source: "User" },
        ],
        fullPathStatus: null,
      });
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    await typeAndCheck(canvasElement, "node");
    const canvas = within(canvasElement);
    const hits = await waitFor(async () => {
      const els = await canvas.findAllByTestId("check-command-hit");
      expect(els).toHaveLength(3);
      return els;
    });
    expect(hits[0]).toHaveAttribute("data-status", "active");
    expect(hits[1]).toHaveAttribute("data-status", "shadowed");
    expect(hits[2]).toHaveAttribute("data-status", "shadowed");
  },
};

export const NotFound: Story = {
  decorators: [
    (Story) => {
      api.checkCommand = async (): Promise<CheckCommandResult> => ({
        input: "ghosttool",
        queriedName: "ghosttool.EXE",
        hadExtension: false,
        hits: [],
        fullPathStatus: null,
      });
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    await typeAndCheck(canvasElement, "ghosttool");
    const canvas = within(canvasElement);
    await waitFor(async () =>
      expect(await canvas.findByTestId("check-command-not-found")).toBeVisible(),
    );
  },
};

export const FullPathNotOnEffectivePath: Story = {
  decorators: [
    (Story) => {
      api.checkCommand = async (): Promise<CheckCommandResult> => ({
        input: "C:\\OldTools\\node.exe",
        queriedName: "node.exe",
        hadExtension: true,
        hits: [
          { directory: "C:\\Program Files\\nodejs", matchedFile: "node.exe", source: "System" },
        ],
        fullPathStatus: { status: "notOnEffectivePath" },
      });
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    await typeAndCheck(canvasElement, "C:\\OldTools\\node.exe");
    const canvas = within(canvasElement);
    const callout = await waitFor(async () =>
      canvas.findByTestId("check-command-full-path-status"),
    );
    expect(callout).toHaveAttribute("data-status", "notOnEffectivePath");
  },
};

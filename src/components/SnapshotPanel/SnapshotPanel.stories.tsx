import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { api } from "../../api";
import type { EnvSnapshot, SnapshotMeta } from "../../types";
import { SnapshotPanel } from "./SnapshotPanel";

const storySnapshots: SnapshotMeta[] = [
  {
    version: 2,
    id: "snapshot-clean-dev",
    createdAt: "2026-07-12T09:00:00.000Z",
    label: "Clean developer setup before upgrading Node and Java toolchains",
    snapshot: {
      user: { PATH: { value: "C:\\Tools", kind: "ExpandString" } },
      system: {},
    },
  },
  {
    version: 2,
    id: "snapshot-before-path",
    createdAt: "2026-07-10T15:30:00.000Z",
    label: "Before PATH cleanup",
    snapshot: {
      user: { PATH: { value: "C:\\OldTools;C:\\Tools", kind: "ExpandString" } },
      system: {},
    },
  },
];

const currentSnapshot: EnvSnapshot = {
  user: { PATH: { value: "C:\\Tools", kind: "ExpandString" } },
  system: {},
};

const manySnapshots = Array.from(
  { length: 12 },
  (_, index): SnapshotMeta => ({
    ...storySnapshots[index % storySnapshots.length],
    id: `snapshot-${index + 1}`,
    createdAt: new Date(Date.UTC(2026, 6, 12 - index, 9)).toISOString(),
    label: `Snapshot ${index + 1}: developer environment before toolchain update`,
  }),
);

const wideDiffSnapshot: SnapshotMeta = {
  ...storySnapshots[1],
  id: "snapshot-wide-diff",
  label: "Before consolidating development tool directories",
  snapshot: {
    user: {
      PATH: {
        value:
          "C:\\Program Files\\Java\\jdk-21\\bin;C:\\Program Files\\Git\\cmd;C:\\Users\\dev\\AppData\\Local\\Programs\\Python\\Python313\\Scripts;C:\\Users\\dev\\.cargo\\bin",
        kind: "ExpandString",
      },
    },
    system: {},
  },
};

const meta: Meta<typeof SnapshotPanel> = {
  title: "Components/SnapshotPanel",
  component: SnapshotPanel,
  parameters: { layout: "fullscreen" },
  args: { onStageSnapshot: () => {} },
  decorators: [
    (Story, context) => {
      const fixtures =
        (context.parameters.snapshotFixtures as SnapshotMeta[] | undefined) ?? storySnapshots;
      let snapshots = fixtures.map((snapshot) => ({ ...snapshot }));
      api.listSnapshots = async () => snapshots.map((snapshot) => ({ ...snapshot }));
      api.createSnapshot = async (label) => {
        const created = { ...storySnapshots[0], id: "snapshot-new", label };
        snapshots = [created, ...snapshots];
        return created;
      };
      api.renameSnapshot = async (id, label) => {
        const snapshotToRename = snapshots.find((snapshot) => snapshot.id === id);
        if (!snapshotToRename) throw new Error(`Snapshot not found: ${id}`);
        const renamed = { ...snapshotToRename, label };
        snapshots = snapshots.map((snapshot) => (snapshot.id === id ? renamed : snapshot));
        return renamed;
      };
      api.deleteSnapshot = async (id) => {
        snapshots = snapshots.filter((snapshot) => snapshot.id !== id);
      };
      api.getRegistrySnapshot = async () => currentSnapshot;
      return (
        <div className="h-[700px] w-[420px] overflow-hidden bg-panel transform-gpu">
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof SnapshotPanel>;

export const Default: Story = {};

export const ManySnapshots: Story = {
  parameters: { snapshotFixtures: manySnapshots },
  play: async ({ canvasElement }) => {
    const scrollRegion = canvasElement.querySelector<HTMLElement>(
      '[data-testid="snapshot-panel-scroll"]',
    );
    await waitFor(() =>
      expect(scrollRegion?.scrollHeight).toBeGreaterThan(scrollRegion?.clientHeight ?? 0),
    );

    if (!scrollRegion) return;
    scrollRegion.scrollTop = scrollRegion.scrollHeight;
    expect(scrollRegion.scrollTop).toBeGreaterThan(0);
  },
};

export const Compare: Story = {
  play: async ({ canvasElement }) => {
    // Button text is localized, so navigate by structural position instead:
    // each card renders [Preview, Compare, rename-icon, delete-icon] normally,
    // and just [Compare with] once a compare source is picked.
    const cards = await waitFor(() => {
      const els = Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-snapshot-id]"));
      expect(els.length).toBeGreaterThanOrEqual(2);
      return els;
    });

    const compareButton = cards[0].querySelectorAll("button")[1];
    compareButton.click();

    const compareWithButton = await waitFor(() => {
      const button = cards[1].querySelector("button");
      expect(button).toBeTruthy();
      return button;
    });
    compareWithButton?.click();

    await waitFor(() => {
      const dialog = canvasElement.ownerDocument.querySelector<HTMLElement>('[role="dialog"]');
      expect(dialog?.parentElement).toBe(canvasElement.ownerDocument.body);
    });
  },
};

export const WidePreviewDiff: Story = {
  parameters: { snapshotFixtures: [wideDiffSnapshot] },
  play: async ({ canvasElement }) => {
    const previewButton = await waitFor(() => {
      const button = canvasElement.querySelector<HTMLButtonElement>("[data-snapshot-id] button");
      expect(button).toBeTruthy();
      return button;
    });
    previewButton?.click();

    await waitFor(() => {
      const dialog = canvasElement.ownerDocument.querySelector<HTMLElement>('[role="dialog"]');
      expect(dialog?.parentElement).toBe(canvasElement.ownerDocument.body);
    });

    const scrollRegion = await waitFor(() => {
      const region = canvasElement.ownerDocument.querySelector<HTMLElement>(
        '[data-testid="snapshot-diff-scroll"]',
      );
      expect(region?.scrollWidth).toBeGreaterThan(region?.clientWidth ?? 0);
      return region;
    });

    if (!scrollRegion) return;
    scrollRegion.scrollLeft = scrollRegion.scrollWidth;
    expect(scrollRegion.scrollLeft).toBeGreaterThan(0);
  },
};

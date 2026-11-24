import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "./Button";
import { Modal } from "./Modal";

const meta: Meta<typeof Modal> = {
  title: "Primitives/Modal",
  component: Modal,
  tags: ["autodocs"],
  argTypes: {
    size: { control: "radio", options: ["md", "lg", "xl", "2xl"] },
    open: { control: "boolean" },
    flex: { control: "boolean" },
  },
};
export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open modal</Button>
        <Modal {...args} open={open} onClose={() => setOpen(false)}>
          <div className="px-6 py-5 text-sm text-muted">Modal content goes here.</div>
        </Modal>
      </>
    );
  },
  args: { title: "Dialog title", size: "lg" },
};

export const NoTitle: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open modal</Button>
        <Modal {...args} open={open} onClose={() => setOpen(false)}>
          <div className="px-6 py-5 text-sm text-muted">
            No title bar — close via backdrop or Escape.
          </div>
        </Modal>
      </>
    );
  },
  args: { ariaLabel: "Untitled dialog", size: "md" },
};

export const Sizes: Story = {
  render: () => {
    const [size, setSize] = useState<"md" | "lg" | "xl" | "2xl" | null>(null);
    return (
      <div className="flex gap-2 flex-wrap">
        {(["md", "lg", "xl", "2xl"] as const).map((s) => (
          <Button key={s} variant="secondary" onClick={() => setSize(s)}>
            {s}
          </Button>
        ))}
        {size && (
          <Modal open title={`Size: ${size}`} size={size} onClose={() => setSize(null)}>
            <div className="px-6 py-5 text-sm text-muted">
              Content at size <code>{size}</code>.
            </div>
          </Modal>
        )}
      </div>
    );
  },
};

/**
 * The exit motion: on close the dialog stays shown, and still modal, with
 * `data-state="closed"` while its backdrop and panel animate out, and is
 * removed after. In a browser because the exit is timed by CSS, which jsdom
 * does not load.
 */
export const ExitMotion: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open modal</Button>
        <Modal {...args} open={open} onClose={() => setOpen(false)}>
          <div className="px-6 py-5 text-sm text-muted">Modal content goes here.</div>
        </Modal>
      </>
    );
  },
  args: { title: "Dialog title", size: "lg" },
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    const screen = within(doc.body);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("data-state", "open");

    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => expect(dialog).toHaveAttribute("data-state", "closed"));
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(dialog.matches(":modal")).toBe(true);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

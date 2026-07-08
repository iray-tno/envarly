import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
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
  args: { size: "md" },
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

import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Design System/Colors",
  tags: ["autodocs"],
};
export default meta;

const semanticColors = [
  { name: "canvas", cls: "bg-canvas", label: "Canvas", desc: "App background" },
  { name: "panel", cls: "bg-panel", label: "Panel", desc: "Sidebar, header, overlays" },
  { name: "surface", cls: "bg-surface", label: "Surface", desc: "Input fields, cards" },
  { name: "hover", cls: "bg-hover", label: "Hover", desc: "Hover / selected states" },
  { name: "rim", cls: "bg-rim", label: "Rim", desc: "Primary borders" },
  { name: "rim-subtle", cls: "bg-rim-subtle", label: "Rim subtle", desc: "Faint dividers" },
];

const textColors = [
  { name: "fg", cls: "bg-fg", label: "Foreground", desc: "Primary text" },
  { name: "muted", cls: "bg-muted", label: "Muted", desc: "Secondary text, labels" },
  { name: "dim", cls: "bg-dim", label: "Dim", desc: "Placeholder, disabled" },
];

const accentColors = [
  { name: "accent", cls: "bg-accent", label: "Accent", desc: "Primary action, links" },
  { name: "accent-hi", cls: "bg-accent-hi", label: "Accent hi", desc: "Accent hover / focus ring" },
  { name: "success", cls: "bg-success", label: "Success", desc: "Added, ok states" },
  { name: "danger", cls: "bg-danger", label: "Danger", desc: "Errors, destructive actions" },
  { name: "warn", cls: "bg-warn", label: "Warn", desc: "Warnings, external changes" },
  { name: "violet", cls: "bg-violet", label: "Violet", desc: "System scope badge" },
];

function SwatchRow({ colors }: { colors: typeof semanticColors }) {
  return (
    <div className="flex flex-wrap gap-3">
      {colors.map((c) => (
        <div key={c.name} className="flex flex-col gap-1 w-32">
          <div className={`${c.cls} h-14 rounded border border-rim`} />
          <p className="text-xs font-semibold text-fg">{c.label}</p>
          <p className="text-[10px] text-dim">{c.desc}</p>
          <p className="text-[9px] font-mono text-muted">{c.name}</p>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide border-b border-rim pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

export const Palette: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-10 p-8 bg-canvas min-h-screen">
      <Section title="Surface">
        <SwatchRow colors={semanticColors} />
      </Section>
      <Section title="Text">
        <SwatchRow colors={textColors} />
      </Section>
      <Section title="Semantic">
        <SwatchRow colors={accentColors} />
      </Section>
    </div>
  ),
};

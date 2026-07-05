import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Design System/Typography",
  tags: ["autodocs"],
};
export default meta;

const scale = [
  { label: "text-xs",   cls: "text-xs",   size: "12px" },
  { label: "text-sm",   cls: "text-sm",   size: "14px" },
  { label: "text-base", cls: "text-base", size: "16px" },
  { label: "text-lg",   cls: "text-lg",   size: "18px" },
  { label: "text-xl",   cls: "text-xl",   size: "20px" },
];

const weights = [
  { label: "normal",    cls: "font-normal" },
  { label: "medium",    cls: "font-medium" },
  { label: "semibold",  cls: "font-semibold" },
  { label: "bold",      cls: "font-bold" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide border-b border-rim pb-2">{title}</h2>
      {children}
    </section>
  );
}

export const Scale: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-10 p-8 bg-canvas min-h-screen">
      <Section title="Font scale (sans)">
        <div className="flex flex-col gap-4">
          {scale.map((s) => (
            <div key={s.label} className="flex items-baseline gap-6">
              <span className="text-[10px] font-mono text-dim w-20 shrink-0">{s.label} / {s.size}</span>
              <span className={`${s.cls} text-fg`}>The quick brown fox jumps over the lazy dog</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Font scale (mono)">
        <div className="flex flex-col gap-4">
          {scale.map((s) => (
            <div key={s.label} className="flex items-baseline gap-6">
              <span className="text-[10px] font-mono text-dim w-20 shrink-0">{s.label} / {s.size}</span>
              <span className={`${s.cls} font-mono text-fg`}>PATH=C:\Windows\System32;C:\Program Files</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Font weight">
        <div className="flex gap-8 flex-wrap">
          {weights.map((w) => (
            <div key={w.label} className="flex flex-col gap-1">
              <span className={`${w.cls} text-base text-fg`}>Aa</span>
              <span className="text-[10px] font-mono text-dim">{w.label}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Patterns in use">
        <div className="flex flex-col gap-3 p-4 bg-panel rounded border border-rim">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Section label</p>
          <h2 className="text-sm font-semibold text-fg">Panel heading</h2>
          <p className="text-xs text-muted">Descriptive body text that provides context for the user.</p>
          <p className="text-[10px] text-dim">Metadata / timestamp</p>
          <code className="font-mono text-sm text-fg">MY_VARIABLE=some_value</code>
        </div>
      </Section>
    </div>
  ),
};

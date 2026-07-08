import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Design System/Spacing",
  tags: ["autodocs"],
};
export default meta;

const steps = [
  { token: "0.5", px: "2px" },
  { token: "1", px: "4px" },
  { token: "1.5", px: "6px" },
  { token: "2", px: "8px" },
  { token: "2.5", px: "10px" },
  { token: "3", px: "12px" },
  { token: "4", px: "16px" },
  { token: "5", px: "20px" },
  { token: "6", px: "24px" },
  { token: "8", px: "32px" },
  { token: "10", px: "40px" },
  { token: "12", px: "48px" },
  { token: "16", px: "64px" },
];

const patterns = [
  { label: "Button padding", cls: "px-3 py-1.5", desc: "px-3 py-1.5" },
  { label: "Panel padding", cls: "px-5 py-4", desc: "px-5 py-4" },
  { label: "Section gap", cls: "gap-4", desc: "gap-4 (between fields)" },
  { label: "Inline chip gap", cls: "gap-1.5", desc: "gap-1.5 (badge + text)" },
];

export const Scale: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-10 p-8 bg-canvas min-h-screen">
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide border-b border-rim pb-2">
          Spacing scale
        </h2>
        <div className="flex flex-col gap-2">
          {steps.map((s) => (
            <div key={s.token} className="flex items-center gap-4">
              <span className="text-[10px] font-mono text-dim w-16 shrink-0">
                {s.token} / {s.px}
              </span>
              <div className="bg-accent/60 h-4 rounded shrink-0" style={{ width: s.px }} />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide border-b border-rim pb-2">
          Common patterns
        </h2>
        <div className="flex flex-col gap-3">
          {patterns.map((p) => (
            <div key={p.label} className="flex items-center gap-6">
              <span className="text-xs text-muted w-36 shrink-0">{p.label}</span>
              <div
                className={`${p.cls} bg-surface border border-rim rounded text-xs text-fg inline-flex items-center`}
              >
                <span className="bg-accent/20 rounded">&nbsp;</span>
              </div>
              <code className="text-[10px] font-mono text-dim">{p.desc}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide border-b border-rim pb-2">
          Border radius
        </h2>
        <div className="flex gap-6 flex-wrap">
          {(["rounded-sm", "rounded", "rounded-md", "rounded-lg", "rounded-full"] as const).map(
            (r) => (
              <div key={r} className="flex flex-col items-center gap-2">
                <div className={`${r} w-12 h-12 bg-accent/30 border border-accent/50`} />
                <span className="text-[10px] font-mono text-dim">{r}</span>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  ),
};

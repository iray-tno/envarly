import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type Variant = "user" | "system" | "warn" | "muted" | "readonly";

const variantCls: Record<Variant, string> = {
  user:     "bg-accent/15 text-accent",
  system:   "bg-violet/15 text-violet",
  warn:     "bg-warn/15 text-warn",
  muted:    "bg-hover text-dim",
  readonly: "border border-rim text-dim",
};

interface Props {
  variant: Variant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant, children, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide shrink-0",
        variantCls[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

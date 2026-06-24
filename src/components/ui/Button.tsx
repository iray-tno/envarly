import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "warn";
type Size = "sm" | "md";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantCls: Record<Variant, string> = {
  primary:   "bg-accent text-canvas hover:bg-accent-hi",
  secondary: "border border-rim text-muted hover:bg-hover hover:text-fg",
  ghost:     "text-muted hover:bg-hover hover:text-fg",
  danger:    "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
  warn:      "border border-warn/40 text-warn hover:bg-warn/10",
};

const sizeCls: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm font-medium",
};

export function Button({ variant = "ghost", size = "sm", className, children, ...props }: Props) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center gap-1.5 rounded font-medium transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantCls[variant],
        sizeCls[size],
        className,
      )}
    >
      {children}
    </button>
  );
}

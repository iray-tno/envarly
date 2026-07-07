import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "warn" | "link";
type Size = "xs" | "sm" | "md";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconPosition?: "left" | "right";
}

const variantCls: Record<Variant, string> = {
  primary:   "bg-accent text-canvas hover:bg-accent-hi",
  secondary: "border border-rim text-muted hover:bg-hover hover:text-fg",
  ghost:     "text-muted hover:bg-hover hover:text-fg",
  danger:    "bg-danger/15 text-danger border border-danger hover:bg-danger/25",
  warn:      "border border-warn text-warn hover:bg-warn/10",
  link:      "text-muted hover:text-fg hover:underline",
};

const sizeCls: Record<Size, string> = {
  xs: "px-2 py-1 text-xs",
  sm: "px-4 py-2.5 text-sm",
  md: "px-5 py-3 text-sm font-medium",
};

export function Button({
  variant = "ghost",
  size = "sm",
  icon,
  iconPosition = "left",
  className,
  children,
  ...props
}: Props) {
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
      {icon && iconPosition === "left" && <Icon name={icon} size={14} />}
      {children}
      {icon && iconPosition === "right" && <Icon name={icon} size={14} />}
    </button>
  );
}

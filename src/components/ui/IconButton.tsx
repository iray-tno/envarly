import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { Icon, type IconName } from "./Icon";

type Variant = "ghost" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  icon: IconName;
  variant?: Variant;
}

export function IconButton({ icon, variant = "ghost", className, ...props }: Props) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded leading-none transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "ghost" && "text-dim hover:text-fg hover:bg-hover",
        variant === "danger" && "text-dim hover:text-danger",
        className,
      )}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

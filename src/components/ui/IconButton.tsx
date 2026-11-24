import { cn } from "../../lib/cn";
import { type ButtonBaseProps, ButtonHost } from "./Button";
import { Icon, type IconName } from "./Icon";

type Variant = "ghost" | "danger";

interface Props extends Omit<ButtonBaseProps, "children"> {
  "aria-label": string;
  icon: IconName;
  variant?: Variant;
}

/** The icon button's look, also used for triggers whose button Hozo renders (Dropdown). */
export function iconButtonClassName(variant: Variant = "ghost", className?: string) {
  return cn(
    "inline-flex size-7 items-center justify-center rounded leading-none transition-colors",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    variant === "ghost" && "text-dim hover:text-fg hover:bg-hover",
    variant === "danger" && "text-dim hover:text-danger",
    className,
  );
}

export function IconButton({ icon, variant = "ghost", className, ...props }: Props) {
  return (
    <ButtonHost {...props} className={iconButtonClassName(variant, className)}>
      <Icon name={icon} size={16} />
    </ButtonHost>
  );
}

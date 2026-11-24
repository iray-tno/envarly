import { Button as HozoButton } from "@hozo/core";
import type { MouseEventHandler, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Icon, type IconName } from "./Icon";
import { Tooltip } from "./Tooltip";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "warn" | "link";
type Size = "xs" | "sm" | "md";

export interface ButtonBaseProps {
  className?: string;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLElement>;
  disabled?: boolean;
  /** Shown as a tooltip on hover and focus, and read as the button's description. */
  title?: string;
  /**
   * `submit` renders a native submit button: Hozo's Button is always
   * `type="button"`, and its SubmitButton submits Hozo's own Form, not a
   * native `<form>`.
   */
  type?: "button" | "submit";
  id?: string;
  "aria-label"?: string;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  "data-testid"?: string;
}

interface Props extends ButtonBaseProps {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconPosition?: "left" | "right";
}

const variantCls: Record<Variant, string> = {
  primary: "bg-accent text-canvas hover:bg-accent-hi",
  secondary: "border border-rim text-muted hover:bg-hover hover:text-fg",
  ghost: "text-muted hover:bg-hover hover:text-fg",
  danger: "bg-danger/15 text-danger border border-danger hover:bg-danger/25",
  warn: "border border-warn text-warn hover:bg-warn/10",
  link: "text-muted hover:text-fg hover:underline",
};

const sizeCls: Record<Size, string> = {
  xs: "px-2 py-1 text-xs",
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-sm font-medium",
};

/** The element under Button and IconButton: Hozo's Button, or a native submit button. */
export function ButtonHost({
  className,
  children,
  onClick,
  disabled,
  title,
  type = "button",
  id,
  "aria-label": ariaLabel,
  "aria-expanded": ariaExpanded,
  "aria-controls": ariaControls,
  "data-testid": testId,
}: ButtonBaseProps) {
  const button =
    type === "submit" ? (
      <button
        type="submit"
        id={id}
        className={className}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-description={title}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        data-testid={testId}
      >
        {children}
      </button>
    ) : (
      <HozoButton
        nativeID={id}
        className={className}
        onPress={onClick}
        disabled={disabled}
        accessibilityLabel={ariaLabel}
        accessibilityHint={title}
        accessibilityState={ariaExpanded === undefined ? undefined : { expanded: ariaExpanded }}
        aria-controls={ariaControls}
        testID={testId}
      >
        {children}
      </HozoButton>
    );
  return <Tooltip content={title}>{button}</Tooltip>;
}

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
    <ButtonHost
      {...props}
      className={cn(
        "inline-flex items-center gap-1 rounded font-medium transition-colors whitespace-nowrap shrink-0",
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
    </ButtonHost>
  );
}

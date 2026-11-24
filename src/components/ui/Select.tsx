import { NativeSelect } from "@hozo/form";
import { useId } from "react";
import { cn } from "../../lib/cn";
import { Icon } from "./Icon";
import { Tooltip } from "./Tooltip";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface Props<T extends string> {
  options: readonly SelectOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
  containerClassName?: string;
  density?: "regular" | "compact";
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  /**
   * Shown as a tooltip on hover and focus, and read as the select's
   * description. NativeSelect takes no `title`.
   */
  title?: string;
}

export function Select<T extends string>({
  options,
  value,
  onValueChange,
  className,
  containerClassName,
  density = "regular",
  disabled,
  id,
  "aria-label": ariaLabel,
  title,
}: Props<T>) {
  const compact = density === "compact";
  const hintId = useId();

  return (
    <Tooltip content={title}>
      <span className={cn("relative inline-flex", containerClassName)}>
        <NativeSelect
          id={id}
          options={options}
          value={value}
          onValueChange={(next) => onValueChange(next as T)}
          disabled={disabled}
          accessibilityLabel={ariaLabel}
          aria-describedby={title ? hintId : undefined}
          className={cn(
            "app-select appearance-none bg-transparent text-dim cursor-pointer rounded",
            "transition-[color,background-color,border-color,box-shadow] duration-150 ease-out",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-accent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className,
            compact ? "pl-1 pr-5" : "pl-2 pr-6",
          )}
        />
        {title && (
          <span id={hintId} className="sr-only">
            {title}
          </span>
        )}
        <Icon
          name="chevron-down"
          size={12}
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 text-dim",
            compact ? "right-1" : "right-2",
            disabled && "opacity-50",
          )}
        />
      </span>
    </Tooltip>
  );
}

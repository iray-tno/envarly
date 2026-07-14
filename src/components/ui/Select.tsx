import type { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { Icon } from "./Icon";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface Props<T extends string>
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> {
  options: readonly SelectOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  containerClassName?: string;
}

export function Select<T extends string>({
  options,
  value,
  onValueChange,
  className,
  containerClassName,
  ...props
}: Props<T>) {
  return (
    <span className={cn("relative inline-flex", containerClassName)}>
      <select
        {...props}
        value={value}
        onChange={(e) => onValueChange(e.target.value as T)}
        className={cn(
          "app-select appearance-none bg-transparent text-dim cursor-pointer rounded",
          "transition-[color,background-color,border-color,box-shadow] duration-150 ease-out",
          "focus:outline-none focus-visible:ring-1 focus-visible:ring-accent",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
          "pr-6",
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon
        name="chevron-down"
        size={12}
        className={cn(
          "pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-dim",
          props.disabled && "opacity-50",
        )}
      />
    </span>
  );
}

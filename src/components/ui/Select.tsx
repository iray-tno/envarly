import type { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

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
}

export function Select<T extends string>({
  options,
  value,
  onValueChange,
  className,
  ...props
}: Props<T>) {
  return (
    <select
      {...props}
      value={value}
      onChange={(e) => onValueChange(e.target.value as T)}
      className={cn(
        "app-select bg-transparent text-dim cursor-pointer rounded",
        "transition-[color,background-color,border-color,box-shadow] duration-150 ease-out",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-accent",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  labelHidden?: boolean;
  error?: string;
}

export function TextInput({ label, labelHidden = false, error, className, id, ...props }: Props) {
  const inputId = id ?? `ti-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className={cn("text-xs font-medium text-muted", labelHidden && "sr-only")}
      >
        {label}
      </label>
      <input
        id={inputId}
        {...props}
        className={cn(
          "px-3 py-2 bg-surface border rounded text-fg text-xs transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas",
          error ? "border-danger" : "border-rim focus:border-accent",
          "placeholder:text-dim disabled:opacity-60 disabled:cursor-not-allowed",
          className,
        )}
      />
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

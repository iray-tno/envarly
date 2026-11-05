import { TextInput as HozoTextInput } from "@hozo/core";
import type { InputHTMLAttributes, KeyboardEvent } from "react";
import { cn } from "../../lib/cn";

interface Props
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "size" | "value" | "onKeyDown" | "autoCorrect" | "style"
  > {
  label: string;
  labelHidden?: boolean;
  error?: string;
  value?: string;
  "data-testid"?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function TextInput({
  label,
  labelHidden = false,
  error,
  className,
  id,
  onKeyDown,
  "data-testid": testID,
  ...props
}: Props) {
  const inputId = id ?? `ti-${label.toLowerCase().replace(/\W+/g, "-")}`;
  // The wrapper, label and error stay raw elements: their literal theme
  // colours would compile to fixed values and miss the light theme
  // (iray-tno/hozo#1690). The input's classes go through `cn`, which stays
  // a runtime call (hozo.config.mjs), so Tailwind still styles it.
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className={cn("text-sm font-medium text-muted", labelHidden && "sr-only")}
      >
        {label}
      </label>
      <HozoTextInput
        {...props}
        // Hozo writes `id` and `data-testid` from these, overriding props.
        nativeID={inputId}
        testID={testID}
        onKeyPress={onKeyDown}
        className={cn(
          "px-4 py-2 bg-surface border rounded text-fg text-sm transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas",
          error ? "border-danger" : "border-rim focus:border-accent",
          "placeholder:text-muted disabled:opacity-60 disabled:cursor-not-allowed",
          className,
        )}
      />
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

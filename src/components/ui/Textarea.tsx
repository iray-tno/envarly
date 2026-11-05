import { TextInput as HozoTextInput, type TextInputProps as HozoTextInputProps } from "@hozo/core";
import type { ClipboardEventHandler, TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface Props
  extends Pick<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "className" | "id" | "disabled" | "placeholder" | "spellCheck" | "onChange" | "aria-label"
  > {
  label: string;
  labelHidden?: boolean;
  error?: string;
  value?: string;
  rows?: number;
  onPaste?: ClipboardEventHandler<HTMLTextAreaElement>;
}

export function Textarea({
  label,
  labelHidden = false,
  error,
  className,
  id,
  rows,
  onChange,
  onPaste,
  ...props
}: Props) {
  const inputId = id ?? `ta-${label.toLowerCase().replace(/\W+/g, "-")}`;
  // See TextInput: the wrapper, label and error stay raw for
  // iray-tno/hozo#1690; the textarea's `cn` classes stay with Tailwind.
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
        multiline
        numberOfLines={rows}
        // Hozo writes `id` from this, overriding props.
        nativeID={inputId}
        // Hozo types its handlers for <input> even when `multiline` renders a
        // <textarea>; these events really come from the textarea.
        onChange={onChange as HozoTextInputProps["onChange"]}
        onPaste={onPaste as unknown as HozoTextInputProps["onPaste"]}
        className={cn(
          "px-4 py-3 bg-surface border rounded font-mono text-sm text-fg leading-relaxed resize-y transition-colors",
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

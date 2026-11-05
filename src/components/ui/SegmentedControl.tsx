import { RadioGroup } from "@hozo/core";
import { cn } from "../../lib/cn";

interface Option<T extends string> {
  value: T;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label": string;
  className?: string;
  /** Stretch each chip to share the row equally, centering its content. */
  stretch?: boolean;
}

// Hozo's RadioGroup is the ARIA radio pattern (roving tabindex, arrow keys
// select), so each chip is the focusable `role="radio"` element and its
// state shows as `aria-checked` / `aria-disabled`. The classes go through
// `cn`, which stays a runtime call (hozo.config.mjs), so Tailwind styles
// them, light theme included (iray-tno/hozo#1690).
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  "aria-label": label,
  className,
  stretch,
}: Props<T>) {
  return (
    <RadioGroup
      accessibilityLabel={label}
      orientation="horizontal"
      value={value}
      onValueChange={onChange}
      className={cn("flex gap-1", className)}
      optionClassName={cn(
        "flex items-center gap-1 px-2.5 py-1.5 rounded text-sm transition-colors cursor-default",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas",
        "aria-disabled:opacity-40 aria-disabled:cursor-not-allowed",
        "aria-checked:bg-surface aria-checked:text-fg",
        "not-aria-checked:text-muted not-aria-checked:hover:bg-hover not-aria-checked:hover:text-fg",
        stretch && "flex-1 justify-center",
      )}
      options={options.map((opt) => ({
        value: opt.value,
        disabled: opt.disabled,
        label: (
          <>
            {opt.label}
            {opt.count !== undefined && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-hover text-dim leading-none">
                {opt.count}
              </span>
            )}
          </>
        ),
      }))}
    />
  );
}

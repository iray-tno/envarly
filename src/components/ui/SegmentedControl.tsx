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

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  "aria-label": label,
  className,
  stretch,
}: Props<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex gap-1", className)}>
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1.5 rounded text-sm transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas",
            opt.disabled && "opacity-40 cursor-not-allowed",
            value === opt.value ? "bg-surface text-fg" : "text-muted hover:bg-hover hover:text-fg",
            stretch && "flex-1 justify-center",
          )}
        >
          <input
            type="radio"
            checked={value === opt.value}
            disabled={opt.disabled}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
          {opt.label}
          {opt.count !== undefined && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-hover text-dim leading-none">
              {opt.count}
            </span>
          )}
        </label>
      ))}
    </div>
  );
}

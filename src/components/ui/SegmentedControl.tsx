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
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  "aria-label": label,
  className,
}: Props<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex gap-0.5", className)}>
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded text-sm transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas",
            opt.disabled && "opacity-40 cursor-not-allowed",
            value === opt.value
              ? "bg-surface text-fg"
              : "text-muted hover:bg-hover hover:text-fg",
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
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-hover text-dim leading-none">
              {opt.count}
            </span>
          )}
        </label>
      ))}
    </div>
  );
}

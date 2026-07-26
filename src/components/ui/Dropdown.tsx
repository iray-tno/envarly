import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { cn } from "../../lib/cn";

export interface DropdownTriggerProps {
  onClick: () => void;
  "aria-expanded": boolean;
  "aria-controls": string;
}

interface DropdownProps {
  trigger: (props: DropdownTriggerProps) => ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  panelClassName?: string;
  /** Accessible name for the panel. Not the same as the trigger's own label. */
  "aria-label": string;
}

/**
 * A minimal floating panel anchored to a trigger — the WAI-ARIA "disclosure"
 * pattern (aria-expanded/aria-controls), not a full ARIA "menu" widget. This
 * is deliberate: the panel can hold arbitrary interactive content (a native
 * <select>, not just menuitem-role buttons), and no arrow-key navigation
 * between items is implemented, so claiming role="menu"/aria-haspopup="menu"
 * would both violate ARIA's required-children rule for menus and overstate
 * the keyboard support to assistive tech.
 */
export function Dropdown({
  trigger,
  children,
  align = "right",
  panelClassName,
  "aria-label": ariaLabel,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useOnClickOutside(containerRef, () => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-flex">
      {trigger({
        onClick: () => setOpen((o) => !o),
        "aria-expanded": open,
        "aria-controls": panelId,
      })}
      {open && (
        // biome-ignore lint/a11y/useSemanticElements: not a form — holds a mix of buttons/controls, <fieldset> doesn't fit
        <div
          id={panelId}
          role="group"
          aria-label={ariaLabel}
          className={cn(
            "absolute top-full z-50 mt-1 min-w-[180px] rounded border border-rim bg-panel p-1 shadow-xl",
            align === "right" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

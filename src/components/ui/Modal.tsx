import { type ReactNode, useEffect, useId } from "react";
import { usePresence } from "../../hooks/usePresence";
import { cn } from "../../lib/cn";
import { IconButton } from "./IconButton";

interface BaseProps {
  open: boolean;
  onClose: () => void;
  size?: "md" | "lg" | "xl" | "2xl";
  /** Make the body a flex column instead of overflow-y-auto. Use for panels that manage their own scrolling. */
  flex?: boolean;
  children: ReactNode;
}

type Props = BaseProps &
  ({ title: string; ariaLabel?: never } | { title?: undefined; ariaLabel: string });

const sizeCls = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-[900px]",
};

export function Modal({
  open,
  onClose,
  title,
  ariaLabel,
  size = "lg",
  flex = false,
  children,
}: Props) {
  const titleId = useId();
  const presence = usePresence(open);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!presence.mounted) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-6",
        presence.state === "closed" && "pointer-events-none",
      )}
      data-state={presence.state}
      role="dialog"
      aria-modal="true"
      aria-label={title ? undefined : ariaLabel}
      aria-labelledby={title ? titleId : undefined}
    >
      {/* Backdrop */}
      <div
        className="motion-modal-backdrop absolute inset-0 bg-canvas/70 backdrop-blur-sm"
        data-state={presence.state}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full flex flex-col bg-panel border border-rim rounded-lg shadow-xl",
          "max-h-[85vh] overflow-hidden",
          "motion-modal-panel",
          sizeCls[size],
        )}
        data-state={presence.state}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-rim shrink-0">
            <h2 id={titleId} className="text-base font-semibold text-fg">
              {title}
            </h2>
            <IconButton aria-label="Close" icon="x" onClick={onClose} />
          </div>
        )}
        <div className={flex ? "flex-1 min-h-0 flex flex-col" : "flex-1 overflow-y-auto"}>
          {children}
        </div>
      </div>
    </div>
  );
}

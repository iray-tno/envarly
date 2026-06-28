import { useEffect, type ReactNode } from "react";
import { cn } from "../../lib/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: "md" | "lg" | "xl" | "2xl";
  /** Make the body a flex column instead of overflow-y-auto. Use for panels that manage their own scrolling. */
  flex?: boolean;
  children: ReactNode;
}

const sizeCls = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-[900px]",
};

export function Modal({ open, onClose, title, size = "lg", flex = false, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-canvas/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full flex flex-col bg-panel border border-rim rounded-lg shadow-xl",
          "max-h-[85vh] overflow-hidden",
          sizeCls[size],
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-rim shrink-0">
            <h2 className="text-base font-semibold text-fg">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-dim hover:text-fg transition-colors text-lg leading-none px-1"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        <div className={flex ? "flex-1 min-h-0 flex flex-col" : "flex-1 overflow-y-auto"}>
          {children}
        </div>
      </div>
    </div>
  );
}

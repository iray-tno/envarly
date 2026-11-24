import { Dialog } from "@hozo/core";
import { type ReactNode, useEffect, useId } from "react";
import { createPortal } from "react-dom";
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

/**
 * Hozo's `Dialog` is the browser's `<dialog>` opened with `showModal()`: focus
 * moves into it, the page behind is inert, and focus goes back to the opener
 * when it closes.
 *
 * The exit motion runs on the backdrop and the panel. Hozo times the exit from
 * the `<dialog>`'s own style, so `motion-modal` gives the dialog a matching
 * `visibility` transition: it stays shown and modal until they have animated
 * out, and only then closes and returns focus. Escape and the backdrop stay
 * ours, so `onClose` is called once either way.
 */
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

  return createPortal(
    <Dialog
      open={open}
      accessibilityLabel={title ? undefined : ariaLabel}
      accessibilityLabelledBy={title ? titleId : undefined}
      className={cn(
        // Undo the UA's <dialog> box: it is a full-viewport layer, as the old div was.
        "fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none overflow-visible border-0 bg-transparent p-6 text-inherit",
        "motion-modal flex items-center justify-center backdrop:bg-transparent",
        presence.state === "closed" && "pointer-events-none",
      )}
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
    </Dialog>,
    document.body,
  );
}

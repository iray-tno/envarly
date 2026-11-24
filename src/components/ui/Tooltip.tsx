import { Tooltip as HozoTooltip } from "@hozo/patterns";
import type { ReactElement } from "react";

interface TooltipProps {
  /** The text shown on hover and focus. No text, no tooltip. */
  content?: string;
  /** Keep it closed, e.g. while the popup its trigger opens is showing. */
  disabled?: boolean;
  /** The trigger. It must take a ref and the hover/focus handlers. */
  children: ReactElement;
}

/**
 * A hover/focus hint for a control, in place of the native `title` tooltip.
 * Hozo's Button takes no `title`, and recommends a Tooltip for what the
 * pointer sees plus `accessibilityHint` for what assistive tech reads.
 */
export function Tooltip({ content, disabled, children }: TooltipProps) {
  if (!content) return children;
  return (
    <HozoTooltip
      content={content}
      disabled={disabled}
      className="z-50 max-w-xs rounded border border-rim bg-surface px-2 py-1 text-xs text-fg shadow-lg"
    >
      {children}
    </HozoTooltip>
  );
}

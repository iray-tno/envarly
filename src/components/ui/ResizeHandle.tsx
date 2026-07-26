import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { cn } from "../../lib/cn";

interface ResizeHandleProps {
  /** Which edge of the host panel it sits on. */
  edge: "left" | "right";
  isDragging: boolean;
  width: number;
  min: number;
  max: number;
  "aria-label": string;
  handleProps: {
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (e: ReactPointerEvent<HTMLDivElement>) => void;
    onKeyDown: (e: ReactKeyboardEvent<HTMLDivElement>) => void;
  };
}

export function ResizeHandle({
  edge,
  isDragging,
  width,
  min,
  max,
  "aria-label": ariaLabel,
  handleProps,
}: ResizeHandleProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: this is an interactive, focusable drag splitter (WAI-ARIA "window splitter" pattern), not a static <hr> divider.
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      className={cn(
        "group absolute inset-y-0 z-10 w-2 touch-none select-none",
        "cursor-ew-resize focus:outline-none",
        // Kept fully inside the host's box (not a negative inset straddling the border):
        // the host panels use `overflow-hidden` for their scrollable content, which silently
        // excludes any part of an absolutely-positioned child that pokes outside the box from
        // hit-testing, even though it still paints there.
        edge === "left" ? "left-0" : "right-0",
      )}
      {...handleProps}
    >
      <div
        className={cn(
          "mx-auto h-full w-px bg-transparent transition-colors",
          "group-hover:bg-accent/60 group-focus-visible:bg-accent/60",
          isDragging && "bg-accent",
        )}
      />
    </div>
  );
}

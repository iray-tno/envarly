import { type HozoI18n, HozoI18nProvider, Splitter, useHozoI18n } from "@hozo/core";
import { type ReactNode, useMemo } from "react";
import { cn } from "../../lib/cn";

interface ResizeHandleProps {
  /** Which edge of the host panel it sits on. */
  edge: "left" | "right";
  /** The id of the panel it resizes. */
  controls: string;
  "aria-label": string;
  splitterProps: {
    min: number;
    max: number;
    size: number;
    onSizeChange: (size: number) => void;
    onSizeCommit: (size: number) => void;
    onSizeCancel: () => void;
  };
}

/**
 * Hozo names a splitter "Resize {label}" in English. Our locale strings are
 * already the whole name ("Resize sidebar", "サイドバーの幅を変更"), so the
 * label is passed through as it is; every other Hozo string is left to the
 * provider above.
 */
function WholeLabel({ children }: { children: ReactNode }) {
  const parent = useHozoI18n();
  const value = useMemo<HozoI18n>(
    () => ({
      ...parent,
      translate: (key, params, fallback) =>
        key === "hozo.splitter.label"
          ? String(params.label)
          : (parent.translate?.(key, params, fallback) ?? fallback),
    }),
    [parent],
  );
  return <HozoI18nProvider value={value}>{children}</HozoI18nProvider>;
}

export function ResizeHandle({
  edge,
  controls,
  "aria-label": ariaLabel,
  splitterProps,
}: ResizeHandleProps) {
  return (
    <WholeLabel>
      {/* Hozo's drag focuses the handle with a plain `focus()`, which Chromium counts as
          focus-visible, so the line below would stay lit after every mouse drag
          (iray-tno/hozo#1714). Focusing it first, before Hozo's handler runs, makes that
          call a no-op. `display: contents` keeps this wrapper out of the layout. */}
      <div
        className="contents"
        onPointerDownCapture={(e) => {
          if (e.button !== 0 || !e.isPrimary) return;
          const handle = e.currentTarget.querySelector<HTMLElement>("[role=separator]");
          handle?.focus({ focusVisible: false } as FocusOptions);
        }}
      >
        <Splitter
          {...splitterProps}
          label={ariaLabel}
          controls={controls}
          // The handle on a panel's right edge has the panel at its start.
          side={edge === "right" ? "start" : "end"}
          // The number alone, as before; Hozo's default is English ("300 pixels").
          valueText={String}
          // Hozo positions the handle `relative` inline; it sits over the panel's edge instead.
          style={{ position: "absolute", zIndex: 10 }}
          className={cn(
            "inset-y-0 w-2 cursor-ew-resize focus:outline-none",
            // Kept fully inside the host's box (not a negative inset straddling the border):
            // the host panels use `overflow-hidden` for their scrollable content, which silently
            // excludes any part of an absolutely-positioned child that pokes outside the box from
            // hit-testing, even though it still paints there.
            edge === "left" ? "left-0" : "right-0",
            // The visible 1px line, centred in the 8px handle.
            "before:absolute before:inset-y-0 before:inset-x-0 before:mx-auto before:w-px before:bg-transparent before:transition-colors",
            "hover:before:bg-accent/60 focus-visible:before:bg-accent/60",
            "data-dragging:before:bg-accent",
          )}
        />
      </div>
    </WholeLabel>
  );
}

import { useEffect, useState } from "react";

export function clampWidth(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export interface UseResizableWidthOptions {
  storageKey: string;
  defaultWidth: number;
  min: number;
  max: number;
}

function readStoredWidth(storageKey: string, defaultWidth: number, min: number, max: number) {
  const stored = Number(localStorage.getItem(storageKey));
  const width = Number.isFinite(stored) && stored > 0 ? stored : defaultWidth;
  return clampWidth(width, min, max);
}

/**
 * The width of a resizable panel, remembered in localStorage.
 *
 * The pointer and keyboard handling is Hozo's `Splitter`'s; `splitterProps`
 * is what it takes. A size change that has not been committed yet is a drag
 * in progress, which is when `isDragging` is true and the width is not saved.
 */
export function useResizableWidth({
  storageKey,
  defaultWidth,
  min,
  max,
}: UseResizableWidthOptions) {
  const [width, setWidth] = useState(() => readStoredWidth(storageKey, defaultWidth, min, max));
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isDragging) return;
    localStorage.setItem(storageKey, String(width));
  }, [isDragging, width, storageKey]);

  return {
    width,
    isDragging,
    splitterProps: {
      min,
      max,
      size: width,
      onSizeChange: (next: number) => {
        setWidth(next);
        setIsDragging(true);
      },
      onSizeCommit: (next: number) => {
        setWidth(next);
        setIsDragging(false);
      },
      onSizeCancel: () => setIsDragging(false),
    },
  };
}

import { type CSSProperties, useId } from "react";
import { useI18n } from "../../hooks/useI18n";
import { usePresence } from "../../hooks/usePresence";
import { useResizableWidth } from "../../hooks/useResizableWidth";
import type { EnvSnapshot } from "../../types";
import { IconButton } from "../ui/IconButton";
import { ResizeHandle } from "../ui/ResizeHandle";
import { SnapshotPanel } from "./SnapshotPanel";

interface Props {
  open: boolean;
  onClose: () => void;
  onStageSnapshot: (snap: EnvSnapshot) => void;
}

const DOCK_WIDTH = {
  storageKey: "envarly-snapshot-panel-width",
  defaultWidth: 420,
  min: 260,
  max: 640,
} as const;

export function SnapshotPanelDock({ open, onClose, onStageSnapshot }: Props) {
  const { t } = useI18n();
  const presence = usePresence(open);
  const { width, isDragging, splitterProps } = useResizableWidth(DOCK_WIDTH);
  const asideId = useId();

  if (!presence.mounted) return null;

  return (
    <aside
      id={asideId}
      className="motion-snapshot-panel relative min-h-0 shrink-0 border-l border-rim overflow-hidden"
      data-state={presence.state}
      data-resizing={isDragging || undefined}
      style={
        { "--panel-width": presence.state === "open" ? `${width}px` : undefined } as CSSProperties
      }
    >
      <ResizeHandle
        edge="left"
        controls={asideId}
        aria-label={t("snapshot.resize")}
        splitterProps={splitterProps}
      />
      <div
        className="motion-snapshot-content h-full min-h-0 flex flex-col bg-panel"
        style={{ width }}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-rim shrink-0">
          <span className="text-sm font-semibold text-fg">{t("header.snapshots")}</span>
          <IconButton aria-label="Close snapshots" icon="x" onClick={onClose} />
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <SnapshotPanel onStageSnapshot={onStageSnapshot} />
        </div>
      </div>
    </aside>
  );
}

import { useI18n } from "../../hooks/useI18n";
import type { DiffEntry } from "../../lib/diff";
import type { SnapshotMeta } from "../../types";
import { Button } from "../ui/Button";
import { DiffTable } from "./SnapshotDiffRow";

interface SnapshotPreviewProps {
  snap: SnapshotMeta;
  diff: DiffEntry[];
  onRestore: () => void;
  onCancel: () => void;
}

export function SnapshotPreview({ snap, diff, onRestore, onCancel }: SnapshotPreviewProps) {
  const { t } = useI18n();
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0 min-w-0">
        <p className="text-sm font-semibold text-fg break-words">{snap.label}</p>
        <p className="text-[11px] text-dim">{new Date(snap.createdAt).toLocaleString()}</p>
      </div>

      {diff.length === 0 ? (
        <p className="text-xs text-dim py-4 text-center">{t("snapshot_preview.no_diff")}</p>
      ) : (
        <DiffTable diff={diff} />
      )}

      <div className="flex shrink-0 gap-2 border-t border-rim pt-4">
        <Button variant={diff.length === 0 ? "secondary" : "primary"} size="md" onClick={onRestore}>
          {diff.length === 0 ? t("snapshot_preview.no_changes") : t("snapshot_preview.restore")}
        </Button>
        <Button variant="ghost" size="md" onClick={onCancel}>
          {t("snapshot_preview.cancel")}
        </Button>
      </div>
    </div>
  );
}

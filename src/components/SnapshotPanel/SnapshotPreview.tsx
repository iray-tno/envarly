import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-fg truncate">{snap.label}</p>
          <p className="text-[11px] text-dim">{new Date(snap.createdAt).toLocaleString()}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>{t("snapshot_preview.back")}</Button>
      </div>

      {diff.length === 0 ? (
        <p className="text-xs text-dim py-4 text-center">{t("snapshot_preview.no_diff")}</p>
      ) : (
        <DiffTable diff={diff} />
      )}

      <div className="flex gap-2">
        <Button
          variant={diff.length === 0 ? "secondary" : "primary"}
          size="md"
          onClick={onRestore}
        >
          {diff.length === 0 ? t("snapshot_preview.no_changes") : t("snapshot_preview.restore")}
        </Button>
        <Button variant="ghost" size="md" onClick={onCancel}>{t("snapshot_preview.cancel")}</Button>
      </div>
    </div>
  );
}

import { useI18n } from "../../hooks/useI18n";
import type { DiffEntry } from "../../lib/diff";
import type { SnapshotMeta } from "../../types";
import { Button } from "../ui/Button";
import { DiffTable } from "./SnapshotDiffRow";

interface SnapshotCompareProps {
  from: SnapshotMeta;
  to: SnapshotMeta;
  diff: DiffEntry[];
  onBack: () => void;
}

export function SnapshotCompare({ from, to, diff, onBack }: SnapshotCompareProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-dim uppercase tracking-wide mb-0.5">
            {t("snapshot_compare.heading")}
          </p>
          <p className="text-sm font-semibold text-fg truncate">{from.label}</p>
          <p className="text-[11px] text-dim">
            {t("snapshot_compare.to_label", { label: to.label })}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          {t("snapshot_compare.back")}
        </Button>
      </div>

      {diff.length === 0 ? (
        <p className="text-xs text-dim py-4 text-center">{t("snapshot_compare.no_diff")}</p>
      ) : (
        <DiffTable diff={diff} />
      )}
    </div>
  );
}

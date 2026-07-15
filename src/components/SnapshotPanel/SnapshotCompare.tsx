import { useI18n } from "../../hooks/useI18n";
import type { DiffEntry } from "../../lib/diff";
import type { SnapshotMeta } from "../../types";
import { DiffTable } from "./SnapshotDiffRow";

interface SnapshotCompareProps {
  from: SnapshotMeta;
  to: SnapshotMeta;
  diff: DiffEntry[];
}

export function SnapshotCompare({ from, to, diff }: SnapshotCompareProps) {
  const { t } = useI18n();
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0 min-w-0">
        <p className="text-[10px] text-dim uppercase tracking-wide mb-0.5">
          {t("snapshot_compare.heading")}
        </p>
        <p className="text-sm font-semibold text-fg break-words">{from.label}</p>
        <p className="text-[11px] text-dim break-words">
          {t("snapshot_compare.to_label", { label: to.label })}
        </p>
      </div>

      {diff.length === 0 ? (
        <p className="text-xs text-dim py-4 text-center">{t("snapshot_compare.no_diff")}</p>
      ) : (
        <DiffTable diff={diff} />
      )}
    </div>
  );
}

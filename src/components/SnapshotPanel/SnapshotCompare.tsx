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
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-dim uppercase tracking-wide mb-0.5">Comparing snapshots</p>
          <p className="text-sm font-semibold text-fg truncate">{from.label}</p>
          <p className="text-[11px] text-dim">→ {to.label}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
      </div>

      {diff.length === 0 ? (
        <p className="text-xs text-dim py-4 text-center">
          These two snapshots are identical — no differences found.
        </p>
      ) : (
        <DiffTable diff={diff} />
      )}
    </div>
  );
}

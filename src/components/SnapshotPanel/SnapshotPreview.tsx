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
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-fg truncate">{snap.label}</p>
          <p className="text-[11px] text-dim">{new Date(snap.createdAt).toLocaleString()}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>← Back</Button>
      </div>

      {diff.length === 0 ? (
        <p className="text-xs text-dim py-4 text-center">
          Current state matches this snapshot — no changes would be made.
        </p>
      ) : (
        <DiffTable diff={diff} />
      )}

      <div className="flex gap-2">
        <Button
          variant={diff.length === 0 ? "secondary" : "primary"}
          size="md"
          onClick={onRestore}
        >
          {diff.length === 0 ? "No changes to stage" : "Stage restore"}
        </Button>
        <Button variant="ghost" size="md" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

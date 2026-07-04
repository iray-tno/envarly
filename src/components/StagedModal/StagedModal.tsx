import { useState } from "react";
import { cn } from "../../lib/cn";
import type { DiffEntry } from "../../lib/diff";
import { Button } from "../ui/Button";

const CRITICAL_VARS = new Set(["SYSTEMROOT", "WINDIR", "COMSPEC"]);

interface StagedModalProps {
  diff: DiffEntry[];
  busy: boolean;
  onApply: (takeSnapshot: boolean) => void;
  onClose: () => void;
}

export function StagedModal({ diff, busy, onApply, onClose }: StagedModalProps) {
  const [takeSnapshot, setTakeSnapshot] = useState(true);

  const criticalChanges = diff.filter((e) => CRITICAL_VARS.has(e.name.toUpperCase()));

  const byKind = {
    added:   diff.filter((e) => e.kind === "added"),
    removed: diff.filter((e) => e.kind === "removed"),
    changed: diff.filter((e) => e.kind === "changed"),
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {criticalChanges.length > 0 && (
        <div className="px-6 py-3 bg-danger/10 border-b border-danger/30 shrink-0">
          <p className="text-xs font-semibold text-danger mb-1">
            ⚠ Critical system variable{criticalChanges.length > 1 ? "s" : ""} will be modified
          </p>
          <p className="text-xs text-danger/80">
            {criticalChanges.map((e) => e.name).join(", ")} — changing {criticalChanges.length > 1 ? "these" : "this"} can break Windows or running applications.
            A snapshot is strongly recommended.
          </p>
        </div>
      )}

      <div className="px-6 py-4 border-b border-rim shrink-0">
        <p className="text-xs text-muted mb-3">
          These changes will be written to the Windows registry and broadcast to running applications.
        </p>
        <div className="flex gap-3 text-xs">
          {byKind.added.length > 0   && <span className="text-success">+{byKind.added.length} added</span>}
          {byKind.removed.length > 0 && <span className="text-danger">−{byKind.removed.length} removed</span>}
          {byKind.changed.length > 0 && <span className="text-warn">~{byKind.changed.length} changed</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
        {diff.map((entry) => {
          const key = `${entry.scope}:${entry.name}`;
          return (
            <div
              key={key}
              className={cn(
                "rounded border px-3 py-2 text-xs",
                entry.kind === "added"   && "border-success/30 bg-success/5 text-success",
                entry.kind === "removed" && "border-danger/30 bg-danger/5 text-danger",
                entry.kind === "changed" && "border-warn/30 bg-warn/5 text-warn",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-semibold text-fg">{entry.name}</span>
                <span className="opacity-60 text-[10px]">{entry.scope}</span>
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide">{entry.kind}</span>
              </div>
              {entry.kind === "removed" && (
                <p className="font-mono text-[11px] opacity-70 line-through truncate">{entry.value}</p>
              )}
              {entry.kind === "added" && (
                <p className="font-mono text-[11px] truncate">{entry.value}</p>
              )}
              {entry.kind === "changed" && (
                <div className="flex flex-col gap-0.5">
                  <p className="font-mono text-[11px] text-danger/70 line-through truncate">{entry.oldValue}</p>
                  <p className="font-mono text-[11px] text-success truncate">{entry.newValue}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-6 py-4 border-t border-rim shrink-0 flex flex-col gap-3">
        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={takeSnapshot}
            onChange={(e) => setTakeSnapshot(e.target.checked)}
            disabled={busy}
            className="accent-accent"
          />
          Take a snapshot before applying (recommended)
        </label>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="md" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" size="md" onClick={() => onApply(takeSnapshot)} disabled={busy}>
            {busy ? "Applying…" : `Apply ${diff.length} ${diff.length === 1 ? "change" : "changes"} to registry`}
          </Button>
        </div>
      </div>
    </div>
  );
}

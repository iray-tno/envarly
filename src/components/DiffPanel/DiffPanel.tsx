import { useState } from "react";
import type { DiffEntry } from "../../lib/diff";
import { EntryRow } from "./EntryRow";

interface Props {
  entries: DiffEntry[];
  onApply: (accepted: DiffEntry[], reverted: DiffEntry[]) => void;
  onDismiss: () => void;
  busy?: boolean;
}

export function DiffPanel({ entries, onApply, onDismiss, busy }: Props) {
  const [accepted, setAccepted] = useState<Record<string, boolean>>(
    () => Object.fromEntries(entries.map((e) => [`${e.scope}:${e.name}`, true])),
  );

  const key = (e: DiffEntry) => `${e.scope}:${e.name}`;

  const toggleEntry = (e: DiffEntry) =>
    setAccepted((prev) => ({ ...prev, [key(e)]: !prev[key(e)] }));

  const toggleAll = (val: boolean) =>
    setAccepted(Object.fromEntries(entries.map((e) => [key(e), val])));

  const acceptedCount = Object.values(accepted).filter(Boolean).length;
  const allChecked = acceptedCount === entries.length;
  const noneChecked = acceptedCount === 0;

  const handleApply = () => {
    const acc = entries.filter((e) => accepted[key(e)]);
    const rev = entries.filter((e) => !accepted[key(e)]);
    onApply(acc, rev);
  };

  if (entries.length === 0) return null;

  const byKind = {
    added:   entries.filter((e) => e.kind === "added"),
    removed: entries.filter((e) => e.kind === "removed"),
    changed: entries.filter((e) => e.kind === "changed"),
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 py-4 border-b border-rim shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-fg">External changes detected</h2>
          <button
            onClick={onDismiss}
            className="text-dim hover:text-fg text-lg leading-none transition-colors"
          >
            ×
          </button>
        </div>
        <p className="text-xs text-muted mb-3">
          The registry was modified outside Envarly.{" "}
          <span className="text-fg font-medium">Check</span> the changes you want to{" "}
          <span className="text-success">accept</span>, uncheck to{" "}
          <span className="text-danger">revert</span> them.
        </p>

        <div className="flex gap-3 text-xs mb-3">
          {byKind.added.length > 0   && <span className="text-success">+{byKind.added.length} added</span>}
          {byKind.removed.length > 0 && <span className="text-danger">−{byKind.removed.length} removed</span>}
          {byKind.changed.length > 0 && <span className="text-warn">~{byKind.changed.length} changed</span>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleAll(true)}
            disabled={allChecked}
            className="text-xs text-muted hover:text-fg disabled:opacity-30 transition-colors"
          >
            Select all
          </button>
          <span className="text-dim">·</span>
          <button
            onClick={() => toggleAll(false)}
            disabled={noneChecked}
            className="text-xs text-muted hover:text-fg disabled:opacity-30 transition-colors"
          >
            Deselect all
          </button>
          <span className="text-dim ml-auto text-xs">{acceptedCount}/{entries.length} selected</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-2">
        {entries.map((entry) => (
          <EntryRow
            key={key(entry)}
            entry={entry}
            accepted={accepted[key(entry)]}
            onToggle={() => toggleEntry(entry)}
          />
        ))}
      </div>

      <div className="px-5 py-3 border-t border-rim shrink-0 flex gap-2 justify-end">
        <button
          onClick={onDismiss}
          className="px-3 py-1.5 rounded text-muted text-xs hover:bg-hover hover:text-fg transition-colors"
        >
          Dismiss
        </button>
        <button
          onClick={handleApply}
          disabled={busy}
          className="px-4 py-1.5 rounded bg-accent text-canvas text-xs font-medium hover:bg-accent-hi disabled:opacity-50 transition-colors"
        >
          {busy ? "Applying…" : `Apply (${acceptedCount} accepted, ${entries.length - acceptedCount} reverted)`}
        </button>
      </div>
    </div>
  );
}

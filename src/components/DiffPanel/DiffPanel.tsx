import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { useState } from "react";
import { cn } from "../../lib/cn";
import type { DiffEntry } from "../../lib/diff";

interface Props {
  entries: DiffEntry[];
  /** Called with accepted (keep external) and reverted (restore old) entries */
  onApply: (accepted: DiffEntry[], reverted: DiffEntry[]) => void;
  onDismiss: () => void;
  busy?: boolean;
}

const KIND_LABEL: Record<DiffEntry["kind"], string> = {
  added: "Added",
  removed: "Removed",
  changed: "Changed",
};

const KIND_COLORS: Record<DiffEntry["kind"], string> = {
  added: "text-success border-success/30 bg-success/5",
  removed: "text-danger border-danger/30 bg-danger/5",
  changed: "text-warn border-warn/30 bg-warn/5",
};

const KIND_DOT: Record<DiffEntry["kind"], string> = {
  added: "bg-success",
  removed: "bg-danger",
  changed: "bg-warn",
};

function pathLines(value: string) {
  return value.split(";").join("\n");
}

function isLongOrPath(entry: DiffEntry): boolean {
  const val = entry.kind === "changed" ? entry.oldValue! : entry.value ?? "";
  return val.includes(";") || val.length > 80;
}

interface EntryRowProps {
  entry: DiffEntry;
  accepted: boolean;
  onToggle: () => void;
}

function EntryRow({ entry, accepted, onToggle }: EntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const showDiff = entry.kind === "changed" && isLongOrPath(entry);
  const showExpand = isLongOrPath(entry);

  const displayOld =
    entry.kind === "changed" ? entry.oldValue! : entry.kind === "removed" ? entry.value! : "";
  const displayNew =
    entry.kind === "changed" ? entry.newValue! : entry.kind === "added" ? entry.value! : "";

  return (
    <div
      className={cn(
        "rounded border transition-opacity",
        KIND_COLORS[entry.kind],
        !accepted && "opacity-40",
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 px-3 py-2">
        <input
          type="checkbox"
          checked={accepted}
          onChange={onToggle}
          className="shrink-0 accent-accent w-3.5 h-3.5 cursor-pointer"
          aria-label={`${entry.kind} ${entry.name}`}
        />

        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", KIND_DOT[entry.kind])} />

        <span className="font-mono text-xs font-semibold text-fg truncate flex-1">
          {entry.name}
        </span>

        <span className="text-[10px] uppercase tracking-wide font-semibold shrink-0 opacity-70">
          {entry.scope}
        </span>

        <span
          className={cn(
            "text-[10px] uppercase tracking-wide font-semibold shrink-0 px-1.5 py-0.5 rounded",
            KIND_COLORS[entry.kind],
          )}
        >
          {KIND_LABEL[entry.kind]}
        </span>

        {showExpand && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-dim hover:text-fg text-xs shrink-0 transition-colors"
          >
            {expanded ? "▲" : "▼"}
          </button>
        )}
      </div>

      {/* Inline value for short entries */}
      {!showExpand && (
        <div className="px-3 pb-2 flex flex-col gap-1">
          {(entry.kind === "removed" || entry.kind === "changed") && (
            <p className="font-mono text-[11px] text-danger line-through opacity-70 truncate">
              {displayOld}
            </p>
          )}
          {(entry.kind === "added" || entry.kind === "changed") && (
            <p className="font-mono text-[11px] text-success truncate">{displayNew}</p>
          )}
        </div>
      )}

      {/* Expanded diff viewer */}
      {showExpand && expanded && (
        <div className="px-3 pb-3">
          {showDiff ? (
            <div className="rounded overflow-hidden text-[11px]">
              <ReactDiffViewer
                oldValue={pathLines(displayOld)}
                newValue={pathLines(displayNew)}
                splitView={false}
                compareMethod={DiffMethod.LINES}
                useDarkTheme
                hideLineNumbers
                styles={{
                  variables: {
                    dark: {
                      diffViewerBackground: "#1c2333",
                      addedBackground: "#1a3a2a",
                      addedColor: "#3fb950",
                      removedBackground: "#3a1a1a",
                      removedColor: "#f85149",
                      wordAddedBackground: "#1a3a2a",
                      wordRemovedBackground: "#3a1a1a",
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {displayOld && (
                <p className="font-mono text-[11px] text-danger line-through break-all">
                  {displayOld}
                </p>
              )}
              {displayNew && (
                <p className="font-mono text-[11px] text-success break-all">{displayNew}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DiffPanel({ entries, onApply, onDismiss, busy }: Props) {
  // true = accept external change, false = revert to old
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
    added: entries.filter((e) => e.kind === "added"),
    removed: entries.filter((e) => e.kind === "removed"),
    changed: entries.filter((e) => e.kind === "changed"),
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
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

        {/* Stats */}
        <div className="flex gap-3 text-xs mb-3">
          {byKind.added.length > 0 && (
            <span className="text-success">+{byKind.added.length} added</span>
          )}
          {byKind.removed.length > 0 && (
            <span className="text-danger">−{byKind.removed.length} removed</span>
          )}
          {byKind.changed.length > 0 && (
            <span className="text-warn">~{byKind.changed.length} changed</span>
          )}
        </div>

        {/* Bulk controls */}
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
          <span className="text-dim ml-auto text-xs">
            {acceptedCount}/{entries.length} selected
          </span>
        </div>
      </div>

      {/* Entry list */}
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

      {/* Footer */}
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

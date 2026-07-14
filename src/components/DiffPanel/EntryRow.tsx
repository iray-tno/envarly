import { useState } from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { cn } from "../../lib/cn";
import type { DiffEntry } from "../../lib/diff";
import { registryKindLabel } from "../../lib/envValueKind";
import { Icon } from "../ui/Icon";

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
  const val = entry.kind === "changed" ? entry.oldValue : entry.value;
  return val.includes(";") || val.length > 80;
}

interface EntryRowProps {
  entry: DiffEntry;
  accepted: boolean;
  onToggle: () => void;
}

export function EntryRow({ entry, accepted, onToggle }: EntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const showDiff = entry.kind === "changed" && isLongOrPath(entry);
  const showExpand = isLongOrPath(entry);

  const displayOld =
    entry.kind === "changed" ? entry.oldValue : entry.kind === "removed" ? entry.value : "";
  const displayNew =
    entry.kind === "changed" ? entry.newValue : entry.kind === "added" ? entry.value : "";

  return (
    <div
      className={cn(
        "rounded border transition-opacity",
        KIND_COLORS[entry.kind],
        !accepted && "border-dashed",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2">
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
        <span className="text-[10px] uppercase tracking-wide font-semibold shrink-0">
          {entry.scope}
        </span>
        <span
          className={cn(
            "text-[10px] uppercase tracking-wide font-semibold shrink-0 px-2 py-1 rounded",
            KIND_COLORS[entry.kind],
          )}
        >
          {KIND_LABEL[entry.kind]}
        </span>
        {showExpand && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${entry.name}`}
            aria-expanded={expanded}
            className="text-dim hover:text-fg text-xs shrink-0 transition-colors"
          >
            <Icon name={expanded ? "chevron-up" : "chevron-down"} size={14} />
          </button>
        )}
      </div>

      {!showExpand && (
        <div className="px-3 pb-2 flex flex-col gap-1">
          {entry.kind === "changed" && entry.oldValueKind !== entry.newValueKind && (
            <p className="font-mono text-[10px] text-muted">
              {registryKindLabel(entry.oldValueKind)} → {registryKindLabel(entry.newValueKind)}
            </p>
          )}
          {(entry.kind === "removed" || entry.kind === "changed") && (
            <p className="font-mono text-[11px] text-danger line-through truncate">{displayOld}</p>
          )}
          {(entry.kind === "added" || entry.kind === "changed") && (
            <p className="font-mono text-[11px] text-success truncate">{displayNew}</p>
          )}
        </div>
      )}

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

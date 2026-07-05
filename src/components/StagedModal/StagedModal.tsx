import { useState } from "react";
import { useI18n } from "../../hooks/useI18n";
import { cn } from "../../lib/cn";
import type { DiffEntry } from "../../lib/diff";
import { Button } from "../ui/Button";

const CRITICAL_VARS = new Set(["SYSTEMROOT", "WINDIR", "COMSPEC"]);

type ViewMode = "delta" | "full";

interface StagedModalProps {
  diff: DiffEntry[];
  busy: boolean;
  onApply: (takeSnapshot: boolean) => void;
  onClose: () => void;
}

function splitList(value: string): string[] {
  return value.split(";").map((e) => e.trim()).filter(Boolean);
}

function isList(value: string): boolean {
  return value.includes(";") && splitList(value).length > 1;
}

function ListDiffDelta({ oldValue, newValue }: { oldValue: string; newValue: string }) {
  const { t } = useI18n();
  const oldEntries = splitList(oldValue);
  const newEntries = splitList(newValue);
  const removed = oldEntries.filter((e) => !newEntries.includes(e));
  const added   = newEntries.filter((e) => !oldEntries.includes(e));

  if (removed.length === 0 && added.length === 0) {
    return (
      <p className="font-mono text-[11px] text-muted mt-1">
        {t("staged.order_changed", { count: oldEntries.length })}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 mt-1 max-h-48 overflow-y-auto">
      {removed.map((e, i) => (
        <p key={`r${i}`} className="font-mono text-[11px] text-danger/80 break-all">
          <span className="select-none mr-1 opacity-70">−</span>{e}
        </p>
      ))}
      {added.map((e, i) => (
        <p key={`a${i}`} className="font-mono text-[11px] text-success break-all">
          <span className="select-none mr-1 opacity-70">+</span>{e}
        </p>
      ))}
    </div>
  );
}

function ListDiffFull({ oldValue, newValue }: { oldValue: string; newValue: string }) {
  const oldEntries = splitList(oldValue);
  const newEntries = splitList(newValue);
  const removedSet = new Set(oldEntries.filter((e) => !newEntries.includes(e)));
  const addedSet   = new Set(newEntries.filter((e) => !oldEntries.includes(e)));

  const rows: { entry: string; status: "added" | "removed" | "unchanged" }[] = [
    ...Array.from(removedSet).map((e) => ({ entry: e, status: "removed" as const })),
    ...newEntries.map((e) => ({ entry: e, status: addedSet.has(e) ? "added" as const : "unchanged" as const })),
  ];

  return (
    <div className="flex flex-col gap-0.5 mt-1 max-h-48 overflow-y-auto">
      {rows.map((r, i) => (
        <p
          key={i}
          className={cn(
            "font-mono text-[11px] break-all",
            r.status === "removed"   && "text-danger/80 line-through",
            r.status === "added"     && "text-success",
            r.status === "unchanged" && "text-muted",
          )}
        >
          <span className="select-none mr-1 opacity-50">
            {r.status === "added" ? "+" : r.status === "removed" ? "−" : " "}
          </span>
          {r.entry}
        </p>
      ))}
    </div>
  );
}

function ListEntries({ value, className }: { value: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-0.5 mt-1 max-h-48 overflow-y-auto", className)}>
      {splitList(value).map((e, i) => (
        <p key={i} className="font-mono text-[11px] break-all">{e}</p>
      ))}
    </div>
  );
}

export function StagedModal({ diff, busy, onApply, onClose }: StagedModalProps) {
  const { t } = useI18n();
  const [takeSnapshot, setTakeSnapshot] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("delta");

  const criticalChanges = diff.filter((e) => CRITICAL_VARS.has(e.name.toUpperCase()));
  const hasListValues = diff.some(
    (e) => isList(e.value ?? "") || isList(e.oldValue ?? "") || isList(e.newValue ?? ""),
  );

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
            {t("staged.critical", { count: criticalChanges.length })}
          </p>
          <p className="text-xs text-danger/80">
            {t("staged.critical_detail", { count: criticalChanges.length, vars: criticalChanges.map((e) => e.name).join(", ") })}
          </p>
        </div>
      )}

      <div className="px-6 py-4 border-b border-rim shrink-0">
        <p className="text-xs text-muted mb-3">
          {t("staged.broadcast")}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex gap-3 text-xs">
            {byKind.added.length > 0   && <span className="text-success">{t("staged.added", { count: byKind.added.length })}</span>}
            {byKind.removed.length > 0 && <span className="text-danger">{t("staged.removed", { count: byKind.removed.length })}</span>}
            {byKind.changed.length > 0 && <span className="text-warn">{t("staged.changed", { count: byKind.changed.length })}</span>}
          </div>
          {hasListValues && (
            <div className="flex rounded border border-rim overflow-hidden text-[10px]">
              {(["delta", "full"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-2.5 py-0.5 capitalize transition-colors",
                    viewMode === mode
                      ? "bg-accent text-bg font-semibold"
                      : "text-muted hover:text-fg hover:bg-hover",
                  )}
                >
                  {mode === "delta" ? t("staged.view_delta") : t("staged.view_full")}
                </button>
              ))}
            </div>
          )}
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
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide">{t(`staged.kind_${entry.kind}`)}</span>
              </div>

              {entry.kind === "removed" && (
                isList(entry.value!) ? (
                  <ListEntries value={entry.value!} className="opacity-70 line-through" />
                ) : (
                  <p className="font-mono text-[11px] opacity-70 line-through break-all">{entry.value}</p>
                )
              )}

              {entry.kind === "added" && (
                isList(entry.value!) ? (
                  <ListEntries value={entry.value!} />
                ) : (
                  <p className="font-mono text-[11px] break-all">{entry.value}</p>
                )
              )}

              {entry.kind === "changed" && (
                isList(entry.oldValue ?? "") || isList(entry.newValue ?? "") ? (
                  viewMode === "delta" ? (
                    <ListDiffDelta oldValue={entry.oldValue ?? ""} newValue={entry.newValue ?? ""} />
                  ) : (
                    <ListDiffFull oldValue={entry.oldValue ?? ""} newValue={entry.newValue ?? ""} />
                  )
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <p className="font-mono text-[11px] text-danger/70 line-through break-all">{entry.oldValue}</p>
                    <p className="font-mono text-[11px] text-success break-all">{entry.newValue}</p>
                  </div>
                )
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
          {t("staged.take_snapshot")}
        </label>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="md" onClick={onClose} disabled={busy}>{t("staged.cancel")}</Button>
          <Button variant="primary" size="md" onClick={() => onApply(takeSnapshot)} disabled={busy}>
            {busy ? t("staged.applying") : t("staged.apply", { count: diff.length })}
          </Button>
        </div>
      </div>
    </div>
  );
}

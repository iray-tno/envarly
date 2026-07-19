import { useState } from "react";
import { useI18n } from "../../hooks/useI18n";
import { cn } from "../../lib/cn";
import type { DiffEntry } from "../../lib/diff";
import { registryKindLabel } from "../../lib/envValueKind";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { ListDiffDelta, ListDiffFull, ListEntries } from "./ListDiff";
import { entryHasListValue, isList } from "./listDiffUtils";

const CRITICAL_VARS = new Set(["SYSTEMROOT", "WINDIR", "COMSPEC"]);

type ViewMode = "delta" | "full";

interface StagedModalProps {
  diff: DiffEntry[];
  busy: boolean;
  error?: string | null;
  onApply: (takeSnapshot: boolean) => void;
  onClose: () => void;
}

export function StagedModal({ diff, busy, error, onApply, onClose }: StagedModalProps) {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<ViewMode>("delta");

  const criticalChanges = diff.filter((e) => CRITICAL_VARS.has(e.name.toUpperCase()));
  const hasListValues = diff.some(entryHasListValue);

  const byKind = {
    added: diff.filter((e) => e.kind === "added"),
    removed: diff.filter((e) => e.kind === "removed"),
    changed: diff.filter((e) => e.kind === "changed"),
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {criticalChanges.length > 0 && (
        <div className="flex gap-2 px-6 py-3 bg-danger/10 border-b border-danger/30 shrink-0 text-danger">
          <Icon name="warning" size={16} className="mt-0.5" />
          <div>
            <p className="text-xs font-semibold mb-1">
              {t("staged.critical", { count: criticalChanges.length })}
            </p>
            <p className="text-xs">
              {t("staged.critical_detail", {
                count: criticalChanges.length,
                vars: criticalChanges.map((e) => e.name).join(", "),
              })}
            </p>
          </div>
        </div>
      )}

      <div className="px-6 py-4 border-b border-rim shrink-0">
        <p className="text-xs text-muted mb-3">{t("staged.broadcast")}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-3 text-xs">
            {byKind.added.length > 0 && (
              <span className="text-success">
                {t("staged.added", { count: byKind.added.length })}
              </span>
            )}
            {byKind.removed.length > 0 && (
              <span className="text-danger">
                {t("staged.removed", { count: byKind.removed.length })}
              </span>
            )}
            {byKind.changed.length > 0 && (
              <span className="text-warn">
                {t("staged.changed", { count: byKind.changed.length })}
              </span>
            )}
          </div>
          {hasListValues && (
            <div className="flex rounded border border-rim overflow-hidden text-[10px]">
              {(["delta", "full"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-2 py-1 capitalize transition-colors",
                    viewMode === mode
                      ? "bg-accent text-canvas font-semibold"
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
                entry.kind === "added" && "border-success/30 bg-success/5 text-success",
                entry.kind === "removed" && "border-danger/30 bg-danger/5 text-danger",
                entry.kind === "changed" && "border-warn/30 bg-warn/5 text-warn",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-semibold text-fg">{entry.name}</span>
                <span className="text-[10px]">{entry.scope}</span>
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide">
                  {t(`staged.kind_${entry.kind}`)}
                </span>
              </div>

              {entry.kind === "changed" && entry.oldValueKind !== entry.newValueKind && (
                <p className="font-mono text-[10px] text-muted mb-1">
                  {registryKindLabel(entry.oldValueKind)} → {registryKindLabel(entry.newValueKind)}
                </p>
              )}

              {entry.kind === "removed" &&
                (isList(entry.value) ? (
                  <ListEntries value={entry.value} className="line-through" />
                ) : (
                  <p className="font-mono text-[11px] line-through break-all">{entry.value}</p>
                ))}

              {entry.kind === "added" &&
                (isList(entry.value) ? (
                  <ListEntries value={entry.value} />
                ) : (
                  <p className="font-mono text-[11px] break-all">{entry.value}</p>
                ))}

              {entry.kind === "changed" &&
                (isList(entry.oldValue ?? "") || isList(entry.newValue ?? "") ? (
                  viewMode === "delta" ? (
                    <ListDiffDelta
                      oldValue={entry.oldValue ?? ""}
                      newValue={entry.newValue ?? ""}
                    />
                  ) : (
                    <ListDiffFull oldValue={entry.oldValue ?? ""} newValue={entry.newValue ?? ""} />
                  )
                ) : (
                  <div className="flex flex-col gap-1">
                    <p className="font-mono text-[11px] text-danger line-through break-all">
                      {entry.oldValue}
                    </p>
                    <p className="font-mono text-[11px] text-success break-all">{entry.newValue}</p>
                  </div>
                ))}
            </div>
          );
        })}
      </div>

      <div className="px-6 py-4 border-t border-rim shrink-0 flex flex-col gap-3">
        {error && (
          <p className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="md" onClick={onClose} disabled={busy}>
            {t("staged.cancel")}
          </Button>
          <Button variant="primary" size="md" onClick={() => onApply(true)} disabled={busy}>
            {busy ? t("staged.applying") : t("staged.apply", { count: diff.length })}
          </Button>
        </div>
      </div>
    </div>
  );
}

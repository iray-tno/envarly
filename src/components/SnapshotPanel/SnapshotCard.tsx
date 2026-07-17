import { type FormEvent, useEffect, useRef } from "react";
import { useI18n } from "../../hooks/useI18n";
import { cn } from "../../lib/cn";
import type { SnapshotMeta } from "../../types";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";

interface Props {
  snap: SnapshotMeta;
  isComparingSource: boolean;
  comparingFrom: SnapshotMeta | null;
  confirmDeleteId: string | null;
  editingId: string | null;
  editingLabel: string;
  renamingId: string | null;
  loadingPreview: boolean;
  canCompare: boolean;
  formatDate: (iso: string) => string;
  onSetEditingLabel: (label: string) => void;
  onRename: (e: FormEvent, id: string) => void;
  onCancelRename: () => void;
  onPreview: () => void;
  onStartCompare: () => void;
  onPickCompareTarget: () => void;
  onStartRename: () => void;
  onStartDelete: () => void;
  onDelete: () => void;
  onCancelDelete: () => void;
}

export function SnapshotCard({
  snap,
  isComparingSource,
  comparingFrom,
  confirmDeleteId,
  editingId,
  editingLabel,
  renamingId,
  loadingPreview,
  canCompare,
  formatDate,
  onSetEditingLabel,
  onRename,
  onCancelRename,
  onPreview,
  onStartCompare,
  onPickCompareTarget,
  onStartRename,
  onStartDelete,
  onDelete,
  onCancelDelete,
}: Props) {
  const { t } = useI18n();
  const renameInputRef = useRef<HTMLInputElement>(null);
  const isEditing = editingId === snap.id;
  const isConfirmingDelete = confirmDeleteId === snap.id;

  useEffect(() => {
    if (!isEditing) return;
    renameInputRef.current?.focus();
    renameInputRef.current?.select();
  }, [isEditing]);

  return (
    <div
      data-snapshot-id={snap.id}
      className={cn(
        "flex flex-col gap-2 px-4 py-2 bg-panel border rounded",
        isComparingSource ? "border-accent/40 bg-accent/5" : "border-rim",
      )}
    >
      {isEditing ? (
        <form className="flex items-center gap-1" onSubmit={(e) => onRename(e, snap.id)}>
          <input
            ref={renameInputRef}
            aria-label={t("snapshot.rename_label")}
            value={editingLabel}
            onChange={(e) => onSetEditingLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                onCancelRename();
              }
            }}
            className="h-8 min-w-0 flex-1 rounded border border-rim bg-surface px-2 text-sm text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <IconButton
            aria-label={t("snapshot.save_rename")}
            icon="check"
            type="submit"
            disabled={!editingLabel.trim() || renamingId === snap.id}
            title={t("snapshot.save_rename")}
          />
          <IconButton
            aria-label={t("snapshot.cancel_rename")}
            icon="x"
            onClick={onCancelRename}
            disabled={renamingId === snap.id}
            title={t("snapshot.cancel_rename")}
          />
        </form>
      ) : (
        <p className="text-sm font-medium leading-snug text-fg break-words" title={snap.label}>
          {snap.label}
        </p>
      )}

      <div>
        <p className="text-[11px] text-dim">{formatDate(snap.createdAt)}</p>
      </div>

      {!isEditing && (
        <div className="flex min-h-8 items-center gap-1">
          {comparingFrom ? (
            !isComparingSource && (
              <Button variant="secondary" size="xs" onClick={onPickCompareTarget}>
                {t("snapshot.compare_with")}
              </Button>
            )
          ) : isConfirmingDelete ? (
            <>
              <span className="min-w-0 flex-1 text-xs text-danger">
                {t("snapshot.confirm_delete")}
              </span>
              <Button variant="danger" size="xs" onClick={onDelete}>
                {t("snapshot.delete")}
              </Button>
              <Button variant="ghost" size="xs" onClick={onCancelDelete}>
                {t("snapshot.cancel")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                size="xs"
                onClick={onPreview}
                disabled={loadingPreview}
              >
                {loadingPreview ? "…" : t("snapshot.preview")}
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={onStartCompare}
                disabled={!canCompare}
                title={!canCompare ? t("snapshot.need_two") : undefined}
              >
                {t("snapshot.compare")}
              </Button>
              <span className="ml-auto flex items-center gap-1">
                <IconButton
                  aria-label={t("snapshot.rename")}
                  icon="pencil"
                  onClick={onStartRename}
                  title={t("snapshot.rename")}
                />
                <IconButton
                  aria-label={t("snapshot.delete_action")}
                  icon="trash"
                  variant="danger"
                  onClick={onStartDelete}
                  title={t("snapshot.delete_action")}
                />
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

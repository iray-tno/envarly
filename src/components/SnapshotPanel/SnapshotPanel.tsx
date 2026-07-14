import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../api";
import { useI18n } from "../../hooks/useI18n";
import { cn } from "../../lib/cn";
import type { DiffEntry } from "../../lib/diff";
import { computeDiff } from "../../lib/diff";
import type { EnvSnapshot, SnapshotMeta } from "../../types";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";
import { TextInput } from "../ui/TextInput";
import { SnapshotCompare } from "./SnapshotCompare";
import { SnapshotPreview } from "./SnapshotPreview";

interface Props {
  onStageSnapshot: (snap: EnvSnapshot) => void;
}

interface CompareResult {
  from: SnapshotMeta;
  to: SnapshotMeta;
  diff: DiffEntry[];
}

interface Status {
  kind: "success" | "error";
  message: string;
}

export function SnapshotPanel({ onStageSnapshot }: Props) {
  const { t } = useI18n();
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [previewing, setPreviewing] = useState<SnapshotMeta | null>(null);
  const [previewDiff, setPreviewDiff] = useState<DiffEntry[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [comparingFrom, setComparingFrom] = useState<SnapshotMeta | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setSnapshots(await api.listSnapshots());
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!editingId) return;
    renameInputRef.current?.focus();
    renameInputRef.current?.select();
  }, [editingId]);

  const handleCreate = async () => {
    const snapshotLabel = label.trim() || new Date().toLocaleString();
    setBusy(true);
    setStatus(null);
    try {
      await api.createSnapshot(snapshotLabel);
      setLabel("");
      setStatus({ kind: "success", message: t("snapshot.saved") });
      await load();
    } catch (e) {
      setStatus({ kind: "error", message: t("snapshot.error_save", { error: e }) });
    } finally {
      setBusy(false);
    }
  };

  const handlePreview = async (snap: SnapshotMeta) => {
    setLoadingPreview(true);
    setStatus(null);
    try {
      const current = await api.getRegistrySnapshot();
      setPreviewDiff(computeDiff(current, snap.snapshot));
      setPreviewing(snap);
    } catch (e) {
      setStatus({ kind: "error", message: t("snapshot.error_preview", { error: e }) });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleRestore = () => {
    if (!previewing) return;
    if (previewing.version < 2 && !confirm(t("snapshot.confirm_legacy_restore"))) {
      return;
    }
    onStageSnapshot(previewing.snapshot);
    const count = previewDiff.length;
    setStatus({
      kind: "success",
      message:
        count === 0
          ? t("snapshot.matches_current", { label: previewing.label })
          : t("snapshot.staged", { count, label: previewing.label }),
    });
    setPreviewing(null);
    setPreviewDiff([]);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteSnapshot(id);
      if (previewing?.id === id) {
        setPreviewing(null);
        setPreviewDiff([]);
      }
      if (comparingFrom?.id === id) setComparingFrom(null);
      if (compareResult?.from.id === id || compareResult?.to.id === id) setCompareResult(null);
      setConfirmDeleteId(null);
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartRename = (snap: SnapshotMeta) => {
    setConfirmDeleteId(null);
    setEditingId(snap.id);
    setEditingLabel(snap.label);
    setStatus(null);
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditingLabel("");
  };

  const handleRename = async (event: FormEvent, id: string) => {
    event.preventDefault();
    const nextLabel = editingLabel.trim();
    if (!nextLabel) return;

    setRenamingId(id);
    setStatus(null);
    try {
      const renamed = await api.renameSnapshot(id, nextLabel);
      setSnapshots((current) => current.map((snap) => (snap.id === id ? renamed : snap)));
      handleCancelRename();
      setStatus({ kind: "success", message: t("snapshot.renamed") });
    } catch (e) {
      setStatus({ kind: "error", message: t("snapshot.error_rename", { error: e }) });
    } finally {
      setRenamingId(null);
    }
  };

  const handleStartCompare = (snap: SnapshotMeta) => {
    setComparingFrom(snap);
    setCompareResult(null);
    setPreviewing(null);
    setPreviewDiff([]);
  };

  const handlePickCompareTarget = (to: SnapshotMeta) => {
    if (!comparingFrom) return;
    const diff = computeDiff(comparingFrom.snapshot, to.snapshot);
    setCompareResult({ from: comparingFrom, to, diff });
    setComparingFrom(null);
  };

  const handleCancelCompare = () => {
    setComparingFrom(null);
    setCompareResult(null);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="w-full px-5 py-5 flex flex-col gap-4 overflow-y-auto">
      <div>
        <h2 className="text-sm font-semibold text-fg mb-1">{t("snapshot.title")}</h2>
        <p className="text-xs text-muted">{t("snapshot.description")}</p>
      </div>

      <div className="flex gap-2">
        <TextInput
          label="Snapshot label"
          labelHidden
          placeholder={t("snapshot.label_placeholder")}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          className="flex-1"
        />
        <Button variant="primary" size="md" onClick={handleCreate} disabled={busy}>
          {busy && !previewing ? t("snapshot.saving") : t("snapshot.save")}
        </Button>
      </div>

      {status && (
        <p className={cn("text-xs", status.kind === "error" ? "text-danger" : "text-success")}>
          {status.message}
        </p>
      )}

      {compareResult ? (
        <SnapshotCompare
          from={compareResult.from}
          to={compareResult.to}
          diff={compareResult.diff}
          onBack={handleCancelCompare}
        />
      ) : previewing ? (
        <SnapshotPreview
          snap={previewing}
          diff={previewDiff}
          onRestore={handleRestore}
          onCancel={() => {
            setPreviewing(null);
            setPreviewDiff([]);
          }}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {comparingFrom && (
            <div className="flex items-center justify-between px-2 py-2 rounded border border-accent/30 bg-accent/10 text-accent text-xs">
              <span>{t("snapshot.comparing_hint", { label: comparingFrom.label })}</span>
              <Button variant="link" size="xs" onClick={handleCancelCompare}>
                {t("snapshot.cancel")}
              </Button>
            </div>
          )}
          {snapshots.length === 0 && (
            <p className="text-center text-dim text-xs py-6">{t("snapshot.no_snapshots")}</p>
          )}
          {snapshots.map((s) => {
            const isComparingSource = comparingFrom?.id === s.id;
            return (
              <div
                key={s.id}
                data-snapshot-id={s.id}
                className={cn(
                  "flex flex-col gap-2 px-4 py-2 bg-panel border rounded",
                  isComparingSource ? "border-accent/40 bg-accent/5" : "border-rim",
                )}
              >
                {editingId === s.id ? (
                  <form className="flex items-center gap-1" onSubmit={(e) => handleRename(e, s.id)}>
                    <input
                      ref={renameInputRef}
                      aria-label={t("snapshot.rename_label")}
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          e.preventDefault();
                          handleCancelRename();
                        }
                      }}
                      className="h-8 min-w-0 flex-1 rounded border border-rim bg-surface px-2 text-sm text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                    <IconButton
                      aria-label={t("snapshot.save_rename")}
                      icon="check"
                      type="submit"
                      disabled={!editingLabel.trim() || renamingId === s.id}
                      title={t("snapshot.save_rename")}
                    />
                    <IconButton
                      aria-label={t("snapshot.cancel_rename")}
                      icon="x"
                      onClick={handleCancelRename}
                      disabled={renamingId === s.id}
                      title={t("snapshot.cancel_rename")}
                    />
                  </form>
                ) : (
                  <p
                    className="text-sm font-medium leading-snug text-fg break-words"
                    title={s.label}
                  >
                    {s.label}
                  </p>
                )}
                <div>
                  <p className="text-[11px] text-dim">{formatDate(s.createdAt)}</p>
                </div>
                {editingId !== s.id && (
                  <div className="flex min-h-8 items-center gap-1">
                    {comparingFrom ? (
                      !isComparingSource && (
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => handlePickCompareTarget(s)}
                        >
                          {t("snapshot.compare_with")}
                        </Button>
                      )
                    ) : confirmDeleteId === s.id ? (
                      <>
                        <span className="min-w-0 flex-1 text-xs text-danger">
                          {t("snapshot.confirm_delete")}
                        </span>
                        <Button variant="danger" size="xs" onClick={() => handleDelete(s.id)}>
                          {t("snapshot.delete")}
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => setConfirmDeleteId(null)}>
                          {t("snapshot.cancel")}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => handlePreview(s)}
                          disabled={loadingPreview}
                        >
                          {loadingPreview ? "…" : t("snapshot.preview")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleStartCompare(s)}
                          disabled={snapshots.length < 2}
                          title={snapshots.length < 2 ? t("snapshot.need_two") : undefined}
                        >
                          {t("snapshot.compare")}
                        </Button>
                        <span className="ml-auto flex items-center gap-1">
                          <IconButton
                            aria-label={t("snapshot.rename")}
                            icon="pencil"
                            onClick={() => handleStartRename(s)}
                            title={t("snapshot.rename")}
                          />
                          <IconButton
                            aria-label={t("snapshot.delete_action")}
                            icon="trash"
                            variant="danger"
                            onClick={() => {
                              setEditingId(null);
                              setConfirmDeleteId(s.id);
                            }}
                            title={t("snapshot.delete_action")}
                          />
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

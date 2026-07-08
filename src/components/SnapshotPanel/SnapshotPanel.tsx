import { useCallback, useEffect, useState } from "react";
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

export function SnapshotPanel({ onStageSnapshot }: Props) {
  const { t } = useI18n();
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<SnapshotMeta | null>(null);
  const [previewDiff, setPreviewDiff] = useState<DiffEntry[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [comparingFrom, setComparingFrom] = useState<SnapshotMeta | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);

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

  const handleCreate = async () => {
    const snapshotLabel = label.trim() || new Date().toLocaleString();
    setBusy(true);
    setStatus(null);
    try {
      await api.createSnapshot(snapshotLabel);
      setLabel("");
      setStatus(t("snapshot.saved"));
      await load();
    } catch (e) {
      setStatus(t("snapshot.error_save", { error: e }));
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
      setStatus(t("snapshot.error_preview", { error: e }));
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleRestore = () => {
    if (!previewing) return;
    onStageSnapshot(previewing.snapshot);
    const count = previewDiff.length;
    setStatus(
      count === 0
        ? t("snapshot.matches_current", { label: previewing.label })
        : t("snapshot.staged", { count, label: previewing.label }),
    );
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
        <p className={cn("text-xs", status.startsWith("Error") ? "text-danger" : "text-success")}>
          {status}
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
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded border border-accent/30 bg-accent/10 text-accent text-xs">
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
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 bg-panel border rounded",
                  isComparingSource ? "border-accent/40 bg-accent/5" : "border-rim",
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-fg truncate">{s.label}</p>
                  <p className="text-[11px] text-dim">{formatDate(s.createdAt)}</p>
                </div>
                <div className="flex gap-1.5 shrink-0 items-center">
                  {comparingFrom ? (
                    !isComparingSource && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePickCompareTarget(s)}
                      >
                        {t("snapshot.compare_with")}
                      </Button>
                    )
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePreview(s)}
                        disabled={loadingPreview}
                      >
                        {loadingPreview ? "…" : t("snapshot.preview")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartCompare(s)}
                        disabled={snapshots.length < 2}
                        title={snapshots.length < 2 ? t("snapshot.need_two") : undefined}
                      >
                        {t("snapshot.compare")}
                      </Button>
                    </>
                  )}
                  {!comparingFrom &&
                    (confirmDeleteId === s.id ? (
                      <>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(s.id)}>
                          {t("snapshot.delete")}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(null)}>
                          {t("snapshot.cancel")}
                        </Button>
                      </>
                    ) : (
                      <IconButton
                        aria-label="Delete snapshot"
                        icon="x"
                        variant="danger"
                        onClick={() => setConfirmDeleteId(s.id)}
                        title="Delete snapshot"
                      />
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

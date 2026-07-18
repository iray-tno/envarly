import { type FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import { useI18n } from "../../hooks/useI18n";
import type { DiffEntry } from "../../lib/diff";
import { computeDiff } from "../../lib/diff";
import type { EnvSnapshot, SnapshotMeta } from "../../types";

interface CompareResult {
  from: SnapshotMeta;
  to: SnapshotMeta;
  diff: DiffEntry[];
}

interface Status {
  kind: "success" | "error";
  message: string;
}

export function useSnapshotPanel(onStageSnapshot: (snap: EnvSnapshot) => void) {
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
      setStatus({ kind: "success", message: t("snapshot.saved") });
      await load();
    } catch (e) {
      setStatus({ kind: "error", message: t("snapshot.error_save", { error: e }) });
    } finally {
      setBusy(false);
    }
  };

  const closePreview = () => {
    setPreviewing(null);
    setPreviewDiff([]);
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
    closePreview();
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteSnapshot(id);
      if (previewing?.id === id) closePreview();
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
    closePreview();
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

  return {
    snapshots,
    label,
    setLabel,
    busy,
    status,
    previewing,
    previewDiff,
    loadingPreview,
    confirmDeleteId,
    setConfirmDeleteId,
    editingId,
    setEditingId,
    editingLabel,
    setEditingLabel,
    renamingId,
    comparingFrom,
    compareResult,
    handleCreate,
    handlePreview,
    closePreview,
    handleRestore,
    handleDelete,
    handleStartRename,
    handleCancelRename,
    handleRename,
    handleStartCompare,
    handlePickCompareTarget,
    handleCancelCompare,
  };
}

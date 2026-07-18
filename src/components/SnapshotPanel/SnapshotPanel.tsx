import { useI18n } from "../../hooks/useI18n";
import { cn } from "../../lib/cn";
import type { EnvSnapshot } from "../../types";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { TextInput } from "../ui/TextInput";
import { SnapshotCard } from "./SnapshotCard";
import { SnapshotCompare } from "./SnapshotCompare";
import { SnapshotPreview } from "./SnapshotPreview";
import { useSnapshotPanel } from "./useSnapshotPanel";

interface Props {
  onStageSnapshot: (snap: EnvSnapshot) => void;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function SnapshotPanel({ onStageSnapshot }: Props) {
  const { t } = useI18n();
  const {
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
  } = useSnapshotPanel(onStageSnapshot);

  return (
    <>
      <div
        data-testid="snapshot-panel-scroll"
        className="h-full min-h-0 w-full px-5 py-5 flex flex-col gap-4 overflow-y-auto"
      >
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
          {snapshots.map((s) => (
            <SnapshotCard
              key={s.id}
              snap={s}
              isComparingSource={comparingFrom?.id === s.id}
              comparingFrom={comparingFrom}
              confirmDeleteId={confirmDeleteId}
              editingId={editingId}
              editingLabel={editingLabel}
              renamingId={renamingId}
              loadingPreview={loadingPreview}
              canCompare={snapshots.length >= 2}
              formatDate={formatDate}
              onSetEditingLabel={setEditingLabel}
              onRename={handleRename}
              onCancelRename={handleCancelRename}
              onPreview={() => handlePreview(s)}
              onStartCompare={() => handleStartCompare(s)}
              onPickCompareTarget={() => handlePickCompareTarget(s)}
              onStartRename={() => handleStartRename(s)}
              onStartDelete={() => {
                setEditingId(null);
                setConfirmDeleteId(s.id);
              }}
              onDelete={() => handleDelete(s.id)}
              onCancelDelete={() => setConfirmDeleteId(null)}
            />
          ))}
        </div>
      </div>

      <Modal
        open={previewing !== null}
        onClose={closePreview}
        title={t("snapshot_preview.title")}
        size="xl"
        flex
      >
        {previewing && (
          <div className="flex-1 min-h-0 px-6 py-5">
            <SnapshotPreview
              snap={previewing}
              diff={previewDiff}
              onRestore={handleRestore}
              onCancel={closePreview}
            />
          </div>
        )}
      </Modal>

      <Modal
        open={compareResult !== null}
        onClose={handleCancelCompare}
        title={t("snapshot_compare.title")}
        size="xl"
        flex
      >
        {compareResult && (
          <div className="flex-1 min-h-0 px-6 py-5">
            <SnapshotCompare
              from={compareResult.from}
              to={compareResult.to}
              diff={compareResult.diff}
            />
          </div>
        )}
      </Modal>
    </>
  );
}

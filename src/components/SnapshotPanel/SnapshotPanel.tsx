import { useEffect, useState } from "react";
import { api } from "../../api";
import { cn } from "../../lib/cn";
import { computeDiff } from "../../lib/diff";
import type { DiffEntry } from "../../lib/diff";
import { resolveSecret } from "../../lib/secrets";
import type { EnvSnapshot, SnapshotMeta } from "../../types";
import { Button } from "../ui/Button";
import { TextInput } from "../ui/TextInput";

interface Props {
  onStageSnapshot: (snap: EnvSnapshot) => void;
}

// ── Diff summary row ─────────────────────────────────────────────────────────

function DiffRow({ entry }: { entry: DiffEntry }) {
  const secret = resolveSecret(entry.name, entry.value ?? entry.newValue ?? "");
  const [revealed, setRevealed] = useState(false);

  const mask = (v: string) =>
    secret && !revealed ? "••••••••" : v;

  return (
    <tr className="border-b border-rim-subtle last:border-0 text-xs">
      <td className="px-2 py-1.5 w-5 text-center font-mono font-bold shrink-0">
        {entry.kind === "added"   && <span className="text-success">+</span>}
        {entry.kind === "removed" && <span className="text-danger">−</span>}
        {entry.kind === "changed" && <span className="text-warn">~</span>}
      </td>
      <td className="px-2 py-1.5 font-mono font-semibold text-fg whitespace-nowrap">
        <span className="flex items-center gap-1.5">
          {entry.name}
          {secret && (
            <span className="text-[9px] font-medium text-warn/80">{secret.service}</span>
          )}
        </span>
      </td>
      <td className="px-2 py-1.5 text-muted w-12">{entry.scope[0]}</td>
      <td className="px-2 py-1.5 font-mono text-muted max-w-xs truncate">
        {entry.kind === "changed" ? (
          <span className="flex flex-col gap-0.5">
            <span className="line-through text-danger/70">{mask(entry.oldValue!)}</span>
            <span className="text-success/90">{mask(entry.newValue!)}</span>
          </span>
        ) : (
          <span>{mask(entry.value!)}</span>
        )}
      </td>
      {secret && (
        <td className="px-2 py-1.5">
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="text-[10px] text-dim hover:text-muted transition-colors"
          >
            {revealed ? "hide" : "show"}
          </button>
        </td>
      )}
    </tr>
  );
}

// ── Preview panel ─────────────────────────────────────────────────────────────

interface PreviewProps {
  snap: SnapshotMeta;
  diff: DiffEntry[];
  onRestore: () => void;
  onCancel: () => void;
}

function SnapshotPreview({ snap, diff, onRestore, onCancel }: PreviewProps) {
  const added   = diff.filter((e) => e.kind === "added").length;
  const removed = diff.filter((e) => e.kind === "removed").length;
  const changed = diff.filter((e) => e.kind === "changed").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-fg truncate">{snap.label}</p>
          <p className="text-[11px] text-dim">{new Date(snap.createdAt).toLocaleString()}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>← Back</Button>
      </div>

      {diff.length === 0 ? (
        <p className="text-xs text-dim py-4 text-center">
          Current state matches this snapshot — no changes would be made.
        </p>
      ) : (
        <>
          <div className="flex gap-3 text-xs">
            {added   > 0 && <span className="text-success">+{added} added</span>}
            {removed > 0 && <span className="text-danger">−{removed} removed</span>}
            {changed > 0 && <span className="text-warn">~{changed} changed</span>}
          </div>

          <div className="rounded border border-rim overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-rim bg-surface text-muted text-[10px] uppercase tracking-wide">
                  <th className="px-2 py-1.5 w-5" />
                  <th className="px-2 py-1.5 text-left">Name</th>
                  <th className="px-2 py-1.5 text-left">Scope</th>
                  <th className="px-2 py-1.5 text-left">Value</th>
                  <th className="px-2 py-1.5 w-10" />
                </tr>
              </thead>
              <tbody>
                {diff.map((entry) => (
                  <DiffRow key={`${entry.scope}:${entry.name}`} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex gap-2">
        <Button
          variant={diff.length === 0 ? "secondary" : "primary"}
          size="md"
          onClick={onRestore}
        >
          {diff.length === 0 ? "No changes to stage" : "Stage restore"}
        </Button>
        <Button variant="ghost" size="md" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function SnapshotPanel({ onStageSnapshot }: Props) {
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<SnapshotMeta | null>(null);
  const [previewDiff, setPreviewDiff] = useState<DiffEntry[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = async () => {
    try {
      setSnapshots(await api.listSnapshots());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    const snapshotLabel = label.trim() || new Date().toLocaleString();
    setBusy(true);
    setStatus(null);
    try {
      await api.createSnapshot(snapshotLabel);
      setLabel("");
      setStatus("Snapshot saved.");
      await load();
    } catch (e) {
      setStatus(`Error: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const handlePreview = async (snap: SnapshotMeta) => {
    setLoadingPreview(true);
    setStatus(null);
    try {
      const current = await api.getRegistrySnapshot();
      // Show what applying snap would change: diff from current → snap
      setPreviewDiff(computeDiff(current, snap.snapshot));
      setPreviewing(snap);
    } catch (e) {
      setStatus(`Error loading preview: ${e}`);
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
        ? `"${previewing.label}" matches current state — nothing to stage.`
        : `"${previewing.label}" staged (${count} change${count !== 1 ? "s" : ""}). Use "Apply staged" to commit.`,
    );
    setPreviewing(null);
    setPreviewDiff([]);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteSnapshot(id);
      if (previewing?.id === id) { setPreviewing(null); setPreviewDiff([]); }
      setConfirmDeleteId(null);
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  return (
    <div className="w-full px-5 py-5 flex flex-col gap-4 overflow-y-auto">
      <div>
        <h2 className="text-sm font-semibold text-fg mb-1">Snapshots</h2>
        <p className="text-xs text-muted">
          Save the current state of all environment variables. Preview and restore any snapshot.
        </p>
      </div>

      {/* Create */}
      <div className="flex gap-2">
        <TextInput
          label="Snapshot label"
          labelHidden
          placeholder="Snapshot label (optional)…"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          className="flex-1"
        />
        <Button variant="primary" size="md" onClick={handleCreate} disabled={busy}>
          {busy && !previewing ? "…" : "Save snapshot"}
        </Button>
      </div>

      {status && (
        <p className={cn("text-xs", status.startsWith("Error") ? "text-danger" : "text-success")}>
          {status}
        </p>
      )}

      {/* Preview or list */}
      {previewing ? (
        <SnapshotPreview
          snap={previewing}
          diff={previewDiff}
          onRestore={handleRestore}
          onCancel={() => { setPreviewing(null); setPreviewDiff([]); }}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {snapshots.length === 0 && (
            <p className="text-center text-dim text-xs py-6">
              No snapshots yet. Create one before making changes!
            </p>
          )}
          {snapshots.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 px-3.5 py-2.5 bg-panel border border-rim rounded"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fg truncate">{s.label}</p>
                <p className="text-[11px] text-dim">{formatDate(s.createdAt)}</p>
              </div>
              <div className="flex gap-1.5 shrink-0 items-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePreview(s)}
                  disabled={loadingPreview}
                >
                  {loadingPreview ? "…" : "Preview"}
                </Button>
                {confirmDeleteId === s.id ? (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(s.id)}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(s.id)}
                    className="px-2 py-1 rounded text-dim text-sm hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Delete snapshot"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

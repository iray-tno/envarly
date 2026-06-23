import { useEffect, useState } from "react";
import { api } from "../../api";
import type { SnapshotMeta } from "../../types";

interface Props {
  onRestored: () => void;
}

export function SnapshotPanel({ onRestored }: Props) {
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const load = async () => {
    try {
      setSnapshots(await api.listSnapshots());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, []);

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

  const handleRestore = async (id: string, snapshotLabel: string) => {
    if (!confirm(`Restore snapshot "${snapshotLabel}"? This will overwrite current variables.`))
      return;
    setBusy(true);
    setStatus(null);
    try {
      await api.restoreSnapshot(id);
      setStatus("Snapshot restored.");
      onRestored();
    } catch (e) {
      setStatus(`Error: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this snapshot?")) return;
    try {
      await api.deleteSnapshot(id);
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-5 py-6 flex flex-col gap-4 overflow-y-auto">
      <div>
        <h2 className="text-sm font-semibold text-fg mb-1">Snapshots</h2>
        <p className="text-xs text-muted">
          Save the current state of all environment variables. Restore any snapshot to roll back.
        </p>
      </div>

      {/* Create */}
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-1.5 bg-surface border border-rim rounded text-fg text-sm placeholder:text-dim focus:border-accent focus:outline-none transition-colors"
          placeholder="Snapshot label (optional)…"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <button
          onClick={handleCreate}
          disabled={busy}
          className="px-3 py-1.5 rounded bg-accent text-canvas text-xs font-medium hover:bg-accent-hi disabled:opacity-50 transition-colors"
        >
          {busy ? "…" : "Create Snapshot"}
        </button>
      </div>

      {status && <p className="text-xs text-success">{status}</p>}

      {/* List */}
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
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => handleRestore(s.id, s.label)}
                disabled={busy}
                className="px-2.5 py-1 rounded bg-surface border border-rim text-fg text-xs hover:bg-hover disabled:opacity-50 transition-colors"
              >
                Restore
              </button>
              <button
                onClick={() => handleDelete(s.id)}
                className="px-2 py-1 rounded text-dim text-sm hover:text-danger hover:bg-danger/10 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

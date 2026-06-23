import React, { useEffect, useState } from 'react';
import { api } from '../api';
import type { SnapshotMeta } from '../types';

interface Props {
  onRestored: () => void;
}

export function SnapshotPanel({ onRestored }: Props) {
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await api.listSnapshots();
      setSnapshots(data);
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
      setLabel('');
      setStatus('Snapshot saved.');
      load();
    } catch (e) {
      setStatus(`Error: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async (id: string, snapshotLabel: string) => {
    if (!confirm(`Restore snapshot "${snapshotLabel}"? This will overwrite current variables.`)) return;
    setBusy(true);
    setStatus(null);
    try {
      await api.restoreSnapshot(id);
      setStatus('Snapshot restored.');
      onRestored();
    } catch (e) {
      setStatus(`Error: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this snapshot?')) return;
    try {
      await api.deleteSnapshot(id);
      load();
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
    <div className="snapshot-panel">
      <div className="snapshot-create">
        <input
          className="snapshot-label-input"
          placeholder="Snapshot label (optional)..."
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <button className="btn btn--primary" onClick={handleCreate} disabled={busy}>
          {busy ? '...' : 'Create Snapshot'}
        </button>
      </div>

      {status && <div className="snapshot-status">{status}</div>}

      <div className="snapshot-list">
        {snapshots.length === 0 && (
          <div className="snapshot-empty">No snapshots yet. Create one before making changes!</div>
        )}
        {snapshots.map((s) => (
          <div key={s.id} className="snapshot-item">
            <div className="snapshot-item-info">
              <span className="snapshot-item-label">{s.label}</span>
              <span className="snapshot-item-date">{formatDate(s.createdAt)}</span>
            </div>
            <div className="snapshot-item-actions">
              <button
                className="btn btn--secondary"
                onClick={() => handleRestore(s.id, s.label)}
                disabled={busy}
              >
                Restore
              </button>
              <button
                className="btn btn--ghost btn--danger"
                onClick={() => handleDelete(s.id)}
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

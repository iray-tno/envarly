import React, { useEffect, useState } from 'react';
import type { EnvVar } from '../types';
import { api } from '../api';
import { PathEditor } from './PathEditor';

interface Props {
  variable: EnvVar | null;
  onSaved: () => void;
  onDeleted: () => void;
}

export function DetailPanel({ variable, onSaved, onDeleted }: Props) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  useEffect(() => {
    if (variable) {
      setValue(variable.value);
      setDirty(false);
      setStatus(null);
    }
  }, [variable?.name, variable?.scope]);

  if (!variable) {
    return (
      <div className="detail-empty">
        <div className="detail-empty-icon">⚙</div>
        <p>Select a variable to view and edit it</p>
      </div>
    );
  }

  const handleValueChange = (newVal: string) => {
    setValue(newVal);
    setDirty(newVal !== variable.value);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await api.setEnvVar(variable.name, value, variable.scope);
      setDirty(false);
      setStatus({ type: 'ok', msg: 'Saved and broadcast to running apps.' });
      onSaved();
    } catch (e) {
      setStatus({ type: 'err', msg: String(e) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${variable.name}" from ${variable.scope} environment?`)) return;
    try {
      await api.deleteEnvVar(variable.name, variable.scope);
      onDeleted();
    } catch (e) {
      setStatus({ type: 'err', msg: String(e) });
    }
  };

  const isPath = variable.name.toUpperCase() === 'PATH' || variable.isPathLike;

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div className="detail-title">
          <h2 className="detail-name">{variable.name}</h2>
          <span className={`badge badge--${variable.scope.toLowerCase()}`}>
            {variable.scope}
          </span>
        </div>
        <div className="detail-actions">
          {dirty && (
            <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
          <button className="btn btn--danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      {status && (
        <div className={`status-bar status-bar--${status.type}`}>{status.msg}</div>
      )}

      <div className="detail-body">
        {isPath ? (
          <>
            <div className="detail-section-label">PATH entries (drag to reorder, double-click to edit)</div>
            <PathEditor
              rawValue={value}
              onChange={handleValueChange}
            />
          </>
        ) : (
          <>
            <div className="detail-section-label">Value</div>
            <textarea
              className="value-textarea"
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              rows={Math.max(3, value.split('\n').length + 1)}
              spellCheck={false}
            />
          </>
        )}

        <div className="detail-meta">
          <div className="detail-meta-row">
            <span className="detail-meta-label">Scope</span>
            <span className="detail-meta-value">{variable.scope}</span>
          </div>
          <div className="detail-meta-row">
            <span className="detail-meta-label">Length</span>
            <span className="detail-meta-value">{value.length} chars</span>
          </div>
          {isPath && (
            <div className="detail-meta-row">
              <span className="detail-meta-label">Entries</span>
              <span className="detail-meta-value">
                {value.split(';').filter((p) => p.trim()).length}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

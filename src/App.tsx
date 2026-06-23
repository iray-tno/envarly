import React, { useEffect, useState } from 'react';
import './App.css';
import { useEnvVars } from './hooks/useEnvVars';
import { Sidebar } from './components/Sidebar';
import { DetailPanel } from './components/DetailPanel';
import { SnapshotPanel } from './components/SnapshotPanel';
import type { EnvVar } from './types';

type Tab = 'editor' | 'snapshots';

export default function App() {
  const { vars, loading, error, refresh } = useEnvVars();
  const [selected, setSelected] = useState<EnvVar | null>(null);
  const [tab, setTab] = useState<Tab>('editor');

  useEffect(() => { refresh(); }, []);

  const handleDeleted = () => {
    setSelected(null);
    refresh();
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-logo">⚡</span>
          <span className="app-title">Envarly</span>
        </div>
        <nav className="app-nav">
          <button
            className={`nav-tab ${tab === 'editor' ? 'active' : ''}`}
            onClick={() => setTab('editor')}
          >
            Variables
          </button>
          <button
            className={`nav-tab ${tab === 'snapshots' ? 'active' : ''}`}
            onClick={() => setTab('snapshots')}
          >
            Snapshots
          </button>
        </nav>
        <div className="app-header-right">
          <button
            className="btn btn--ghost"
            onClick={refresh}
            disabled={loading}
            title="Refresh from registry"
          >
            ↻ Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="global-error">
          Registry error: {error}
        </div>
      )}

      <main className="app-main">
        {tab === 'editor' ? (
          <>
            <Sidebar
              vars={vars}
              selected={selected}
              onSelect={setSelected}
              loading={loading}
            />
            <div className="detail-container">
              <DetailPanel
                variable={selected}
                onSaved={refresh}
                onDeleted={handleDeleted}
              />
            </div>
          </>
        ) : (
          <div className="snapshots-container">
            <SnapshotPanel onRestored={refresh} />
          </div>
        )}
      </main>
    </div>
  );
}

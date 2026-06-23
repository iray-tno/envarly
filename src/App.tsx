import { useCallback, useEffect, useRef, useState } from "react";
import { DetailPanel } from "./components/DetailPanel/DetailPanel";
import { DiffPanel } from "./components/DiffPanel/DiffPanel";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { SnapshotPanel } from "./components/SnapshotPanel/SnapshotPanel";
import { useEnvVars } from "./hooks/useEnvVars";
import { cn } from "./lib/cn";
import { applyAccepted, computeDiff, snapshotsEqual } from "./lib/diff";
import type { DiffEntry } from "./lib/diff";
import { api } from "./api";
import type { EnvSnapshot, EnvVar, VarScope } from "./types";

type Tab = "editor" | "snapshots" | "changes";

export default function App() {
  const { vars, loading, error, refresh } = useEnvVars();
  const [selected, setSelected] = useState<EnvVar | null>(null);
  const [tab, setTab] = useState<Tab>("editor");

  // Baseline snapshot captured on mount; updated after apply
  const baselineRef = useRef<EnvSnapshot | null>(null);
  const [diffEntries, setDiffEntries] = useState<DiffEntry[]>([]);
  const [applyBusy, setApplyBusy] = useState(false);

  /** Fetch current registry state and compare against baseline. */
  const checkForExternalChanges = useCallback(async () => {
    if (!baselineRef.current) return;
    try {
      const current = await api.getRegistrySnapshot();
      if (snapshotsEqual(baselineRef.current, current)) {
        setDiffEntries([]);
      } else {
        setDiffEntries(computeDiff(baselineRef.current, current));
      }
    } catch {
      // silently ignore — diff detection is best-effort
    }
  }, []);

  // Capture baseline on first load
  useEffect(() => {
    (async () => {
      try {
        baselineRef.current = await api.getRegistrySnapshot();
      } catch {
        // ignore; diff detection won't work but the rest of the app is fine
      }
      refresh();
    })();
  }, []);

  const handleRefresh = useCallback(async () => {
    await refresh();
    await checkForExternalChanges();
  }, [refresh, checkForExternalChanges]);

  const handleDeleted = () => {
    setSelected(null);
    refresh();
  };

  /** Called from DiffPanel: write reverted entries back to registry, advance baseline. */
  const handleDiffApply = async (accepted: DiffEntry[], reverted: DiffEntry[]) => {
    setApplyBusy(true);
    try {
      for (const entry of reverted) {
        const scope = entry.scope as VarScope;
        if (entry.kind === "added") {
          // revert: delete what was added externally
          await api.deleteEnvVar(entry.name, scope);
        } else if (entry.kind === "removed") {
          // revert: restore what was deleted externally
          await api.setEnvVar(entry.name, entry.value!, scope);
        } else {
          // revert: write old value back
          await api.setEnvVar(entry.name, entry.oldValue!, scope);
        }
      }

      // Advance baseline: merge accepted external changes
      if (baselineRef.current) {
        baselineRef.current = applyAccepted(baselineRef.current, accepted);
      }

      setDiffEntries([]);
      setTab("editor");
      await refresh();
    } catch (err) {
      console.error("Failed to apply diff", err);
    } finally {
      setApplyBusy(false);
    }
  };

  const handleDiffDismiss = () => {
    // Advance baseline to current (ignore all diffs)
    if (baselineRef.current) {
      baselineRef.current = applyAccepted(baselineRef.current, diffEntries);
    }
    setDiffEntries([]);
    if (tab === "changes") setTab("editor");
  };

  // Auto-switch to changes tab when new diffs appear
  useEffect(() => {
    if (diffEntries.length > 0 && tab === "editor") {
      setTab("changes");
    }
  }, [diffEntries.length]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "editor", label: "Variables" },
    { id: "snapshots", label: "Snapshots" },
    ...(diffEntries.length > 0 ? [{ id: "changes" as Tab, label: `Changes (${diffEntries.length})` }] : []),
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header
        className="flex items-center gap-3 h-12 px-4 bg-panel border-b border-rim shrink-0"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div className="flex items-center gap-2 mr-2">
          <span className="text-lg">⚡</span>
          <span className="text-[15px] font-semibold tracking-tight">Envarly</span>
        </div>

        <nav
          className="flex gap-0.5"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "px-3 py-1.5 rounded text-[13px] transition-colors",
                tab === id ? "bg-surface text-fg" : "text-muted hover:bg-hover hover:text-fg",
                id === "changes" && tab !== id && "text-warn hover:text-warn",
              )}
            >
              {label}
            </button>
          ))}
        </nav>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="ml-auto px-2.5 py-1 rounded text-muted text-xs hover:bg-hover hover:text-fg disabled:opacity-50 transition-colors"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          ↻ Refresh
        </button>
      </header>

      {error && (
        <div className="px-4 py-2 bg-danger/15 border-b border-danger text-danger text-xs">
          Registry error: {error}
        </div>
      )}

      <main className="flex flex-1 overflow-hidden">
        {tab === "editor" && (
          <>
            <Sidebar vars={vars} selected={selected} onSelect={setSelected} loading={loading} />
            <div className="flex flex-1 overflow-hidden">
              <DetailPanel variable={selected} onSaved={refresh} onDeleted={handleDeleted} />
            </div>
          </>
        )}

        {tab === "snapshots" && (
          <div className="flex flex-1 overflow-hidden">
            <SnapshotPanel onRestored={refresh} />
          </div>
        )}

        {tab === "changes" && (
          <div className="flex flex-1 overflow-hidden">
            <DiffPanel
              entries={diffEntries}
              onApply={handleDiffApply}
              onDismiss={handleDiffDismiss}
              busy={applyBusy}
            />
          </div>
        )}
      </main>
    </div>
  );
}

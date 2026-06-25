import { useCallback, useEffect, useRef, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { DetailPanel } from "./components/DetailPanel/DetailPanel";
import { DiffPanel } from "./components/DiffPanel/DiffPanel";
import { ImportExportPanel } from "./components/ImportExportPanel/ImportExportPanel";
import { LicensesPanel } from "./components/LicensesPanel/LicensesPanel";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { SnapshotPanel } from "./components/SnapshotPanel/SnapshotPanel";
import { Button } from "./components/ui/Button";
import { Modal } from "./components/ui/Modal";
import { ThemeContext } from "./context/ThemeContext";
import { useEnvVars } from "./hooks/useEnvVars";
import { useTheme } from "./hooks/useTheme";
import { cn } from "./lib/cn";
import { applyAccepted, computeDiff, snapshotsEqual } from "./lib/diff";
import type { DiffEntry } from "./lib/diff";
import { api } from "./api";
import type { EnvSnapshot, EnvVar, VarScope } from "./types";

type Dialog = "importexport" | "changes" | "licenses" | null;

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { vars, loading, error, refresh } = useEnvVars();
  const [selected, setSelected] = useState<EnvVar | null>(null);
  const [elevated, setElevated] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);

  const baselineRef = useRef<EnvSnapshot | null>(null);
  const [diffEntries, setDiffEntries] = useState<DiffEntry[]>([]);
  const [applyBusy, setApplyBusy] = useState(false);

  const checkForExternalChanges = useCallback(async () => {
    if (!baselineRef.current) return;
    try {
      const current = await api.getRegistrySnapshot();
      setDiffEntries(snapshotsEqual(baselineRef.current, current) ? [] : computeDiff(baselineRef.current, current));
    } catch {
      // diff detection is best-effort
    }
  }, []);

  useEffect(() => {
    (async () => {
      try { baselineRef.current = await api.getRegistrySnapshot(); } catch { }
      try { setElevated(await api.isElevated()); } catch { }
      refresh();
    })();
  }, []);

  const handleRefresh = useCallback(async () => {
    await refresh();
    await checkForExternalChanges();
  }, [refresh, checkForExternalChanges]);

  const handleDeleted = () => { setSelected(null); refresh(); };

  const handleDiffApply = async (accepted: DiffEntry[], reverted: DiffEntry[]) => {
    setApplyBusy(true);
    try {
      for (const entry of reverted) {
        const scope = entry.scope as VarScope;
        if (entry.kind === "added") await api.deleteEnvVar(entry.name, scope);
        else if (entry.kind === "removed") await api.setEnvVar(entry.name, entry.value!, scope);
        else await api.setEnvVar(entry.name, entry.oldValue!, scope);
      }
      if (baselineRef.current) baselineRef.current = applyAccepted(baselineRef.current, accepted);
      setDiffEntries([]);
      setDialog(null);
      await refresh();
    } catch (err) {
      console.error("Failed to apply diff", err);
    } finally {
      setApplyBusy(false);
    }
  };

  const handleDiffDismiss = () => {
    if (baselineRef.current) baselineRef.current = applyAccepted(baselineRef.current, diffEntries);
    setDiffEntries([]);
    setDialog(null);
  };

  // Auto-open changes dialog when new diffs appear
  useEffect(() => {
    if (diffEntries.length > 0) setDialog("changes");
  }, [diffEntries.length]);

  return (
    <ThemeContext.Provider value={theme}>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center gap-2 h-13 px-5 bg-panel border-b border-rim shrink-0"
          style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        >
          <div className="flex items-center gap-2 mr-3">
            <span className="text-lg">⚡</span>
            <span className="text-[15px] font-semibold tracking-tight">Envarly</span>
          </div>

          <div
            className="flex items-center gap-1.5"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          >
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
              ↻ Refresh
            </Button>

            {diffEntries.length > 0 && (
              <Button
                variant="warn"
                size="sm"
                onClick={() => setDialog("changes")}
              >
                ⚠ Apply {diffEntries.length} {diffEntries.length === 1 ? "change" : "changes"}
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={() => setDialog("importexport")}>
              Import / Export
            </Button>

            <Button
              variant={snapshotsOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSnapshotsOpen((o) => !o)}
            >
              Snapshots
            </Button>
          </div>

          <div
            className="ml-auto flex items-center gap-2"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          >
            {!elevated && (
              <Button
                variant="warn"
                size="sm"
                onClick={() => api.restartAsAdmin()}
                title="System variables are read-only. Restart as administrator to edit them."
              >
                🛡 Run as admin
              </Button>
            )}
            {elevated && (
              <span className="text-xs text-success opacity-60">🛡 Administrator</span>
            )}
            <button
              type="button"
              onClick={() => openUrl("https://github.com/iray-tno/envarly")}
              className="text-muted hover:text-fg transition-colors text-xs px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-panel"
              title="View on GitHub"
            >
              ↗ GitHub
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="px-2 py-1 rounded text-muted hover:bg-hover hover:text-fg transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas"
            >
              {theme === "dark" ? "☀" : "🌙"}
            </button>
            <button
              type="button"
              onClick={() => setDialog("licenses")}
              className="text-dim hover:text-muted transition-colors text-xs px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-panel"
            >
              Licenses
            </button>
          </div>
        </header>

        {error && (
          <div className="px-4 py-2 bg-danger/15 border-b border-danger text-danger text-sm shrink-0">
            Registry error: {error}
          </div>
        )}

        {/* Main */}
        <main className="flex flex-1 overflow-hidden">
          <Sidebar vars={vars} selected={selected} onSelect={setSelected} loading={loading} />

          <div className="flex flex-1 overflow-hidden">
            <DetailPanel
              variable={selected}
              elevated={elevated}
              onSaved={refresh}
              onDeleted={handleDeleted}
            />
          </div>

          {/* Snapshots right sidebar */}
          {snapshotsOpen && (
            <div className={cn(
              "w-[380px] shrink-0 flex flex-col border-l border-rim bg-panel overflow-hidden",
            )}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-rim shrink-0">
                <span className="text-sm font-semibold text-fg">Snapshots</span>
                <button
                  type="button"
                  onClick={() => setSnapshotsOpen(false)}
                  className="text-dim hover:text-fg transition-colors text-lg leading-none px-1"
                  aria-label="Close snapshots"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <SnapshotPanel onRestored={refresh} />
              </div>
            </div>
          )}
        </main>

        {/* Import/Export modal */}
        <Modal
          open={dialog === "importexport"}
          onClose={() => setDialog(null)}
          title="Import / Export"
          size="xl"
        >
          <ImportExportPanel onApplied={() => { refresh(); setDialog(null); }} />
        </Modal>

        {/* Changes modal */}
        <Modal
          open={dialog === "changes"}
          onClose={handleDiffDismiss}
          title={`External changes detected (${diffEntries.length})`}
          size="xl"
        >
          <div className="px-6 py-5">
            <DiffPanel
              entries={diffEntries}
              onApply={handleDiffApply}
              onDismiss={handleDiffDismiss}
              busy={applyBusy}
            />
          </div>
        </Modal>

        {/* Licenses modal */}
        <Modal
          open={dialog === "licenses"}
          onClose={() => setDialog(null)}
          title="Open Source Licenses"
          size="lg"
        >
          <LicensesPanel />
        </Modal>
      </div>
    </ThemeContext.Provider>
  );
}

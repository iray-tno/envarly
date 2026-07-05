import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { AppModals } from "./components/AppModals/AppModals";
import { PathBanner } from "./components/PathBanner/PathBanner";
import { DetailPanel } from "./components/DetailPanel/DetailPanel";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { SnapshotPanel } from "./components/SnapshotPanel/SnapshotPanel";
import { IconButton } from "./components/ui/IconButton";
import { ThemeContext } from "./context/ThemeContext";
import { useUndo } from "./contexts/UndoContext";
import { useEnvVars } from "./hooks/useEnvVars";
import { useStaged } from "./hooks/useStaged";
import { useStagingHandlers } from "./hooks/useStagingHandlers";
import { useTheme } from "./hooks/useTheme";
import { usePathStatus } from "./hooks/usePathStatus";
import { useDiff } from "./hooks/useDiff";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { stagedToDiff } from "./lib/stagedToDiff";
import { api } from "./api";
import type { EnvVar } from "./types";

type Dialog = "importexport" | "changes" | "staged" | "licenses" | "newvar" | null;

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { vars, loading, error, refresh } = useEnvVars();
  const [selected, setSelected] = useState<EnvVar | null>(null);
  const [elevated, setElevated] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);
  const [stagedBusy, setStagedBusy] = useState(false);

  const { staged, effectiveVars, stageSet, stageDelete, stageImport, stageSnapshot, unstage, clearStaged, restoreStaged } =
    useStaged(vars);

  const { push, undo, redo } = useUndo();

  const {
    userPathInEnv, systemPathInEnv, pathBannerDismissed,
    refreshPathStatus, handleStageAddToPath, handleDismissPathBanner,
  } = usePathStatus(staged, stageSet);

  const { diffEntries, baselineRef, checkForExternalChanges, handleDiffApply, handleDiffDismiss, applyBusy } =
    useDiff(refresh, setDialog);

  const localUndoRef = useRef<(() => void) | null>(null);
  const handleRegisterLocalUndo = useCallback((fn: (() => void) | null) => {
    localUndoRef.current = fn;
  }, []);

  useEffect(() => {
    (async () => {
      try { baselineRef.current = await api.getRegistrySnapshot(); } catch { }
      try { setElevated(await api.isElevated()); } catch { }
      await refreshPathStatus();
      refresh();
    })();
  }, []);

  const handleRefresh = useCallback(async () => {
    await refresh();
    await checkForExternalChanges();
  }, [refresh, checkForExternalChanges]);

  useKeyboardShortcuts(undo, redo, localUndoRef);

  const {
    handleStage, handleStageDelete, handleUnstage, handleClearStaged,
    handleStageImport, handleStageSnapshot, handleNewVarStage,
  } = useStagingHandlers({
    staged, stageSet, stageDelete, stageImport, stageSnapshot,
    unstage, clearStaged, restoreStaged, push,
    setDialog, setSelected, setSnapshotsOpen,
  });

  const effectiveSelected = useMemo<EnvVar | null>(() => {
    if (!selected) return null;
    return effectiveVars.find((v) => v.name === selected.name && v.scope === selected.scope) ?? null;
  }, [selected, effectiveVars]);

  const handleApplyStaged = async (takeSnapshot: boolean) => {
    setStagedBusy(true);
    try {
      if (takeSnapshot) await api.createSnapshot("auto: before apply");
      for (const change of staged.values()) {
        if (change.kind === "delete") await api.deleteEnvVar(change.name, change.scope);
        else await api.setEnvVar(change.name, change.newValue!, change.scope);
      }
      clearStaged();
      setDialog(null);
      await refresh();
      try { baselineRef.current = await api.getRegistrySnapshot(); } catch { }
      await refreshPathStatus();
    } catch (err) {
      console.error("Failed to apply staged changes", err);
    } finally {
      setStagedBusy(false);
    }
  };

  const stagedDiff = useMemo(() => stagedToDiff(staged), [staged]);

  return (
    <ThemeContext.Provider value={theme}>
      <div className="flex flex-col h-screen overflow-hidden">
        <AppHeader
          loading={loading}
          stagedCount={staged.size}
          diffCount={diffEntries.length}
          elevated={elevated}
          snapshotsOpen={snapshotsOpen}
          theme={theme}
          onRefresh={handleRefresh}
          onApplyStaged={() => setDialog("staged")}
          onDiscard={handleClearStaged}
          onShowChanges={() => setDialog("changes")}
          onImportExport={() => setDialog("importexport")}
          onToggleSnapshots={() => setSnapshotsOpen((o) => !o)}
          onToggleTheme={toggleTheme}
          onLicenses={() => setDialog("licenses")}
        />

        {(elevated ? !systemPathInEnv : !userPathInEnv) && !pathBannerDismissed && (
          <PathBanner
            scope={elevated ? "System" : "User"}
            onStageAddToPath={() => handleStageAddToPath(elevated ? "System" : "User")}
            onDismiss={handleDismissPathBanner}
          />
        )}

        {error && (
          <div className="px-4 py-2 bg-danger/15 border-b border-danger text-danger text-sm shrink-0">
            Registry error: {error}
          </div>
        )}

        <main className="flex flex-1 overflow-hidden">
          <Sidebar
            vars={effectiveVars}
            selected={selected}
            onSelect={setSelected}
            onCreateNew={() => setDialog("newvar")}
            loading={loading}
            staged={staged}
          />

          <div className="flex flex-1 overflow-hidden">
            <DetailPanel
              variable={effectiveSelected}
              allVars={effectiveVars}
              elevated={elevated}
              userPathInEnv={userPathInEnv}
              systemPathInEnv={systemPathInEnv}
              staged={staged}
              onStage={handleStage}
              onStageDelete={handleStageDelete}
              onUnstage={handleUnstage}
              onStageAddToPath={handleStageAddToPath}
              onRegisterLocalUndo={handleRegisterLocalUndo}
            />
          </div>

          {snapshotsOpen && (
            <div className="w-[380px] shrink-0 flex flex-col border-l border-rim bg-panel overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-rim shrink-0">
                <span className="text-sm font-semibold text-fg">Snapshots</span>
                <IconButton aria-label="Close snapshots" icon="×" onClick={() => setSnapshotsOpen(false)} />
              </div>
              <div className="flex-1 overflow-hidden">
                <SnapshotPanel onStageSnapshot={handleStageSnapshot} />
              </div>
            </div>
          )}
        </main>

        <AppModals
          dialog={dialog}
          setDialog={setDialog}
          staged={staged}
          stagedDiff={stagedDiff}
          stagedBusy={stagedBusy}
          onApplyStaged={handleApplyStaged}
          diffEntries={diffEntries}
          applyBusy={applyBusy}
          onDiffApply={handleDiffApply}
          onDiffDismiss={handleDiffDismiss}
          onStageImport={handleStageImport}
          effectiveVars={effectiveVars}
          elevated={elevated}
          onNewVarStage={handleNewVarStage}
        />
      </div>
    </ThemeContext.Provider>
  );
}

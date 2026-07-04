import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { PathBanner } from "./components/PathBanner/PathBanner";
import { DetailPanel } from "./components/DetailPanel/DetailPanel";
import { DiffPanel } from "./components/DiffPanel/DiffPanel";
import { ImportExportPanel } from "./components/ImportExportPanel/ImportExportPanel";
import { LicensesPanel } from "./components/LicensesPanel/LicensesPanel";
import { NewVarModal } from "./components/NewVarModal/NewVarModal";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { SnapshotPanel } from "./components/SnapshotPanel/SnapshotPanel";
import { StagedModal } from "./components/StagedModal/StagedModal";
import { IconButton } from "./components/ui/IconButton";
import { Modal } from "./components/ui/Modal";
import { ThemeContext } from "./context/ThemeContext";
import { useUndo } from "./contexts/UndoContext";
import { useEnvVars } from "./hooks/useEnvVars";
import { useStaged, type StagedChange } from "./hooks/useStaged";
import { useStagingHandlers } from "./hooks/useStagingHandlers";
import { useTheme } from "./hooks/useTheme";
import { applyAccepted, computeDiff, snapshotsEqual } from "./lib/diff";
import type { DiffEntry } from "./lib/diff";
import { api } from "./api";
import type { EnvSnapshot, EnvVar, VarScope } from "./types";

type Dialog = "importexport" | "changes" | "staged" | "licenses" | "newvar" | null;

function stagedToDiff(staged: Map<string, StagedChange>): DiffEntry[] {
  return Array.from(staged.values()).map((c): DiffEntry => {
    if (c.kind === "delete")
      return { kind: "removed", name: c.name, scope: c.scope, value: c.originalValue! };
    if (c.originalValue === null)
      return { kind: "added", name: c.name, scope: c.scope, value: c.newValue! };
    return { kind: "changed", name: c.name, scope: c.scope, oldValue: c.originalValue, newValue: c.newValue! };
  }).sort((a, b) => a.scope.localeCompare(b.scope) || a.name.localeCompare(b.name));
}

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { vars, loading, error, refresh } = useEnvVars();
  const [selected, setSelected] = useState<EnvVar | null>(null);
  const [elevated, setElevated] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);
  const [userPathInEnv, setUserPathInEnv] = useState(true);
  const [systemPathInEnv, setSystemPathInEnv] = useState(true);
  const [pathBannerDismissed, setPathBannerDismissed] = useState(
    () => localStorage.getItem("envarly.pathBannerDismissed") === "1",
  );

  const { staged, effectiveVars, stageSet, stageDelete, stageImport, stageSnapshot, unstage, clearStaged, restoreStaged } =
    useStaged(vars);

  const { push, undo, redo } = useUndo();

  const localUndoRef = useRef<(() => void) | null>(null);
  const handleRegisterLocalUndo = useCallback((fn: (() => void) | null) => {
    localUndoRef.current = fn;
  }, []);

  const baselineRef = useRef<EnvSnapshot | null>(null);
  const [diffEntries, setDiffEntries] = useState<DiffEntry[]>([]);
  const [applyBusy, setApplyBusy] = useState(false);
  const [stagedBusy, setStagedBusy] = useState(false);

  const checkForExternalChanges = useCallback(async () => {
    if (!baselineRef.current) return;
    try {
      const current = await api.getRegistrySnapshot();
      setDiffEntries(snapshotsEqual(baselineRef.current, current) ? [] : computeDiff(baselineRef.current, current));
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      try { baselineRef.current = await api.getRegistrySnapshot(); } catch { }
      let isAdmin = false;
      try { isAdmin = await api.isElevated(); setElevated(isAdmin); } catch { }
      try {
        const ps = await api.getPathStatus();
        setUserPathInEnv(ps.userHasEntry);
        setSystemPathInEnv(ps.systemHasEntry);
      } catch { }
      refresh();
    })();
  }, []);

  const handleRefresh = useCallback(async () => {
    await refresh();
    await checkForExternalChanges();
  }, [refresh, checkForExternalChanges]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      // Local discard takes priority even when a text field has focus.
      if (e.key === "z" && !e.shiftKey && localUndoRef.current) {
        e.preventDefault();
        localUndoRef.current();
        return;
      }
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === "y" || (e.key === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

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

  useEffect(() => {
    if (diffEntries.length > 0) setDialog("changes");
  }, [diffEntries.length]);

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
    } catch (err) {
      console.error("Failed to apply staged changes", err);
    } finally {
      setStagedBusy(false);
    }
  };

  const stagedDiff = useMemo(() => stagedToDiff(staged), [staged]);

  const handleStageAddToPath = useCallback(async (scope: "User" | "System") => {
    try {
      const proposed = await api.getPathProposal(scope);
      if (proposed === null) return; // already in PATH
      stageSet("Path", scope, proposed);
      if (scope === "User") setUserPathInEnv(true);
      else setSystemPathInEnv(true);
    } catch (err) {
      console.error("Failed to get PATH proposal", err);
    }
  }, [stageSet]);

  const handleDismissPathBanner = useCallback(() => {
    localStorage.setItem("envarly.pathBannerDismissed", "1");
    setPathBannerDismissed(true);
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      <div className="flex flex-col h-screen overflow-hidden">
        <AppHeader
          loading={loading}
          stagedCount={staged.size}
          diffCount={diffEntries.length}
          elevated={elevated}
          userPathInEnv={userPathInEnv}
          systemPathInEnv={systemPathInEnv}
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
          onStageAddToPath={handleStageAddToPath}
        />

        {(!userPathInEnv || (elevated && !systemPathInEnv)) && !pathBannerDismissed && (
          <PathBanner
            elevated={elevated}
            userPathInEnv={userPathInEnv}
            systemPathInEnv={systemPathInEnv}
            onStageAddToPath={handleStageAddToPath}
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

        <Modal open={dialog === "importexport"} onClose={() => setDialog(null)} title="Import / Export" size="xl">
          <ImportExportPanel onStage={handleStageImport} />
        </Modal>

        <Modal
          open={dialog === "staged"}
          onClose={() => setDialog(null)}
          title={`Apply ${staged.size} staged ${staged.size === 1 ? "change" : "changes"}`}
          size="xl"
        >
          <StagedModal diff={stagedDiff} busy={stagedBusy} onApply={handleApplyStaged} onClose={() => setDialog(null)} />
        </Modal>

        <Modal open={dialog === "changes"} onClose={handleDiffDismiss} title={`External changes detected (${diffEntries.length})`} size="xl">
          <div className="px-6 py-5">
            <DiffPanel entries={diffEntries} onApply={handleDiffApply} onDismiss={handleDiffDismiss} busy={applyBusy} />
          </div>
        </Modal>

        <Modal open={dialog === "newvar"} onClose={() => setDialog(null)} title="New variable" size="md">
          <NewVarModal vars={effectiveVars} elevated={elevated} onStage={handleNewVarStage} onClose={() => setDialog(null)} />
        </Modal>

        <Modal open={dialog === "licenses"} onClose={() => setDialog(null)} title="Open Source Licenses" size="2xl" flex>
          <LicensesPanel />
        </Modal>
      </div>
    </ThemeContext.Provider>
  );
}

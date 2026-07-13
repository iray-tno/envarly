import { useMemo, useState } from "react";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { AppModals } from "./components/AppModals/AppModals";
import { DetailPanel } from "./components/DetailPanel/DetailPanel";
import { DiagnosticsPanel } from "./components/DiagnosticsPanel/DiagnosticsPanel";
import { PathBanner } from "./components/PathBanner/PathBanner";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { SnapshotPanel } from "./components/SnapshotPanel/SnapshotPanel";
import { IconButton } from "./components/ui/IconButton";
import { ThemeContext } from "./context/ThemeContext";
import { useUndo } from "./contexts/UndoContext";
import { useAppInit } from "./hooks/useAppInit";
import { useApplyStaged } from "./hooks/useApplyStaged";
import { useDiagnostics } from "./hooks/useDiagnostics";
import { useDiff } from "./hooks/useDiff";
import { useEnvVars } from "./hooks/useEnvVars";
import { useI18n } from "./hooks/useI18n";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useLocalUndo } from "./hooks/useLocalUndo";
import { usePathStatus } from "./hooks/usePathStatus";
import { usePresence } from "./hooks/usePresence";
import { useStaged } from "./hooks/useStaged";
import { useStagingHandlers } from "./hooks/useStagingHandlers";
import { useTheme } from "./hooks/useTheme";
import type { DiagnosticAction, EnvironmentDiagnostic } from "./lib/environmentDiagnostics";
import { stagedToDiff } from "./lib/stagedToDiff";
import type { EnvVar } from "./types";

type Dialog = "importexport" | "changes" | "staged" | "licenses" | "newvar" | null;

export default function App() {
  const { t } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();
  const { vars, loading, error, refresh } = useEnvVars();
  const [selected, setSelected] = useState<EnvVar | null>(null);
  const [elevated, setElevated] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);
  const snapshotsPresence = usePresence(snapshotsOpen);
  const diagnostics = useDiagnostics(vars);

  const {
    staged,
    effectiveVars,
    stageSet,
    stageDelete,
    stageImport,
    stageSnapshot,
    unstage,
    clearStaged,
    restoreStaged,
  } = useStaged(vars);

  const { push, undo, redo } = useUndo();
  const { localUndoRef, handleRegisterLocalUndo } = useLocalUndo();

  const {
    userPathInEnv,
    systemPathInEnv,
    pathBannerDismissed,
    refreshPathStatus,
    handleStageAddToPath,
    handleDismissPathBanner,
  } = usePathStatus(staged, stageSet);

  const {
    diffEntries,
    baselineRef,
    checkForExternalChanges,
    handleDiffApply,
    handleDiffDismiss,
    applyBusy,
    applyError,
  } = useDiff(refresh, setDialog);

  const { handleRefresh } = useAppInit({
    baselineRef,
    setElevated,
    refreshPathStatus,
    refresh,
    checkForExternalChanges,
  });

  useKeyboardShortcuts(undo, redo, localUndoRef);

  const {
    handleStage,
    handleStageDelete,
    handleUnstage,
    handleClearStaged,
    handleStageImport,
    handleStageSnapshot,
    handleNewVarStage,
  } = useStagingHandlers({
    staged,
    stageSet,
    stageDelete,
    stageImport,
    stageSnapshot,
    unstage,
    clearStaged,
    restoreStaged,
    push,
    setDialog,
    setSelected,
    setSnapshotsOpen,
  });

  const {
    handleApplyStaged,
    busy: stagedBusy,
    error: stagedError,
  } = useApplyStaged({
    staged,
    clearStaged,
    refresh,
    refreshPathStatus,
    baselineRef,
    setDialog,
  });

  const effectiveSelected = useMemo<EnvVar | null>(() => {
    if (!selected) return null;
    return (
      effectiveVars.find((v) => v.name === selected.name && v.scope === selected.scope) ?? null
    );
  }, [selected, effectiveVars]);

  const stagedDiff = useMemo(() => stagedToDiff(staged), [staged]);

  const handleDiagnosticAction = (diagnostic: EnvironmentDiagnostic, action: DiagnosticAction) => {
    const variable = vars.find(
      (item) => item.name === diagnostic.name && item.scope === diagnostic.scope,
    );
    if (action.kind === "delete") {
      handleStageDelete(diagnostic.name, diagnostic.scope);
    } else if (action.kind === "set-value") {
      handleStage(diagnostic.name, diagnostic.scope, action.value);
    } else if (variable) {
      handleStage(variable.name, variable.scope, variable.value, action.valueKind);
    }
  };

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

        <DiagnosticsPanel
          diagnostics={diagnostics}
          elevated={elevated}
          onStageAction={handleDiagnosticAction}
        />

        {error && (
          <div className="px-4 py-2 bg-danger/15 border-b border-danger text-danger text-sm shrink-0">
            {t("app.registry_error", { error })}
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

          {snapshotsPresence.mounted && (
            <aside
              className="motion-snapshot-panel shrink-0 border-l border-rim overflow-hidden"
              data-state={snapshotsPresence.state}
            >
              <div className="motion-snapshot-content w-[420px] h-full flex flex-col bg-panel">
                <div className="flex items-center justify-between px-5 py-3 border-b border-rim shrink-0">
                  <span className="text-sm font-semibold text-fg">{t("header.snapshots")}</span>
                  <IconButton
                    aria-label="Close snapshots"
                    icon="x"
                    onClick={() => setSnapshotsOpen(false)}
                  />
                </div>
                <div className="flex-1 overflow-hidden">
                  <SnapshotPanel onStageSnapshot={handleStageSnapshot} />
                </div>
              </div>
            </aside>
          )}
        </main>

        <AppModals
          dialog={dialog}
          setDialog={setDialog}
          staged={staged}
          stagedDiff={stagedDiff}
          stagedBusy={stagedBusy}
          stagedError={stagedError}
          onApplyStaged={handleApplyStaged}
          diffEntries={diffEntries}
          applyBusy={applyBusy}
          applyError={applyError}
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

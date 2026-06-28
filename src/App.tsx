import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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
import { useStaged } from "./hooks/useStaged";
import { useTheme } from "./hooks/useTheme";
import { cn } from "./lib/cn";
import { applyAccepted, computeDiff, snapshotsEqual } from "./lib/diff";
import type { DiffEntry } from "./lib/diff";
import { api } from "./api";
import type { EnvSnapshot, EnvVar, VarScope } from "./types";

type Dialog = "importexport" | "changes" | "staged" | "licenses" | "newvar" | null;

/** Convert staged changes to DiffEntry[] for the unified review modal. */
function stagedToDiff(staged: Map<string, import("./hooks/useStaged").StagedChange>): DiffEntry[] {
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

  const { staged, effectiveVars, stageSet, stageDelete, stageImport, stageSnapshot, unstage, clearStaged } =
    useStaged(vars);

  // External-change detection
  const baselineRef = useRef<EnvSnapshot | null>(null);
  const [diffEntries, setDiffEntries] = useState<DiffEntry[]>([]);
  const [applyBusy, setApplyBusy] = useState(false);
  const [stagedBusy, setStagedBusy] = useState(false);

  const checkForExternalChanges = useCallback(async () => {
    if (!baselineRef.current) return;
    try {
      const current = await api.getRegistrySnapshot();
      setDiffEntries(snapshotsEqual(baselineRef.current, current) ? [] : computeDiff(baselineRef.current, current));
    } catch {
      // best-effort
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

  // Keep selected pointing at the current effectiveVar for the same identity
  const effectiveSelected = useMemo<EnvVar | null>(() => {
    if (!selected) return null;
    return effectiveVars.find((v) => v.name === selected.name && v.scope === selected.scope) ?? null;
  }, [selected, effectiveVars]);

  // External changes apply
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

  // Auto-open changes dialog when external diffs appear
  useEffect(() => {
    if (diffEntries.length > 0) setDialog("changes");
  }, [diffEntries.length]);

  // Apply all staged changes to registry
  const handleApplyStaged = async (takeSnapshot: boolean) => {
    setStagedBusy(true);
    try {
      if (takeSnapshot) {
        await api.createSnapshot("auto: before apply");
      }
      for (const change of staged.values()) {
        if (change.kind === "delete") {
          await api.deleteEnvVar(change.name, change.scope);
        } else {
          await api.setEnvVar(change.name, change.newValue!, change.scope);
        }
      }
      clearStaged();
      setDialog(null);
      await refresh();
      // Refresh baseline so external-change detection doesn't flag our own writes
      try { baselineRef.current = await api.getRegistrySnapshot(); } catch { }
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

            {staged.size > 0 && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setDialog("staged")}
                >
                  Apply {staged.size} staged {staged.size === 1 ? "change" : "changes"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearStaged}
                >
                  Discard all
                </Button>
              </>
            )}

            {diffEntries.length > 0 && (
              <Button
                variant="warn"
                size="sm"
                onClick={() => setDialog("changes")}
              >
                ⚠ {diffEntries.length} external {diffEntries.length === 1 ? "change" : "changes"}
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
              elevated={elevated}
              staged={staged}
              onStage={stageSet}
              onStageDelete={stageDelete}
              onUnstage={unstage}
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
                <SnapshotPanel onStageSnapshot={(snap) => { stageSnapshot(snap); setSnapshotsOpen(false); }} />
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
          <ImportExportPanel
            onStage={(sets, deletes) => {
              stageImport(sets, deletes);
              setDialog(null);
            }}
          />
        </Modal>

        {/* Staged changes review modal */}
        <Modal
          open={dialog === "staged"}
          onClose={() => setDialog(null)}
          title={`Apply ${staged.size} staged ${staged.size === 1 ? "change" : "changes"}`}
          size="xl"
        >
          <StagedModal
            diff={stagedDiff}
            busy={stagedBusy}
            onApply={handleApplyStaged}
            onClose={() => setDialog(null)}
          />
        </Modal>

        {/* External changes modal */}
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

        {/* New variable modal */}
        <Modal
          open={dialog === "newvar"}
          onClose={() => setDialog(null)}
          title="New variable"
          size="md"
        >
          <NewVarModal
            vars={effectiveVars}
            elevated={elevated}
            onStage={(name, scope, value) => {
              stageSet(name, scope, value);
              setSelected({ name, scope, value, listSeparator: null });
              setDialog(null);
            }}
            onClose={() => setDialog(null)}
          />
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

// ---------------------------------------------------------------------------
// New variable form (inline — simple enough to keep here)
// ---------------------------------------------------------------------------

interface NewVarModalProps {
  vars: EnvVar[];
  elevated: boolean;
  onStage: (name: string, scope: VarScope, value: string) => void;
  onClose: () => void;
}

function NewVarModal({ vars, elevated, onStage, onClose }: NewVarModalProps) {
  const [name, setName] = useState("");
  const [scope, setScope] = useState<VarScope>("User");
  const [value, setValue] = useState("");

  const trimmedName = name.trim();
  const alreadyExists = trimmedName
    ? vars.some((v) => v.name.toLowerCase() === trimmedName.toLowerCase() && v.scope === scope)
    : false;
  const canSubmit = trimmedName.length > 0 && !alreadyExists;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onStage(trimmedName, scope, value);
  };

  return (
    <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted uppercase tracking-wide" htmlFor="newvar-name">
          Name
        </label>
        <input
          id="newvar-name"
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          spellCheck={false}
          placeholder="VARIABLE_NAME"
          className={cn(
            "px-2.5 py-1.5 bg-surface border rounded font-mono text-sm text-fg",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent",
            alreadyExists ? "border-danger" : "border-rim",
          )}
        />
        {alreadyExists && (
          <p className="text-xs text-danger">
            {trimmedName} already exists in {scope} scope
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide">Scope</p>
        <div className="flex gap-2">
          {(["User", "System"] as VarScope[]).map((s) => (
            <button
              key={s}
              type="button"
              disabled={s === "System" && !elevated}
              onClick={() => setScope(s)}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium border transition-colors",
                scope === s
                  ? "bg-accent text-white border-accent"
                  : "bg-surface text-muted border-rim hover:border-accent",
                s === "System" && !elevated && "opacity-40 cursor-not-allowed",
              )}
            >
              {s}
              {s === "System" && !elevated && " (admin)"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted uppercase tracking-wide" htmlFor="newvar-value">
          Value
        </label>
        <textarea
          id="newvar-value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          spellCheck={false}
          rows={3}
          placeholder="(empty)"
          className={cn(
            "px-2.5 py-1.5 bg-surface border border-rim rounded font-mono text-sm text-fg resize-none",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent",
          )}
        />
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" type="submit" disabled={!canSubmit}>
          Stage new variable
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Staged changes review panel (inline — no separate file needed)
// ---------------------------------------------------------------------------

interface StagedModalProps {
  diff: DiffEntry[];
  busy: boolean;
  onApply: (takeSnapshot: boolean) => void;
  onClose: () => void;
}

function StagedModal({ diff, busy, onApply, onClose }: StagedModalProps) {
  const [takeSnapshot, setTakeSnapshot] = useState(true);

  const byKind = {
    added:   diff.filter((e) => e.kind === "added"),
    removed: diff.filter((e) => e.kind === "removed"),
    changed: diff.filter((e) => e.kind === "changed"),
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-rim shrink-0">
        <p className="text-xs text-muted mb-3">
          These changes will be written to the Windows registry and broadcast to running applications.
        </p>
        <div className="flex gap-3 text-xs">
          {byKind.added.length > 0   && <span className="text-success">+{byKind.added.length} added</span>}
          {byKind.removed.length > 0 && <span className="text-danger">−{byKind.removed.length} removed</span>}
          {byKind.changed.length > 0 && <span className="text-warn">~{byKind.changed.length} changed</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
        {diff.map((entry) => {
          const key = `${entry.scope}:${entry.name}`;
          return (
            <div
              key={key}
              className={cn(
                "rounded border px-3 py-2 text-xs",
                entry.kind === "added"   && "border-success/30 bg-success/5 text-success",
                entry.kind === "removed" && "border-danger/30 bg-danger/5 text-danger",
                entry.kind === "changed" && "border-warn/30 bg-warn/5 text-warn",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-semibold text-fg">{entry.name}</span>
                <span className="opacity-60 text-[10px]">{entry.scope}</span>
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide">
                  {entry.kind}
                </span>
              </div>
              {entry.kind === "removed" && (
                <p className="font-mono text-[11px] opacity-70 line-through truncate">{entry.value}</p>
              )}
              {entry.kind === "added" && (
                <p className="font-mono text-[11px] truncate">{entry.value}</p>
              )}
              {entry.kind === "changed" && (
                <div className="flex flex-col gap-0.5">
                  <p className="font-mono text-[11px] text-danger/70 line-through truncate">{entry.oldValue}</p>
                  <p className="font-mono text-[11px] text-success truncate">{entry.newValue}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-6 py-4 border-t border-rim shrink-0 flex flex-col gap-3">
        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={takeSnapshot}
            onChange={(e) => setTakeSnapshot(e.target.checked)}
            disabled={busy}
            className="accent-accent"
          />
          Take a snapshot before applying (recommended)
        </label>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="md" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" size="md" onClick={() => onApply(takeSnapshot)} disabled={busy}>
            {busy ? "Applying…" : `Apply ${diff.length} ${diff.length === 1 ? "change" : "changes"} to registry`}
          </Button>
        </div>
      </div>
    </div>
  );
}

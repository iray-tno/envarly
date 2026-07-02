import { openUrl } from "@tauri-apps/plugin-opener";
import { api } from "../../api";
import { Button } from "../ui/Button";

interface AppHeaderProps {
  loading: boolean;
  stagedCount: number;
  diffCount: number;
  elevated: boolean;
  pathInEnv: boolean;
  snapshotsOpen: boolean;
  theme: "dark" | "light";
  onRefresh: () => void;
  onApplyStaged: () => void;
  onDiscard: () => void;
  onShowChanges: () => void;
  onImportExport: () => void;
  onToggleSnapshots: () => void;
  onToggleTheme: () => void;
  onLicenses: () => void;
  onStageAddToPath: () => void;
}

export function AppHeader({
  loading, stagedCount, diffCount, elevated, pathInEnv, snapshotsOpen, theme,
  onRefresh, onApplyStaged, onDiscard, onShowChanges, onImportExport,
  onToggleSnapshots, onToggleTheme, onLicenses, onStageAddToPath,
}: AppHeaderProps) {
  return (
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
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
          ↻ Refresh
        </Button>

        {stagedCount > 0 && (
          <>
            <Button variant="primary" size="sm" onClick={onApplyStaged}>
              Apply {stagedCount} staged {stagedCount === 1 ? "change" : "changes"}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDiscard}>
              Discard all
            </Button>
          </>
        )}

        {diffCount > 0 && (
          <Button variant="warn" size="sm" onClick={onShowChanges}>
            ⚠ {diffCount} external {diffCount === 1 ? "change" : "changes"}
          </Button>
        )}

        <Button variant="ghost" size="sm" onClick={onImportExport}>
          Import / Export
        </Button>

        <Button
          variant={snapshotsOpen ? "secondary" : "ghost"}
          size="sm"
          onClick={onToggleSnapshots}
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
        {!pathInEnv && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onStageAddToPath}
            title="Stage adding Envarly to PATH so it can be run from a terminal"
          >
            + PATH
          </Button>
        )}
        <Button variant="ghost" size="xs" onClick={() => openUrl("https://github.com/iray-tno/envarly")} title="View on GitHub">
          ↗ GitHub
        </Button>
        <Button variant="ghost" size="xs" onClick={onToggleTheme} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
          {theme === "dark" ? "☀" : "🌙"}
        </Button>
        <Button variant="ghost" size="xs" onClick={onLicenses} className="text-dim">
          Licenses
        </Button>
      </div>
    </header>
  );
}

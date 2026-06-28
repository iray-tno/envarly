import { openUrl } from "@tauri-apps/plugin-opener";
import { api } from "../../api";
import { Button } from "../ui/Button";

interface AppHeaderProps {
  loading: boolean;
  stagedCount: number;
  diffCount: number;
  elevated: boolean;
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
}

export function AppHeader({
  loading, stagedCount, diffCount, elevated, snapshotsOpen, theme,
  onRefresh, onApplyStaged, onDiscard, onShowChanges, onImportExport,
  onToggleSnapshots, onToggleTheme, onLicenses,
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
          onClick={onToggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="px-2 py-1 rounded text-muted hover:bg-hover hover:text-fg transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas"
        >
          {theme === "dark" ? "☀" : "🌙"}
        </button>
        <button
          type="button"
          onClick={onLicenses}
          className="text-dim hover:text-muted transition-colors text-xs px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-panel"
        >
          Licenses
        </button>
      </div>
    </header>
  );
}

import { openUrl } from "@tauri-apps/plugin-opener";
import { useI18n } from "../../hooks/useI18n";
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
  const { t, language, setLanguage } = useI18n();

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
          {t("header.refresh")}
        </Button>

        {stagedCount > 0 && (
          <>
            <Button variant="primary" size="sm" onClick={onApplyStaged}>
              {t("header.apply_staged", { count: stagedCount })}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDiscard}>
              {t("header.discard_all")}
            </Button>
          </>
        )}

        {diffCount > 0 && (
          <Button variant="warn" size="sm" onClick={onShowChanges}>
            {t("header.external_changes", { count: diffCount })}
          </Button>
        )}

        <Button variant="ghost" size="sm" onClick={onImportExport}>
          {t("header.import_export")}
        </Button>

        <Button
          variant={snapshotsOpen ? "secondary" : "ghost"}
          size="sm"
          onClick={onToggleSnapshots}
        >
          {t("header.snapshots")}
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
            title={t("header.run_as_admin_title")}
          >
            {t("header.run_as_admin")}
          </Button>
        )}
        {elevated && (
          <span className="text-xs text-success opacity-60">{t("header.administrator")}</span>
        )}
        <Button variant="ghost" size="xs" onClick={() => openUrl("https://github.com/iray-tno/envarly")} title="View on GitHub">
          ↗ GitHub
        </Button>
        <label className="flex items-center gap-1 text-xs text-dim cursor-pointer">
          <span title="Language">🌐</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "en" | "ja")}
            className="bg-transparent text-xs text-dim cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
          >
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </label>
        <Button variant="ghost" size="xs" onClick={onToggleTheme} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
          {theme === "dark" ? "☀" : "🌙"}
        </Button>
        <Button variant="ghost" size="xs" onClick={onLicenses} className="text-dim">
          {t("header.licenses")}
        </Button>
      </div>
    </header>
  );
}

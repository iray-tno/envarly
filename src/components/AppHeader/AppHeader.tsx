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
  const { t, language, toggleLanguage } = useI18n();

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
        <Button variant="ghost" size="xs" onClick={toggleLanguage} title={language === "ja" ? "Switch to English" : "日本語に切り替え"}>
          {language === "ja" ? "EN" : "JA"}
        </Button>
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

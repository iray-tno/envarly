import { openUrl } from "@tauri-apps/plugin-opener";
import { api } from "../../api";
import { useI18n } from "../../hooks/useI18n";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Select } from "../ui/Select";

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
  loading,
  stagedCount,
  diffCount,
  elevated,
  snapshotsOpen,
  theme,
  onRefresh,
  onApplyStaged,
  onDiscard,
  onShowChanges,
  onImportExport,
  onToggleSnapshots,
  onToggleTheme,
  onLicenses,
}: AppHeaderProps) {
  const { t, language, setLanguage } = useI18n();
  const languageOptions = [
    { value: "en", label: "English" },
    { value: "ja", label: "日本語" },
  ] as const;

  return (
    <header
      className="flex items-center gap-2 h-13 px-5 bg-panel border-b border-rim shrink-0"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <Button variant="ghost" size="sm" icon="refresh" onClick={onRefresh} disabled={loading}>
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
          <Button variant="warn" size="sm" icon="warning" onClick={onShowChanges}>
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
            icon="shield"
            onClick={() => api.restartAsAdmin()}
            title={t("header.run_as_admin_title")}
          >
            {t("header.run_as_admin")}
          </Button>
        )}
        {elevated && (
          <span className="inline-flex items-center gap-1 text-xs text-success">
            <Icon name="shield" size={14} />
            {t("header.administrator")}
          </span>
        )}
        <Button
          variant="ghost"
          size="xs"
          icon="external-link"
          iconPosition="right"
          onClick={() => openUrl("https://github.com/iray-tno/envarly")}
          title="View on GitHub"
        >
          GitHub
        </Button>
        <div className="flex items-center gap-1 text-xs text-dim">
          <Icon name="globe" size={14} className="text-dim" />
          <Select
            aria-label="Language"
            value={language}
            onValueChange={setLanguage}
            options={languageOptions}
            density="compact"
            className="text-xs"
          />
        </div>
        <Button
          variant="ghost"
          size="xs"
          icon={theme === "dark" ? "sun" : "moon"}
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        />
        <Button variant="ghost" size="xs" onClick={onLicenses} className="text-dim">
          {t("header.licenses")}
        </Button>
      </div>
    </header>
  );
}

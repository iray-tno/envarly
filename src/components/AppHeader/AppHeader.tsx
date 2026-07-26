import { openUrl } from "@tauri-apps/plugin-opener";
import { api } from "../../api";
import { useI18n } from "../../hooks/useI18n";
import type { UpdateInfo } from "../../types";
import { Button } from "../ui/Button";
import { Dropdown } from "../ui/Dropdown";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
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
  onShowChanges: () => void;
  onImportExport: () => void;
  onCheckCommand: () => void;
  onToggleSnapshots: () => void;
  onToggleTheme: () => void;
  onLicenses: () => void;
  updateInfo: UpdateInfo | null;
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
  onShowChanges,
  onImportExport,
  onCheckCommand,
  onToggleSnapshots,
  onToggleTheme,
  onLicenses,
  updateInfo,
}: AppHeaderProps) {
  const { t, language, setLanguage } = useI18n();
  const languageOptions = [
    { value: "en", label: "English" },
    { value: "ja", label: "日本語" },
  ] as const;

  return (
    <header
      className="@container flex items-center gap-2 h-13 px-5 bg-panel border-b border-rim shrink-0"
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
          <Button
            variant="primary"
            size="sm"
            onClick={onApplyStaged}
            className="shrink-0"
            title={t("header.apply_staged", { count: stagedCount })}
          >
            {t("header.staged_count", { count: stagedCount })}
          </Button>
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

        <Button variant="ghost" size="sm" onClick={onCheckCommand}>
          {t("header.check_command")}
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
        {updateInfo && (
          <Button
            variant="ghost"
            size="xs"
            icon="info"
            onClick={() => openUrl(updateInfo.url)}
            title={t("header.update_available_title")}
            className="text-accent"
          >
            {t("header.update_available", { version: updateInfo.version })}
          </Button>
        )}
        <div className="hidden @5xl:flex items-center gap-2">
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
          <Button variant="ghost" size="xs" onClick={onLicenses} className="text-dim">
            {t("header.licenses")}
          </Button>
        </div>

        <div className="@5xl:hidden">
          <Dropdown
            align="right"
            aria-label={t("header.more_options")}
            trigger={(triggerProps) => (
              <IconButton
                {...triggerProps}
                icon="more"
                aria-label={t("header.more_options")}
                title={t("header.more_options")}
                data-testid="header-more-trigger"
              />
            )}
          >
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Icon name="globe" size={14} className="text-dim shrink-0" />
              <Select
                aria-label="Language"
                value={language}
                onValueChange={setLanguage}
                options={languageOptions}
                density="compact"
                containerClassName="flex-1"
                className="w-full"
              />
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-muted hover:bg-hover hover:text-fg"
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} size={14} />
              {theme === "dark" ? t("header.light_mode") : t("header.dark_mode")}
            </button>
            <button
              type="button"
              onClick={() => openUrl("https://github.com/iray-tno/envarly")}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-muted hover:bg-hover hover:text-fg"
            >
              <Icon name="external-link" size={14} />
              GitHub
            </button>
            <button
              type="button"
              onClick={onLicenses}
              className="flex w-full items-center rounded px-2 py-1.5 text-left text-sm text-muted hover:bg-hover hover:text-fg"
            >
              {t("header.licenses")}
            </button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}

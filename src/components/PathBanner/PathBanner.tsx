import { useI18n } from "../../hooks/useI18n";
import { Button } from "../ui/Button";

interface PathBannerProps {
  scope: "User" | "System";
  onStageAddToPath: () => void;
  onDismiss: () => void;
}

export function PathBanner({ scope, onStageAddToPath, onDismiss }: PathBannerProps) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-3 px-5 py-2 bg-accent/10 border-b border-accent/30 text-sm shrink-0">
      <span className="text-fg flex-1">
        {t("path_banner.prefix", { scope })}{" "}
        <span className="font-mono text-fg">envarly</span>{" "}
        {t("path_banner.suffix")}
      </span>
      <Button variant="secondary" size="sm" icon="plus" onClick={onStageAddToPath}>
        {t("path_banner.add", { scope })}
      </Button>
      <Button variant="ghost" size="sm" onClick={onDismiss}>
        {t("path_banner.dismiss")}
      </Button>
    </div>
  );
}

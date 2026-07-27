import { useI18n } from "../../hooks/useI18n";
import { Button } from "../ui/Button";

interface PathBannerProps {
  /** Display label for the scope: "User", "System", or (while another
   * account is selected) that account's username. */
  scopeLabel: string;
  onStageAddToPath: () => void;
  onDismiss: () => void;
}

export function PathBanner({ scopeLabel, onStageAddToPath, onDismiss }: PathBannerProps) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-3 px-5 py-2 bg-accent/10 border-b border-accent/30 text-sm shrink-0">
      <span className="text-fg flex-1">
        {t("path_banner.prefix", { scope: scopeLabel })}{" "}
        <span className="font-mono text-fg">envarly</span> {t("path_banner.suffix")}
      </span>
      <Button variant="secondary" size="sm" icon="plus" onClick={onStageAddToPath}>
        {t("path_banner.add", { scope: scopeLabel })}
      </Button>
      <Button variant="ghost" size="sm" onClick={onDismiss}>
        {t("path_banner.dismiss")}
      </Button>
    </div>
  );
}

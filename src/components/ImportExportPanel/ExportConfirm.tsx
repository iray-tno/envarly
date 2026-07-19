import { useI18n } from "../../hooks/useI18n";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

interface Props {
  secretServices: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExportConfirm({ secretServices, onConfirm, onCancel }: Props) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-3 p-3 rounded border border-warn/40 bg-warn/10">
      <p className="flex gap-2 text-warn text-xs">
        <Icon name="warning" size={14} className="mt-px" />
        <span>{t("export.secret_warning", { services: secretServices.join(", ") })}</span>
      </p>
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={onConfirm}>
          {t("export.export_anyway")}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {t("export.cancel")}
        </Button>
      </div>
    </div>
  );
}

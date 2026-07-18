import { api } from "../../api";
import { useI18n } from "../../hooks/useI18n";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface Props {
  name: string;
  scope: "User" | "System";
  readOnly: boolean;
  isStagedSet: boolean;
  isStagedDelete: boolean;
  dirty: boolean;
  editorDirty: boolean;
  onApply: () => void;
  onDiscard: () => void;
  onUnstage: () => void;
  onDelete: () => void;
}

export function DetailHeader({
  name,
  scope,
  readOnly,
  isStagedSet,
  isStagedDelete,
  dirty,
  editorDirty,
  onApply,
  onDiscard,
  onUnstage,
  onDelete,
}: Props) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-3 px-6 h-[60px] border-b border-rim-subtle shrink-0">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <h2 className="font-mono font-semibold text-base text-fg truncate">{name}</h2>
        <Badge variant={scope === "User" ? "user" : "system"}>{scope}</Badge>
        {readOnly && (
          <>
            <Badge variant="readonly">{t("detail.readonly_badge")}</Badge>
            <button
              type="button"
              onClick={() => api.restartAsAdmin()}
              className="text-[10px] text-accent hover:text-accent-hi px-2 py-1 rounded hover:bg-accent/10 transition-colors shrink-0"
              title="Restart as administrator to edit system variables"
            >
              {t("detail.restart_admin")}
            </button>
          </>
        )}
        {isStagedSet && !dirty && (
          <span className="text-[10px] font-semibold px-2 py-1 rounded bg-accent/15 text-accent shrink-0">
            {t("detail.staged_badge")}
          </span>
        )}
        {isStagedDelete && (
          <span className="text-[10px] font-semibold px-2 py-1 rounded bg-danger/15 text-danger shrink-0">
            {t("detail.staged_delete_badge")}
          </span>
        )}
      </div>

      <div className="flex gap-2 shrink-0">
        {editorDirty ? (
          <>
            <Button variant="primary" size="sm" onClick={onApply}>
              {t("detail.stage")}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDiscard}>
              {t("detail.discard")}
            </Button>
          </>
        ) : isStagedSet ? (
          <Button variant="ghost" size="sm" onClick={onUnstage}>
            {t("detail.unstage")}
          </Button>
        ) : !isStagedDelete && !readOnly ? (
          <Button variant="danger" size="sm" onClick={onDelete}>
            {t("detail.delete")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

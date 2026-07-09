import { useI18n } from "../../hooks/useI18n";
import type { DiagnosticAction, EnvironmentDiagnostic } from "../../lib/environmentDiagnostics";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

interface Props {
  diagnostics: EnvironmentDiagnostic[];
  elevated: boolean;
  onStageAction: (diagnostic: EnvironmentDiagnostic, action: DiagnosticAction) => void;
}

export function DiagnosticsPanel({ diagnostics, elevated, onStageAction }: Props) {
  const { t } = useI18n();
  if (diagnostics.length === 0) return null;

  const attentionCount = diagnostics.filter(
    (diagnostic) => diagnostic.severity === "attention",
  ).length;

  return (
    <details className="group border-b border-warn/35 bg-warn/8 shrink-0">
      <summary className="flex items-center gap-2 px-4 py-2 cursor-pointer select-none text-xs text-warn hover:bg-warn/5">
        <Icon name="warning" size={16} />
        <span className="font-semibold">
          {t("diagnostics.summary", {
            count: diagnostics.length,
            attention: attentionCount,
          })}
        </span>
        <span className="ml-auto text-dim group-open:hidden">{t("diagnostics.show")}</span>
        <span className="ml-auto text-dim hidden group-open:inline">{t("diagnostics.hide")}</span>
      </summary>

      <div className="max-h-64 overflow-y-auto border-t border-warn/20">
        {diagnostics.map((diagnostic) => {
          const canStage = diagnostic.scope === "User" || elevated;
          return (
            <div
              key={diagnostic.id}
              className="flex items-start gap-3 px-4 py-2.5 border-b border-rim-subtle last:border-0"
            >
              <Badge variant={diagnostic.scope === "User" ? "user" : "system"}>
                {diagnostic.scope}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-fg">
                  <span className="font-mono font-semibold">{diagnostic.name}</span>
                  {" — "}
                  {t(`diagnostics.kind.${diagnostic.kind}`, {
                    detail: diagnostic.detail ?? "",
                  })}
                </p>
                {diagnostic.severity === "info" && (
                  <p className="text-[10px] text-dim mt-0.5">{t("diagnostics.information")}</p>
                )}
              </div>
              {diagnostic.action && canStage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStageAction(diagnostic, diagnostic.action as DiagnosticAction)}
                >
                  {t(`diagnostics.action.${diagnostic.action.kind}`)}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}

import { useState } from "react";
import { api } from "../../api";
import { useI18n } from "../../hooks/useI18n";
import type { CheckCommandResult, CommandHit } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { TextInput } from "../ui/TextInput";

export function CheckCommandPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckCommandResult | null>(null);

  const runCheck = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await api.checkCommand(trimmed));
    } catch (e) {
      setError(String(e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 py-3 border-b border-rim shrink-0 flex items-center gap-2">
        <TextInput
          label={t("check_command.input_label")}
          labelHidden
          placeholder={t("check_command.placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runCheck();
          }}
          data-testid="check-command-input"
          className="flex-1"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={runCheck}
          disabled={loading || !input.trim()}
          data-testid="check-command-submit"
          className="shrink-0 whitespace-nowrap border border-transparent"
        >
          {loading ? t("check_command.checking") : t("check_command.check")}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {error && <p className="text-sm text-danger">{error}</p>}
        {!error && !result && <p className="text-sm text-dim">{t("check_command.empty_state")}</p>}
        {!error && result && <CheckCommandResultView result={result} />}
      </div>
    </div>
  );
}

function CheckCommandResultView({ result }: { result: CheckCommandResult }) {
  const { t } = useI18n();

  if (result.hits.length === 0) {
    return (
      <div
        data-testid="check-command-not-found"
        className="flex items-center gap-2 text-sm text-danger"
      >
        <Icon name="x" size={16} />
        <span>{t("check_command.not_found")}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {result.hits.map((hit, index) => (
          <HitRow key={`${hit.source}:${hit.directory}`} hit={hit} isActive={index === 0} />
        ))}
      </ul>

      {result.fullPathStatus && (
        <div
          data-testid="check-command-full-path-status"
          data-status={result.fullPathStatus.status}
          className={
            "text-xs px-3 py-2 rounded border " +
            (result.fullPathStatus.status === "active"
              ? "border-success/40 bg-success/10 text-success"
              : result.fullPathStatus.status === "shadowed"
                ? "border-warn/40 bg-warn/10 text-warn"
                : "border-rim bg-hover text-muted")
          }
        >
          {result.fullPathStatus.status === "active" && t("check_command.full_path_active")}
          {result.fullPathStatus.status === "shadowed" &&
            t("check_command.full_path_shadowed", {
              directory: result.fullPathStatus.shadowedBy.directory,
              file: result.fullPathStatus.shadowedBy.matchedFile,
            })}
          {result.fullPathStatus.status === "notOnEffectivePath" &&
            t("check_command.full_path_not_on_path", {
              directory: result.hits[0].directory,
              file: result.hits[0].matchedFile,
              name: result.queriedName,
            })}
        </div>
      )}
    </div>
  );
}

function HitRow({ hit, isActive }: { hit: CommandHit; isActive: boolean }) {
  const { t } = useI18n();
  return (
    <li
      data-testid="check-command-hit"
      data-status={isActive ? "active" : "shadowed"}
      className="flex items-center gap-2 px-3 py-2 rounded border border-rim bg-panel text-sm"
    >
      <Icon
        name={isActive ? "check" : "warning"}
        size={16}
        className={isActive ? "text-success shrink-0" : "text-warn shrink-0"}
      />
      <span className="font-mono text-xs text-fg break-all">
        {hit.directory}\{hit.matchedFile}
      </span>
      <span className="ml-auto flex items-center gap-2 shrink-0">
        <span className={isActive ? "text-xs text-success" : "text-xs text-warn"}>
          {isActive ? t("check_command.active") : t("check_command.shadowed")}
        </span>
        <Badge variant={hit.source === "User" ? "user" : "system"}>{hit.source}</Badge>
      </span>
    </li>
  );
}

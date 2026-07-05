import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../api";
import { useLocalHistory } from "../../hooks/useLocalHistory";
import type { StagedChange } from "../../hooks/useStaged";
import { stagedKey } from "../../hooks/useStaged";
import { lookupEnvDescription } from "../../lib/envDescriptions";
import type { EnvVar, VarScope } from "../../types";
import { ListEditor } from "../ListEditor/ListEditor";
import { PathEditor } from "../PathEditor/PathEditor";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";

interface Props {
  variable: EnvVar | null;
  allVars: EnvVar[];
  elevated: boolean;
  userPathInEnv: boolean;
  systemPathInEnv: boolean;
  staged: Map<string, StagedChange>;
  onStage: (name: string, scope: VarScope, value: string) => void;
  onStageDelete: (name: string, scope: VarScope) => void;
  onUnstage: (name: string, scope: VarScope) => void;
  onStageAddToPath: (scope: "User" | "System") => void;
  /** Called with a discard fn when dirty, null when clean. Lets App wire Ctrl+Z. */
  onRegisterLocalUndo?: (fn: (() => void) | null) => void;
}

export function DetailPanel({ variable, allVars, elevated, userPathInEnv, systemPathInEnv, staged, onStage, onStageDelete, onUnstage, onStageAddToPath, onRegisterLocalUndo }: Props) {
  const { t } = useTranslation();
  const [overrideSeparator, setOverrideSeparator] = useState<";" | "," | null>(null);
  const prevVarRef = useRef<{ name: string; scope: string } | null>(null);

  const {
    value,
    dirty,
    onChange: handleValueChange,
    discard: handleDiscard,
    onBeforeStructuralChange,
    reset,
  } = useLocalHistory(variable?.value ?? "");

  // Reset overrideSeparator only when the variable identity changes (not on value-only updates).
  useEffect(() => {
    if (!variable) return;
    const isSameVar =
      prevVarRef.current?.name === variable.name &&
      prevVarRef.current?.scope === variable.scope;
    if (!isSameVar) setOverrideSeparator(null);
    prevVarRef.current = { name: variable.name, scope: variable.scope };
  }, [variable?.name, variable?.scope]);

  useEffect(() => {
    if (!onRegisterLocalUndo) return;
    onRegisterLocalUndo(dirty ? handleDiscard : null);
    return () => { onRegisterLocalUndo(null); };
  }, [dirty, handleDiscard, onRegisterLocalUndo]);

  const expandedValue = useMemo(() => {
    if (!value.includes("%")) return null;
    const lookup = new Map<string, string>();
    allVars.filter((v) => v.scope === "System").forEach((v) => lookup.set(v.name.toUpperCase(), v.value));
    allVars.filter((v) => v.scope === "User").forEach((v) => lookup.set(v.name.toUpperCase(), v.value));
    const expanded = value.replace(/%([^%]+)%/g, (match, name: string) => lookup.get(name.toUpperCase()) ?? match);
    return expanded !== value ? expanded : null;
  }, [value, allVars]);

  if (!variable) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-dim">
        <span className="text-5xl opacity-20">⚙</span>
        <p className="text-sm">{t("detail.empty")}</p>
      </div>
    );
  }

  const key = stagedKey(variable.name, variable.scope);
  const stagedChange = staged.get(key);
  const isStagedDelete = stagedChange?.kind === "delete";
  const isStagedSet = stagedChange?.kind === "set";

  const handleApply = () => {
    onStage(variable.name, variable.scope, value);
  };

  const handleDelete = () => {
    if (!confirm(t("detail.confirm_delete", { name: variable.name, scope: variable.scope }))) return;
    onStageDelete(variable.name, variable.scope);
  };

  const handleUnstage = () => {
    onUnstage(variable.name, variable.scope);
    reset(stagedChange?.originalValue ?? variable.value);
  };

  /** Auto-detect list separator from pasted text. */
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    if (text.includes(";") && text.split(";").some((p) => p.includes("\\"))) {
      setOverrideSeparator(";");
    } else if (text.includes(",") && text.split(",").length > 1) {
      setOverrideSeparator(",");
    }
  };

  const effectiveSeparator = overrideSeparator ?? variable.listSeparator;
  const readOnly = variable.scope === "System" && !elevated;
  const description = lookupEnvDescription(variable.name);
  const isPathVar = variable.name.toUpperCase() === "PATH";
  const pathInEnvForScope = variable.scope === "System" ? systemPathInEnv : userPathInEnv;
  const showAddToPathHint = isPathVar && !pathInEnvForScope && !isStagedDelete
    && (variable.scope === "User" || elevated);

  const editorLabel =
    effectiveSeparator === ";" ? t("detail.label_path") :
    effectiveSeparator === "," ? t("detail.label_list") :
    t("detail.label_value");

  const entriesCount = effectiveSeparator
    ? value.split(effectiveSeparator).filter((p) => p.trim()).length
    : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header — fixed height so button appearance doesn't shift layout */}
      <div className="flex items-center gap-3 px-6 h-[60px] border-b border-rim-subtle shrink-0">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <h2 className="font-mono font-semibold text-base text-fg truncate">{variable.name}</h2>
          <Badge variant={variable.scope === "User" ? "user" : "system"}>
            {variable.scope}
          </Badge>
          {readOnly && (
            <>
              <Badge variant="readonly">{t("detail.readonly_badge")}</Badge>
              <button
                type="button"
                onClick={() => api.restartAsAdmin()}
                className="text-[10px] text-accent/70 hover:text-accent px-1.5 py-0.5 rounded hover:bg-accent/10 transition-colors shrink-0"
                title="Restart as administrator to edit system variables"
              >
                {t("detail.restart_admin")}
              </button>
            </>
          )}
          {isStagedSet && !dirty && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent/15 text-accent shrink-0">
              {t("detail.staged_badge")}
            </span>
          )}
          {isStagedDelete && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-danger/15 text-danger shrink-0">
              {t("detail.staged_delete_badge")}
            </span>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          {dirty ? (
            <>
              <Button variant="primary" size="sm" onClick={handleApply}>{t("detail.stage")}</Button>
              <Button variant="ghost" size="sm" onClick={handleDiscard}>{t("detail.discard")}</Button>
            </>
          ) : isStagedSet ? (
            <Button variant="ghost" size="sm" onClick={handleUnstage}>{t("detail.unstage")}</Button>
          ) : !isStagedDelete && !readOnly ? (
            <Button variant="danger" size="sm" onClick={handleDelete}>{t("detail.delete")}</Button>
          ) : null}
        </div>
      </div>

      {description && (
        <div className="flex items-start gap-2.5 px-6 py-2 border-b border-rim-subtle bg-hover/40 shrink-0">
          <span className="text-dim text-xs mt-px select-none">ℹ</span>
          <p className="text-xs text-muted leading-relaxed">
            <span className="font-semibold text-dim mr-1.5">{description.category}</span>
            {description.summary}
          </p>
        </div>
      )}

      {/* Staged-delete overlay */}
      {isStagedDelete ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-dim px-6">
          <span className="text-4xl opacity-20">🗑</span>
          <p className="text-sm text-center">
            {t("detail.staged_delete_title", { name: variable.name })}
          </p>
          <p className="text-xs text-center">
            {t("detail.original_value_label")} <span className="font-mono text-muted">{stagedChange.originalValue}</span>
          </p>
          <Button variant="secondary" size="md" onClick={handleUnstage}>{t("detail.unstage")}</Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {/* Editor label + mode toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold text-muted uppercase tracking-wide">{editorLabel}</p>
              {showAddToPathHint && (
                <button
                  type="button"
                  onClick={() => onStageAddToPath(variable.scope as "User" | "System")}
                  className="text-[10px] text-accent/70 hover:text-accent px-1.5 py-0.5 rounded hover:bg-accent/10 transition-colors"
                  title="Stage adding Envarly install directory to this PATH variable"
                >
                  {t("detail.add_to_path")}
                </button>
              )}
            </div>
            <div className="flex gap-1">
              {effectiveSeparator !== null ? (
                <button
                  type="button"
                  onClick={() => setOverrideSeparator(null)}
                  className="text-[10px] text-dim hover:text-muted px-1.5 py-0.5 rounded hover:bg-hover transition-colors"
                >
                  {t("detail.plain_text")}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setOverrideSeparator(";")}
                    className="text-[10px] text-dim hover:text-muted px-1.5 py-0.5 rounded hover:bg-hover transition-colors"
                  >
                    {t("detail.list_semicolon")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideSeparator(",")}
                    className="text-[10px] text-dim hover:text-muted px-1.5 py-0.5 rounded hover:bg-hover transition-colors"
                  >
                    {t("detail.list_comma")}
                  </button>
                </>
              )}
            </div>
          </div>

          {effectiveSeparator === ";" ? (
            <PathEditor
              rawValue={value}
              onChange={handleValueChange}
              readOnly={readOnly}
              allVars={allVars}
              skipPathValidation={variable.name.toUpperCase() === "PATHEXT"}
              onBeforeReorder={onBeforeStructuralChange}
            />
          ) : effectiveSeparator === "," ? (
            <ListEditor separator="," rawValue={value} onChange={handleValueChange} readOnly={readOnly} />
          ) : (
            <Textarea
              label="Value"
              labelHidden
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              onPaste={handlePaste}
              rows={Math.max(3, value.split("\n").length + 1)}
              spellCheck={false}
              disabled={readOnly}
            />
          )}

          {/* Metadata */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-rim-subtle mt-1">
            {[
              [t("detail.meta_scope"), variable.scope],
              [t("detail.meta_length_label"), t("detail.meta_length", { count: value.length })],
              ...(entriesCount !== null ? [[t("detail.meta_entries"), String(entriesCount)]] : []),
              ...(expandedValue !== null
                ? [[t("detail.meta_expanded"), expandedValue.length > 60 ? `${expandedValue.slice(0, 60)}…` : expandedValue]]
                : []),
              ...(isStagedSet && stagedChange.originalValue !== null
                ? [[t("detail.meta_original"), stagedChange.originalValue.length > 40
                    ? `${stagedChange.originalValue.slice(0, 40)}…`
                    : stagedChange.originalValue]]
                : []),
            ].map(([label, val]) => (
              <div key={label} className="flex gap-3 text-sm">
                <span className="text-dim w-14 shrink-0">{label}</span>
                <span className="text-muted font-mono">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

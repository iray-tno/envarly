import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../hooks/useI18n";
import { useLocalHistory } from "../../hooks/useLocalHistory";
import type { StagedChange } from "../../hooks/useStaged";
import { stagedKey } from "../../hooks/useStaged";
import { lookupEnvDescription } from "../../lib/envDescriptions";
import { resolveEnvValueKind } from "../../lib/envValueKind";
import type { EnvValueKindSelection, EnvVar, VarScope } from "../../types";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Select } from "../ui/Select";
import { DetailHeader } from "./DetailHeader";
import { DetailMetadata } from "./DetailMetadata";
import { VariableEditor } from "./VariableEditor";

interface Props {
  variable: EnvVar | null;
  allVars: EnvVar[];
  elevated: boolean;
  userPathInEnv: boolean;
  systemPathInEnv: boolean;
  staged: Map<string, StagedChange>;
  onStage: (
    name: string,
    scope: VarScope,
    value: string,
    valueKind?: EnvValueKindSelection,
  ) => void;
  onStageDelete: (name: string, scope: VarScope) => void;
  onUnstage: (name: string, scope: VarScope) => void;
  onStageAddToPath: (scope: "User" | "System") => void;
  /** Called with a discard fn when dirty, null when clean. Lets App wire Ctrl+Z. */
  onRegisterLocalUndo?: (fn: (() => void) | null) => void;
}


export function DetailPanel({
  variable,
  allVars,
  elevated,
  userPathInEnv,
  systemPathInEnv,
  staged,
  onStage,
  onStageDelete,
  onUnstage,
  onStageAddToPath,
  onRegisterLocalUndo,
}: Props) {
  const { t } = useI18n();
  const [overrideSeparator, setOverrideSeparator] = useState<";" | "," | "plain" | null>(null);
  const [valueKindSelection, setValueKindSelection] = useState<EnvValueKindSelection>("Auto");
  const prevVarRef = useRef<{ name: string; scope: string } | null>(null);
  const variableName = variable?.name;
  const variableScope = variable?.scope;

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
    if (!variableName || !variableScope) return;
    const isSameVar =
      prevVarRef.current?.name === variableName && prevVarRef.current?.scope === variableScope;
    if (!isSameVar) {
      setOverrideSeparator(null);
      setValueKindSelection("Auto");
    }
    prevVarRef.current = { name: variableName, scope: variableScope };
  }, [variableName, variableScope]);

  useEffect(() => {
    if (!onRegisterLocalUndo) return;
    onRegisterLocalUndo(dirty ? handleDiscard : null);
    return () => {
      onRegisterLocalUndo(null);
    };
  }, [dirty, handleDiscard, onRegisterLocalUndo]);

  const expandedValue = useMemo(() => {
    if (!value.includes("%")) return null;
    const lookup = new Map<string, string>();
    allVars
      .filter((v) => v.scope === "System")
      .forEach((v) => {
        lookup.set(v.name.toUpperCase(), v.value);
      });
    allVars
      .filter((v) => v.scope === "User")
      .forEach((v) => {
        lookup.set(v.name.toUpperCase(), v.value);
      });
    const expanded = value.replace(
      /%([^%]+)%/g,
      (match, name: string) => lookup.get(name.toUpperCase()) ?? match,
    );
    return expanded !== value ? expanded : null;
  }, [value, allVars]);

  if (!variable) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-dim">
        <Icon name="info" size={48} className="opacity-20" />
        <p className="text-sm">{t("detail.empty")}</p>
      </div>
    );
  }

  const key = stagedKey(variable.name, variable.scope);
  const stagedChange = staged.get(key);
  const isStagedDelete = stagedChange?.kind === "delete";
  const isStagedSet = stagedChange?.kind === "set";

  const resolvedValueKind = resolveEnvValueKind(
    valueKindSelection,
    value,
    variable.valueKind ?? resolveEnvValueKind("Auto", variable.value),
  );
  const typeDirty =
    resolvedValueKind !== (variable.valueKind ?? resolveEnvValueKind("Auto", variable.value));
  const editorDirty = dirty || typeDirty;

  const handleApply = () => {
    if (valueKindSelection === "Auto") onStage(variable.name, variable.scope, value);
    else onStage(variable.name, variable.scope, value, valueKindSelection);
  };

  const handleDelete = () => {
    if (!confirm(t("detail.confirm_delete", { name: variable.name, scope: variable.scope })))
      return;
    onStageDelete(variable.name, variable.scope);
  };

  const handleUnstage = () => {
    onUnstage(variable.name, variable.scope);
    reset(stagedChange?.originalValue ?? variable.value);
    setValueKindSelection("Auto");
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

  const effectiveSeparator =
    overrideSeparator === "plain" ? null : (overrideSeparator ?? variable.listSeparator);
  const readOnly = variable.scope === "System" && !elevated;
  const description = lookupEnvDescription(variable.name);
  const isPathVar = variable.name.toUpperCase() === "PATH";
  const pathInEnvForScope = variable.scope === "System" ? systemPathInEnv : userPathInEnv;
  const showAddToPathHint =
    isPathVar && !pathInEnvForScope && !isStagedDelete && (variable.scope === "User" || elevated);

  const editorLabel =
    effectiveSeparator === ";"
      ? t("detail.label_path")
      : effectiveSeparator === ","
        ? t("detail.label_list")
        : t("detail.label_value");

  const entriesCount = effectiveSeparator
    ? value.split(effectiveSeparator).filter((p) => p.trim()).length
    : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <DetailHeader
        name={variable.name}
        scope={variable.scope}
        readOnly={readOnly}
        isStagedSet={isStagedSet}
        isStagedDelete={isStagedDelete}
        dirty={dirty}
        editorDirty={editorDirty}
        onApply={handleApply}
        onDiscard={handleDiscard}
        onUnstage={handleUnstage}
        onDelete={handleDelete}
      />

      {description && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-rim-subtle bg-hover/40 shrink-0">
          <Icon name="info" size={14} className="text-dim" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold bg-surface border border-rim text-dim shrink-0 select-none">
              {t(description.categoryKey)}
            </span>
            <p className="text-xs text-muted leading-relaxed">{t(description.summaryKey)}</p>
          </div>
        </div>
      )}

      {/* Staged-delete overlay */}
      {isStagedDelete ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-dim px-6">
          <Icon name="trash" size={48} className="opacity-20" />
          <p className="text-sm text-center">
            {t("detail.staged_delete_title", { name: variable.name })}
          </p>
          <p className="text-xs text-center">
            {t("detail.original_value_label")}{" "}
            <span className="font-mono text-muted">{stagedChange.originalValue}</span>
          </p>
          <Button variant="secondary" size="md" onClick={handleUnstage}>
            {t("detail.unstage")}
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="detail-value-kind"
              className="text-xs font-semibold text-muted uppercase tracking-wide"
            >
              {t("detail.value_kind")}
            </label>
            <Select
              id="detail-value-kind"
              options={[
                {
                  value: "Auto",
                  label: t("value_kind.auto_current", {
                    kind: t(
                      `value_kind.${resolvedValueKind === "String" ? "string" : "expand_string"}`,
                    ),
                  }),
                },
                { value: "String", label: t("value_kind.string") },
                { value: "ExpandString", label: t("value_kind.expand_string") },
              ]}
              value={valueKindSelection}
              onValueChange={setValueKindSelection}
              disabled={readOnly}
              containerClassName="w-full max-w-sm"
              className="w-full px-2 py-2 bg-surface border border-rim text-sm text-fg"
            />
            {resolvedValueKind === "String" && expandedValue && (
              <div className="flex items-center gap-2 text-xs text-warn">
                <Icon name="warning" size={14} />
                <span>{t("detail.expandable_value_warning")}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setValueKindSelection("ExpandString")}
                >
                  {t("detail.change_to_expand_string")}
                </Button>
              </div>
            )}
          </div>
          {/* Editor label + mode toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold text-muted uppercase tracking-wide">
                {editorLabel}
              </p>
              {showAddToPathHint && (
                <button
                  type="button"
                  onClick={() => onStageAddToPath(variable.scope as "User" | "System")}
                  className="text-[10px] text-accent hover:text-accent-hi px-2 py-1 rounded hover:bg-accent/10 transition-colors"
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
                  onClick={() => setOverrideSeparator("plain")}
                  className="text-[10px] text-dim hover:text-muted px-2 py-1 rounded hover:bg-hover transition-colors"
                >
                  {t("detail.plain_text")}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setOverrideSeparator(";")}
                    className="text-[10px] text-dim hover:text-muted px-2 py-1 rounded hover:bg-hover transition-colors"
                  >
                    {t("detail.list_semicolon")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideSeparator(",")}
                    className="text-[10px] text-dim hover:text-muted px-2 py-1 rounded hover:bg-hover transition-colors"
                  >
                    {t("detail.list_comma")}
                  </button>
                </>
              )}
            </div>
          </div>

          <VariableEditor
            variable={variable}
            value={value}
            separator={effectiveSeparator}
            readOnly={readOnly}
            allVars={allVars}
            onChange={handleValueChange}
            onPaste={handlePaste}
            onBeforeReorder={onBeforeStructuralChange}
          />

          <DetailMetadata
            scope={variable.scope}
            valueLength={value.length}
            entriesCount={entriesCount}
            expandedValue={expandedValue}
            originalValue={
              isStagedSet && stagedChange.originalValue !== null ? stagedChange.originalValue : null
            }
          />
        </div>
      )}
    </div>
  );
}

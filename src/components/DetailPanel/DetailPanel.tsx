import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api";
import { useI18n } from "../../hooks/useI18n";
import { useLocalHistory } from "../../hooks/useLocalHistory";
import type { StagedChange } from "../../hooks/useStaged";
import { stagedKey } from "../../hooks/useStaged";
import { lookupEnvDescription } from "../../lib/envDescriptions";
import { resolveEnvValueKind } from "../../lib/envValueKind";
import type { EnvValueKindSelection, EnvVar, VarScope } from "../../types";
import { ListEditor } from "../ListEditor/ListEditor";
import { PathEditor } from "../PathEditor/PathEditor";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";

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

const PATH_NAME_SUFFIXES = ["_HOME", "_ROOT", "_PATH", "_DIR", "_DIRECTORY"];
const PATH_NAME_EXACT = new Set([
  "APPDATA",
  "CUDA_PATH",
  "LOCALAPPDATA",
  "PROGRAMDATA",
  "PROGRAMFILES",
  "PROGRAMFILES(X86)",
  "PUBLIC",
  "SYSTEMDRIVE",
  "SYSTEMROOT",
  "TEMP",
  "TMP",
  "USERPROFILE",
  "WINDIR",
]);

function looksLikeSinglePath(name: string, value: string) {
  const normalizedName = name.toUpperCase();
  const trimmedValue = value.trim();

  if (
    PATH_NAME_EXACT.has(normalizedName) ||
    PATH_NAME_SUFFIXES.some((suffix) => normalizedName.endsWith(suffix))
  ) {
    return true;
  }

  return (
    /^[a-z]:[\\/]/i.test(trimmedValue) ||
    trimmedValue.startsWith("/") ||
    trimmedValue.startsWith("\\\\")
  );
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

  const handleBrowseFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: value.trim() || undefined,
    });
    if (typeof selected === "string") {
      handleValueChange(selected);
    }
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
  const showFolderPicker =
    !readOnly && effectiveSeparator === null && looksLikeSinglePath(variable.name, value);
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
      {/* Header — fixed height so button appearance doesn't shift layout */}
      <div className="flex items-center gap-3 px-6 h-[60px] border-b border-rim-subtle shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h2 className="font-mono font-semibold text-base text-fg truncate">{variable.name}</h2>
          <Badge variant={variable.scope === "User" ? "user" : "system"}>{variable.scope}</Badge>
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
              <Button variant="primary" size="sm" onClick={handleApply}>
                {t("detail.stage")}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDiscard}>
                {t("detail.discard")}
              </Button>
            </>
          ) : isStagedSet ? (
            <Button variant="ghost" size="sm" onClick={handleUnstage}>
              {t("detail.unstage")}
            </Button>
          ) : !isStagedDelete && !readOnly ? (
            <Button variant="danger" size="sm" onClick={handleDelete}>
              {t("detail.delete")}
            </Button>
          ) : null}
        </div>
      </div>

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

          {effectiveSeparator === ";" ? (
            <PathEditor
              rawValue={value}
              onChange={handleValueChange}
              readOnly={readOnly}
              allVars={allVars}
              skipPathValidation={variable.name.toUpperCase() === "PATHEXT"}
              allowFolderBrowse={variable.name.toUpperCase() !== "PATHEXT"}
              onBeforeReorder={onBeforeStructuralChange}
            />
          ) : effectiveSeparator === "," ? (
            <ListEditor
              separator=","
              rawValue={value}
              onChange={handleValueChange}
              readOnly={readOnly}
            />
          ) : (
            <div className="group relative">
              <Textarea
                label="Value"
                labelHidden
                value={value}
                onChange={(e) => handleValueChange(e.target.value)}
                onPaste={handlePaste}
                rows={Math.max(3, value.split("\n").length + 1)}
                spellCheck={false}
                disabled={readOnly}
                className={showFolderPicker ? "pr-11" : undefined}
              />
              {showFolderPicker && (
                <IconButton
                  aria-label={t("detail.browse_folder")}
                  title={t("detail.browse_folder")}
                  icon="folder"
                  onClick={handleBrowseFolder}
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                />
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-col gap-1 pt-2 border-t border-rim-subtle mt-1">
            {[
              [t("detail.meta_scope"), variable.scope],
              [t("detail.meta_length_label"), t("detail.meta_length", { count: value.length })],
              ...(entriesCount !== null ? [[t("detail.meta_entries"), String(entriesCount)]] : []),
              ...(expandedValue !== null
                ? [
                    [
                      t("detail.meta_expanded"),
                      expandedValue.length > 60 ? `${expandedValue.slice(0, 60)}…` : expandedValue,
                    ],
                  ]
                : []),
              ...(isStagedSet && stagedChange.originalValue !== null
                ? [
                    [
                      t("detail.meta_original"),
                      stagedChange.originalValue.length > 40
                        ? `${stagedChange.originalValue.slice(0, 40)}…`
                        : stagedChange.originalValue,
                    ],
                  ]
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

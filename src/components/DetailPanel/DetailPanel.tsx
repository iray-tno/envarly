import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalHistory } from "../../hooks/useLocalHistory";
import type { StagedChange } from "../../hooks/useStaged";
import { stagedKey } from "../../hooks/useStaged";
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
  staged: Map<string, StagedChange>;
  onStage: (name: string, scope: VarScope, value: string) => void;
  onStageDelete: (name: string, scope: VarScope) => void;
  onUnstage: (name: string, scope: VarScope) => void;
  /** Called with a discard fn when dirty, null when clean. Lets App wire Ctrl+Z. */
  onRegisterLocalUndo?: (fn: (() => void) | null) => void;
}

export function DetailPanel({ variable, allVars, elevated, staged, onStage, onStageDelete, onUnstage, onRegisterLocalUndo }: Props) {
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
        <p className="text-sm">Select a variable to view and edit it</p>
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
    if (!confirm(`Stage "${variable.name}" for deletion from ${variable.scope} environment?`)) return;
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

  const editorLabel =
    effectiveSeparator === ";" ? "Path entries (drag to reorder)" :
    effectiveSeparator === "," ? "List entries (drag to reorder)" :
    "Value";

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
            <Badge variant="readonly">read-only · requires admin</Badge>
          )}
          {isStagedSet && !dirty && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent/15 text-accent shrink-0">
              staged
            </span>
          )}
          {isStagedDelete && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-danger/15 text-danger shrink-0">
              staged: delete
            </span>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          {dirty ? (
            <>
              <Button variant="primary" size="sm" onClick={handleApply}>Stage</Button>
              <Button variant="ghost" size="sm" onClick={handleDiscard}>Discard</Button>
            </>
          ) : isStagedSet ? (
            <Button variant="ghost" size="sm" onClick={handleUnstage}>Unstage</Button>
          ) : !isStagedDelete && !readOnly ? (
            <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
          ) : null}
        </div>
      </div>

      {/* Staged-delete overlay */}
      {isStagedDelete ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-dim px-6">
          <span className="text-4xl opacity-20">🗑</span>
          <p className="text-sm text-center">
            <span className="font-mono font-semibold text-fg">{variable.name}</span> is staged for deletion.
          </p>
          <p className="text-xs text-center">
            Original value: <span className="font-mono text-muted">{stagedChange.originalValue}</span>
          </p>
          <Button variant="secondary" size="md" onClick={handleUnstage}>Unstage</Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {/* Editor label + mode toggle */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted uppercase tracking-wide">{editorLabel}</p>
            <div className="flex gap-1">
              {effectiveSeparator !== null ? (
                <button
                  type="button"
                  onClick={() => setOverrideSeparator(null)}
                  className="text-[10px] text-dim hover:text-muted px-1.5 py-0.5 rounded hover:bg-hover transition-colors"
                >
                  Plain text
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setOverrideSeparator(";")}
                    className="text-[10px] text-dim hover:text-muted px-1.5 py-0.5 rounded hover:bg-hover transition-colors"
                  >
                    List (;)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideSeparator(",")}
                    className="text-[10px] text-dim hover:text-muted px-1.5 py-0.5 rounded hover:bg-hover transition-colors"
                  >
                    List (,)
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
              ["Scope", variable.scope],
              ["Length", `${value.length} chars`],
              ...(entriesCount !== null ? [["Entries", String(entriesCount)]] : []),
              ...(expandedValue !== null
                ? [["Expanded", expandedValue.length > 60 ? `${expandedValue.slice(0, 60)}…` : expandedValue]]
                : []),
              ...(isStagedSet && stagedChange.originalValue !== null
                ? [["Original", stagedChange.originalValue.length > 40
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

import { useEffect, useState } from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { api } from "../../api";
import { useThemeContext } from "../../context/ThemeContext";
import type { EnvVar } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { PathEditor } from "../PathEditor/PathEditor";

interface Props {
  variable: EnvVar | null;
  elevated: boolean;
  onSaved: () => void;
  onDeleted: () => void;
}

type StatusMsg = { type: "ok" | "err"; text: string };

export function DetailPanel({ variable, elevated, onSaved, onDeleted }: Props) {
  const theme = useThemeContext();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<StatusMsg | null>(null);

  useEffect(() => {
    if (variable) {
      setValue(variable.value);
      setDirty(false);
      setConfirming(false);
      setStatus(null);
    }
  }, [variable?.name, variable?.scope]);

  if (!variable) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-dim">
        <span className="text-5xl opacity-20">⚙</span>
        <p className="text-sm">Select a variable to view and edit it</p>
      </div>
    );
  }

  const handleValueChange = (newVal: string) => {
    setValue(newVal);
    setDirty(newVal !== variable.value);
    setConfirming(false);
  };

  const handleApply = () => setConfirming(true);
  const handleCancelConfirm = () => setConfirming(false);

  const handleConfirm = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await api.setEnvVar(variable.name, value, variable.scope);
      setDirty(false);
      setConfirming(false);
      setStatus({ type: "ok", text: "Saved and broadcast to running apps." });
      onSaved();
    } catch (e) {
      setStatus({ type: "err", text: String(e) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${variable.name}" from ${variable.scope} environment?`)) return;
    try {
      await api.deleteEnvVar(variable.name, variable.scope);
      onDeleted();
    } catch (e) {
      setStatus({ type: "err", text: String(e) });
    }
  };

  const isPath = variable.name.toUpperCase() === "PATH" || variable.isPathLike;
  const readOnly = variable.scope === "System" && !elevated;

  const oldDisplay = isPath ? variable.value.split(";").join("\n") : variable.value;
  const newDisplay = isPath ? value.split(";").join("\n") : value;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-rim-subtle shrink-0">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <h2 className="font-mono font-semibold text-base text-fg truncate">{variable.name}</h2>
          <Badge variant={variable.scope === "User" ? "user" : "system"}>
            {variable.scope}
          </Badge>
          {readOnly && (
            <Badge variant="readonly">read-only · requires admin</Badge>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {confirming ? (
            <>
              <Button variant="primary" size="md" onClick={handleConfirm} disabled={saving}>
                {saving ? "Applying…" : "Confirm"}
              </Button>
              <Button variant="ghost" size="md" onClick={handleCancelConfirm}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              {dirty && !readOnly && (
                <Button variant="primary" size="md" onClick={handleApply}>
                  Apply
                </Button>
              )}
              {!readOnly && (
                <Button variant="danger" size="md" onClick={handleDelete}>
                  Delete
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Status */}
      {status && (
        <div
          className={
            status.type === "ok"
              ? "px-5 py-2 text-sm bg-success/10 text-success shrink-0"
              : "px-5 py-2 text-sm bg-danger/10 text-danger shrink-0"
          }
          role={status.type === "err" ? "alert" : undefined}
        >
          {status.text}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
        {confirming ? (
          /* Diff confirmation view */
          <>
            <p className="text-sm font-semibold text-muted uppercase tracking-wide">
              Review changes before applying
            </p>
            <div className="rounded overflow-hidden text-[11px]">
              <ReactDiffViewer
                oldValue={oldDisplay}
                newValue={newDisplay}
                splitView={false}
                compareMethod={isPath ? DiffMethod.LINES : DiffMethod.WORDS}
                useDarkTheme={theme === "dark"}
                hideLineNumbers
                styles={{
                  variables: {
                    dark: {
                      diffViewerBackground: "#1c2333",
                      addedBackground: "#1a3a2a",
                      addedColor: "#3fb950",
                      removedBackground: "#3a1a1a",
                      removedColor: "#f85149",
                      wordAddedBackground: "#1a3a2a",
                      wordRemovedBackground: "#3a1a1a",
                    },
                    light: {
                      diffViewerBackground: "#f6f8fa",
                      addedBackground: "#e6ffec",
                      addedColor: "#1a7f37",
                      removedBackground: "#ffebe9",
                      removedColor: "#cf222e",
                      wordAddedBackground: "#e6ffec",
                      wordRemovedBackground: "#ffebe9",
                    },
                  },
                }}
              />
            </div>
          </>
        ) : (
          /* Edit view */
          <>
            <p className="text-sm font-semibold text-muted uppercase tracking-wide">
              {isPath ? "PATH entries (drag to reorder)" : "Value"}
            </p>

            {isPath ? (
              <PathEditor rawValue={value} onChange={handleValueChange} readOnly={readOnly} />
            ) : (
              <Textarea
                label="Value"
                labelHidden
                value={value}
                onChange={(e) => handleValueChange(e.target.value)}
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
                ...(isPath
                  ? [["Entries", String(value.split(";").filter((p) => p.trim()).length)]]
                  : []),
              ].map(([label, val]) => (
                <div key={label} className="flex gap-3 text-sm">
                  <span className="text-dim w-14 shrink-0">{label}</span>
                  <span className="text-muted font-mono">{val}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

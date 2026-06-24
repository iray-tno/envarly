import { useEffect, useState } from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { api } from "../../api";
import { cn } from "../../lib/cn";
import type { EnvVar } from "../../types";
import { PathEditor } from "../PathEditor/PathEditor";

interface Props {
  variable: EnvVar | null;
  elevated: boolean;
  onSaved: () => void;
  onDeleted: () => void;
}

type StatusMsg = { type: "ok" | "err"; text: string };

export function DetailPanel({ variable, elevated, onSaved, onDeleted }: Props) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<StatusMsg | null>(null);

  useEffect(() => {
    if (variable) {
      setValue(variable.value);
      setDirty(false);
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
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await api.setEnvVar(variable.name, value, variable.scope);
      setDirty(false);
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-rim-subtle shrink-0">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <h2 className="font-mono font-semibold text-base text-fg truncate">{variable.name}</h2>
          <span
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0",
              variable.scope === "User"
                ? "bg-accent/15 text-accent"
                : "bg-violet/15 text-violet",
            )}
          >
            {variable.scope}
          </span>
          {readOnly && (
            <span className="text-[10px] text-dim border border-rim rounded px-1.5 py-0.5 shrink-0">
              read-only · requires admin
            </span>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {dirty && !readOnly && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded bg-accent text-canvas text-sm font-medium hover:bg-accent-hi disabled:opacity-50 transition-colors"
            >
              {saving ? "Applying…" : "Apply"}
            </button>
          )}
          {!readOnly && (
            <button
              onClick={handleDelete}
              className="px-4 py-1.5 rounded bg-danger/15 text-danger border border-danger/30 text-sm font-medium hover:bg-danger/25 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Status */}
      {status && (
        <div
          className={cn(
            "px-5 py-1.5 text-xs shrink-0",
            status.type === "ok" ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
          )}
        >
          {status.text}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
        <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">
          {isPath ? "PATH entries (drag to reorder, double-click to edit)" : "Value"}
        </p>

        {isPath ? (
          <PathEditor rawValue={value} onChange={handleValueChange} readOnly={readOnly} />
        ) : (
          <textarea
            className="w-full px-3 py-2.5 bg-surface border border-rim rounded font-mono text-xs text-fg leading-relaxed resize-y focus:border-accent focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            rows={Math.max(3, value.split("\n").length + 1)}
            spellCheck={false}
            disabled={readOnly}
          />
        )}

        {/* Diff preview — shown when the value has been edited */}
        {dirty && !readOnly && (
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wide">
              Preview changes
            </p>
            <div className="rounded overflow-hidden text-[11px]">
              <ReactDiffViewer
                oldValue={isPath ? variable.value.split(";").join("\n") : variable.value}
                newValue={isPath ? value.split(";").join("\n") : value}
                splitView={false}
                compareMethod={isPath ? DiffMethod.LINES : DiffMethod.WORDS}
                useDarkTheme
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
                  },
                }}
              />
            </div>
          </div>
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
            <div key={label} className="flex gap-3 text-xs">
              <span className="text-dim w-14 shrink-0">{label}</span>
              <span className="text-muted font-mono">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

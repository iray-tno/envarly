import { useEffect, useRef, useState } from "react";
import { api } from "../../api";
import { cn } from "../../lib/cn";
import { isSecretVar } from "../../lib/secrets";
import type { EnvSnapshot, EnvVar, VarScope } from "../../types";
import { Button } from "../ui/Button";
import { SegmentedControl } from "../ui/SegmentedControl";
import { Textarea } from "../ui/Textarea";

type Mode = "export" | "import";
type ExportScope = "All" | "User" | "System" | "Custom";
type ExportFormat = "json" | "reg";
type MergeStrategy = "merge" | "replace";

interface FlatVar {
  name: string;
  value: string;
  scope: VarScope;
}

function flattenSnapshot(snap: EnvSnapshot): FlatVar[] {
  return [
    ...Object.entries(snap.user).map(([name, value]) => ({ name, value, scope: "User" as const })),
    ...Object.entries(snap.system).map(([name, value]) => ({ name, value, scope: "System" as const })),
  ].sort((a, b) => a.name.localeCompare(b.name));
}

const scopeOptions: { value: ExportScope; label: string }[] = [
  { value: "All", label: "All" },
  { value: "User", label: "User" },
  { value: "System", label: "System" },
  { value: "Custom", label: "Custom…" },
];

const formatOptions: { value: ExportFormat; label: string }[] = [
  { value: "json", label: ".json" },
  { value: "reg", label: ".reg" },
];

const strategyOptions: { value: MergeStrategy; label: string }[] = [
  { value: "merge", label: "Merge" },
  { value: "replace", label: "Replace" },
];

function SecretBanner({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="flex gap-2 px-3 py-2 rounded border border-warn/40 bg-warn/10 text-warn text-xs">
      <span className="shrink-0">⚠</span>
      <span>
        {count} selected variable{count !== 1 ? "s" : ""} may contain sensitive data
        (tokens, keys, passwords). Verify you trust the destination before sharing this file.
      </span>
    </div>
  );
}

interface VarTableProps {
  vars: FlatVar[];
  checked: Record<string, boolean>;
  onToggle: (key: string) => void;
  onToggleAll: (val: boolean) => void;
}

function varKey(v: FlatVar) {
  return `${v.scope}:${v.name}`;
}

function VarTable({ vars, checked, onToggle, onToggleAll }: VarTableProps) {
  const checkedCount = vars.filter((v) => checked[varKey(v)]).length;
  const allChecked = checkedCount === vars.length;
  const noneChecked = checkedCount === 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 text-xs text-muted">
        <span>{vars.length} variable{vars.length !== 1 ? "s" : ""}</span>
        <Button variant="ghost" size="sm" onClick={() => onToggleAll(true)} disabled={allChecked} className="px-1.5 py-0.5">Select all</Button>
        <span className="text-dim">·</span>
        <Button variant="ghost" size="sm" onClick={() => onToggleAll(false)} disabled={noneChecked} className="px-1.5 py-0.5">Deselect all</Button>
        <span className="ml-auto font-medium text-fg">{checkedCount} selected</span>
      </div>

      <div className="rounded border border-rim overflow-hidden max-h-72 overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-rim bg-surface text-muted uppercase text-[10px] tracking-wide">
              <th className="w-8 px-2 py-1.5 text-center">
                <input type="checkbox" checked={allChecked} onChange={(e) => onToggleAll(e.target.checked)} className="accent-accent" aria-label="Select all" />
              </th>
              <th className="px-3 py-1.5 text-left">Name</th>
              <th className="px-3 py-1.5 text-left">Scope</th>
              <th className="px-3 py-1.5 text-left">Value</th>
            </tr>
          </thead>
          <tbody>
            {vars.map((v) => {
              const key = varKey(v);
              const secret = isSecretVar(v.name);
              return (
                <tr
                  key={key}
                  onClick={() => onToggle(key)}
                  className={cn(
                    "border-b border-rim-subtle last:border-0 cursor-pointer transition-colors",
                    checked[key] ? "bg-canvas hover:bg-hover" : "bg-canvas opacity-40 hover:opacity-60",
                  )}
                >
                  <td className="px-2 py-1.5 text-center">
                    <input type="checkbox" checked={!!checked[key]} onChange={() => onToggle(key)} onClick={(e) => e.stopPropagation()} className="accent-accent" aria-label={v.name} />
                  </td>
                  <td className="px-3 py-1.5 font-mono font-semibold text-fg">
                    <span className="flex items-center gap-1.5">
                      {v.name}
                      {secret && <span title="May contain sensitive data" className="text-warn text-[10px]">⚠</span>}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-muted">{v.scope}</td>
                  <td className="px-3 py-1.5 font-mono text-muted truncate max-w-xs">
                    {secret ? "••••••••" : v.value}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export tab
// ---------------------------------------------------------------------------

interface ExportTabProps {
  onStatus: (msg: string | null) => void;
}

function ExportTab({ onStatus }: ExportTabProps) {
  const [scope, setScope] = useState<ExportScope>("All");
  const [format, setFormat] = useState<ExportFormat>("json");
  const [busy, setBusy] = useState(false);
  const [allVars, setAllVars] = useState<FlatVar[] | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loadingVars, setLoadingVars] = useState(false);

  useEffect(() => {
    if (scope !== "Custom") return;
    if (allVars !== null) return;
    setLoadingVars(true);
    api.getEnvVars()
      .then((vars: EnvVar[]) => {
        const flat: FlatVar[] = vars.map((v) => ({ name: v.name, value: v.value, scope: v.scope }));
        setAllVars(flat);
        setChecked(Object.fromEntries(flat.map((v) => [varKey(v), true])));
      })
      .catch(() => onStatus("Failed to load variables."))
      .finally(() => setLoadingVars(false));
  }, [scope]);

  const handleScopeChange = (s: ExportScope) => {
    setScope(s);
    if (s !== "Custom") setAllVars(null);
    onStatus(null);
  };

  const selectedCustomVars = allVars?.filter((v) => checked[varKey(v)]) ?? [];
  const secretCount =
    scope === "Custom"
      ? selectedCustomVars.filter((v) => isSecretVar(v.name)).length
      : 0;

  const handleExport = async () => {
    setBusy(true);
    onStatus(null);
    try {
      let savedPath: string | null;
      if (scope === "Custom") {
        savedPath = await api.exportCustomVars(selectedCustomVars, format);
      } else {
        savedPath = await api.exportVars(scope, format);
      }
      onStatus(savedPath ? `Saved to ${savedPath}` : null);
    } catch (e) {
      onStatus(`Export failed: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const canExport = scope !== "Custom" || selectedCustomVars.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted uppercase tracking-wide">Scope</span>
        <SegmentedControl aria-label="Export scope" options={scopeOptions} value={scope} onChange={handleScopeChange} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted uppercase tracking-wide">Format</span>
        <SegmentedControl aria-label="Export format" options={formatOptions} value={format} onChange={setFormat} />
        <p className="text-xs text-dim">
          {format === "json"
            ? "Envarly JSON — can be re-imported into Envarly."
            : "Windows Registry Editor format — double-click to merge into the registry directly."}
        </p>
      </div>

      {scope === "Custom" && (
        <div className="flex flex-col gap-3">
          {loadingVars && <p className="text-xs text-dim">Loading variables…</p>}
          {allVars && (
            <>
              <SecretBanner count={secretCount} />
              <VarTable
                vars={allVars}
                checked={checked}
                onToggle={(key) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }))}
                onToggleAll={(val) => setChecked(Object.fromEntries((allVars ?? []).map((v) => [varKey(v), val])))}
              />
            </>
          )}
        </div>
      )}

      <Button
        variant="primary"
        size="md"
        onClick={handleExport}
        disabled={busy || !canExport}
        className="self-start"
      >
        {busy ? "Exporting…" : scope === "Custom" ? `Export ${selectedCustomVars.length} selected → .${format}` : `Export ${scope} → .${format}`}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Import tab
// ---------------------------------------------------------------------------

interface ImportTabProps {
  onApplied: () => void;
  onStatus: (msg: string | null) => void;
}

function ImportTab({ onApplied, onStatus }: ImportTabProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [format, setFormat] = useState<ExportFormat>("json");
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<FlatVar[] | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [strategy, setStrategy] = useState<MergeStrategy>("merge");
  const [parsing, setParsing] = useState(false);
  const [applying, setApplying] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.endsWith(".reg")) setFormat("reg");
    else setFormat("json");
    const reader = new FileReader();
    reader.onload = (ev) => setText((ev.target?.result as string) ?? "");
    reader.readAsText(file, "utf-8");
    setPreview(null);
    onStatus(null);
  };

  const handleParse = async () => {
    const content = text.trim();
    if (!content) { onStatus("Paste or upload a file first."); return; }
    setParsing(true);
    onStatus(null);
    try {
      const snap = await api.parseImport(content, format);
      const vars = flattenSnapshot(snap);
      if (vars.length === 0) { onStatus("No environment variables found in file."); setPreview(null); return; }
      setPreview(vars);
      setChecked(Object.fromEntries(vars.map((v) => [varKey(v), true])));
    } catch (e) {
      onStatus(`Parse failed: ${e}`);
      setPreview(null);
    } finally {
      setParsing(false);
    }
  };

  const handleApply = async () => {
    if (!preview) return;
    const selected = preview.filter((v) => checked[varKey(v)]);
    if (selected.length === 0) { onStatus("No variables selected."); return; }
    setApplying(true);
    onStatus(null);
    try {
      if (strategy === "replace") {
        // Determine affected scopes from selected vars
        const affectedScopes = new Set(selected.map((v) => v.scope));
        const current = await api.getRegistrySnapshot();

        // Delete current vars not present in the selected set, per scope
        const selectedKeys = new Set(selected.map((v) => `${v.scope}:${v.name}`));
        if (affectedScopes.has("User")) {
          for (const name of Object.keys(current.user)) {
            if (!selectedKeys.has(`User:${name}`)) {
              await api.deleteEnvVar(name, "User");
            }
          }
        }
        if (affectedScopes.has("System")) {
          for (const name of Object.keys(current.system)) {
            if (!selectedKeys.has(`System:${name}`)) {
              await api.deleteEnvVar(name, "System");
            }
          }
        }
      }

      for (const v of selected) {
        await api.setEnvVar(v.name, v.value, v.scope);
      }

      const deletedMsg = strategy === "replace" ? " (replaced scope)" : "";
      onStatus(`Applied ${selected.length} variable${selected.length !== 1 ? "s" : ""}${deletedMsg}.`);
      setPreview(null);
      setText("");
      onApplied();
    } catch (e) {
      onStatus(`Apply failed: ${e}`);
    } finally {
      setApplying(false);
    }
  };

  const checkedCount = preview ? preview.filter((v) => checked[varKey(v)]).length : 0;
  const secretCount = preview ? preview.filter((v) => checked[varKey(v)] && isSecretVar(v.name)).length : 0;
  const noneChecked = checkedCount === 0;

  // Scopes affected by Replace, for the warning message
  const affectedScopes = preview
    ? [...new Set(preview.filter((v) => checked[varKey(v)]).map((v) => v.scope))]
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>Choose file…</Button>
        <SegmentedControl aria-label="Import format" options={formatOptions} value={format} onChange={setFormat} />
        <input ref={fileRef} type="file" accept=".json,.reg" className="hidden" onChange={handleFileChange} aria-label="Import file" />
      </div>

      <Textarea
        label="File contents"
        labelHidden
        value={text}
        onChange={(e) => { setText(e.target.value); setPreview(null); }}
        placeholder="…or paste file contents here"
        rows={5}
      />

      <Button variant="secondary" onClick={handleParse} disabled={parsing || !text.trim()} className="self-start">
        {parsing ? "Parsing…" : "Parse"}
      </Button>

      {preview && (
        <div className="flex flex-col gap-3">
          <SecretBanner count={secretCount} />

          <VarTable
            vars={preview}
            checked={checked}
            onToggle={(key) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }))}
            onToggleAll={(val) => setChecked(Object.fromEntries((preview ?? []).map((v) => [varKey(v), val])))}
          />

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted uppercase tracking-wide">Merge strategy</span>
            <SegmentedControl aria-label="Merge strategy" options={strategyOptions} value={strategy} onChange={setStrategy} />
            <p className="text-xs text-dim">
              {strategy === "merge"
                ? "Add and update selected variables. Variables not in this file are left unchanged."
                : "Make the selected scope(s) exactly match this file. Variables currently in the scope but not selected here will be deleted."}
            </p>
          </div>

          {strategy === "replace" && affectedScopes.length > 0 && (
            <div className="flex gap-2 px-3 py-2 rounded border border-danger/40 bg-danger/10 text-danger text-xs">
              <span className="shrink-0">⚠</span>
              <span>
                Replace will delete all <strong>{affectedScopes.join(" and ")}</strong> variables
                not present in your selection. This cannot be undone — consider creating a snapshot first.
              </span>
            </div>
          )}

          <Button
            variant={strategy === "replace" ? "danger" : "primary"}
            size="md"
            onClick={handleApply}
            disabled={applying || noneChecked}
            className="self-start"
          >
            {applying ? "Applying…" : `${strategy === "replace" ? "Replace" : "Apply"} ${checkedCount} selected variable${checkedCount !== 1 ? "s" : ""}`}
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel shell
// ---------------------------------------------------------------------------

interface Props {
  onApplied: () => void;
}

export function ImportExportPanel({ onApplied }: Props) {
  const [mode, setMode] = useState<Mode>("export");
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const modeOptions: { value: Mode; label: string }[] = [
    { value: "export", label: "Export" },
    { value: "import", label: "Import" },
  ];

  const handleStatus = (msg: string | null) => {
    if (msg === null) { setStatus(null); return; }
    const ok = !msg.toLowerCase().includes("fail") && !msg.toLowerCase().includes("error");
    setStatus({ ok, msg });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 py-4 border-b border-rim shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-semibold text-fg">Import / Export</h2>
          <div className="ml-auto">
            <SegmentedControl
              aria-label="Mode"
              options={modeOptions}
              value={mode}
              onChange={(m) => { setMode(m); setStatus(null); }}
            />
          </div>
        </div>
        {status && (
          <p className={cn("text-xs", status.ok ? "text-success" : "text-danger")}>{status.msg}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {mode === "export"
          ? <ExportTab onStatus={handleStatus} />
          : <ImportTab onApplied={onApplied} onStatus={handleStatus} />
        }
      </div>
    </div>
  );
}

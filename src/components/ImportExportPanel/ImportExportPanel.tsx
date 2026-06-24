import { useRef, useState } from "react";
import { api } from "../../api";
import { cn } from "../../lib/cn";
import type { EnvSnapshot, VarScope } from "../../types";
import { Button } from "../ui/Button";
import { SegmentedControl } from "../ui/SegmentedControl";
import { Textarea } from "../ui/Textarea";

type Mode = "export" | "import";
type ExportScope = "All" | "User" | "System";
type ExportFormat = "json" | "reg";

interface FlatVar {
  name: string;
  value: string;
  scope: VarScope;
}

function flattenSnapshot(snap: EnvSnapshot): FlatVar[] {
  return [
    ...Object.entries(snap.user).map(([name, value]) => ({ name, value, scope: "User" as const })),
    ...Object.entries(snap.system).map(([name, value]) => ({
      name,
      value,
      scope: "System" as const,
    })),
  ].sort((a, b) => a.name.localeCompare(b.name));
}

const scopeOptions: { value: ExportScope; label: string }[] = [
  { value: "All", label: "All" },
  { value: "User", label: "User" },
  { value: "System", label: "System" },
];

const formatOptions: { value: ExportFormat; label: string }[] = [
  { value: "json", label: ".json" },
  { value: "reg", label: ".reg" },
];

interface ExportTabProps {
  onStatus: (msg: string | null) => void;
}

function ExportTab({ onStatus }: ExportTabProps) {
  const [scope, setScope] = useState<ExportScope>("All");
  const [format, setFormat] = useState<ExportFormat>("json");
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    onStatus(null);
    try {
      const savedPath = await api.exportVars(scope, format);
      if (savedPath) {
        onStatus(`Saved to ${savedPath}`);
      } else {
        onStatus(null);
      }
    } catch (e) {
      onStatus(`Export failed: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted uppercase tracking-wide">Scope</span>
        <SegmentedControl
          aria-label="Export scope"
          options={scopeOptions}
          value={scope}
          onChange={setScope}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted uppercase tracking-wide">Format</span>
        <SegmentedControl
          aria-label="Export format"
          options={formatOptions}
          value={format}
          onChange={setFormat}
        />
        <p className="text-xs text-dim">
          {format === "json"
            ? "Envarly JSON — can be re-imported into Envarly."
            : "Windows Registry Editor format — double-click to merge into the registry directly."}
        </p>
      </div>

      <Button
        variant="primary"
        size="md"
        onClick={handleExport}
        disabled={busy}
        className="self-start"
      >
        {busy ? "Exporting…" : `Export ${scope} → .${format}`}
      </Button>
    </div>
  );
}

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
  const [parsing, setParsing] = useState(false);
  const [applying, setApplying] = useState(false);

  const varKey = (v: FlatVar) => `${v.scope}:${v.name}`;

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
    if (!content) {
      onStatus("Paste or upload a file first.");
      return;
    }
    setParsing(true);
    onStatus(null);
    try {
      const snap = await api.parseImport(content, format);
      const vars = flattenSnapshot(snap);
      if (vars.length === 0) {
        onStatus("No environment variables found in file.");
        setPreview(null);
        return;
      }
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
    if (selected.length === 0) {
      onStatus("No variables selected.");
      return;
    }
    setApplying(true);
    onStatus(null);
    try {
      for (const v of selected) {
        await api.setEnvVar(v.name, v.value, v.scope);
      }
      onStatus(`Applied ${selected.length} variable${selected.length !== 1 ? "s" : ""}.`);
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
  const allChecked = preview ? checkedCount === preview.length : false;
  const noneChecked = checkedCount === 0;

  const toggleAll = (val: boolean) => {
    if (!preview) return;
    setChecked(Object.fromEntries(preview.map((v) => [varKey(v), val])));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
          Choose file…
        </Button>
        <SegmentedControl
          aria-label="Import format"
          options={formatOptions}
          value={format}
          onChange={setFormat}
        />
        <input
          ref={fileRef}
          type="file"
          accept=".json,.reg"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Import file"
        />
      </div>

      <Textarea
        label="File contents"
        labelHidden
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setPreview(null);
        }}
        placeholder="…or paste file contents here"
        rows={5}
      />

      <Button
        variant="secondary"
        onClick={handleParse}
        disabled={parsing || !text.trim()}
        className="self-start"
      >
        {parsing ? "Parsing…" : "Parse"}
      </Button>

      {preview && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-xs text-muted">
            <span>
              {preview.length} variable{preview.length !== 1 ? "s" : ""} found
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleAll(true)}
              disabled={allChecked}
              className="px-1.5 py-0.5"
            >
              Select all
            </Button>
            <span className="text-dim">·</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleAll(false)}
              disabled={noneChecked}
              className="px-1.5 py-0.5"
            >
              Deselect all
            </Button>
          </div>

          <div className="rounded border border-rim overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-rim bg-surface text-muted uppercase text-[10px] tracking-wide">
                  <th className="w-8 px-2 py-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={(e) => toggleAll(e.target.checked)}
                      className="accent-accent"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-3 py-1.5 text-left">Name</th>
                  <th className="px-3 py-1.5 text-left">Scope</th>
                  <th className="px-3 py-1.5 text-left">Value</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((v) => (
                  <tr
                    key={varKey(v)}
                    onClick={() =>
                      setChecked((prev) => ({ ...prev, [varKey(v)]: !prev[varKey(v)] }))
                    }
                    className={cn(
                      "border-b border-rim-subtle last:border-0 cursor-pointer transition-colors",
                      checked[varKey(v)]
                        ? "bg-canvas hover:bg-hover"
                        : "bg-canvas opacity-40 hover:opacity-60",
                    )}
                  >
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={!!checked[varKey(v)]}
                        onChange={() =>
                          setChecked((prev) => ({ ...prev, [varKey(v)]: !prev[varKey(v)] }))
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="accent-accent"
                        aria-label={v.name}
                      />
                    </td>
                    <td className="px-3 py-1.5 font-mono font-semibold text-fg">{v.name}</td>
                    <td className="px-3 py-1.5 text-muted">{v.scope}</td>
                    <td className="px-3 py-1.5 font-mono text-muted truncate max-w-xs">
                      {v.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            variant="primary"
            onClick={handleApply}
            disabled={applying || noneChecked}
            className="self-start"
          >
            {applying
              ? "Applying…"
              : `Apply ${checkedCount} selected variable${checkedCount !== 1 ? "s" : ""}`}
          </Button>
        </div>
      )}
    </div>
  );
}

interface Props {
  onApplied: () => void;
}

export function ImportExportPanel({ onApplied }: Props) {
  const [mode, setMode] = useState<Mode>("export");
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleStatus = (msg: string | null) => {
    if (msg === null) {
      setStatus(null);
    } else {
      const ok = !msg.toLowerCase().includes("fail") && !msg.toLowerCase().includes("error");
      setStatus({ ok, msg });
    }
  };

  const modeOptions: { value: Mode; label: string }[] = [
    { value: "export", label: "Export" },
    { value: "import", label: "Import" },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 py-4 border-b border-rim shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-semibold text-fg">Import / Export</h2>
          <SegmentedControl
            aria-label="Mode"
            options={modeOptions}
            value={mode}
            onChange={(m) => {
              setMode(m);
              setStatus(null);
            }}
            className="ml-auto"
          />
        </div>

        {status && (
          <p className={cn("text-xs mb-3", status.ok ? "text-success" : "text-danger")}>
            {status.msg}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {mode === "export" ? (
          <ExportTab onStatus={handleStatus} />
        ) : (
          <ImportTab onApplied={onApplied} onStatus={handleStatus} />
        )}
      </div>
    </div>
  );
}

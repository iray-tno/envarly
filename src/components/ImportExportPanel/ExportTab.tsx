import { useEffect, useState } from "react";
import { api } from "../../api";
import { type SecretInfo, resolveSecret } from "../../lib/secrets";
import type { EnvVar } from "../../types";
import { Button } from "../ui/Button";
import { SegmentedControl } from "../ui/SegmentedControl";
import { SecretBanner, VarTable } from "./VarTable";
import { type ExportFormat, type ExportScope, type FlatVar, type IacFormat, formatOptions, scopeOptions, varKey } from "./types";

const IAC_FORMATS: { id: IacFormat; label: string; ext: string }[] = [
  { id: "ps1",     label: "PowerShell",  ext: ".ps1" },
  { id: "dsc_v2",  label: "DSC v2",      ext: ".ps1" },
  { id: "dsc_v3",  label: "DSC v3",      ext: ".dsc.yaml" },
  { id: "ansible", label: "Ansible",     ext: ".yml" },
];

function IacSection({ disabled, onExport }: { disabled: boolean; onExport: (fmt: IacFormat) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-rim-subtle pt-4 flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-fg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded self-start"
      >
        <span>{open ? "▾" : "▸"}</span>
        <span>Script / IaC formats</span>
      </button>
      {open && (
        <div className="flex flex-wrap gap-2 pl-3">
          {IAC_FORMATS.map(({ id, label, ext }) => (
            <Button
              key={id}
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={() => onExport(id)}
            >
              {label} <span className="text-dim font-normal">{ext}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ExportConfirmProps {
  secretServices: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

function ExportConfirm({ secretServices, onConfirm, onCancel }: ExportConfirmProps) {
  return (
    <div className="flex flex-col gap-3 p-3 rounded border border-warn/40 bg-warn/10">
      <p className="flex gap-2 text-warn text-xs">
        <span className="shrink-0">⚠</span>
        <span>
          {secretServices.join(", ")} credentials will be included in the exported file.
          Only export to destinations you trust.
        </span>
      </p>
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={onConfirm}>Export anyway</Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

interface ExportTabProps {
  onStatus: (msg: string | null) => void;
}

export function ExportTab({ onStatus }: ExportTabProps) {
  const [scope, setScope] = useState<ExportScope>("All");
  const [format, setFormat] = useState<ExportFormat>("json");
  const [busy, setBusy] = useState(false);
  const [allVars, setAllVars] = useState<FlatVar[] | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loadingVars, setLoadingVars] = useState(false);
  const [pendingExport, setPendingExport] = useState(false);
  const [pendingSecretServices, setPendingSecretServices] = useState<string[]>([]);
  const [checkingSecrets, setCheckingSecrets] = useState(false);

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
    setPendingExport(false);
    setPendingSecretServices([]);
    onStatus(null);
  };

  const selectedCustomVars = allVars?.filter((v) => checked[varKey(v)]) ?? [];
  const secretCount =
    scope === "Custom"
      ? selectedCustomVars.filter((v) => resolveSecret(v.name, v.value) !== null).length
      : 0;

  const doExport = async (fmt: string) => {
    setPendingExport(false);
    setBusy(true);
    onStatus(null);
    try {
      let savedPath: string | null;
      if (scope === "Custom") {
        savedPath = await api.exportCustomVars(selectedCustomVars, fmt);
      } else {
        savedPath = await api.exportVars(scope, fmt);
      }
      onStatus(savedPath ? `Saved to ${savedPath}` : null);
    } catch (e) {
      onStatus(`Export failed: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const [pendingFormat, setPendingFormat] = useState<string>(format);

  const handleExport = async (fmt: string) => {
    setPendingFormat(fmt);
    if (scope === "Custom") {
      if (secretCount > 0) {
        const services = [
          ...new Set(
            selectedCustomVars
              .map((v) => resolveSecret(v.name, v.value))
              .filter((s): s is SecretInfo => s !== null)
              .map((s) => s.service),
          ),
        ];
        setPendingSecretServices(services);
        setPendingExport(true);
      } else {
        void doExport(fmt);
      }
      return;
    }

    setCheckingSecrets(true);
    try {
      const vars: EnvVar[] = await api.getEnvVars();
      const flat = vars.filter((v) => scope === "All" || v.scope === scope);
      const services = [
        ...new Set(
          flat
            .map((v) => resolveSecret(v.name, v.value))
            .filter((s): s is SecretInfo => s !== null)
            .map((s) => s.service),
        ),
      ];
      if (services.length > 0) {
        setPendingSecretServices(services);
        setPendingExport(true);
      } else {
        void doExport(fmt);
      }
    } catch {
      void doExport(fmt);
    } finally {
      setCheckingSecrets(false);
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

      {pendingExport ? (
        <ExportConfirm
          secretServices={pendingSecretServices}
          onConfirm={() => void doExport(pendingFormat)}
          onCancel={() => { setPendingExport(false); setPendingSecretServices([]); }}
        />
      ) : (
        <Button
          variant="primary"
          size="md"
          onClick={() => void handleExport(format)}
          disabled={busy || !canExport || checkingSecrets}
          className="self-start"
        >
          {checkingSecrets ? "Checking…" : busy ? "Exporting…" : scope === "Custom" ? `Export ${selectedCustomVars.length} selected → .${format}` : `Export ${scope} → .${format}`}
        </Button>
      )}

      <IacSection
        disabled={busy || !canExport || checkingSecrets}
        onExport={(fmt) => void handleExport(fmt)}
      />
    </div>
  );
}

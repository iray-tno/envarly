import { useEffect, useState } from "react";
import { useI18n } from "../../hooks/useI18n";
import { api } from "../../api";
import { type SecretInfo, resolveSecret } from "../../lib/secrets";
import type { EnvVar } from "../../types";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { SegmentedControl } from "../ui/SegmentedControl";
import { SecretBanner, VarTable } from "./VarTable";
import { type AnyFormat, type ExportScope, type FlatVar, formatOptions, scopeOptions, varKey } from "./types";

const FORMAT_EXT: Record<AnyFormat, string> = {
  json:    ".json",
  reg:     ".reg",
  ps1:     ".ps1",
  dsc_v2:  ".ps1",
  dsc_v3:  ".dsc.yaml",
  ansible: ".yml",
};

const FORMAT_DESC: Record<AnyFormat, string> = {
  json:    "Envarly JSON — can be re-imported into Envarly.",
  reg:     "Windows Registry Editor format — double-click to merge into the registry directly.",
  ps1:     "PowerShell script — SetEnvironmentVariable calls.",
  dsc_v2:  "PowerShell DSC v2 — Configuration block using PSDscResources.",
  dsc_v3:  "DSC v3 YAML — Microsoft's cross-platform DSC format.",
  ansible: "Ansible playbook — win_environment tasks.",
};

interface ExportConfirmProps {
  secretServices: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

function ExportConfirm({ secretServices, onConfirm, onCancel }: ExportConfirmProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-3 p-3 rounded border border-warn/40 bg-warn/10">
      <p className="flex gap-2 text-warn text-xs">
        <Icon name="warning" size={14} className="mt-px" />
        <span>
          {t("export.secret_warning", { services: secretServices.join(", ") })}
        </span>
      </p>
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={onConfirm}>{t("export.export_anyway")}</Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>{t("export.cancel")}</Button>
      </div>
    </div>
  );
}

interface ExportTabProps {
  onStatus: (msg: string | null) => void;
}

export function ExportTab({ onStatus }: ExportTabProps) {
  const { t } = useI18n();
  const [scope, setScope] = useState<ExportScope>("All");
  const [format, setFormat] = useState<AnyFormat>("json");
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
      .catch(() => onStatus(t("export.failed_load")))
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

  const doExport = async () => {
    setPendingExport(false);
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
      onStatus(t("export.failed", { error: e }));
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
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
        void doExport();
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
        void doExport();
      }
    } catch {
      void doExport();
    } finally {
      setCheckingSecrets(false);
    }
  };

  const canExport = scope !== "Custom" || selectedCustomVars.length > 0;
  const ext = FORMAT_EXT[format];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted uppercase tracking-wide">{t("export.scope_label")}</span>
        <SegmentedControl aria-label="Export scope" options={scopeOptions} value={scope} onChange={handleScopeChange} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted uppercase tracking-wide">{t("export.format_label")}</span>
        <SegmentedControl aria-label="Export format" options={formatOptions} value={format} onChange={setFormat} className="flex-wrap" />
        <p className="text-xs text-dim">{FORMAT_DESC[format]}</p>
      </div>

      {scope === "Custom" && (
        <div className="flex flex-col gap-3">
          {loadingVars && <p className="text-xs text-dim">{t("export.loading")}</p>}
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
          onConfirm={() => void doExport()}
          onCancel={() => { setPendingExport(false); setPendingSecretServices([]); }}
        />
      ) : (
        <Button
          variant="primary"
          size="md"
          onClick={() => void handleExport()}
          disabled={busy || !canExport || checkingSecrets}
          className="self-start"
        >
          {checkingSecrets ? t("export.checking") : busy ? t("export.exporting") : scope === "Custom"
            ? t("export.custom_btn", { count: selectedCustomVars.length, ext })
            : t("export.scope_btn", { scope, ext })}
        </Button>
      )}
    </div>
  );
}

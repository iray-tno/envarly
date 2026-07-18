import type { EnvSnapshot, EnvValueKind, VarScope } from "../../types";

export type Mode = "export" | "import";
export type ExportScope = "All" | "User" | "System" | "Custom";
export type ExportFormat = "json" | "reg";
export type IacFormat = "ps1" | "dsc_v2" | "dsc_v3" | "ansible";
export type AnyFormat = ExportFormat | IacFormat;
export type MergeStrategy = "merge" | "replace";

export interface FlatVar {
  name: string;
  value: string;
  valueKind: EnvValueKind | null;
  scope: VarScope;
}

export function flattenSnapshot(snap: EnvSnapshot): FlatVar[] {
  const flatValue = (entry: EnvSnapshot["user"][string] | string) =>
    typeof entry === "string"
      ? { value: entry, valueKind: null }
      : {
          value: entry.value,
          valueKind: entry.kind,
        };
  return [
    ...Object.entries(snap.user).map(([name, entry]) => ({
      name,
      ...flatValue(entry),
      scope: "User" as const,
    })),
    ...Object.entries(snap.system).map(([name, entry]) => ({
      name,
      ...flatValue(entry),
      scope: "System" as const,
    })),
  ].sort((a, b) => a.name.localeCompare(b.name));
}

export function varKey(v: FlatVar) {
  return `${v.scope}:${v.name}`;
}

export const scopeOptions: { value: ExportScope; label: string }[] = [
  { value: "All", label: "All" },
  { value: "User", label: "User" },
  { value: "System", label: "System" },
  { value: "Custom", label: "Custom…" },
];

export const formatOptions: { value: AnyFormat; label: string }[] = [
  { value: "json", label: ".json" },
  { value: "reg", label: ".reg" },
  { value: "ps1", label: ".ps1" },
  { value: "dsc_v2", label: "DSC v2" },
  { value: "dsc_v3", label: "DSC v3" },
  { value: "ansible", label: "Ansible" },
];

export const formatExt: Record<AnyFormat, string> = {
  json: ".json",
  reg: ".reg",
  ps1: ".ps1",
  dsc_v2: ".ps1",
  dsc_v3: ".dsc.yaml",
  ansible: ".yml",
};

export const formatDescriptions: Record<AnyFormat, string> = {
  json: "Envarly JSON — can be re-imported into Envarly.",
  reg: "Windows Registry Editor format — double-click to merge into the registry directly.",
  ps1: "PowerShell script — SetEnvironmentVariable calls.",
  dsc_v2: "PowerShell DSC v2 — Configuration block using PSDscResources.",
  dsc_v3: "DSC v3 YAML — Microsoft's cross-platform DSC format.",
  ansible: "Ansible playbook — win_environment tasks.",
};

export const importFormatOptions: { value: ExportFormat; label: string }[] = [
  { value: "json", label: ".json" },
  { value: "reg", label: ".reg" },
];

export const strategyOptions: { value: MergeStrategy; label: string }[] = [
  { value: "merge", label: "Merge" },
  { value: "replace", label: "Replace" },
];

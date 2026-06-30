import type { EnvSnapshot, VarScope } from "../../types";

export type Mode = "export" | "import";
export type ExportScope = "All" | "User" | "System" | "Custom";
export type ExportFormat = "json" | "reg";
export type IacFormat = "ps1" | "dsc_v2" | "dsc_v3" | "ansible";
export type MergeStrategy = "merge" | "replace";

export interface FlatVar {
  name: string;
  value: string;
  scope: VarScope;
}

export function flattenSnapshot(snap: EnvSnapshot): FlatVar[] {
  return [
    ...Object.entries(snap.user).map(([name, value]) => ({ name, value, scope: "User" as const })),
    ...Object.entries(snap.system).map(([name, value]) => ({ name, value, scope: "System" as const })),
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

export const formatOptions: { value: ExportFormat; label: string }[] = [
  { value: "json", label: ".json" },
  { value: "reg", label: ".reg" },
];

export const strategyOptions: { value: MergeStrategy; label: string }[] = [
  { value: "merge", label: "Merge" },
  { value: "replace", label: "Replace" },
];

export type VarScope = "User" | "System";
export type EnvValueKind = "String" | "ExpandString";
export type EnvValueKindSelection = "Auto" | EnvValueKind;

export interface SnapshotValue {
  value: string;
  /** Null only when reading a legacy snapshot or JSON export. */
  kind: EnvValueKind | null;
}

export interface EnvVar {
  name: string;
  value: string;
  scope: VarScope;
  valueKind: EnvValueKind;
  /** ";" = PATH-style, "," = NO_PROXY-style, null = plain value */
  listSeparator: ";" | "," | null;
}

export interface UnsupportedEnvValue {
  name: string;
  scope: VarScope;
  registryType: string;
}

export interface EnvSnapshot {
  user: Record<string, SnapshotValue>;
  system: Record<string, SnapshotValue>;
}

export interface SnapshotMeta {
  version: number;
  id: string;
  createdAt: string;
  label: string;
  snapshot: EnvSnapshot;
}

export type EnvChange =
  | {
      changeType: "set";
      name: string;
      value: string;
      valueKind: EnvValueKind;
      scope: VarScope;
    }
  | {
      changeType: "delete";
      name: string;
      scope: VarScope;
    };

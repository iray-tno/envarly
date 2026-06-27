export type VarScope = 'User' | 'System';

export interface EnvVar {
  name: string;
  value: string;
  scope: VarScope;
  /** ";" = PATH-style, "," = NO_PROXY-style, null = plain value */
  listSeparator: ";" | "," | null;
}

export interface EnvSnapshot {
  user: Record<string, string>;
  system: Record<string, string>;
}

export interface SnapshotMeta {
  id: string;
  createdAt: string;
  label: string;
  snapshot: EnvSnapshot;
}

export type VarScope = 'User' | 'System';

export interface EnvVar {
  name: string;
  value: string;
  scope: VarScope;
  isPathLike: boolean;
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

import { invoke } from '@tauri-apps/api/core';
import type { EnvVar, VarScope, SnapshotMeta } from './types';

export const api = {
  getEnvVars: () =>
    invoke<EnvVar[]>('get_env_vars'),

  setEnvVar: (name: string, value: string, scope: VarScope) =>
    invoke<void>('set_env_var', { name, value, scope }),

  deleteEnvVar: (name: string, scope: VarScope) =>
    invoke<void>('delete_env_var', { name, scope }),

  createSnapshot: (label: string) =>
    invoke<SnapshotMeta>('create_snapshot', { label }),

  listSnapshots: () =>
    invoke<SnapshotMeta[]>('list_snapshots'),

  deleteSnapshot: (id: string) =>
    invoke<void>('delete_snapshot', { id }),

  restoreSnapshot: (id: string) =>
    invoke<void>('restore_snapshot', { id }),

  validatePaths: (paths: string[]) =>
    invoke<boolean[]>('validate_paths', { paths }),
};

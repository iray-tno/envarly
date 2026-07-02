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

  getRegistrySnapshot: () =>
    invoke<import('./types').EnvSnapshot>('get_registry_snapshot'),

  /** True when the process has write access to HKLM (elevated / admin). */
  isElevated: () => invoke<boolean>('is_elevated'),

  /** Spawn a new elevated instance via UAC and exit this process. */
  restartAsAdmin: () => invoke<void>('restart_as_admin'),

  /** Opens a native save dialog, writes the file, and returns the saved path (null = cancelled). */
  exportVars: (scope: 'All' | 'User' | 'System', format: string) =>
    invoke<string | null>('export_vars', { scope, format }),

  /** Export a hand-picked list of variables. Values come from the frontend. */
  exportCustomVars: (vars: { name: string; value: string; scope: string }[], format: string) =>
    invoke<string | null>('export_custom', { vars, format }),

  /** Parses file content and returns a snapshot. Does NOT write to the registry. */
  parseImport: (content: string, format: 'json' | 'reg') =>
    invoke<import('./types').EnvSnapshot>('parse_import', { content, format }),

  /** Returns whether the Envarly install directory is currently in User/System PATH. */
  getPathStatus: () =>
    invoke<{ installDir: string; userHasEntry: boolean; systemHasEntry: boolean }>('get_path_status'),

  /** Returns proposed new PATH value with Envarly added, or null if already present. */
  getPathProposal: (scope: 'User' | 'System') =>
    invoke<string | null>('get_path_proposal', { scope }),
};

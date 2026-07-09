import { invoke } from "@tauri-apps/api/core";
import { createDemoApi, loadDemoFixture } from "./demo/createDemoApi";
import type {
  EnvChange,
  EnvSnapshot,
  EnvValueKind,
  EnvVar,
  SnapshotMeta,
  UnsupportedEnvValue,
  VarScope,
} from "./types";

export interface LaunchOptions {
  demo: boolean;
  demoFixture: string | null;
}

export interface EnvarlyApi {
  getLaunchOptions: () => Promise<LaunchOptions>;
  getEnvVars: () => Promise<EnvVar[]>;
  getUnsupportedEnvValues: () => Promise<UnsupportedEnvValue[]>;
  setEnvVar: (
    name: string,
    value: string,
    valueKind: EnvValueKind,
    scope: VarScope,
  ) => Promise<void>;
  deleteEnvVar: (name: string, scope: VarScope) => Promise<void>;
  applyEnvChanges: (changes: EnvChange[]) => Promise<void>;
  createSnapshot: (label: string) => Promise<SnapshotMeta>;
  listSnapshots: () => Promise<SnapshotMeta[]>;
  deleteSnapshot: (id: string) => Promise<void>;
  validatePaths: (paths: string[]) => Promise<boolean[]>;
  getRegistrySnapshot: () => Promise<EnvSnapshot>;
  isElevated: () => Promise<boolean>;
  restartAsAdmin: () => Promise<void>;
  exportVars: (scope: "All" | "User" | "System", format: string) => Promise<string | null>;
  exportCustomVars: (
    vars: { name: string; value: string; valueKind: EnvValueKind; scope: string }[],
    format: string,
  ) => Promise<string | null>;
  parseImport: (content: string, format: "json" | "reg") => Promise<EnvSnapshot>;
  getPathStatus: () => Promise<{
    installDir: string;
    userHasEntry: boolean;
    systemHasEntry: boolean;
  }>;
  getPathProposal: (scope: "User" | "System") => Promise<string | null>;
}

const normalApi: EnvarlyApi = {
  getLaunchOptions: () => invoke<LaunchOptions>("get_launch_options"),
  getEnvVars: () => invoke<EnvVar[]>("get_env_vars"),
  getUnsupportedEnvValues: () => invoke<UnsupportedEnvValue[]>("get_unsupported_env_values"),
  setEnvVar: (name, value, valueKind, scope) =>
    invoke<void>("set_env_var", { name, value, valueKind, scope }),
  deleteEnvVar: (name, scope) => invoke<void>("delete_env_var", { name, scope }),
  applyEnvChanges: (changes) => invoke<void>("apply_env_changes", { changes }),
  createSnapshot: (label) => invoke<SnapshotMeta>("create_snapshot", { label }),
  listSnapshots: () => invoke<SnapshotMeta[]>("list_snapshots"),
  deleteSnapshot: (id) => invoke<void>("delete_snapshot", { id }),
  validatePaths: (paths) => invoke<boolean[]>("validate_paths", { paths }),
  getRegistrySnapshot: () => invoke<EnvSnapshot>("get_registry_snapshot"),
  isElevated: () => invoke<boolean>("is_elevated"),
  restartAsAdmin: () => invoke<void>("restart_as_admin"),
  exportVars: (scope, format) => invoke<string | null>("export_vars", { scope, format }),
  exportCustomVars: (vars, format) => invoke<string | null>("export_custom", { vars, format }),
  parseImport: (content, format) => invoke<EnvSnapshot>("parse_import", { content, format }),
  getPathStatus: () =>
    invoke<{ installDir: string; userHasEntry: boolean; systemHasEntry: boolean }>(
      "get_path_status",
    ),
  getPathProposal: (scope) => invoke<string | null>("get_path_proposal", { scope }),
};

let apiPromise: Promise<EnvarlyApi> | null = null;

async function getApi(): Promise<EnvarlyApi> {
  if (!apiPromise) {
    apiPromise = normalApi
      .getLaunchOptions()
      .catch(() => ({ demo: false, demoFixture: null }))
      .then(async (options) => {
        if (!options.demo) return normalApi;
        return createDemoApi(options, await loadDemoFixture(options), normalApi);
      });
  }
  return apiPromise;
}

export const api: EnvarlyApi = {
  getLaunchOptions: async () => (await getApi()).getLaunchOptions(),
  getEnvVars: async () => (await getApi()).getEnvVars(),
  getUnsupportedEnvValues: async () => (await getApi()).getUnsupportedEnvValues(),
  setEnvVar: async (name, value, valueKind, scope) =>
    (await getApi()).setEnvVar(name, value, valueKind, scope),
  deleteEnvVar: async (name, scope) => (await getApi()).deleteEnvVar(name, scope),
  applyEnvChanges: async (changes) => (await getApi()).applyEnvChanges(changes),
  createSnapshot: async (label) => (await getApi()).createSnapshot(label),
  listSnapshots: async () => (await getApi()).listSnapshots(),
  deleteSnapshot: async (id) => (await getApi()).deleteSnapshot(id),
  validatePaths: async (paths) => (await getApi()).validatePaths(paths),
  getRegistrySnapshot: async () => (await getApi()).getRegistrySnapshot(),
  isElevated: async () => (await getApi()).isElevated(),
  restartAsAdmin: async () => (await getApi()).restartAsAdmin(),
  exportVars: async (scope, format) => (await getApi()).exportVars(scope, format),
  exportCustomVars: async (vars, format) => (await getApi()).exportCustomVars(vars, format),
  parseImport: async (content, format) => (await getApi()).parseImport(content, format),
  getPathStatus: async () => (await getApi()).getPathStatus(),
  getPathProposal: async (scope) => (await getApi()).getPathProposal(scope),
};

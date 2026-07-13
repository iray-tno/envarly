import { invoke } from "@tauri-apps/api/core";
import type { EnvarlyApi, LaunchOptions } from "../api";
import { inferEnvValueKind } from "../lib/envValueKind";
import type { EnvSnapshot, EnvVar, SnapshotMeta, SnapshotValue, VarScope } from "../types";
import bundledFixture from "./envarly-demo.json";

interface DemoFixture {
  elevated: boolean;
  installDir: string;
  pathStatus: {
    userHasEntry: boolean;
    systemHasEntry: boolean;
  };
  pathExists: Record<string, boolean>;
  baseline?: EnvSnapshot;
  current: EnvSnapshot;
  snapshots: SnapshotMeta[];
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function inferListSeparator(name: string, value: string): ";" | "," | null {
  const upper = name.toUpperCase();
  if (upper === "PATH" || upper === "PATHEXT") return ";";
  if (upper === "NO_PROXY" || upper === "NOPROXY") return ",";
  if (value.includes(";") && value.split(";").some((part) => part.includes("\\"))) return ";";
  return null;
}

function snapshotToVars(snapshot: EnvSnapshot): EnvVar[] {
  return (["User", "System"] as const).flatMap((scope) => {
    const entries = scope === "User" ? snapshot.user : snapshot.system;
    return Object.entries(entries).map(([name, entry]) => ({
      name,
      value: entry.value,
      scope,
      valueKind: entry.kind ?? inferEnvValueKind(entry.value),
      listSeparator: inferListSeparator(name, entry.value),
    }));
  });
}

function scopedRecord(snapshot: EnvSnapshot, scope: VarScope) {
  return scope === "User" ? snapshot.user : snapshot.system;
}

function normalizeValues(values: Record<string, string | SnapshotValue> = {}) {
  return Object.fromEntries(
    Object.entries(values).map(([name, entry]) => [
      name,
      typeof entry === "string" ? { value: entry, kind: null } : entry,
    ]),
  );
}

function normalizeSnapshot(snapshot: {
  user?: Record<string, string | SnapshotValue>;
  system?: Record<string, string | SnapshotValue>;
}): EnvSnapshot {
  return {
    user: normalizeValues(snapshot.user),
    system: normalizeValues(snapshot.system),
  };
}

export async function loadDemoFixture(options: LaunchOptions): Promise<DemoFixture> {
  const load = (raw: unknown) => {
    const fixture = clone(raw) as Omit<DemoFixture, "current" | "baseline" | "snapshots"> & {
      current: Parameters<typeof normalizeSnapshot>[0];
      baseline?: Parameters<typeof normalizeSnapshot>[0];
      snapshots: Array<
        Omit<SnapshotMeta, "snapshot" | "version"> & {
          version?: number;
          snapshot: Parameters<typeof normalizeSnapshot>[0];
        }
      >;
    };
    return {
      ...fixture,
      current: normalizeSnapshot(fixture.current),
      baseline: fixture.baseline ? normalizeSnapshot(fixture.baseline) : undefined,
      snapshots: fixture.snapshots.map((snapshot) => ({
        ...snapshot,
        version: snapshot.version ?? 1,
        snapshot: normalizeSnapshot(snapshot.snapshot),
      })),
    };
  };
  if (!options.demoFixture) return load(bundledFixture);
  const content = await invoke<string>("read_demo_fixture", { path: options.demoFixture });
  return load(JSON.parse(content));
}

export function createDemoApi(
  options: LaunchOptions,
  fixture: DemoFixture,
  fallbackApi: EnvarlyApi,
): EnvarlyApi {
  const current = clone(fixture.current);
  let snapshots = clone(fixture.snapshots);
  let pendingBaseline = fixture.baseline ? clone(fixture.baseline) : null;

  const snapshot = () => clone(current);

  return {
    getLaunchOptions: async () => options,
    getEnvVars: async () => snapshotToVars(current),
    getUnsupportedEnvValues: async () => [],
    setEnvVar: async (name, value, valueKind, scope) => {
      scopedRecord(current, scope)[name] = { value, kind: valueKind };
    },
    deleteEnvVar: async (name, scope) => {
      delete scopedRecord(current, scope)[name];
    },
    applyEnvChanges: async (changes) => {
      for (const change of changes) {
        if (change.changeType === "delete") {
          delete scopedRecord(current, change.scope)[change.name];
        } else {
          scopedRecord(current, change.scope)[change.name] = {
            value: change.value,
            kind: change.valueKind,
          };
        }
      }
    },
    createSnapshot: async (label) => {
      const created: SnapshotMeta = {
        version: 2,
        id: `demo-${Date.now()}`,
        createdAt: new Date().toISOString(),
        label,
        snapshot: snapshot(),
      };
      snapshots = [created, ...snapshots];
      return clone(created);
    },
    listSnapshots: async () => clone(snapshots),
    renameSnapshot: async (id, label) => {
      const snapshotToRename = snapshots.find((snap) => snap.id === id);
      if (!snapshotToRename) throw new Error(`Snapshot not found: ${id}`);
      const nextLabel = label.trim();
      if (!nextLabel) throw new Error("Snapshot name cannot be empty");
      snapshotToRename.label = nextLabel;
      return clone(snapshotToRename);
    },
    deleteSnapshot: async (id) => {
      snapshots = snapshots.filter((snap) => snap.id !== id);
    },
    validatePaths: async (paths) =>
      paths.map((path) => {
        const normalized = path.trim();
        if (normalized in fixture.pathExists) return fixture.pathExists[normalized];
        return (
          !normalized.toLowerCase().includes("missing") &&
          !normalized.toLowerCase().includes("oldtools")
        );
      }),
    getRegistrySnapshot: async () => {
      if (pendingBaseline) {
        const baseline = pendingBaseline;
        pendingBaseline = null;
        return baseline;
      }
      return snapshot();
    },
    isElevated: async () => fixture.elevated,
    restartAsAdmin: async () => undefined,
    exportVars: async (_scope, format) =>
      `C:\\Users\\Demo\\Downloads\\envarly-demo.${format === "reg" ? "reg" : "json"}`,
    exportCustomVars: async (_vars, format) =>
      `C:\\Users\\Demo\\Downloads\\envarly-demo-custom.${format === "reg" ? "reg" : "json"}`,
    parseImport: async (content, format) => {
      if (format !== "json") {
        return fallbackApi.parseImport(content, format);
      }
      return normalizeSnapshot(JSON.parse(content));
    },
    getPathStatus: async () => ({
      installDir: fixture.installDir,
      userHasEntry: fixture.pathStatus.userHasEntry,
      systemHasEntry: fixture.pathStatus.systemHasEntry,
    }),
    getPathProposal: async (scope) => {
      const path = scopedRecord(current, scope).Path?.value ?? "";
      const entries = path.split(";").filter(Boolean);
      if (entries.some((entry) => entry.toLowerCase() === fixture.installDir.toLowerCase())) {
        return null;
      }
      return [fixture.installDir, ...entries].join(";");
    },
  };
}

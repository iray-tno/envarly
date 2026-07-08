import { invoke } from "@tauri-apps/api/core";
import bundledFixture from "./envarly-demo.json";
import type { EnvarlyApi, LaunchOptions } from "../api";
import type { EnvSnapshot, EnvVar, SnapshotMeta, VarScope } from "../types";

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
    return Object.entries(entries).map(([name, value]) => ({
      name,
      value,
      scope,
      listSeparator: inferListSeparator(name, value),
    }));
  });
}

function scopedRecord(snapshot: EnvSnapshot, scope: VarScope) {
  return scope === "User" ? snapshot.user : snapshot.system;
}

function parseJsonSnapshot(content: string): EnvSnapshot {
  const parsed = JSON.parse(content) as Partial<EnvSnapshot>;
  return {
    user: parsed.user ?? {},
    system: parsed.system ?? {},
  };
}

export async function loadDemoFixture(options: LaunchOptions): Promise<DemoFixture> {
  if (!options.demoFixture) return clone(bundledFixture as unknown as DemoFixture);
  const content = await invoke<string>("read_demo_fixture", { path: options.demoFixture });
  return JSON.parse(content) as DemoFixture;
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
    setEnvVar: async (name, value, scope) => {
      scopedRecord(current, scope)[name] = value;
    },
    deleteEnvVar: async (name, scope) => {
      delete scopedRecord(current, scope)[name];
    },
    createSnapshot: async (label) => {
      const created: SnapshotMeta = {
        id: `demo-${Date.now()}`,
        createdAt: new Date().toISOString(),
        label,
        snapshot: snapshot(),
      };
      snapshots = [created, ...snapshots];
      return clone(created);
    },
    listSnapshots: async () => clone(snapshots),
    deleteSnapshot: async (id) => {
      snapshots = snapshots.filter((snap) => snap.id !== id);
    },
    validatePaths: async (paths) =>
      paths.map((path) => {
        const normalized = path.trim();
        if (normalized in fixture.pathExists) return fixture.pathExists[normalized];
        return !normalized.toLowerCase().includes("missing") && !normalized.toLowerCase().includes("oldtools");
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
    exportVars: async (_scope, format) => `C:\\Users\\Demo\\Downloads\\envarly-demo.${format === "reg" ? "reg" : "json"}`,
    exportCustomVars: async (_vars, format) =>
      `C:\\Users\\Demo\\Downloads\\envarly-demo-custom.${format === "reg" ? "reg" : "json"}`,
    parseImport: async (content, format) => {
      if (format !== "json") {
        return fallbackApi.parseImport(content, format);
      }
      return parseJsonSnapshot(content);
    },
    getPathStatus: async () => ({
      installDir: fixture.installDir,
      userHasEntry: fixture.pathStatus.userHasEntry,
      systemHasEntry: fixture.pathStatus.systemHasEntry,
    }),
    getPathProposal: async (scope) => {
      const path = scopedRecord(current, scope).Path ?? "";
      const entries = path.split(";").filter(Boolean);
      if (entries.some((entry) => entry.toLowerCase() === fixture.installDir.toLowerCase())) {
        return null;
      }
      return [fixture.installDir, ...entries].join(";");
    },
  };
}

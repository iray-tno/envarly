import type { EnvSnapshot, VarScope } from "../types";

export type DiffKind = "added" | "removed" | "changed";

interface DiffEntryBase {
  name: string;
  scope: VarScope;
}

export type DiffEntry =
  | (DiffEntryBase & { kind: "added"; value: string })
  | (DiffEntryBase & { kind: "removed"; value: string })
  | (DiffEntryBase & { kind: "changed"; oldValue: string; newValue: string });

/** Compare two snapshots and return a sorted list of differences. */
export function computeDiff(baseline: EnvSnapshot, current: EnvSnapshot): DiffEntry[] {
  const entries: DiffEntry[] = [];

  for (const scope of ["User", "System"] as const) {
    const old = scope === "User" ? baseline.user : baseline.system;
    const cur = scope === "User" ? current.user : current.system;

    for (const name of Object.keys(cur)) {
      if (!(name in old)) {
        entries.push({ kind: "added", name, scope, value: cur[name] });
      }
    }
    for (const name of Object.keys(old)) {
      if (!(name in cur)) {
        entries.push({ kind: "removed", name, scope, value: old[name] });
      }
    }
    for (const name of Object.keys(old)) {
      if (name in cur && old[name] !== cur[name]) {
        entries.push({ kind: "changed", name, scope, oldValue: old[name], newValue: cur[name] });
      }
    }
  }

  return entries.sort((a, b) => a.scope.localeCompare(b.scope) || a.name.localeCompare(b.name));
}

/** True when two snapshots are identical. */
export function snapshotsEqual(a: EnvSnapshot, b: EnvSnapshot): boolean {
  return computeDiff(a, b).length === 0;
}

/**
 * Build a new baseline by merging accepted external changes into baseline.
 * Reverted entries are NOT merged — they stay as they were in baseline,
 * and the caller is responsible for writing them back to the registry.
 */
export function applyAccepted(baseline: EnvSnapshot, accepted: DiffEntry[]): EnvSnapshot {
  const user = { ...baseline.user };
  const system = { ...baseline.system };

  for (const entry of accepted) {
    const target = entry.scope === "User" ? user : system;
    if (entry.kind === "added") {
      target[entry.name] = entry.value;
    } else if (entry.kind === "removed") {
      delete target[entry.name];
    } else {
      target[entry.name] = entry.newValue;
    }
  }

  return { user, system };
}

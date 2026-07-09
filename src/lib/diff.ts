import type { EnvSnapshot, EnvValueKind, SnapshotValue, VarScope } from "../types";

export type DiffKind = "added" | "removed" | "changed";

interface DiffEntryBase {
  name: string;
  scope: VarScope;
}

export type DiffEntry =
  | (DiffEntryBase & { kind: "added"; value: string; valueKind: EnvValueKind | null })
  | (DiffEntryBase & { kind: "removed"; value: string; valueKind: EnvValueKind | null })
  | (DiffEntryBase & {
      kind: "changed";
      oldValue: string;
      oldValueKind: EnvValueKind | null;
      newValue: string;
      newValueKind: EnvValueKind | null;
    });

function valuesEqual(a: SnapshotValue, b: SnapshotValue) {
  return (
    snapshotValue(a).value === snapshotValue(b).value &&
    snapshotValue(a).kind === snapshotValue(b).kind
  );
}

function snapshotValue(value: SnapshotValue | string): SnapshotValue {
  return typeof value === "string" ? { value, kind: null } : value;
}

/** Compare two snapshots and return a sorted list of differences. */
export function computeDiff(baseline: EnvSnapshot, current: EnvSnapshot): DiffEntry[] {
  const entries: DiffEntry[] = [];

  for (const scope of ["User", "System"] as const) {
    const old = scope === "User" ? baseline.user : baseline.system;
    const cur = scope === "User" ? current.user : current.system;

    for (const name of Object.keys(cur)) {
      if (!(name in old)) {
        const value = snapshotValue(cur[name]);
        entries.push({
          kind: "added",
          name,
          scope,
          value: value.value,
          valueKind: value.kind,
        });
      }
    }
    for (const name of Object.keys(old)) {
      if (!(name in cur)) {
        const value = snapshotValue(old[name]);
        entries.push({
          kind: "removed",
          name,
          scope,
          value: value.value,
          valueKind: value.kind,
        });
      }
    }
    for (const name of Object.keys(old)) {
      if (name in cur && !valuesEqual(old[name], cur[name])) {
        const oldValue = snapshotValue(old[name]);
        const newValue = snapshotValue(cur[name]);
        entries.push({
          kind: "changed",
          name,
          scope,
          oldValue: oldValue.value,
          oldValueKind: oldValue.kind,
          newValue: newValue.value,
          newValueKind: newValue.kind,
        });
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
      target[entry.name] = { value: entry.value, kind: entry.valueKind };
    } else if (entry.kind === "removed") {
      delete target[entry.name];
    } else {
      target[entry.name] = { value: entry.newValue, kind: entry.newValueKind };
    }
  }

  return { user, system };
}

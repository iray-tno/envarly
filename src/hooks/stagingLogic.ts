import { inferEnvValueKind, resolveEnvValueKind } from "../lib/envValueKind";
import type {
  EnvSnapshot,
  EnvValueKind,
  EnvValueKindSelection,
  EnvVar,
  SnapshotValue,
  VarScope,
} from "../types";

export type StagedKind = "set" | "delete";

interface StagedChangeBase {
  name: string;
  scope: VarScope;
}

export type StagedChange =
  /** Value currently in the registry; null if this is a brand-new variable. */
  | (StagedChangeBase & {
      kind: "set";
      originalValue: string | null;
      originalValueKind: EnvValueKind | null;
      newValue: string;
      newValueKind: EnvValueKind;
    })
  | (StagedChangeBase & {
      kind: "delete";
      originalValue: string;
      originalValueKind: EnvValueKind;
      newValue: null;
    });

export type StagedKey = string; // `${VarScope}:${name}`

type RegistryByKey = Map<StagedKey, EnvVar>;
type StagedMap = Map<StagedKey, StagedChange>;

export function stagedKey(name: string, scope: VarScope): StagedKey {
  return `${scope}:${name}`;
}

function inferListSeparator(name: string, value: string): ";" | "," | null {
  const upper = name.toUpperCase();
  if (upper === "PATH" || upper === "PATHEXT") return ";";
  if (upper === "NO_PROXY" || upper === "NOPROXY") return ",";
  if (value.includes(";") && value.split(";").some((p) => p.includes("\\"))) return ";";
  return null;
}

/** Compute the staged map after setting a value for one variable. */
export function computeStageSet(
  registryByKey: RegistryByKey,
  prev: StagedMap,
  name: string,
  scope: VarScope,
  newValue: string,
  valueKindSelection: EnvValueKindSelection = "Auto",
): StagedMap {
  const k = stagedKey(name, scope);
  const registryValue = registryByKey.get(k);
  const original = registryValue?.value ?? null;
  const originalValueKind = registryValue
    ? (registryValue.valueKind ?? inferEnvValueKind(registryValue.value))
    : null;
  const newValueKind = resolveEnvValueKind(
    valueKindSelection,
    newValue,
    originalValueKind ?? undefined,
  );
  const next = new Map(prev);
  if (original === newValue && originalValueKind === newValueKind) {
    next.delete(k);
  } else {
    next.set(k, {
      kind: "set",
      name,
      scope,
      originalValue: original,
      originalValueKind,
      newValue,
      newValueKind,
    });
  }
  return next;
}

/** Compute the staged map after deleting one variable. Returns `prev` unchanged if there's nothing to delete. */
export function computeStageDelete(
  registryByKey: RegistryByKey,
  prev: StagedMap,
  name: string,
  scope: VarScope,
): StagedMap {
  const k = stagedKey(name, scope);
  const registryValue = registryByKey.get(k);
  const original = registryValue?.value ?? null;
  const originalValueKind = registryValue
    ? (registryValue.valueKind ?? inferEnvValueKind(registryValue.value))
    : undefined;
  if (original === null || !originalValueKind) return prev;
  const next = new Map(prev);
  next.set(k, {
    kind: "delete",
    name,
    scope,
    originalValue: original,
    originalValueKind,
    newValue: null,
  });
  return next;
}

/** Compute the staged map after importing a batch of sets/deletes. */
export function computeStageImport(
  registryByKey: RegistryByKey,
  prev: StagedMap,
  sets: Array<{ name: string; scope: VarScope; value: string; valueKind: EnvValueKind | null }>,
  deletes: Array<{ name: string; scope: VarScope }> = [],
): StagedMap {
  const next = new Map(prev);
  for (const v of sets) {
    const k = stagedKey(v.name, v.scope);
    const registryValue = registryByKey.get(k);
    const original = registryValue?.value ?? null;
    const originalValueKind = registryValue
      ? (registryValue.valueKind ?? inferEnvValueKind(registryValue.value))
      : null;
    const newValueKind = v.valueKind ?? originalValueKind ?? inferEnvValueKind(v.value);
    if (original === v.value && originalValueKind === newValueKind) {
      next.delete(k);
    } else {
      next.set(k, {
        kind: "set",
        name: v.name,
        scope: v.scope,
        originalValue: original,
        originalValueKind,
        newValue: v.value,
        newValueKind,
      });
    }
  }
  for (const d of deletes) {
    const k = stagedKey(d.name, d.scope);
    const registryValue = registryByKey.get(k);
    const original = registryValue?.value ?? null;
    if (original !== null && registryValue) {
      next.set(k, {
        kind: "delete",
        name: d.name,
        scope: d.scope,
        originalValue: original,
        originalValueKind: registryValue.valueKind ?? inferEnvValueKind(registryValue.value),
        newValue: null,
      });
    }
  }
  return next;
}

/** Compute the staged map needed to make the registry match a snapshot. */
export function computeStageSnapshot(
  registryByKey: RegistryByKey,
  registryVars: EnvVar[],
  prev: StagedMap,
  snap: EnvSnapshot,
): StagedMap {
  const next = new Map(prev);

  const stageValue = (name: string, scope: VarScope, value: SnapshotValue) => {
    const k = stagedKey(name, scope);
    const registryValue = registryByKey.get(stagedKey(name, scope));
    const original = registryValue?.value ?? null;
    const originalValueKind = registryValue
      ? (registryValue.valueKind ?? inferEnvValueKind(registryValue.value))
      : null;
    const snapshotValue = typeof value === "string" ? { value, kind: null } : value;
    const newValueKind =
      snapshotValue.kind ?? originalValueKind ?? inferEnvValueKind(snapshotValue.value);
    if (original === snapshotValue.value && originalValueKind === newValueKind) {
      next.delete(k);
    } else {
      next.set(stagedKey(name, scope), {
        kind: "set",
        name,
        scope,
        originalValue: original,
        originalValueKind,
        newValue: snapshotValue.value,
        newValueKind,
      });
    }
  };
  for (const [name, value] of Object.entries(snap.user)) {
    stageValue(name, "User", value);
  }
  for (const [name, value] of Object.entries(snap.system)) {
    stageValue(name, "System", value);
  }

  // Stage deletes for registry vars not present in the snapshot
  for (const v of registryVars) {
    const inSnap = v.scope === "User" ? snap.user : snap.system;
    if (!(v.name in inSnap)) {
      const k = stagedKey(v.name, v.scope);
      next.set(k, {
        kind: "delete",
        name: v.name,
        scope: v.scope,
        originalValue: v.value,
        originalValueKind: v.valueKind ?? inferEnvValueKind(v.value),
        newValue: null,
      });
    }
  }
  return next;
}

/**
 * Effective var list: registry vars merged with staged changes.
 * Staged-deleted vars remain visible so the sidebar can show a D marker
 * and the user can unstage the deletion.
 */
export function computeEffectiveVars(registryVars: EnvVar[], staged: StagedMap): EnvVar[] {
  const result = new Map<string, EnvVar>(registryVars.map((v) => [stagedKey(v.name, v.scope), v]));
  for (const [k, change] of staged) {
    if (change.kind === "set") {
      const existing = result.get(k);
      result.set(k, {
        name: change.name,
        scope: change.scope,
        value: change.newValue,
        valueKind: change.newValueKind,
        listSeparator: existing?.listSeparator ?? inferListSeparator(change.name, change.newValue),
      });
    }
    // "delete": var stays in result with original value; sidebar renders D marker
  }
  return Array.from(result.values()).sort(
    (a, b) => a.scope.localeCompare(b.scope) || a.name.localeCompare(b.name),
  );
}

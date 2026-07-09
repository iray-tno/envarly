import { useCallback, useMemo, useState } from "react";
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

type StagedKey = string; // `${VarScope}:${name}`

function inferListSeparator(name: string, value: string): ";" | "," | null {
  const upper = name.toUpperCase();
  if (upper === "PATH" || upper === "PATHEXT") return ";";
  if (upper === "NO_PROXY" || upper === "NOPROXY") return ",";
  if (value.includes(";") && value.split(";").some((p) => p.includes("\\"))) return ";";
  return null;
}

export function stagedKey(name: string, scope: VarScope): StagedKey {
  return `${scope}:${name}`;
}

export function useStaged(registryVars: EnvVar[]) {
  const [staged, setStaged] = useState<Map<StagedKey, StagedChange>>(new Map());

  const registryByKey = useMemo(
    () => new Map(registryVars.map((v) => [stagedKey(v.name, v.scope), v])),
    [registryVars],
  );

  /** Stage a value change for a single variable. */
  const stageSet = useCallback(
    (
      name: string,
      scope: VarScope,
      newValue: string,
      valueKindSelection: EnvValueKindSelection = "Auto",
    ) => {
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
      setStaged((prev) => {
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
      });
    },
    [registryByKey],
  );

  /** Stage a deletion for a single variable. */
  const stageDelete = useCallback(
    (name: string, scope: VarScope) => {
      const k = stagedKey(name, scope);
      const original = registryByKey.get(k)?.value ?? null;
      const originalValueKind = registryByKey.get(k)
        ? (registryByKey.get(k)?.valueKind ?? inferEnvValueKind(registryByKey.get(k)?.value ?? ""))
        : undefined;
      if (original === null || !originalValueKind) return;
      setStaged((prev) => {
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
      });
    },
    [registryByKey],
  );

  /** Stage a batch of changes from Import (with optional deletions for Replace strategy). */
  const stageImport = useCallback(
    (
      sets: Array<{
        name: string;
        scope: VarScope;
        value: string;
        valueKind: EnvValueKind | null;
      }>,
      deletes: Array<{ name: string; scope: VarScope }> = [],
    ) => {
      setStaged((prev) => {
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
      });
    },
    [registryByKey],
  );

  /** Stage all changes needed to make the registry match a snapshot. */
  const stageSnapshot = useCallback(
    (snap: EnvSnapshot) => {
      setStaged((prev) => {
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
      });
    },
    [registryByKey, registryVars],
  );

  /** Remove a single staged change (revert to registry state). */
  const unstage = useCallback((name: string, scope: VarScope) => {
    const k = stagedKey(name, scope);
    setStaged((prev) => {
      const next = new Map(prev);
      next.delete(k);
      return next;
    });
  }, []);

  /** Clear all staged changes. */
  const clearStaged = useCallback(() => setStaged(new Map()), []);

  /** Restore staged map to a previously captured snapshot (used for undo). */
  const restoreStaged = useCallback((map: Map<string, StagedChange>) => {
    setStaged(new Map(map));
  }, []);

  /**
   * Effective var list: registry vars merged with staged changes.
   * Staged-deleted vars remain visible so the sidebar can show a D marker
   * and the user can unstage the deletion.
   */
  const effectiveVars = useMemo<EnvVar[]>(() => {
    const result = new Map<string, EnvVar>(
      registryVars.map((v) => [stagedKey(v.name, v.scope), v]),
    );
    for (const [k, change] of staged) {
      if (change.kind === "set") {
        const existing = result.get(k);
        result.set(k, {
          name: change.name,
          scope: change.scope,
          value: change.newValue,
          valueKind: change.newValueKind,
          listSeparator:
            existing?.listSeparator ?? inferListSeparator(change.name, change.newValue),
        });
      }
      // "delete": var stays in result with original value; sidebar renders D marker
    }
    return Array.from(result.values()).sort(
      (a, b) => a.scope.localeCompare(b.scope) || a.name.localeCompare(b.name),
    );
  }, [registryVars, staged]);

  return {
    staged,
    effectiveVars,
    stageSet,
    stageDelete,
    stageImport,
    stageSnapshot,
    unstage,
    clearStaged,
    restoreStaged,
  };
}

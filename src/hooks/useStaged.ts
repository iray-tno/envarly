import { useCallback, useMemo, useState } from "react";
import type { EnvSnapshot, EnvVar, VarScope } from "../types";

export type StagedKind = "set" | "delete";

export interface StagedChange {
  kind: StagedKind;
  name: string;
  scope: VarScope;
  /** Value currently in the registry; null if this is a brand-new variable. */
  originalValue: string | null;
  /** New value; null when kind is "delete". */
  newValue: string | null;
}

type StagedKey = string; // `${VarScope}:${name}`

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
    (name: string, scope: VarScope, newValue: string) => {
      const k = stagedKey(name, scope);
      const original = registryByKey.get(k)?.value ?? null;
      setStaged((prev) => {
        const next = new Map(prev);
        if (original === newValue) {
          next.delete(k);
        } else {
          next.set(k, { kind: "set", name, scope, originalValue: original, newValue });
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
      if (original === null) return;
      setStaged((prev) => {
        const next = new Map(prev);
        next.set(k, { kind: "delete", name, scope, originalValue: original, newValue: null });
        return next;
      });
    },
    [registryByKey],
  );

  /** Stage a batch of changes from Import (with optional deletions for Replace strategy). */
  const stageImport = useCallback(
    (
      sets: Array<{ name: string; scope: VarScope; value: string }>,
      deletes: Array<{ name: string; scope: VarScope }> = [],
    ) => {
      setStaged((prev) => {
        const next = new Map(prev);
        for (const v of sets) {
          const k = stagedKey(v.name, v.scope);
          const original = registryByKey.get(k)?.value ?? null;
          if (original === v.value) {
            next.delete(k);
          } else {
            next.set(k, { kind: "set", name: v.name, scope: v.scope, originalValue: original, newValue: v.value });
          }
        }
        for (const d of deletes) {
          const k = stagedKey(d.name, d.scope);
          const original = registryByKey.get(k)?.value ?? null;
          if (original !== null) {
            next.set(k, { kind: "delete", name: d.name, scope: d.scope, originalValue: original, newValue: null });
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

        for (const [name, value] of Object.entries(snap.user)) {
          const k = stagedKey(name, "User");
          const original = registryByKey.get(k)?.value ?? null;
          if (original === value) { next.delete(k); }
          else { next.set(k, { kind: "set", name, scope: "User", originalValue: original, newValue: value }); }
        }
        for (const [name, value] of Object.entries(snap.system)) {
          const k = stagedKey(name, "System");
          const original = registryByKey.get(k)?.value ?? null;
          if (original === value) { next.delete(k); }
          else { next.set(k, { kind: "set", name, scope: "System", originalValue: original, newValue: value }); }
        }

        // Stage deletes for registry vars not present in the snapshot
        for (const v of registryVars) {
          const inSnap = v.scope === "User" ? snap.user : snap.system;
          if (!(v.name in inSnap)) {
            const k = stagedKey(v.name, v.scope);
            next.set(k, { kind: "delete", name: v.name, scope: v.scope, originalValue: v.value, newValue: null });
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
          value: change.newValue!,
          isPathLike:
            existing?.isPathLike ??
            (change.name.toUpperCase() === "PATH" || (change.newValue?.includes(";") ?? false)),
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
  };
}

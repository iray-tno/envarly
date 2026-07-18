import { useCallback, useMemo, useState } from "react";
import type { EnvSnapshot, EnvValueKind, EnvValueKindSelection, EnvVar, VarScope } from "../types";
import {
  computeEffectiveVars,
  computeStageDelete,
  computeStageImport,
  computeStageSet,
  computeStageSnapshot,
  stagedKey,
} from "./stagingLogic";
import type { StagedChange, StagedKey } from "./stagingLogic";

export type { StagedChange, StagedKind } from "./stagingLogic";
export { stagedKey } from "./stagingLogic";

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
      setStaged((prev) =>
        computeStageSet(registryByKey, prev, name, scope, newValue, valueKindSelection),
      );
    },
    [registryByKey],
  );

  /** Stage a deletion for a single variable. */
  const stageDelete = useCallback(
    (name: string, scope: VarScope) => {
      setStaged((prev) => computeStageDelete(registryByKey, prev, name, scope));
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
      setStaged((prev) => computeStageImport(registryByKey, prev, sets, deletes));
    },
    [registryByKey],
  );

  /** Stage all changes needed to make the registry match a snapshot. */
  const stageSnapshot = useCallback(
    (snap: EnvSnapshot) => {
      setStaged((prev) => computeStageSnapshot(registryByKey, registryVars, prev, snap));
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

  const effectiveVars = useMemo(
    () => computeEffectiveVars(registryVars, staged),
    [registryVars, staged],
  );

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

import type { RefObject } from "react";
import { useCallback, useState } from "react";
import { api } from "../api";
import type { EnvChange, EnvSnapshot } from "../types";
import type { StagedChange } from "./useStaged";

type SetDialog = (d: "importexport" | "changes" | "staged" | "licenses" | "newvar" | null) => void;

interface Params {
  staged: Map<string, StagedChange>;
  clearStaged: () => void;
  refresh: () => Promise<void>;
  refreshPathStatus: () => Promise<void>;
  baselineRef: RefObject<EnvSnapshot | null>;
  setDialog: SetDialog;
}

export function useApplyStaged({
  staged,
  clearStaged,
  refresh,
  refreshPathStatus,
  baselineRef,
  setDialog,
}: Params) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApplyStaged = useCallback(
    async (_takeSnapshot: boolean) => {
      setBusy(true);
      setError(null);
      try {
        const changes: EnvChange[] = Array.from(staged.values(), (change) =>
          change.kind === "delete"
            ? {
                changeType: "delete",
                name: change.name,
                scope: change.scope,
              }
            : {
                changeType: "set",
                name: change.name,
                value: change.newValue,
                valueKind: change.newValueKind,
                scope: change.scope,
              },
        );
        await api.applyEnvChanges(changes);
        clearStaged();
        await refresh();
        try {
          baselineRef.current = await api.getRegistrySnapshot();
        } catch {}
        await refreshPathStatus();
        setDialog(null);
      } catch (err) {
        console.error("Failed to apply staged changes", err);
        setError(String(err));
      } finally {
        setBusy(false);
      }
    },
    [staged, clearStaged, refresh, refreshPathStatus, baselineRef, setDialog],
  );

  return { handleApplyStaged, busy, error };
}

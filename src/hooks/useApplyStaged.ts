import type { RefObject } from "react";
import { useCallback, useState } from "react";
import { api } from "../api";
import type { EnvSnapshot } from "../types";
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

  const handleApplyStaged = useCallback(
    async (takeSnapshot: boolean) => {
      setBusy(true);
      try {
        if (takeSnapshot) await api.createSnapshot("auto: before apply");
        for (const change of staged.values()) {
          if (change.kind === "delete") await api.deleteEnvVar(change.name, change.scope);
          else await api.setEnvVar(change.name, change.newValue, change.scope);
        }
        clearStaged();
        setDialog(null);
        await refresh();
        try {
          baselineRef.current = await api.getRegistrySnapshot();
        } catch {}
        await refreshPathStatus();
      } catch (err) {
        console.error("Failed to apply staged changes", err);
      } finally {
        setBusy(false);
      }
    },
    [staged, clearStaged, refresh, refreshPathStatus, baselineRef, setDialog],
  );

  return { handleApplyStaged, busy };
}

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import { applyAccepted, computeDiff, snapshotsEqual } from "../lib/diff";
import type { DiffEntry } from "../lib/diff";
import type { EnvSnapshot, VarScope } from "../types";

type SetDialog = (d: "importexport" | "changes" | "staged" | "licenses" | "newvar" | null) => void;

interface UseDiffResult {
  diffEntries: DiffEntry[];
  baselineRef: React.RefObject<EnvSnapshot | null>;
  checkForExternalChanges: () => Promise<void>;
  handleDiffApply: (accepted: DiffEntry[], reverted: DiffEntry[]) => Promise<void>;
  handleDiffDismiss: () => void;
  applyBusy: boolean;
}

export function useDiff(refresh: () => Promise<void>, setDialog: SetDialog): UseDiffResult {
  const baselineRef = useRef<EnvSnapshot | null>(null);
  const [diffEntries, setDiffEntries] = useState<DiffEntry[]>([]);
  const [applyBusy, setApplyBusy] = useState(false);

  const checkForExternalChanges = useCallback(async () => {
    if (!baselineRef.current) return;
    try {
      const current = await api.getRegistrySnapshot();
      setDiffEntries(snapshotsEqual(baselineRef.current, current) ? [] : computeDiff(baselineRef.current, current));
    } catch {}
  }, []);

  useEffect(() => {
    if (diffEntries.length > 0) setDialog("changes");
  }, [diffEntries.length, setDialog]);

  const handleDiffApply = useCallback(async (accepted: DiffEntry[], reverted: DiffEntry[]) => {
    setApplyBusy(true);
    try {
      for (const entry of reverted) {
        const scope = entry.scope as VarScope;
        if (entry.kind === "added") await api.deleteEnvVar(entry.name, scope);
        else if (entry.kind === "removed") await api.setEnvVar(entry.name, entry.value!, scope);
        else await api.setEnvVar(entry.name, entry.oldValue!, scope);
      }
      if (baselineRef.current) baselineRef.current = applyAccepted(baselineRef.current, accepted);
      setDiffEntries([]);
      setDialog(null);
      await refresh();
    } catch (err) {
      console.error("Failed to apply diff", err);
    } finally {
      setApplyBusy(false);
    }
  }, [refresh, setDialog]);

  const handleDiffDismiss = useCallback(() => {
    if (baselineRef.current) baselineRef.current = applyAccepted(baselineRef.current, diffEntries);
    setDiffEntries([]);
    setDialog(null);
  }, [diffEntries, setDialog]);

  return { diffEntries, baselineRef, checkForExternalChanges, handleDiffApply, handleDiffDismiss, applyBusy };
}

import type { RefObject } from "react";
import { useCallback, useState } from "react";
import { api } from "../api";
import { validateEnvInput } from "../lib/envValidation";
import type { ApplyProgressEvent, EnvChange, EnvSnapshot } from "../types";
import { useI18n } from "./useI18n";
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
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ index: number; total: number } | null>(null);
  const [log, setLog] = useState<ApplyProgressEvent[]>([]);

  const handleApplyStaged = useCallback(
    async (_takeSnapshot: boolean) => {
      setBusy(true);
      setError(null);
      setProgress(null);
      setLog([]);
      // Must resolve before applyEnvChanges is called, or a fast apply can
      // emit all its progress events before this subscription exists to hear them.
      const unsubscribe = await api.onApplyProgress((event) => {
        setProgress({ index: event.index, total: event.total });
        setLog((prev) => [...prev, event]);
      });
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
        for (const change of changes) {
          const inputError = validateEnvInput(
            change.name,
            change.changeType === "set" ? change.value : undefined,
          );
          if (inputError)
            throw new Error(
              t("validation.variable_error", {
                name: change.name,
                error: t(`validation.${inputError}`),
              }),
            );
        }
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
        unsubscribe();
        setBusy(false);
      }
    },
    [staged, clearStaged, refresh, refreshPathStatus, baselineRef, setDialog, t],
  );

  return { handleApplyStaged, busy, error, progress, log };
}

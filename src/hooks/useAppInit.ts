import { useCallback, useEffect } from "react";
import type { RefObject } from "react";
import { api } from "../api";
import type { EnvSnapshot } from "../types";

interface Params {
  baselineRef: RefObject<EnvSnapshot | null>;
  setElevated: (v: boolean) => void;
  refreshPathStatus: () => Promise<void>;
  refresh: () => void;
  checkForExternalChanges: () => Promise<void>;
}

export function useAppInit({ baselineRef, setElevated, refreshPathStatus, refresh, checkForExternalChanges }: Params) {
  useEffect(() => {
    (async () => {
      try { baselineRef.current = await api.getRegistrySnapshot(); } catch { }
      try { setElevated(await api.isElevated()); } catch { }
      await refreshPathStatus();
      refresh();
    })();
  }, []);

  const handleRefresh = useCallback(async () => {
    await refresh();
    await checkForExternalChanges();
  }, [refresh, checkForExternalChanges]);

  return { handleRefresh };
}

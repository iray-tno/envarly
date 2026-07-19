import type { RefObject } from "react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import type { EnvSnapshot } from "../types";

interface Params {
  baselineRef: RefObject<EnvSnapshot | null>;
  setElevated: (v: boolean) => void;
  refreshPathStatus: () => Promise<void>;
  refresh: () => Promise<void>;
  checkForExternalChanges: () => Promise<void>;
}

export function useAppInit({
  baselineRef,
  setElevated,
  refreshPathStatus,
  refresh,
  checkForExternalChanges,
}: Params) {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Each task is independent — run them concurrently so a stuck call doesn't
    // block the others, especially `refresh()` which populates the main view.
    void (async () => {
      try {
        baselineRef.current = await api.getRegistrySnapshot();
      } catch {}
    })();
    void (async () => {
      try {
        setElevated(await api.isElevated());
      } catch {}
    })();
    void refreshPathStatus();
    void refresh().finally(() => setInitializing(false));
  }, [baselineRef, setElevated, refreshPathStatus, refresh]);

  const handleRefresh = useCallback(async () => {
    await refresh();
    await checkForExternalChanges();
  }, [refresh, checkForExternalChanges]);

  return { handleRefresh, initializing };
}

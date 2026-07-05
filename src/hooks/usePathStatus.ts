import { useCallback, useState } from "react";
import { api } from "../api";
import { stagedKey } from "./useStaged";
import type { StagedChange } from "./useStaged";
import type { VarScope } from "../types";

interface UsePathStatusResult {
  userPathInEnv: boolean;
  systemPathInEnv: boolean;
  pathBannerDismissed: boolean;
  refreshPathStatus: () => Promise<void>;
  handleStageAddToPath: (scope: "User" | "System") => Promise<void>;
  handleDismissPathBanner: () => void;
  setActualUserPathInEnv: (v: boolean) => void;
  setActualSystemPathInEnv: (v: boolean) => void;
}

export function usePathStatus(
  staged: Map<string, StagedChange>,
  stageSet: (name: string, scope: VarScope, value: string) => void,
): UsePathStatusResult {
  const [actualUserPathInEnv, setActualUserPathInEnv] = useState(true);
  const [actualSystemPathInEnv, setActualSystemPathInEnv] = useState(true);
  const [pathBannerDismissed, setPathBannerDismissed] = useState(
    () => localStorage.getItem("envarly.pathBannerDismissed") === "1",
  );

  const userPathInEnv = actualUserPathInEnv || staged.has(stagedKey("Path", "User"));
  const systemPathInEnv = actualSystemPathInEnv || staged.has(stagedKey("Path", "System"));

  const refreshPathStatus = useCallback(async () => {
    try {
      const ps = await api.getPathStatus();
      setActualUserPathInEnv(ps.userHasEntry);
      setActualSystemPathInEnv(ps.systemHasEntry);
    } catch {}
  }, []);

  const handleStageAddToPath = useCallback(async (scope: "User" | "System") => {
    try {
      const proposed = await api.getPathProposal(scope);
      if (proposed === null) return;
      stageSet("Path", scope, proposed);
    } catch (err) {
      console.error("Failed to get PATH proposal", err);
    }
  }, [stageSet]);

  const handleDismissPathBanner = useCallback(() => {
    localStorage.setItem("envarly.pathBannerDismissed", "1");
    setPathBannerDismissed(true);
  }, []);

  return {
    userPathInEnv,
    systemPathInEnv,
    pathBannerDismissed,
    refreshPathStatus,
    handleStageAddToPath,
    handleDismissPathBanner,
    setActualUserPathInEnv,
    setActualSystemPathInEnv,
  };
}

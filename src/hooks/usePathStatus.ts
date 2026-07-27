import { useCallback, useState } from "react";
import { api } from "../api";
import type { VarScope } from "../types";
import type { StagedChange } from "./useStaged";
import { stagedKey } from "./useStaged";

interface UsePathStatusResult {
  userPathInEnv: boolean;
  systemPathInEnv: boolean;
  /** `null` when no other-user account is selected. */
  otherUserPathInEnv: boolean | null;
  pathBannerDismissed: boolean;
  refreshPathStatus: () => Promise<void>;
  handleStageAddToPath: (scope: VarScope) => Promise<void>;
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
  const [actualOtherUserPathInEnv, setActualOtherUserPathInEnv] = useState<boolean | null>(null);
  const [pathBannerDismissed, setPathBannerDismissed] = useState(
    () => localStorage.getItem("envarly.pathBannerDismissed") === "1",
  );

  const userPathInEnv = actualUserPathInEnv || staged.has(stagedKey("Path", "User"));
  const systemPathInEnv = actualSystemPathInEnv || staged.has(stagedKey("Path", "System"));
  const otherUserPathInEnv =
    actualOtherUserPathInEnv === null
      ? null
      : actualOtherUserPathInEnv || staged.has(stagedKey("Path", "OtherUser"));

  const refreshPathStatus = useCallback(async () => {
    try {
      const ps = await api.getPathStatus();
      setActualUserPathInEnv(ps.userHasEntry);
      setActualSystemPathInEnv(ps.systemHasEntry);
      setActualOtherUserPathInEnv(ps.otherUserHasEntry);
    } catch {}
  }, []);

  const handleStageAddToPath = useCallback(
    async (scope: VarScope) => {
      try {
        const proposed = await api.getPathProposal(scope);
        if (proposed === null) return;
        stageSet("Path", scope, proposed);
      } catch (err) {
        console.error("Failed to get PATH proposal", err);
      }
    },
    [stageSet],
  );

  const handleDismissPathBanner = useCallback(() => {
    localStorage.setItem("envarly.pathBannerDismissed", "1");
    setPathBannerDismissed(true);
  }, []);

  return {
    userPathInEnv,
    systemPathInEnv,
    otherUserPathInEnv,
    pathBannerDismissed,
    refreshPathStatus,
    handleStageAddToPath,
    handleDismissPathBanner,
    setActualUserPathInEnv,
    setActualSystemPathInEnv,
  };
}

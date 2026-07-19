import { useEffect, useState } from "react";
import { api } from "../api";
import type { UpdateInfo } from "../types";

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "envarly.lastUpdateCheck";

export function useUpdateCheck() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    const lastChecked = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Date.now() - lastChecked < CHECK_INTERVAL_MS) return;

    void api
      .checkForUpdate()
      .then((info) => {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
        if (info) setUpdateInfo(info);
      })
      .catch(() => {});
  }, []);

  return updateInfo;
}

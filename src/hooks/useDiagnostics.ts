import { useEffect, useState } from "react";
import { api } from "../api";
import { diagnoseEnvironment, type EnvironmentDiagnostic } from "../lib/environmentDiagnostics";
import type { EnvVar } from "../types";

export function useDiagnostics(vars: EnvVar[]) {
  const [diagnostics, setDiagnostics] = useState<EnvironmentDiagnostic[]>([]);

  useEffect(() => {
    let cancelled = false;

    void api
      .getUnsupportedEnvValues()
      .then((unsupported) => diagnoseEnvironment(vars, unsupported, api.validatePaths))
      .then((result) => {
        if (!cancelled) setDiagnostics(result);
      })
      .catch(() => {
        if (!cancelled) setDiagnostics([]);
      });

    return () => {
      cancelled = true;
    };
  }, [vars]);

  return diagnostics;
}

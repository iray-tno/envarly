import type { EnvValueKind, EnvValueKindSelection } from "../types";

const ENV_REFERENCE = /%[^%]+%/;

export function inferEnvValueKind(value: string): EnvValueKind {
  return ENV_REFERENCE.test(value) ? "ExpandString" : "String";
}

export function resolveEnvValueKind(
  selection: EnvValueKindSelection,
  value: string,
  existingKind?: EnvValueKind,
): EnvValueKind {
  if (selection !== "Auto") return selection;
  return existingKind ?? inferEnvValueKind(value);
}

export function registryKindLabel(kind: EnvValueKind | null): string {
  if (kind === "String") return "REG_SZ";
  if (kind === "ExpandString") return "REG_EXPAND_SZ";
  return "type unknown";
}

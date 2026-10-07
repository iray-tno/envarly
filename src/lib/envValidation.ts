export type EnvInputError = "empty_name" | "invalid_name" | "invalid_value";

export function validateEnvInput(name: string, value?: string): EnvInputError | null {
  if (name.length === 0) return "empty_name";
  if (name.includes("=") || name.includes("\0")) return "invalid_name";
  if (value?.includes("\0")) return "invalid_value";
  return null;
}

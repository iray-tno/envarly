import type { EnvVar } from "../types";

export interface LintDiagnostic {
  kind: "unresolved-ref" | "whitespace";
  /** The %VAR% name that could not be resolved. Only set for "unresolved-ref". */
  varName: string;
  /** Index into the non-empty entries of the split value. */
  entryIndex: number;
}

// Windows volatile/session variables set by the OS at login, not stored in the
// registry keys this app reads (HKCU\Environment / HKLM\...\Environment).
// Always available at runtime, so %REF% warnings for them are false positives.
const WINDOWS_BUILTIN = new Set([
  "USERPROFILE", "APPDATA", "LOCALAPPDATA", "TEMP", "TMP",
  "SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "COMSPEC",
  "ALLUSERSPROFILE", "PROGRAMDATA", "PUBLIC",
  "HOMEDRIVE", "HOMEPATH", "USERDOMAIN", "USERNAME", "COMPUTERNAME",
  "PROCESSOR_ARCHITECTURE", "NUMBER_OF_PROCESSORS", "OS",
]);

/**
 * Checks a semicolon-separated path value for %VAR% references that cannot
 * be resolved against the provided variable list. Synchronous — does not hit
 * the filesystem. Pair with api.validatePaths for existence checks.
 */
export function lintPathValue(rawValue: string, allVars: EnvVar[]): LintDiagnostic[] {
  const known = new Set(allVars.map((v) => v.name.toUpperCase()));
  const diagnostics: LintDiagnostic[] = [];

  rawValue
    .split(";")
    .filter((entry) => entry.trim().length > 0)
    .forEach((entry, entryIndex) => {
      if (entry !== entry.trim()) {
        diagnostics.push({ kind: "whitespace", varName: "", entryIndex });
      }
      for (const match of entry.matchAll(/%([^%]+)%/g)) {
        const varName = match[1];
        if (!known.has(varName.toUpperCase()) && !WINDOWS_BUILTIN.has(varName.toUpperCase())) {
          diagnostics.push({ kind: "unresolved-ref", varName, entryIndex });
        }
      }
    });

  return diagnostics;
}

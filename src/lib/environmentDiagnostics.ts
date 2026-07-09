import type { EnvValueKind, EnvVar, UnsupportedEnvValue, VarScope } from "../types";

export type DiagnosticSeverity = "attention" | "info";
export type DiagnosticKind =
  | "expandable-stored-as-string"
  | "undefined-reference"
  | "missing-temp-directory"
  | "unsupported-registry-type"
  | "invalid-nul"
  | "windows-generated-override"
  | "missing-path-entry"
  | "duplicate-path-entry"
  | "expandable-without-reference"
  | "system-references-user-variable";

export type DiagnosticAction =
  | { kind: "set-type"; valueKind: EnvValueKind }
  | { kind: "set-value"; value: string }
  | { kind: "delete" };

export interface EnvironmentDiagnostic {
  id: string;
  kind: DiagnosticKind;
  severity: DiagnosticSeverity;
  name: string;
  scope: VarScope;
  detail?: string;
  action?: DiagnosticAction;
}

const REFERENCE_PATTERN = /%([^%]+)%/g;

const WINDOWS_BUILTIN = new Set([
  "ALLUSERSPROFILE",
  "APPDATA",
  "COMPUTERNAME",
  "COMSPEC",
  "HOMEDRIVE",
  "HOMEPATH",
  "LOCALAPPDATA",
  "NUMBER_OF_PROCESSORS",
  "OS",
  "PROCESSOR_ARCHITECTURE",
  "PROGRAMDATA",
  "PUBLIC",
  "SYSTEMDRIVE",
  "SYSTEMROOT",
  "TEMP",
  "TMP",
  "USERDOMAIN",
  "USERNAME",
  "USERPROFILE",
  "WINDIR",
]);

const WINDOWS_GENERATED = new Set([
  "APPDATA",
  "COMPUTERNAME",
  "HOMEDRIVE",
  "HOMEPATH",
  "LOCALAPPDATA",
  "USERNAME",
  "USERPROFILE",
  "USERDOMAIN",
]);

function references(value: string): string[] {
  return [...new Set([...value.matchAll(REFERENCE_PATTERN)].map((match) => match[1]))];
}

function diagnosticId(kind: DiagnosticKind, scope: VarScope, name: string, detail = ""): string {
  return `${kind}:${scope}:${name}:${detail}`;
}

function pathKey(value: string): string {
  return value
    .trim()
    .replace(/[\\/]+$/, "")
    .toLowerCase();
}

function sortDiagnostics(diagnostics: EnvironmentDiagnostic[]) {
  return diagnostics.sort(
    (a, b) =>
      (a.severity === b.severity ? 0 : a.severity === "attention" ? -1 : 1) ||
      a.scope.localeCompare(b.scope) ||
      a.name.localeCompare(b.name) ||
      a.kind.localeCompare(b.kind),
  );
}

export async function diagnoseEnvironment(
  vars: EnvVar[],
  unsupported: UnsupportedEnvValue[],
  validatePaths: (paths: string[]) => Promise<boolean[]>,
): Promise<EnvironmentDiagnostic[]> {
  const diagnostics: EnvironmentDiagnostic[] = [];
  const known = new Set(vars.map((variable) => variable.name.toUpperCase()));
  const systemNames = new Set(
    vars
      .filter((variable) => variable.scope === "System")
      .map((variable) => variable.name.toUpperCase()),
  );
  const userNames = new Set(
    vars
      .filter((variable) => variable.scope === "User")
      .map((variable) => variable.name.toUpperCase()),
  );
  const pathChecks: Array<{
    variable: EnvVar;
    entry: string;
    remainingValue: string;
  }> = [];
  const tempChecks: EnvVar[] = [];

  for (const variable of vars) {
    const upperName = variable.name.toUpperCase();
    const refs = references(variable.value);

    if (variable.value.includes("\0")) {
      diagnostics.push({
        id: diagnosticId("invalid-nul", variable.scope, variable.name),
        kind: "invalid-nul",
        severity: "attention",
        name: variable.name,
        scope: variable.scope,
      });
    }

    if (WINDOWS_GENERATED.has(upperName)) {
      diagnostics.push({
        id: diagnosticId("windows-generated-override", variable.scope, variable.name),
        kind: "windows-generated-override",
        severity: "attention",
        name: variable.name,
        scope: variable.scope,
        action: { kind: "delete" },
      });
    }

    for (const ref of refs) {
      const upperRef = ref.toUpperCase();
      if (!known.has(upperRef) && !WINDOWS_BUILTIN.has(upperRef)) {
        diagnostics.push({
          id: diagnosticId("undefined-reference", variable.scope, variable.name, ref),
          kind: "undefined-reference",
          severity: "attention",
          name: variable.name,
          scope: variable.scope,
          detail: ref,
        });
      }
      if (variable.scope === "System" && userNames.has(upperRef) && !systemNames.has(upperRef)) {
        diagnostics.push({
          id: diagnosticId("system-references-user-variable", variable.scope, variable.name, ref),
          kind: "system-references-user-variable",
          severity: "info",
          name: variable.name,
          scope: variable.scope,
          detail: ref,
        });
      }
    }

    if (
      variable.valueKind === "String" &&
      refs.some((ref) => {
        const upperRef = ref.toUpperCase();
        return known.has(upperRef) || WINDOWS_BUILTIN.has(upperRef);
      })
    ) {
      diagnostics.push({
        id: diagnosticId("expandable-stored-as-string", variable.scope, variable.name),
        kind: "expandable-stored-as-string",
        severity: "attention",
        name: variable.name,
        scope: variable.scope,
        action: { kind: "set-type", valueKind: "ExpandString" },
      });
    } else if (variable.valueKind === "ExpandString" && refs.length === 0) {
      diagnostics.push({
        id: diagnosticId("expandable-without-reference", variable.scope, variable.name),
        kind: "expandable-without-reference",
        severity: "info",
        name: variable.name,
        scope: variable.scope,
      });
    }

    if (upperName === "PATH") {
      const entries = variable.value.split(";").filter((entry) => entry.trim());
      const seen = new Set<string>();
      const deduplicated: string[] = [];
      const duplicates = new Set<string>();
      for (const entry of entries) {
        const key = pathKey(entry);
        if (seen.has(key)) {
          duplicates.add(entry);
        } else {
          seen.add(key);
          deduplicated.push(entry);
        }
      }
      for (const entry of duplicates) {
        diagnostics.push({
          id: diagnosticId("duplicate-path-entry", variable.scope, variable.name, entry),
          kind: "duplicate-path-entry",
          severity: "info",
          name: variable.name,
          scope: variable.scope,
          detail: entry,
          action: { kind: "set-value", value: deduplicated.join(";") },
        });
      }
      const validationKeys = new Set<string>();
      for (const entry of entries) {
        const key = pathKey(entry);
        if (validationKeys.has(key)) continue;
        validationKeys.add(key);
        pathChecks.push({
          variable,
          entry,
          remainingValue: entries.filter((candidate) => pathKey(candidate) !== key).join(";"),
        });
      }
    }

    if (upperName === "TEMP" || upperName === "TMP") {
      tempChecks.push(variable);
    }
  }

  for (const value of unsupported) {
    diagnostics.push({
      id: diagnosticId("unsupported-registry-type", value.scope, value.name),
      kind: "unsupported-registry-type",
      severity: "attention",
      name: value.name,
      scope: value.scope,
      detail: value.registryType,
    });
  }

  const checks = [
    ...pathChecks.map((check) => check.entry),
    ...tempChecks.map((item) => item.value),
  ];
  if (checks.length > 0) {
    let results: boolean[];
    try {
      results = await validatePaths(checks);
    } catch {
      return sortDiagnostics(diagnostics);
    }
    pathChecks.forEach((check, resultIndex) => {
      if (results[resultIndex]) return;
      diagnostics.push({
        id: diagnosticId(
          "missing-path-entry",
          check.variable.scope,
          check.variable.name,
          check.entry,
        ),
        kind: "missing-path-entry",
        severity: "info",
        name: check.variable.name,
        scope: check.variable.scope,
        detail: check.entry,
        action: { kind: "set-value", value: check.remainingValue },
      });
    });
    tempChecks.forEach((variable, index) => {
      if (results[pathChecks.length + index]) return;
      diagnostics.push({
        id: diagnosticId("missing-temp-directory", variable.scope, variable.name),
        kind: "missing-temp-directory",
        severity: "attention",
        name: variable.name,
        scope: variable.scope,
        detail: variable.value,
      });
    });
  }

  return sortDiagnostics(diagnostics);
}

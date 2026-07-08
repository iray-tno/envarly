import type { StagedChange } from "../hooks/useStaged";
import type { DiffEntry } from "./diff";

export function stagedToDiff(staged: Map<string, StagedChange>): DiffEntry[] {
  return Array.from(staged.values())
    .map((c): DiffEntry => {
      if (c.kind === "delete")
        return { kind: "removed", name: c.name, scope: c.scope, value: c.originalValue };
      if (c.originalValue === null)
        return { kind: "added", name: c.name, scope: c.scope, value: c.newValue };
      return {
        kind: "changed",
        name: c.name,
        scope: c.scope,
        oldValue: c.originalValue,
        newValue: c.newValue,
      };
    })
    .sort((a, b) => a.scope.localeCompare(b.scope) || a.name.localeCompare(b.name));
}

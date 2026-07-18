import type { DiffEntry } from "../../lib/diff";

export function splitList(value: string): string[] {
  return value
    .split(";")
    .map((e) => e.trim())
    .filter(Boolean);
}

export function isList(value: string): boolean {
  return value.includes(";") && splitList(value).length > 1;
}

export function entryHasListValue(entry: DiffEntry): boolean {
  return entry.kind === "changed"
    ? isList(entry.oldValue) || isList(entry.newValue)
    : isList(entry.value);
}

export function keyedEntries(entries: string[], prefix: string) {
  const seen = new Map<string, number>();
  return entries.map((entry) => {
    const count = seen.get(entry) ?? 0;
    seen.set(entry, count + 1);
    return { entry, key: `${prefix}:${entry}:${count}` };
  });
}

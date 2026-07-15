import { useState } from "react";
import type { DiffEntry } from "../../lib/diff";
import { registryKindLabel } from "../../lib/envValueKind";
import { resolveSecret } from "../../lib/secrets";
import { Icon } from "../ui/Icon";

export function DiffRow({ entry }: { entry: DiffEntry }) {
  const secret = resolveSecret(entry.name, entry.kind === "changed" ? entry.newValue : entry.value);
  const [revealed, setRevealed] = useState(false);

  const mask = (v: string) => (secret && !revealed ? "••••••••" : v);

  return (
    <tr className="border-b border-rim-subtle last:border-0 text-xs">
      <td className="px-2 py-2 w-5 text-center font-mono font-bold shrink-0">
        {entry.kind === "added" && <span className="text-success">+</span>}
        {entry.kind === "removed" && <span className="text-danger">−</span>}
        {entry.kind === "changed" && <span className="text-warn">~</span>}
      </td>
      <td className="px-2 py-2 font-mono font-semibold text-fg whitespace-nowrap">
        <span className="flex items-center gap-1">
          {entry.name}
          {secret && (
            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-warn">
              <Icon name="warning" size={12} />
              {secret.service}
            </span>
          )}
        </span>
      </td>
      <td className="px-2 py-2 text-muted w-12">{entry.scope[0]}</td>
      <td className="px-2 py-2 font-mono text-muted whitespace-nowrap">
        {entry.kind === "changed" ? (
          <span className="flex flex-col gap-1">
            {entry.oldValueKind !== entry.newValueKind && (
              <span className="text-[10px] text-dim">
                {registryKindLabel(entry.oldValueKind)} → {registryKindLabel(entry.newValueKind)}
              </span>
            )}
            <span className="line-through text-danger">{mask(entry.oldValue)}</span>
            <span className="text-success">{mask(entry.newValue)}</span>
          </span>
        ) : (
          <span>{mask(entry.value)}</span>
        )}
      </td>
      {secret && (
        <td className="px-2 py-2">
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="text-[10px] text-dim hover:text-muted transition-colors"
          >
            {revealed ? "hide" : "show"}
          </button>
        </td>
      )}
    </tr>
  );
}

export function DiffTable({ diff }: { diff: DiffEntry[] }) {
  const added = diff.filter((e) => e.kind === "added").length;
  const removed = diff.filter((e) => e.kind === "removed").length;
  const changed = diff.filter((e) => e.kind === "changed").length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 gap-3 text-xs">
        {added > 0 && <span className="text-success">+{added} added</span>}
        {removed > 0 && <span className="text-danger">−{removed} removed</span>}
        {changed > 0 && <span className="text-warn">~{changed} changed</span>}
      </div>

      <section
        data-testid="snapshot-diff-scroll"
        aria-label="Snapshot differences"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable content must be keyboard reachable.
        tabIndex={0}
        className="min-h-0 flex-1 rounded border border-rim overflow-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <table className="w-max min-w-full">
          <thead>
            <tr className="border-b border-rim bg-surface text-muted text-[10px] uppercase tracking-wide">
              <th className="px-2 py-2 w-5">
                <span className="sr-only">Change</span>
              </th>
              <th className="px-2 py-2 text-left">Name</th>
              <th className="px-2 py-2 text-left">Scope</th>
              <th className="px-2 py-2 text-left">Value</th>
              <th className="px-2 py-2 w-10">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {diff.map((entry) => (
              <DiffRow key={`${entry.scope}:${entry.name}`} entry={entry} />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

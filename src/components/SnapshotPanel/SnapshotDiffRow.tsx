import { useState } from "react";
import type { DiffEntry } from "../../lib/diff";
import { resolveSecret } from "../../lib/secrets";

export function DiffRow({ entry }: { entry: DiffEntry }) {
  const secret = resolveSecret(entry.name, entry.value ?? entry.newValue ?? "");
  const [revealed, setRevealed] = useState(false);

  const mask = (v: string) => secret && !revealed ? "••••••••" : v;

  return (
    <tr className="border-b border-rim-subtle last:border-0 text-xs">
      <td className="px-2 py-1.5 w-5 text-center font-mono font-bold shrink-0">
        {entry.kind === "added"   && <span className="text-success">+</span>}
        {entry.kind === "removed" && <span className="text-danger">−</span>}
        {entry.kind === "changed" && <span className="text-warn">~</span>}
      </td>
      <td className="px-2 py-1.5 font-mono font-semibold text-fg whitespace-nowrap">
        <span className="flex items-center gap-1.5">
          {entry.name}
          {secret && <span className="text-[9px] font-medium text-warn">{secret.service}</span>}
        </span>
      </td>
      <td className="px-2 py-1.5 text-muted w-12">{entry.scope[0]}</td>
      <td className="px-2 py-1.5 font-mono text-muted max-w-xs truncate">
        {entry.kind === "changed" ? (
          <span className="flex flex-col gap-0.5">
            <span className="line-through text-danger">{mask(entry.oldValue!)}</span>
            <span className="text-success">{mask(entry.newValue!)}</span>
          </span>
        ) : (
          <span>{mask(entry.value!)}</span>
        )}
      </td>
      {secret && (
        <td className="px-2 py-1.5">
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
  const added   = diff.filter((e) => e.kind === "added").length;
  const removed = diff.filter((e) => e.kind === "removed").length;
  const changed = diff.filter((e) => e.kind === "changed").length;

  return (
    <>
      <div className="flex gap-3 text-xs">
        {added   > 0 && <span className="text-success">+{added} added</span>}
        {removed > 0 && <span className="text-danger">−{removed} removed</span>}
        {changed > 0 && <span className="text-warn">~{changed} changed</span>}
      </div>

      <div className="rounded border border-rim overflow-hidden max-h-80 overflow-y-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-rim bg-surface text-muted text-[10px] uppercase tracking-wide">
              <th className="px-2 py-1.5 w-5" />
              <th className="px-2 py-1.5 text-left">Name</th>
              <th className="px-2 py-1.5 text-left">Scope</th>
              <th className="px-2 py-1.5 text-left">Value</th>
              <th className="px-2 py-1.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {diff.map((entry) => (
              <DiffRow key={`${entry.scope}:${entry.name}`} entry={entry} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

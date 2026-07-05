import { useState } from "react";
import { useI18n } from "../../hooks/useI18n";
import type { DiffEntry } from "../../lib/diff";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";
import { EntryRow } from "./EntryRow";

interface Props {
  entries: DiffEntry[];
  onApply: (accepted: DiffEntry[], reverted: DiffEntry[]) => void;
  onDismiss: () => void;
  busy?: boolean;
}

export function DiffPanel({ entries, onApply, onDismiss, busy }: Props) {
  const { t } = useI18n();
  const [accepted, setAccepted] = useState<Record<string, boolean>>(
    () => Object.fromEntries(entries.map((e) => [`${e.scope}:${e.name}`, true])),
  );

  const key = (e: DiffEntry) => `${e.scope}:${e.name}`;

  const toggleEntry = (e: DiffEntry) =>
    setAccepted((prev) => ({ ...prev, [key(e)]: !prev[key(e)] }));

  const toggleAll = (val: boolean) =>
    setAccepted(Object.fromEntries(entries.map((e) => [key(e), val])));

  const acceptedCount = Object.values(accepted).filter(Boolean).length;
  const allChecked = acceptedCount === entries.length;
  const noneChecked = acceptedCount === 0;

  const handleApply = () => {
    const acc = entries.filter((e) => accepted[key(e)]);
    const rev = entries.filter((e) => !accepted[key(e)]);
    onApply(acc, rev);
  };

  if (entries.length === 0) return null;

  const byKind = {
    added:   entries.filter((e) => e.kind === "added"),
    removed: entries.filter((e) => e.kind === "removed"),
    changed: entries.filter((e) => e.kind === "changed"),
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 py-4 border-b border-rim shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-fg">{t("diff.title")}</h2>
          <IconButton aria-label="Close" icon="×" onClick={onDismiss} />
        </div>
        <p className="text-xs text-muted mb-3">{t("diff.description")}</p>

        <div className="flex gap-3 text-xs mb-3">
          {byKind.added.length > 0   && <span className="text-success">{t("staged.added", { count: byKind.added.length })}</span>}
          {byKind.removed.length > 0 && <span className="text-danger">{t("staged.removed", { count: byKind.removed.length })}</span>}
          {byKind.changed.length > 0 && <span className="text-warn">{t("staged.changed", { count: byKind.changed.length })}</span>}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="link" size="xs" onClick={() => toggleAll(true)} disabled={allChecked}>
            {t("diff.select_all")}
          </Button>
          <span className="text-dim">·</span>
          <Button variant="link" size="xs" onClick={() => toggleAll(false)} disabled={noneChecked}>
            {t("diff.deselect_all")}
          </Button>
          <span className="text-dim ml-auto text-xs">{t("diff.selected", { accepted: acceptedCount, total: entries.length })}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-2">
        {entries.map((entry) => (
          <EntryRow
            key={key(entry)}
            entry={entry}
            accepted={accepted[key(entry)]}
            onToggle={() => toggleEntry(entry)}
          />
        ))}
      </div>

      <div className="px-5 py-3 border-t border-rim shrink-0 flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onDismiss}>{t("diff.dismiss")}</Button>
        <Button variant="primary" size="sm" onClick={handleApply} disabled={busy}>
          {busy ? t("diff.applying") : t("diff.apply", { accepted: acceptedCount, reverted: entries.length - acceptedCount })}
        </Button>
      </div>
    </div>
  );
}

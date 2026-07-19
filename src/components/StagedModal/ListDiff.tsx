import { useI18n } from "../../hooks/useI18n";
import { cn } from "../../lib/cn";
import { keyedEntries, splitList } from "./listDiffUtils";

export function ListDiffDelta({ oldValue, newValue }: { oldValue: string; newValue: string }) {
  const { t } = useI18n();
  const oldEntries = splitList(oldValue);
  const newEntries = splitList(newValue);
  const removed = oldEntries.filter((e) => !newEntries.includes(e));
  const added = newEntries.filter((e) => !oldEntries.includes(e));

  if (removed.length === 0 && added.length === 0) {
    return (
      <p className="font-mono text-[11px] text-muted mt-1">
        {t("staged.order_changed", { count: oldEntries.length })}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1 mt-1 max-h-48 overflow-y-auto">
      {keyedEntries(removed, "removed").map(({ entry, key }) => (
        <p key={key} className="font-mono text-[11px] text-danger break-all">
          <span className="select-none mr-1">−</span>
          {entry}
        </p>
      ))}
      {keyedEntries(added, "added").map(({ entry, key }) => (
        <p key={key} className="font-mono text-[11px] text-success break-all">
          <span className="select-none mr-1">+</span>
          {entry}
        </p>
      ))}
    </div>
  );
}

export function ListDiffFull({ oldValue, newValue }: { oldValue: string; newValue: string }) {
  const oldEntries = splitList(oldValue);
  const newEntries = splitList(newValue);
  const removedSet = new Set(oldEntries.filter((e) => !newEntries.includes(e)));
  const addedSet = new Set(newEntries.filter((e) => !oldEntries.includes(e)));

  const rows: { entry: string; status: "added" | "removed" | "unchanged" }[] = [
    ...Array.from(removedSet).map((e) => ({ entry: e, status: "removed" as const })),
    ...newEntries.map((e) => ({
      entry: e,
      status: addedSet.has(e) ? ("added" as const) : ("unchanged" as const),
    })),
  ];
  const seen = new Map<string, number>();

  return (
    <div className="flex flex-col gap-1 mt-1 max-h-48 overflow-y-auto">
      {rows.map((r) => {
        const keyBase = `${r.status}:${r.entry}`;
        const count = seen.get(keyBase) ?? 0;
        seen.set(keyBase, count + 1);
        return (
          <p
            key={`${keyBase}:${count}`}
            className={cn(
              "font-mono text-[11px] break-all",
              r.status === "removed" && "text-danger line-through",
              r.status === "added" && "text-success",
              r.status === "unchanged" && "text-muted",
            )}
          >
            <span className="select-none mr-1">
              {r.status === "added" ? "+" : r.status === "removed" ? "−" : " "}
            </span>
            {r.entry}
          </p>
        );
      })}
    </div>
  );
}

export function ListEntries({ value, className }: { value: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1 mt-1 max-h-48 overflow-y-auto", className)}>
      {keyedEntries(splitList(value), "entry").map(({ entry, key }) => (
        <p key={key} className="font-mono text-[11px] break-all">
          {entry}
        </p>
      ))}
    </div>
  );
}

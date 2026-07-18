import { useI18n } from "../../hooks/useI18n";
import type { VarScope } from "../../types";

interface Props {
  scope: VarScope;
  valueLength: number;
  entriesCount: number | null;
  expandedValue: string | null;
  originalValue: string | null;
}

export function DetailMetadata({
  scope,
  valueLength,
  entriesCount,
  expandedValue,
  originalValue,
}: Props) {
  const { t } = useI18n();

  const rows: [string, string][] = [
    [t("detail.meta_scope"), scope],
    [t("detail.meta_length_label"), t("detail.meta_length", { count: valueLength })],
    ...(entriesCount !== null
      ? ([[t("detail.meta_entries"), String(entriesCount)]] as [string, string][])
      : []),
    ...(expandedValue !== null
      ? ([
          [
            t("detail.meta_expanded"),
            expandedValue.length > 60 ? `${expandedValue.slice(0, 60)}…` : expandedValue,
          ],
        ] as [string, string][])
      : []),
    ...(originalValue !== null
      ? ([
          [
            t("detail.meta_original"),
            originalValue.length > 40 ? `${originalValue.slice(0, 40)}…` : originalValue,
          ],
        ] as [string, string][])
      : []),
  ];

  return (
    <div className="flex flex-col gap-1 pt-2 border-t border-rim-subtle mt-1">
      {rows.map(([label, val]) => (
        <div key={label} className="flex gap-3 text-sm">
          <span className="text-dim w-14 shrink-0">{label}</span>
          <span className="text-muted font-mono">{val}</span>
        </div>
      ))}
    </div>
  );
}

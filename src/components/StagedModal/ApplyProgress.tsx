import { useI18n } from "../../hooks/useI18n";
import { cn } from "../../lib/cn";
import type { ApplyProgressEvent } from "../../types";
import { Icon } from "../ui/Icon";

interface Props {
  progress: { index: number; total: number } | null;
  log: ApplyProgressEvent[];
}

export function ApplyProgress({ progress, log }: Props) {
  const { t } = useI18n();
  const percent = progress ? Math.round(((progress.index + 1) / progress.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      {progress && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-rim overflow-hidden">
            <div
              className="h-full bg-accent transition-[width] duration-150"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-[10px] text-dim shrink-0">
            {t("staged.apply_progress_count", {
              current: progress.index + 1,
              total: progress.total,
            })}
          </span>
        </div>
      )}
      {log.length > 0 && (
        <div className="flex flex-col gap-0.5 max-h-32 overflow-y-auto font-mono text-[11px]">
          {log.map((entry) => (
            <p
              key={`${entry.index}:${entry.scope}:${entry.name}`}
              className={cn(
                "flex items-center gap-1",
                entry.success ? "text-muted" : "text-danger",
              )}
            >
              <Icon name={entry.success ? "check" : "x"} size={12} className="shrink-0" />
              <span className="truncate">
                {entry.action} {entry.scope}:{entry.name}
                {!entry.success && entry.error ? ` — ${entry.error}` : ""}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

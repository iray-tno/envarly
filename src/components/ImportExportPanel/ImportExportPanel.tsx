import { useState } from "react";
import { useI18n } from "../../hooks/useI18n";
import { cn } from "../../lib/cn";
import type { EnvValueKind, VarScope } from "../../types";
import { SegmentedControl } from "../ui/SegmentedControl";
import { ExportTab } from "./ExportTab";
import { ImportTab } from "./ImportTab";
import type { Mode } from "./types";

interface Props {
  onStage: (
    sets: Array<{
      name: string;
      scope: VarScope;
      value: string;
      valueKind: EnvValueKind | null;
    }>,
    deletes: Array<{ name: string; scope: VarScope }>,
  ) => void;
}

export function ImportExportPanel({ onStage }: Props) {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("export");
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const modeOptions: { value: Mode; label: string }[] = [
    { value: "export", label: t("modal.tab_export") },
    { value: "import", label: t("modal.tab_import") },
  ];

  const handleStatus = (msg: string | null) => {
    if (msg === null) {
      setStatus(null);
      return;
    }
    const ok = !msg.toLowerCase().includes("fail") && !msg.toLowerCase().includes("error");
    setStatus({ ok, msg });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 py-4 border-b border-rim shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-semibold text-fg">{t("modal.import_export")}</h2>
          <div className="ml-auto">
            <SegmentedControl
              aria-label="Mode"
              options={modeOptions}
              value={mode}
              onChange={(m) => {
                setMode(m);
                setStatus(null);
              }}
            />
          </div>
        </div>
        {status && (
          <p className={cn("text-xs", status.ok ? "text-success" : "text-danger")}>{status.msg}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {mode === "export" ? (
          <ExportTab onStatus={handleStatus} />
        ) : (
          <ImportTab onStage={onStage} onStatus={handleStatus} />
        )}
      </div>
    </div>
  );
}

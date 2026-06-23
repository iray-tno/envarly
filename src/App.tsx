import { useEffect, useState } from "react";
import { DetailPanel } from "./components/DetailPanel/DetailPanel";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { SnapshotPanel } from "./components/SnapshotPanel/SnapshotPanel";
import { useEnvVars } from "./hooks/useEnvVars";
import { cn } from "./lib/cn";
import type { EnvVar } from "./types";

type Tab = "editor" | "snapshots";

export default function App() {
  const { vars, loading, error, refresh } = useEnvVars();
  const [selected, setSelected] = useState<EnvVar | null>(null);
  const [tab, setTab] = useState<Tab>("editor");

  useEffect(() => {
    refresh();
  }, []);

  const handleDeleted = () => {
    setSelected(null);
    refresh();
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header
        className="flex items-center gap-3 h-12 px-4 bg-panel border-b border-rim shrink-0"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div className="flex items-center gap-2 mr-2">
          <span className="text-lg">⚡</span>
          <span className="text-[15px] font-semibold tracking-tight">Envarly</span>
        </div>

        <nav
          className="flex gap-0.5"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          {(["editor", "snapshots"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 rounded text-[13px] capitalize transition-colors",
                tab === t ? "bg-surface text-fg" : "text-muted hover:bg-hover hover:text-fg",
              )}
            >
              {t === "editor" ? "Variables" : "Snapshots"}
            </button>
          ))}
        </nav>

        <button
          onClick={refresh}
          disabled={loading}
          className="ml-auto px-2.5 py-1 rounded text-muted text-xs hover:bg-hover hover:text-fg disabled:opacity-50 transition-colors"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          ↻ Refresh
        </button>
      </header>

      {error && (
        <div className="px-4 py-2 bg-danger/15 border-b border-danger text-danger text-xs">
          Registry error: {error}
        </div>
      )}

      <main className="flex flex-1 overflow-hidden">
        {tab === "editor" ? (
          <>
            <Sidebar
              vars={vars}
              selected={selected}
              onSelect={setSelected}
              loading={loading}
            />
            <div className="flex flex-1 overflow-hidden">
              <DetailPanel
                variable={selected}
                onSaved={refresh}
                onDeleted={handleDeleted}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            <SnapshotPanel onRestored={refresh} />
          </div>
        )}
      </main>
    </div>
  );
}

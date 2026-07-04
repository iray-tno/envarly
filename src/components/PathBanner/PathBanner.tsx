import { Button } from "../ui/Button";

interface PathBannerProps {
  scope: "User" | "System";
  onStageAddToPath: () => void;
  onDismiss: () => void;
}

export function PathBanner({ scope, onStageAddToPath, onDismiss }: PathBannerProps) {
  return (
    <div className="flex items-center gap-3 px-5 py-2 bg-accent/10 border-b border-accent/30 text-sm shrink-0">
      <span className="text-fg/80 flex-1">
        Envarly is not in your {scope} PATH — add it to run{" "}
        <span className="font-mono text-fg">envarly</span> from a terminal.
      </span>
      <Button variant="secondary" size="sm" onClick={onStageAddToPath}>
        + {scope} PATH
      </Button>
      <Button variant="ghost" size="sm" onClick={onDismiss}>
        Dismiss
      </Button>
    </div>
  );
}

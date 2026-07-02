import { Button } from "../ui/Button";

interface PathBannerProps {
  elevated: boolean;
  onStageAddToPath: (scope: "User" | "System") => void;
  onDismiss: () => void;
}

export function PathBanner({ elevated, onStageAddToPath, onDismiss }: PathBannerProps) {
  const scope: "User" | "System" = elevated ? "System" : "User";

  return (
    <div className="flex items-center gap-3 px-5 py-2 bg-accent/10 border-b border-accent/30 text-sm shrink-0">
      <span className="text-fg/80 flex-1">
        Envarly is not in your {scope} PATH — you can run it from the terminal by adding it.
      </span>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onStageAddToPath(scope)}
      >
        Stage add to {scope} PATH
      </Button>
      <Button variant="ghost" size="sm" onClick={onDismiss}>
        Dismiss
      </Button>
    </div>
  );
}

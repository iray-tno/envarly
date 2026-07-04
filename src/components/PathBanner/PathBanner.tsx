import { Button } from "../ui/Button";

interface PathBannerProps {
  elevated: boolean;
  userPathInEnv: boolean;
  systemPathInEnv: boolean;
  onStageAddToPath: (scope: "User" | "System") => void;
  onDismiss: () => void;
}

export function PathBanner({ elevated, userPathInEnv, systemPathInEnv, onStageAddToPath, onDismiss }: PathBannerProps) {
  const missingUser = !userPathInEnv;
  const missingSystem = elevated && !systemPathInEnv;

  const label =
    missingUser && missingSystem ? "User and System PATH" :
    missingUser ? "User PATH" :
    "System PATH";

  return (
    <div className="flex items-center gap-3 px-5 py-2 bg-accent/10 border-b border-accent/30 text-sm shrink-0">
      <span className="text-fg/80 flex-1">
        Envarly is not in your {label} — add it to run{" "}
        <span className="font-mono text-fg">envarly</span> from a terminal.
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        {missingUser && (
          <Button variant="secondary" size="sm" onClick={() => onStageAddToPath("User")}>
            + User PATH
          </Button>
        )}
        {missingSystem && (
          <Button variant="secondary" size="sm" onClick={() => onStageAddToPath("System")}>
            + System PATH
          </Button>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={onDismiss}>
        Dismiss
      </Button>
    </div>
  );
}

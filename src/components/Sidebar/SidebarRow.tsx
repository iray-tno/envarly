import type { StagedChange } from "../../hooks/useStaged";
import { cn } from "../../lib/cn";
import type { SecretInfo } from "../../lib/secrets";
import type { EnvVar } from "../../types";
import { Icon } from "../ui/Icon";

interface Props {
  entryKey: string;
  v: EnvVar;
  isSelected: boolean;
  isFirstWhenNoneSelected: boolean;
  secret: SecretInfo | null;
  stagedChange: StagedChange | undefined;
  copiedKey: string | null;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onCopy: () => void;
  registerRef: (el: HTMLButtonElement | null) => void;
}

export function SidebarRow({
  entryKey,
  v,
  isSelected,
  isFirstWhenNoneSelected,
  secret,
  stagedChange,
  copiedKey,
  onSelect,
  onKeyDown,
  onCopy,
  registerRef,
}: Props) {
  const isDelete = stagedChange?.kind === "delete";
  const isSet = stagedChange?.kind === "set";
  const isNew = isSet && stagedChange.originalValue === null;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: mouse-only convenience so the scope badge stays clickable; keyboard selection is already handled by the inner button's onKeyDown
    <li
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-1 mx-2 w-[calc(100%-1rem)] rounded transition-colors",
        isSelected ? "bg-surface text-fg" : "text-muted hover:bg-hover hover:text-fg",
      )}
    >
      <button
        ref={registerRef}
        type="button"
        aria-current={isSelected ? "true" : undefined}
        tabIndex={isSelected || isFirstWhenNoneSelected ? 0 : -1}
        onKeyDown={onKeyDown}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 py-2 pl-4 text-left rounded",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
        )}
      >
        <span className={cn("flex-1 font-mono text-sm truncate", isDelete && "line-through")}>
          {v.name}
        </span>
        {secret && !isDelete && (
          <span
            title={secret.label}
            className="text-[9px] font-medium text-warn shrink-0 max-w-[44px] truncate"
          >
            {secret.service}
          </span>
        )}
        {isDelete && <span className="text-[9px] font-bold text-danger shrink-0">D</span>}
        {isNew && <span className="text-[9px] font-bold text-success shrink-0">A</span>}
        {isSet && !isNew && <span className="text-[9px] font-bold text-warn shrink-0">M</span>}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onCopy();
        }}
        aria-label={`Copy value of ${v.name}`}
        title="Copy value"
        className={cn(
          "shrink-0 text-[10px] p-1 rounded transition-all",
          "opacity-0 group-hover:opacity-100 focus:opacity-100",
          copiedKey === entryKey ? "text-success" : "text-dim hover:text-muted",
        )}
      >
        <Icon name={copiedKey === entryKey ? "check" : "copy"} size={12} />
      </button>
      <span
        className={cn(
          "text-[10px] font-semibold w-4 h-4 rounded flex items-center justify-center shrink-0 mr-4",
          v.scope === "User" && "bg-accent/15 text-accent",
          v.scope === "System" && "bg-violet/15 text-violet",
          v.scope === "OtherUser" && "bg-warn/15 text-warn",
        )}
      >
        {v.scope[0]}
      </span>
    </li>
  );
}

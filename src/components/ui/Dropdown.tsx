import { Popover } from "@hozo/core";
import { type ReactNode, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { Icon, type IconName } from "./Icon";
import { iconButtonClassName } from "./IconButton";
import { Tooltip } from "./Tooltip";

interface DropdownProps {
  /** The trigger: an icon button with this icon and accessible name. */
  triggerIcon: IconName;
  triggerLabel: string;
  /** Shown as a tooltip on the trigger, and read as its description. */
  triggerTitle?: string;
  triggerTestId?: string;
  children: ReactNode;
  align?: "left" | "right";
  panelClassName?: string;
  /** Accessible name for the panel. Not the same as the trigger's own label. */
  "aria-label": string;
}

/**
 * A floating panel anchored to an icon button: Hozo's Popover. The panel is
 * a non-modal `role="dialog"` and the trigger says `aria-haspopup="dialog"`,
 * not a `menu`, because the panel holds arbitrary controls (a native
 * <select>, not only menu items) and has no arrow-key navigation. Focus moves
 * into the panel when it opens and back to the trigger when it closes; it
 * closes on Escape, on a press outside, and when focus leaves it.
 */
export function Dropdown({
  triggerIcon,
  triggerLabel,
  triggerTitle,
  triggerTestId,
  children,
  align = "right",
  panelClassName,
  "aria-label": ariaLabel,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  // Hozo's Popover treats a press on its own trigger as a press outside the
  // panel: pointerdown closes it and the click then reopens it, so the trigger
  // can never close it (iray-tno/hozo#2255). Ignore that one dismissal and
  // let the click toggle.
  const pressingTrigger = useRef(false);
  const onOpenChange = (next: boolean) => {
    if (!next && pressingTrigger.current) {
      pressingTrigger.current = false;
      return;
    }
    setOpen(next);
  };

  return (
    // Hozo renders the trigger button itself, so the tooltip hangs on this
    // wrapper, and stays closed while the panel (also inside it) is open.
    <Tooltip content={triggerTitle} disabled={open}>
      <span
        className="relative inline-flex"
        onPointerDownCapture={(e) => {
          pressingTrigger.current = !!(e.target as Element).closest("[aria-haspopup]");
        }}
        onClickCapture={() => {
          pressingTrigger.current = false;
        }}
      >
        <Popover
          open={open}
          onOpenChange={onOpenChange}
          placement={align === "right" ? "bottom-end" : "bottom-start"}
          offset={4}
          accessibilityLabel={ariaLabel}
          triggerAccessibilityLabel={triggerLabel}
          triggerAccessibilityHint={triggerTitle}
          triggerTestID={triggerTestId}
          className="inline-flex"
          triggerClassName={iconButtonClassName()}
          panelClassName={cn(
            "min-w-[180px] rounded border border-rim bg-panel p-1 shadow-xl",
            panelClassName,
          )}
          trigger={<Icon name={triggerIcon} size={16} />}
        >
          {children}
        </Popover>
      </span>
    </Tooltip>
  );
}

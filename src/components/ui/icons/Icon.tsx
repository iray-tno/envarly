import type { ComponentType } from "react";
import { cn } from "../../../lib/cn";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  ExternalLinkIcon,
  FolderIcon,
  GlobeIcon,
  GripIcon,
  type IconSvgProps,
  InfoIcon,
  MinusIcon,
  MoonIcon,
  PlusIcon,
  RefreshIcon,
  ShieldIcon,
  SunIcon,
  TrashIcon,
  WarningIcon,
  XIcon,
} from ".";

export const iconNames = [
  "check",
  "chevron-down",
  "chevron-up",
  "copy",
  "external-link",
  "folder",
  "globe",
  "grip",
  "info",
  "minus",
  "moon",
  "plus",
  "refresh",
  "shield",
  "sun",
  "trash",
  "warning",
  "x",
] as const;

export type IconName = (typeof iconNames)[number];

interface IconProps {
  name: IconName;
  size?: 12 | 14 | 16 | 18 | 20 | 24 | 32 | 48;
  className?: string;
}

const icons: Record<IconName, ComponentType<IconSvgProps>> = {
  check: CheckIcon,
  "chevron-down": ChevronDownIcon,
  "chevron-up": ChevronUpIcon,
  copy: CopyIcon,
  "external-link": ExternalLinkIcon,
  folder: FolderIcon,
  globe: GlobeIcon,
  grip: GripIcon,
  info: InfoIcon,
  minus: MinusIcon,
  moon: MoonIcon,
  plus: PlusIcon,
  refresh: RefreshIcon,
  shield: ShieldIcon,
  sun: SunIcon,
  trash: TrashIcon,
  warning: WarningIcon,
  x: XIcon,
};

export function Icon({ name, size = 16, className }: IconProps) {
  const SvgIcon = icons[name];
  return (
    <SvgIcon
      aria-hidden="true"
      className={cn("inline-block shrink-0", className)}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 16 16"
      width={size}
    />
  );
}

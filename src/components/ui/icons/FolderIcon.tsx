import type { IconSvgProps } from "./types";

export function FolderIcon(props: IconSvgProps) {
  return (
    <svg {...props}>
      <path d="M2.5 5.5a1.5 1.5 0 0 1 1.5-1.5h2.7l1.5 1.5H12a1.5 1.5 0 0 1 1.5 1.5v.8" />
      <path d="M2.8 7.5h10.8a1 1 0 0 1 1 1.3l-.9 3.3a1.8 1.8 0 0 1-1.7 1.4H4a1.8 1.8 0 0 1-1.7-2.2l.8-3" />
    </svg>
  );
}

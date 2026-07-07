import type { IconSvgProps } from "./types";

export function TrashIcon(props: IconSvgProps) {
  return (
    <svg {...props}>
      <path d="M3.2 4.5h9.6" />
      <path d="M6.5 2.5h3l.5 2h-4z" />
      <path d="M5 6.3 5.5 13h5L11 6.3" />
      <path d="M7 7.5v3.7M9 7.5v3.7" />
    </svg>
  );
}

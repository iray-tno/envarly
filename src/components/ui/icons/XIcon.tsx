import type { IconSvgProps } from "./types";

export function XIcon(props: IconSvgProps) {
  return (
    <svg {...props}>
      <path d="M4.5 4.5 11.5 11.5" />
      <path d="M11.5 4.5 4.5 11.5" />
    </svg>
  );
}

import type { IconSvgProps } from "./types";

export function WarningIcon(props: IconSvgProps) {
  return (
    <svg {...props}>
      <path d="M7.1 2.8a1 1 0 0 1 1.8 0l5.1 9.4a1 1 0 0 1-.9 1.5H2.9a1 1 0 0 1-.9-1.5z" />
      <path d="M8 6v3" />
      <path d="M8 11.7h.01" />
    </svg>
  );
}

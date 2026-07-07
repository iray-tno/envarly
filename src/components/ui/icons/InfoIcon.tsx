import type { IconSvgProps } from "./types";

export function InfoIcon(props: IconSvgProps) {
  return (
    <svg {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7.5v3.7" />
      <path d="M8 4.8h.01" />
    </svg>
  );
}

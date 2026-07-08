import type { IconSvgProps } from "./types";

export function GlobeIcon(props: IconSvgProps) {
  return (
    <svg aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M2.5 8h11" />
      <path d="M8 2a9 9 0 0 1 0 12" />
      <path d="M8 2a9 9 0 0 0 0 12" />
    </svg>
  );
}

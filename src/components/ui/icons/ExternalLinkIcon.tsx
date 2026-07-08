import type { IconSvgProps } from "./types";

export function ExternalLinkIcon(props: IconSvgProps) {
  return (
    <svg aria-hidden="true" {...props}>
      <path d="M6.5 3.5h6v6" />
      <path d="m12.5 3.5-7 7" />
      <path d="M11.5 11.5v1a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h1" />
    </svg>
  );
}

import type { IconSvgProps } from "./types";

export function PencilIcon(props: IconSvgProps) {
  return (
    <svg aria-hidden="true" {...props}>
      <path d="m3 13 .8-3.2 6.9-6.9a1.2 1.2 0 0 1 1.7 0l.7.7a1.2 1.2 0 0 1 0 1.7l-6.9 6.9L3 13Z" />
      <path d="m9.8 3.8 2.4 2.4M3.8 9.8l2.4 2.4" />
    </svg>
  );
}

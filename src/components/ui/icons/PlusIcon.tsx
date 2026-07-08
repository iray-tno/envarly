import type { IconSvgProps } from "./types";

export function PlusIcon(props: IconSvgProps) {
  return (
    <svg aria-hidden="true" {...props}>
      <path d="M8 3.5v9" />
      <path d="M3.5 8h9" />
    </svg>
  );
}

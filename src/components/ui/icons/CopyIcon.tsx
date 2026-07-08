import type { IconSvgProps } from "./types";

export function CopyIcon(props: IconSvgProps) {
  return (
    <svg aria-hidden="true" {...props}>
      <rect x="5.5" y="5.5" width="7" height="7" rx="1.5" />
      <path d="M3.5 10.5h-.2A1.3 1.3 0 0 1 2 9.2V3.3A1.3 1.3 0 0 1 3.3 2h5.9a1.3 1.3 0 0 1 1.3 1.3v.2" />
    </svg>
  );
}

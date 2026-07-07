import type { IconSvgProps } from "./types";

export function RefreshIcon(props: IconSvgProps) {
  return (
    <svg {...props}>
      <path d="M12.5 7A4.5 4.5 0 0 0 4.8 4.3L3.5 5.6" />
      <path d="M3.5 2.5v3.1h3.1" />
      <path d="M3.5 9A4.5 4.5 0 0 0 11.2 11.7l1.3-1.3" />
      <path d="M12.5 13.5v-3.1H9.4" />
    </svg>
  );
}

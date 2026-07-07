import type { IconSvgProps } from "./types";

export function SunIcon(props: IconSvgProps) {
  return (
    <svg {...props}>
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1.8v1.4M8 12.8v1.4M1.8 8h1.4M12.8 8h1.4M3.6 3.6l1 1M11.4 11.4l1 1M12.4 3.6l-1 1M4.6 11.4l-1 1" />
    </svg>
  );
}

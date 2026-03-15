/**
 * 最小化图标，24×24 stroke。
 */
import { Icon } from "../Icon.tsx";
import type { IconComponentProps } from "../Icon.tsx";

const svg = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="w-full h-full"
    aria-hidden
  >
    <path d="M4 14h6v6M4 10l7-7M20 10h-6v6M14 4l7 7" />
  </svg>
);

export function IconMinimize2(props?: IconComponentProps) {
  return () => <Icon size={props?.size} class={props?.class}>{svg}</Icon>;
}

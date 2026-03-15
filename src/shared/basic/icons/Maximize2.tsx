/**
 * 最大化图标，24×24 stroke。
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
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

export function IconMaximize2(props?: IconComponentProps) {
  return () => <Icon size={props?.size} class={props?.class}>{svg}</Icon>;
}

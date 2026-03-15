/**
 * 右上箭头图标，24×24 stroke。
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
    <path d="M7 17L17 7M17 7h-6M17 7v6" />
  </svg>
);

export function IconArrowUpRight(props?: IconComponentProps) {
  return () => <Icon size={props?.size} class={props?.class}>{svg}</Icon>;
}

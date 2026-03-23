/**
 * 筛选（漏斗）图标，24×24 stroke。
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
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
  </svg>
);

export function IconFilter(props?: IconComponentProps) {
  return <Icon size={props?.size} class={props?.class}>{svg}</Icon>;
}

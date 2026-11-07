/**
 * 关门图标，24×24 stroke。
 */
import { Icon } from "../Icon.tsx";
import type { JSXRenderable } from "@dreamer/view";
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
    <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
    <path d="M2 20h20" />
    <path d="M14 12v.01" />
  </svg>
);

export function IconDoorClosed(props?: IconComponentProps): JSXRenderable {
  return <Icon size={props?.size} class={props?.class}>{svg}</Icon>;
}

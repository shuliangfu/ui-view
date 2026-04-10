/**
 * 播放图标，24×24 stroke。
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
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

export function IconPlay(props?: IconComponentProps): JSXRenderable {
  return <Icon size={props?.size} class={props?.class}>{svg}</Icon>;
}

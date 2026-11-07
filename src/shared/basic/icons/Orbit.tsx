/**
 * 轨道图标，24×24 stroke。
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
    <circle cx="12" cy="12" r="3" />
    <circle cx="19" cy="5" r="2" />
    <circle cx="5" cy="19" r="2" />
    <path d="M10.4 21.9a10 10 0 0 0 9.941-15.416" />
    <path d="M13.5 2.1a10 10 0 0 0-9.841 15.416" />
  </svg>
);

export function IconOrbit(props?: IconComponentProps): JSXRenderable {
  return <Icon size={props?.size} class={props?.class}>{svg}</Icon>;
}

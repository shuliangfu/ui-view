/**
 * 圆形客服耳麦图标，24×24 stroke。
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
    <circle cx="12" cy="12" r="10" />
    <path d="M7 12h2a1.5 1.5 0 011.5 1.5v1.5A1.5 1.5 0 019 16.5H8A1.5 1.5 0 016.5 15V12z" />
    <path d="M7 12a5 5 0 0110 0" />
    <path d="M17 12h-2a1.5 1.5 0 00-1.5 1.5v1.5A1.5 1.5 0 0015 16.5h1a1.5 1.5 0 001.5-1.5V12z" />
    <path d="M17 15v1a2.5 2.5 0 01-2.5 2.5H12" />
  </svg>
);

export function IconHeadsetCircle(props?: IconComponentProps): JSXRenderable {
  return <Icon size={props?.size} class={props?.class}>{svg}</Icon>;
}

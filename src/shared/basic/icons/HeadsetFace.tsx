/**
 * 头戴耳麦客服图标，24×24 stroke。圆形脸、双眼、耳罩与话筒。
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
    <path d="M5 13a7 7 0 0 1 14 0" />
    <path d="M5 13H3.5A1.5 1.5 0 0 0 2 14.5v3A1.5 1.5 0 0 0 3.5 19H5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2z" />
    <path d="M19 13h1.5A1.5 1.5 0 0 1 22 14.5v3A1.5 1.5 0 0 1 20.5 19H19a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z" />
    <circle cx="12" cy="14.5" r="3.6" />
    <path d="M10.5 14h.01" />
    <path d="M13.5 14h.01" />
    <path d="M19 18.5c.3 1.5-.5 2.7-2.4 3.1" />
  </svg>
);

export function IconHeadsetFace(props?: IconComponentProps): JSXRenderable {
  return <Icon size={props?.size} class={props?.class}>{svg}</Icon>;
}

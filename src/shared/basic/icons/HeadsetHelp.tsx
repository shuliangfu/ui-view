/**
 * 客服帮助（耳麦加问号）图标，24×24 stroke。
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
    <path d="M2 11h2.5a1.5 1.5 0 011.5 1.5v2A1.5 1.5 0 014.5 16H3.5A1.5 1.5 0 012 14.5V11z" />
    <path d="M2 11a6.5 6.5 0 0113 0" />
    <path d="M15 11h-2.5A1.5 1.5 0 0011 12.5v2A1.5 1.5 0 0012.5 16H13.5A1.5 1.5 0 0015 14.5V11z" />
    <path d="M15 14.5v1.2A3 3 0 0112 18.5H9" />
    <path d="M17.15 8.4a2.4 2.4 0 014.2 1.65c0 1.6-2.2 2.15-2.2 3.45M19.25 16.7h.01" />
  </svg>
);

export function IconHeadsetHelp(props?: IconComponentProps): JSXRenderable {
  return <Icon size={props?.size} class={props?.class}>{svg}</Icon>;
}

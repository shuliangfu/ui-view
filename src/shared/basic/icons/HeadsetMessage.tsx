/**
 * 在线客服（对话气泡加耳麦）图标，24×24 stroke。
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
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    <path d="M8 10h2a1 1 0 011 1v1.2a1 1 0 01-1 1H9a1 1 0 01-1-1V10z" />
    <path d="M8 10a4 4 0 018 0" />
    <path d="M16 10h-2a1 1 0 00-1 1v1.2a1 1 0 001 1h1a1 1 0 001-1V10z" />
    <path d="M16 12.4v.9a1.8 1.8 0 01-1.8 1.8H13" />
  </svg>
);

export function IconHeadsetMessage(props?: IconComponentProps): JSXRenderable {
  return <Icon size={props?.size} class={props?.class}>{svg}</Icon>;
}

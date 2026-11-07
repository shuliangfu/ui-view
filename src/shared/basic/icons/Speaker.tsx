/**
 * 扬声器图标，24×24 stroke。
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
    <rect width="16" height="20" x="4" y="2" rx="2" />
    <path d="M12 6h.01" />
    <circle cx="12" cy="14" r="4" />
    <path d="M12 14h.01" />
  </svg>
);

export function IconSpeaker(props?: IconComponentProps): JSXRenderable {
  return <Icon size={props?.size} class={props?.class}>{svg}</Icon>;
}

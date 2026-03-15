/**
 * 指纹/身份/签名图标，24×24 stroke。安全/生物识别场景。
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
    <path d="M12 10a4 4 0 0 1 4 4v6" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="M4.93 4.93l1.41 1.41" />
    <path d="M17.66 17.66l1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M6.34 17.66l-1.41 1.41" />
    <path d="M19.07 4.93l-1.41 1.41" />
    <path d="M12 6a6 6 0 0 1 6 6v2" />
    <path d="M12 14a2 2 0 0 0-2 2v4a2 2 0 0 0 4 0v-4a2 2 0 0 0-2-2z" />
  </svg>
);

export function IconFingerprint(props?: IconComponentProps) {
  return () => <Icon size={props?.size} class={props?.class}>{svg}</Icon>;
}

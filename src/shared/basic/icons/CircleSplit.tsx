/**
 * 正圆 **竖直对分**（左/右各半圆）：左半固定深黑、右半纯白，保证亮/暗对比，
 * 不因深色主题里 `currentColor` 偏亮而「两边都发白」。
 */
import { Icon } from "../Icon.tsx";
import type { JSXRenderable } from "@dreamer/view";
import type { IconComponentProps } from "../Icon.tsx";

/** 24×24：圆心 (12,12)，半径 9；左半弧 sweep=0，右半弧 sweep=1 */
const svg = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    class="w-full h-full"
    aria-hidden
  >
    {/* 左半圆（西侧），深黑 */}
    <path
      d="M12 3 A 9 9 0 0 0 12 21 Z"
      fill="#171717"
    />
    {/* 右半圆（东侧，经 3 点方向），白 — 与白底可分，外圈描边在最后层 */}
    <path
      d="M12 3 A 9 9 0 0 1 12 21 Z"
      fill="#ffffff"
    />
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      stroke-width="1"
      fill="none"
    />
  </svg>
);

/**
 * 圆竖直对分（左黑右白），多用于主题「自动」与 Sun / Moon 并排。
 *
 * @param props - `size`、`class`（外圈描边仍为 `currentColor`，便于与文案色对齐）
 */
export function IconCircleSplit(props?: IconComponentProps): JSXRenderable {
  return <Icon size={props?.size} class={props?.class}>{svg}</Icon>;
}

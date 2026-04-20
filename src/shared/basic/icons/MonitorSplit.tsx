/**
 * 显示器屏面 **竖直对分**：左半深黑、右半纯白，表示「浅色 / 深色 / 自动」中的跟随系统，
 * 与 {@link IconSun}、{@link IconMoon} 并列。
 * 外轮廓与底座为 `stroke`，避免整块 `fill` 盖住双色屏。
 */
import { Icon } from "../Icon.tsx";
import type { JSXRenderable } from "@dreamer/view";
import type { IconComponentProps } from "../Icon.tsx";

/** 屏内分区与 docs 示例一致：原始 1024 坐标系（内屏约 x96–896，y128–672） */
const SCREEN_LEFT = { x: 96, y: 128, w: 416, h: 544 } as const;
const SCREEN_RIGHT = { x: 512, y: 128, w: 384, h: 544 } as const;

/** 固定左黑右白，避免深色主题下 `currentColor` 变浅导致「一片灰白」 */
const FILL_LEFT = "#171717";
const FILL_RIGHT = "#ffffff";

/**
 * 机身 + 底座外轮廓（不含屏内分割），仅描边 {@link STROKE_OUTER}。
 * 由原单 path 去掉屏内矩形子路径得到。
 */
const STROKE_OUTER =
  "M928 64H96c-17.7 0-32 14.3-32 32v608c0 17.7 14.3 32 32 32h288L304 896h416L672 736h288c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32z";

const svg = (
  <svg
    viewBox="0 0 1024 1024"
    fill="none"
    class="w-full h-full"
    aria-hidden
  >
    {/* 屏幕左半（黑） */}
    <rect
      x={SCREEN_LEFT.x}
      y={SCREEN_LEFT.y}
      width={SCREEN_LEFT.w}
      height={SCREEN_LEFT.h}
      fill={FILL_LEFT}
    />
    {/* 屏幕右半（白） */}
    <rect
      x={SCREEN_RIGHT.x}
      y={SCREEN_RIGHT.y}
      width={SCREEN_RIGHT.w}
      height={SCREEN_RIGHT.h}
      fill={FILL_RIGHT}
    />
    {/* 机身 + 底座轮廓 */}
    <path
      d={STROKE_OUTER}
      fill="none"
      stroke="currentColor"
      stroke-width="32"
      stroke-linejoin="round"
    />
  </svg>
);

/**
 * 显示器半分主题图标（屏面左黑右白），供主题菜单与 Sun/Moon 配套。
 *
 * @param props - 与内置图标一致：可选 `size`、`class`
 */
export function IconMonitorSplit(props?: IconComponentProps): JSXRenderable {
  return <Icon size={props?.size} class={props?.class}>{svg}</Icon>;
}

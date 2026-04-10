/**
 * Tooltip 悬停提示（View）。
 * 桌面常用：触发器悬停时显示气泡；支持 placement、箭头。
 *
 * **布局**：相对包裹层 `position:relative`，气泡为同包裹层内 `position:absolute`，按 `placement` 对齐到触发内容边缘。
 * 若祖先存在 `overflow: hidden | auto`，气泡可能被裁切（有意不挂 Portal，由调用方控制布局）。
 */

import { twMerge } from "tailwind-merge";
import type { JSXRenderable } from "@dreamer/view";

export type TooltipPlacement =
  | "top"
  | "topLeft"
  | "topRight"
  | "bottom"
  | "bottomLeft"
  | "bottomRight"
  | "left"
  | "leftTop"
  | "leftBottom"
  | "right"
  | "rightTop"
  | "rightBottom";

export interface TooltipProps {
  /** 提示文案或节点 */
  content: string | unknown;
  /** 气泡位置，默认 "top" */
  placement?: TooltipPlacement;
  /** 触发元素（子节点） */
  children?: unknown;
  /** 是否显示箭头，默认 true */
  arrow?: boolean;
  /** 额外 class（作用于包装器） */
  class?: string;
  /** 气泡内容区 class */
  overlayClass?: string;
}

/**
 * 箭头：在气泡内的方位（与 placement 对应）。
 *
 * @param placement - 气泡相对触发器的方位
 * @returns Tailwind 定位类名字符串
 */
function arrowClass(placement: TooltipPlacement): string {
  const base = "absolute w-2 h-2 rotate-45 bg-slate-800 dark:bg-slate-700";
  if (placement.startsWith("top")) {
    return `${base} bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2`;
  }
  if (placement.startsWith("bottom")) {
    return `${base} top-0 left-1/2 -translate-x-1/2 -translate-y-1/2`;
  }
  if (placement.startsWith("left")) {
    return `${base} right-0 top-1/2 -translate-y-1/2 translate-x-1/2`;
  }
  if (placement.startsWith("right")) {
    return `${base} left-0 top-1/2 -translate-y-1/2 -translate-x-1/2`;
  }
  return base;
}

/** 相对包裹层、按 placement 对齐的 Tailwind 类（与触发内容同一包含块） */
const placementClasses: Record<TooltipPlacement, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  topLeft: "bottom-full left-0 mb-2",
  topRight: "bottom-full right-0 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  bottomLeft: "top-full left-0 mt-2",
  bottomRight: "top-full right-0 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  leftTop: "right-full top-0 mr-2",
  leftBottom: "right-full bottom-0 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
  rightTop: "left-full top-0 ml-2",
  rightBottom: "left-full bottom-0 ml-2",
};

/**
 * 悬停提示：包裹 `children`，悬停时在同层绝对定位展示 `content`。
 *
 * @param props - {@link TooltipProps}
 * @returns 包装器与气泡节点
 */
export function Tooltip(props: TooltipProps): JSXRenderable {
  const {
    content,
    placement = "top",
    children,
    arrow = true,
    class: className,
    overlayClass,
  } = props;

  const tooltipId = `tooltip-${Math.random().toString(36).slice(2, 11)}`;
  const arrowCls = arrow ? arrowClass(placement) : "";
  const posCls = placementClasses[placement];

  return (
    <span
      class={twMerge("relative inline-flex group", className)}
      aria-describedby={tooltipId}
    >
      {children}
      <span
        id={tooltipId}
        role="tooltip"
        class={twMerge(
          // w-max：在窄包含块（仅触发器宽）内避免 shrink-to-fit 把宽度压成一字一行；max-w 限制长文案再换行
          "absolute z-1070 w-max max-w-[min(20rem,calc(100vw-1rem))] px-3 py-1.5 text-xs font-normal text-white text-left whitespace-normal break-words rounded-md bg-slate-800 dark:bg-slate-700 shadow-lg",
          "opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-150 pointer-events-none box-border",
          posCls,
          overlayClass,
        )}
      >
        {typeof content === "string" ? content : content}
        {arrow && <span class={arrowCls} />}
      </span>
    </span>
  );
}

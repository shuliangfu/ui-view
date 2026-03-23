/**
 * Tooltip 悬停提示（View）。
 * 桌面常用：触发器悬停时显示气泡；支持 placement、箭头、延迟（通过 CSS 或需上层 state）。
 * 当前实现为 CSS 悬停显示，无延迟；若需受控或延迟可由上层配合 state 实现。
 */

import { twMerge } from "tailwind-merge";

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

/** 箭头朝向对应的 border 色（与背景一致） */
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

export function Tooltip(props: TooltipProps) {
  const {
    content,
    placement = "top",
    children,
    arrow = true,
    class: className,
    overlayClass,
  } = props;

  const posCls = placementClasses[placement];
  const arrowCls = arrow ? arrowClass(placement) : "";
  /** 实例级稳定 id，供 aria-describedby；无内部 signal，直接返回 VNode */
  const tooltipId = `tooltip-${Math.random().toString(36).slice(2, 11)}`;

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
          "absolute z-50 px-3 py-1.5 text-xs font-normal text-white whitespace-nowrap rounded-md bg-slate-800 dark:bg-slate-700 shadow-lg",
          "opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-150 pointer-events-none",
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

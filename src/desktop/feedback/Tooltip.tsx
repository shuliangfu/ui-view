/**
 * Tooltip 悬停提示（View）。
 * 桌面常用：触发器悬停时显示气泡；支持 placement、箭头。
 *
 * **布局**：有可用 `document.body` 时，气泡经 {@link createPortal} 挂到 body，`position:fixed` + 视口坐标，
 * 避免祖先 `overflow: hidden | auto` 裁切；否则回退为包裹层内 `absolute`（SSR / hybrid）。
 */

import {
  createPortal,
  createRef,
  createRenderEffect,
  createSignal,
  type JSXRenderable,
  onCleanup,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { getBrowserBodyPortalHost } from "../../shared/feedback/portal-host.ts";

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
  /** 气泡内容区 class（含 z-index 等，便于全屏编辑器等抬高） */
  overlayClass?: string;
}

const TOOLTIP_VIEWPORT_GAP_PX = 8;

/** 占位矩形，仅作 {@link createSignal} 初值，首帧 hover 前即会被 {@link syncFloatGeometry} 覆盖 */
const EMPTY_DOM_RECT = {
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0,
  x: 0,
  y: 0,
} as unknown as DOMRect;

/**
 * 根据触发器视口矩形与 placement，计算 Portal 浮层 `fixed` 的 left/top/transform（像素）。
 *
 * @param placement - 气泡相对触发器的方位
 * @param rect - 触发器 {@link DOMRect}
 * @param gap - 与触发器边距（px）
 */
function getTooltipFixedStyle(
  placement: TooltipPlacement,
  rect: DOMRect,
  gap: number,
): { left: string; top: string; transform: string } {
  const L = rect.left;
  const R = rect.right;
  const T = rect.top;
  const B = rect.bottom;
  const cx = L + rect.width / 2;
  const cy = T + rect.height / 2;
  switch (placement) {
    case "top":
      return {
        left: `${cx}px`,
        top: `${T - gap}px`,
        transform: "translate(-50%, -100%)",
      };
    case "topLeft":
      return {
        left: `${L}px`,
        top: `${T - gap}px`,
        transform: "translate(0, -100%)",
      };
    case "topRight":
      return {
        left: `${R}px`,
        top: `${T - gap}px`,
        transform: "translate(-100%, -100%)",
      };
    case "bottom":
      return {
        left: `${cx}px`,
        top: `${B + gap}px`,
        transform: "translate(-50%, 0)",
      };
    case "bottomLeft":
      return {
        left: `${L}px`,
        top: `${B + gap}px`,
        transform: "translate(0, 0)",
      };
    case "bottomRight":
      return {
        left: `${R}px`,
        top: `${B + gap}px`,
        transform: "translate(-100%, 0)",
      };
    case "left":
      return {
        left: `${L - gap}px`,
        top: `${cy}px`,
        transform: "translate(-100%, -50%)",
      };
    case "leftTop":
      return {
        left: `${L - gap}px`,
        top: `${T}px`,
        transform: "translate(-100%, 0)",
      };
    case "leftBottom":
      return {
        left: `${L - gap}px`,
        top: `${B}px`,
        transform: "translate(-100%, -100%)",
      };
    case "right":
      return {
        left: `${R + gap}px`,
        top: `${cy}px`,
        transform: "translate(0, -50%)",
      };
    case "rightTop":
      return {
        left: `${R + gap}px`,
        top: `${T}px`,
        transform: "translate(0, 0)",
      };
    case "rightBottom":
      return {
        left: `${R + gap}px`,
        top: `${B}px`,
        transform: "translate(0, -100%)",
      };
    default:
      return {
        left: `${cx}px`,
        top: `${T - gap}px`,
        transform: "translate(-50%, -100%)",
      };
  }
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

/** 相对包裹层、按 placement 对齐（仅无 Portal 时的回退路径） */
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

const bubbleInnerCls =
  "relative w-max max-w-[min(20rem,calc(100vw-1rem))] px-3 py-1.5 text-xs font-normal text-white text-left whitespace-normal break-words rounded-md bg-slate-800 dark:bg-slate-700 shadow-lg box-border";

/**
 * 悬停提示：包裹 `children`，有 `body` 时将气泡 Portal 到文档根，避免 overflow 裁切。
 *
 * @param props - {@link TooltipProps}
 * @returns 包装器与（悬停时）Portal 气泡
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

  const wrapRef = createRef<HTMLSpanElement>(null);
  const visible = createSignal(false);
  const floatStyle = createSignal(
    getTooltipFixedStyle(placement, EMPTY_DOM_RECT, TOOLTIP_VIEWPORT_GAP_PX),
  );

  const portalHostOk = getBrowserBodyPortalHost() != null;

  const syncFloatGeometry = () => {
    const el = wrapRef.current;
    if (el == null) return;
    floatStyle.value = getTooltipFixedStyle(
      placement,
      el.getBoundingClientRect(),
      TOOLTIP_VIEWPORT_GAP_PX,
    );
  };

  const onEnter = () => {
    syncFloatGeometry();
    visible.value = true;
  };
  const onLeave = () => {
    visible.value = false;
  };

  createRenderEffect(() => {
    /** View 的 {@link createSignal} 用 `.value` 读写，勿写成 `visible()`（不会订阅、条件恒错） */
    if (!portalHostOk || !visible.value) return;
    const host = getBrowserBodyPortalHost();
    if (host == null) return;

    const onScrollOrResize = () => {
      syncFloatGeometry();
    };
    syncFloatGeometry();
    globalThis.addEventListener?.("scroll", onScrollOrResize, true);
    globalThis.addEventListener?.("resize", onScrollOrResize);

    const root = createPortal(() => {
      const st = floatStyle.value;
      return (
        <div
          id={tooltipId}
          role="tooltip"
          class={twMerge(
            "fixed z-[1070] pointer-events-none transition-opacity duration-150 opacity-100 visible",
            overlayClass,
          )}
          style={{
            left: st.left,
            top: st.top,
            transform: st.transform,
          }}
        >
          <div class={bubbleInnerCls}>
            {typeof content === "string" ? content : content}
            {arrow && <span class={arrowCls} />}
          </div>
        </div>
      );
    }, host);

    onCleanup(() => {
      globalThis.removeEventListener?.("scroll", onScrollOrResize, true);
      globalThis.removeEventListener?.("resize", onScrollOrResize);
      root.unmount();
    });
  });

  if (!portalHostOk) {
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

  return (
    <span
      ref={wrapRef}
      class={twMerge("relative inline-flex", className)}
      aria-describedby={() => (visible.value ? tooltipId : undefined)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {children}
    </span>
  );
}

/**
 * Tooltip 悬停提示（View）。
 * 桌面常用：触发器悬停时显示气泡；支持 placement、箭头。
 *
 * **溢出**：原先 `position:absolute` 气泡在 `overflow:auto` 的主内容区内会被裁切；在存在 `document.body` 时，
 * 气泡经 {@link createPortal} 挂到 `body`，`position:fixed` + 视口 clamp，避免贴左/贴右时被侧栏或滚动容器裁掉。
 * 无 `body`（纯 SSR 字符串）时退回内联绝对定位（与旧行为一致）。
 */

import { createRenderEffect, createSignal, onCleanup } from "@dreamer/view";
import { createPortal } from "@dreamer/view";
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

/** 触发器与气泡间距（px） */
const GAP_PX = 8;
/** 与视口边缘留白（px） */
const VIEW_MARGIN_PX = 8;

/**
 * 是否可将浮层挂到页面 `body`（与 Drawer/Modal 同向）。
 *
 * @returns 可作为 Portal 容器的 `body`，否则 `null`
 */
function getBrowserBodyPortalHost(): HTMLElement | null {
  try {
    if (typeof globalThis.document === "undefined") return null;
    const b = globalThis.document.body;
    if (b == null || b.nodeType !== 1) return null;
    return b as HTMLElement;
  } catch {
    return null;
  }
}

/**
 * 按 placement 计算理想 `fixed` 左上角（视口坐标），再夹紧到视口内。
 *
 * @param tr - 触发器 `getBoundingClientRect()`
 * @param fr - 气泡 `getBoundingClientRect()`
 * @param placement - 方位
 * @returns 气泡 `left`/`top`（px）
 */
function computeFixedPosition(
  tr: DOMRect,
  fr: DOMRect,
  placement: TooltipPlacement,
): { top: number; left: number } {
  const g = GAP_PX;
  let top = 0;
  let left = 0;

  switch (placement) {
    case "top":
      top = tr.top - fr.height - g;
      left = tr.left + tr.width / 2 - fr.width / 2;
      break;
    case "topLeft":
      top = tr.top - fr.height - g;
      left = tr.left;
      break;
    case "topRight":
      top = tr.top - fr.height - g;
      left = tr.right - fr.width;
      break;
    case "bottom":
      top = tr.bottom + g;
      left = tr.left + tr.width / 2 - fr.width / 2;
      break;
    case "bottomLeft":
      top = tr.bottom + g;
      left = tr.left;
      break;
    case "bottomRight":
      top = tr.bottom + g;
      left = tr.right - fr.width;
      break;
    case "left":
      top = tr.top + tr.height / 2 - fr.height / 2;
      left = tr.left - fr.width - g;
      break;
    case "leftTop":
      top = tr.top;
      left = tr.left - fr.width - g;
      break;
    case "leftBottom":
      top = tr.bottom - fr.height;
      left = tr.left - fr.width - g;
      break;
    case "right":
      top = tr.top + tr.height / 2 - fr.height / 2;
      left = tr.right + g;
      break;
    case "rightTop":
      top = tr.top;
      left = tr.right + g;
      break;
    case "rightBottom":
      top = tr.bottom - fr.height;
      left = tr.right + g;
      break;
    default:
      top = tr.top - fr.height - g;
      left = tr.left + tr.width / 2 - fr.width / 2;
  }

  const vw = typeof globalThis.innerWidth === "number"
    ? globalThis.innerWidth
    : 0;
  const vh = typeof globalThis.innerHeight === "number"
    ? globalThis.innerHeight
    : 0;
  const m = VIEW_MARGIN_PX;
  if (vw > 0 && vh > 0) {
    left = Math.min(Math.max(m, left), Math.max(m, vw - fr.width - m));
    top = Math.min(Math.max(m, top), Math.max(m, vh - fr.height - m));
  }
  return { top, left };
}

/** 箭头：在气泡内的方位（与 placement 对应） */
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

/** 无 Portal 时内联绝对定位的 Tailwind 类 */
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

export function Tooltip(props: TooltipProps) {
  const {
    content,
    placement = "top",
    children,
    arrow = true,
    class: className,
    overlayClass,
  } = props;

  /** 悬停时展示浮层 */
  const visible = createSignal(false);
  /** Portal 浮层 `fixed` 坐标（视口 px） */
  const fixedPos = createSignal({ top: 0, left: 0 });
  /** 量完尺寸后再淡入，避免从 (0,0) 闪动 */
  const overlayReady = createSignal(false);

  /** 触发器 DOM */
  let triggerEl: HTMLElement | null = null;
  /** Portal 内气泡根节点 */
  let floatingEl: HTMLElement | null = null;

  const tooltipId = `tooltip-${Math.random().toString(36).slice(2, 11)}`;
  const arrowCls = arrow ? arrowClass(placement) : "";

  /**
   * 根据触发器与浮层矩形写回 `fixedPos`。
   */
  const runPositionUpdate = () => {
    if (triggerEl == null || floatingEl == null) return;
    const tr = triggerEl.getBoundingClientRect();
    const fr = floatingEl.getBoundingClientRect();
    if (fr.width < 1 || fr.height < 1) return;
    fixedPos.value = computeFixedPosition(tr, fr, placement);
    overlayReady.value = true;
  };

  /**
   * 双 rAF：浮层挂载并完成布局后再量 `getBoundingClientRect`。
   */
  const schedulePositionUpdate = () => {
    let id0 = 0;
    let id1 = 0;
    id0 = globalThis.requestAnimationFrame(() => {
      id1 = globalThis.requestAnimationFrame(() => {
        runPositionUpdate();
      });
    });
    return () => {
      globalThis.cancelAnimationFrame(id0);
      globalThis.cancelAnimationFrame(id1);
    };
  };

  /**
   * 触发器 ref。
   */
  const setTriggerRef = (el: unknown) => {
    if (el != null && typeof el === "object" && "getBoundingClientRect" in el) {
      triggerEl = el as HTMLElement;
    } else {
      triggerEl = null;
    }
  };

  /**
   * 浮层根 ref：挂载后再调度量测。
   */
  const setFloatingRef = (el: unknown) => {
    if (el != null && typeof el === "object" && "getBoundingClientRect" in el) {
      floatingEl = el as HTMLElement;
      if (visible.value) {
        schedulePositionUpdate();
      }
    } else {
      floatingEl = null;
    }
  };

  /**
   * `visible` 为 true 且存在 `body` 时挂 Portal；`onCleanup` 卸载并清引用。
   */
  createRenderEffect(() => {
    if (!visible.value) {
      overlayReady.value = false;
      return;
    }
    const portalHost = getBrowserBodyPortalHost();
    if (portalHost == null) return;

    const root = createPortal(
      () => {
        const p = fixedPos.value;
        const r = overlayReady.value;
        return (
          <div
            ref={setFloatingRef}
            id={tooltipId}
            role="tooltip"
            class={twMerge(
              "fixed z-1070 max-w-[min(20rem,calc(100vw-1rem))] px-3 py-1.5 text-xs font-normal text-white text-left whitespace-normal wrap-break-word rounded-md bg-slate-800 dark:bg-slate-700 shadow-lg pointer-events-none box-border",
              !r && "opacity-0",
              r && "opacity-100 transition-opacity duration-150",
              overlayClass,
            )}
            style={{
              top: `${p.top}px`,
              left: `${p.left}px`,
            }}
          >
            {typeof content === "string" ? content : content}
            {arrow && <span class={arrowCls} />}
          </div>
        );
      },
      portalHost,
    );

    onCleanup(() => {
      root.unmount();
      floatingEl = null;
    });
  });

  /**
   * 悬停期间随滚动、缩放重算位置（捕获阶段可收到 `overflow` 子树滚动）。
   */
  createRenderEffect(() => {
    if (!visible.value) return;
    const portalHost = getBrowserBodyPortalHost();
    if (portalHost == null) return;

    const onScrollOrResize = () => {
      runPositionUpdate();
    };
    globalThis.addEventListener("scroll", onScrollOrResize, true);
    globalThis.addEventListener("resize", onScrollOrResize);
    onCleanup(() => {
      globalThis.removeEventListener("scroll", onScrollOrResize, true);
      globalThis.removeEventListener("resize", onScrollOrResize);
    });
  });

  const usePortal = getBrowserBodyPortalHost() != null;

  const onEnter = () => {
    visible.value = true;
    overlayReady.value = false;
  };
  const onLeave = () => {
    visible.value = false;
    overlayReady.value = false;
  };

  if (usePortal) {
    return (
      <span
        ref={setTriggerRef}
        class={twMerge("relative inline-flex", className)}
        aria-describedby={tooltipId}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {children}
      </span>
    );
  }

  /** 无 `body`：退回 CSS 悬停（仍可能被 overflow 裁切） */
  const posCls = placementClasses[placement];
  return (
    <span
      ref={setTriggerRef}
      class={twMerge("relative inline-flex group", className)}
      aria-describedby={tooltipId}
    >
      {children}
      <span
        id={tooltipId}
        role="tooltip"
        class={twMerge(
          "absolute z-50 max-w-[min(20rem,calc(100vw-1rem))] px-3 py-1.5 text-xs font-normal text-white text-left whitespace-normal wrap-break-word rounded-md bg-slate-800 dark:bg-slate-700 shadow-lg",
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

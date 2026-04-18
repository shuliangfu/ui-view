/**
 * Popover 弹出面板（View）。
 * 桌面常用：悬停触发，显示带标题的面板；支持 placement、箭头。
 * 浮层经 {@link Portal} 挂到 `document.body` 且 `position: fixed`，与触发器视口坐标对齐，避免被祖先 `overflow` 裁剪；
 * 显示期间用 `requestAnimationFrame` 持续同步 `getBoundingClientRect`（与 Popconfirm、Dropdown 的 body + fixed 浮层策略一致）以跟滚动同帧。
 */

import { createEffect, createSignal, Portal, Show } from "@dreamer/view";
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { computePopFixedStyle } from "./popFixedStyle.ts";

export type PopoverPlacement =
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

export interface PopoverProps {
  /** 面板标题（可选） */
  title?: string | null;
  /** 面板内容 */
  content: string | unknown;
  /** 气泡位置，默认 "top" */
  placement?: PopoverPlacement;
  /** 触发元素（子节点） */
  children?: unknown;
  /** 是否显示箭头，默认 true */
  arrow?: boolean;
  /** 额外 class（作用于包装器） */
  class?: string;
  /** 面板容器 class */
  overlayClass?: string;
  /**
   * 进入触发区后多少 ms 再显示，默认 0。
   * Portal 后浮层在 body，需用延迟配合 `hoverCloseDelay` 从触发区移入浮层。
   */
  hoverOpenDelay?: number;
  /**
   * 离开触发/浮层后多少 ms 再收起，默认 100。
   */
  hoverCloseDelay?: number;
}

/**
 * 小箭头 class：与原先 `w-2 h-2 rotate-45` 缺边样式一致，相对面板 `relative` 根绝对定位。
 *
 * @param p - 气泡方位
 * @returns 箭头根节点 class
 */
function arrowClass(p: PopoverPlacement): string {
  const base =
    "absolute w-2 h-2 rotate-45 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600";
  if (p.startsWith("top")) {
    return `${base} bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-t-0 border-l-0`;
  }
  if (p.startsWith("bottom")) {
    return `${base} top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-b-0 border-r-0`;
  }
  if (p.startsWith("left")) {
    return `${base} right-0 top-1/2 -translate-y-1/2 translate-x-1/2 border-b-0 border-l-0`;
  }
  if (p.startsWith("right")) {
    return `${base} left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 border-t-0 border-r-0`;
  }
  return base;
}

export function Popover(props: PopoverProps): JSXRenderable {
  const {
    title,
    content,
    placement = "top",
    children,
    arrow = true,
    class: className,
    overlayClass,
    hoverOpenDelay = 0,
    hoverCloseDelay = 100,
  } = props;

  /** 本组件实例的悬停延迟，避免多 Popover 共用导致互相取消计时器 */
  const hoverTimers = { open: 0, close: 0 } as { open: number; close: number };
  const clearHoverOpenCloseTimers = () => {
    if (hoverTimers.open) {
      globalThis.clearTimeout(hoverTimers.open);
      hoverTimers.open = 0;
    }
    if (hoverTimers.close) {
      globalThis.clearTimeout(hoverTimers.close);
      hoverTimers.close = 0;
    }
  };

  /** 是否展示 Portal 内容（等效于原先 `group-hover` 显示） */
  const showOverlay = createSignal(false);
  /** 挂到 body 的 `fixed` 外层的内联位置（`computePopFixedStyle` 结果） */
  const portalFixedStyle = createSignal<Record<string, string>>({});
  const arrowCls = arrow ? arrowClass(placement) : "";
  let triggerEl: HTMLElement | null = null;

  /**
   * 显示浮层时：rAF 循环 + resize 复用与 Dropdown/Popconfirm 同策略，保证全页与容器内滚动不脱节。
   */
  createEffect(() => {
    if (!showOverlay.value || typeof globalThis.window === "undefined") {
      portalFixedStyle.value = {};
      return;
    }
    void placement;
    const run = () => {
      if (!triggerEl) return;
      const tr = triggerEl.getBoundingClientRect();
      portalFixedStyle.value = computePopFixedStyle(tr, placement);
    };
    run();
    let rafLoop = 0;
    let running = true;
    const keepAligned = () => {
      if (!running) return;
      run();
      rafLoop = globalThis.requestAnimationFrame(keepAligned);
    };
    rafLoop = globalThis.requestAnimationFrame(keepAligned);
    const onResize = () => run();
    globalThis.window.addEventListener("resize", onResize);
    const vv = globalThis.visualViewport;
    if (vv) {
      vv.addEventListener("resize", onResize);
    }
    return () => {
      running = false;
      clearHoverOpenCloseTimers();
      globalThis.cancelAnimationFrame(rafLoop);
      globalThis.window.removeEventListener("resize", onResize);
      if (vv) {
        vv.removeEventListener("resize", onResize);
      }
    };
  });

  /**
   * 进入触发区或已挂载的浮层：取消关闭、预约或立即显示。
   */
  const onHoverEnter = () => {
    if (hoverTimers.close) {
      globalThis.clearTimeout(hoverTimers.close);
      hoverTimers.close = 0;
    }
    if (hoverOpenDelay <= 0) {
      showOverlay.value = true;
    } else {
      hoverTimers.open = globalThis.setTimeout(() => {
        showOverlay.value = true;
        hoverTimers.open = 0;
      }, hoverOpenDelay);
    }
  };

  /**
   * 离开触发/浮层：若未进入另一侧则延迟收起。
   */
  const onHoverLeave = () => {
    if (hoverTimers.open) {
      globalThis.clearTimeout(hoverTimers.open);
      hoverTimers.open = 0;
    }
    hoverTimers.close = globalThis.setTimeout(() => {
      showOverlay.value = false;
      hoverTimers.close = 0;
    }, hoverCloseDelay);
  };

  return (
    <span
      class={twMerge("relative inline-flex", className)}
      ref={(el: HTMLElement) => {
        triggerEl = el;
      }}
      onMouseEnter={onHoverEnter as (e: Event) => void}
      onMouseLeave={onHoverLeave as (e: Event) => void}
    >
      {children}
      {typeof globalThis.document !== "undefined" && (
        <Show when={() => showOverlay.value}>
          <Portal mount={globalThis.document.body}>
            <div
              class="pointer-events-auto fixed z-50 min-w-0 max-w-[min(320px,calc(100vw-1rem))] overflow-visible transition-opacity duration-150"
              style={() =>
                portalFixedStyle.value}
              onMouseEnter={onHoverEnter as (e: Event) => void}
              onMouseLeave={onHoverLeave as (e: Event) => void}
            >
              <span
                class={twMerge(
                  "relative z-0 block min-w-[140px] max-w-[320px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg text-slate-900 dark:text-slate-100",
                  overlayClass,
                )}
              >
                {title != null && title !== "" && (
                  <div class="px-3 py-2 border-b border-slate-200 dark:border-slate-600 font-medium text-sm">
                    {title}
                  </div>
                )}
                <div class="px-3 py-2 text-sm">
                  {typeof content === "string" ? content : content}
                </div>
                {arrow && <span class={arrowCls} />}
              </span>
            </div>
          </Portal>
        </Show>
      )}
    </span>
  );
}

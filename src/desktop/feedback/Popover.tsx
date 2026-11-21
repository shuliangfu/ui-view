/**
 * Popover 弹出面板（View）。
 * 桌面常用：默认悬停触发，也可 `trigger="click"` 点击开关；显示带标题的面板；支持 placement、箭头。
 * 展开默认内部维护，也可传受控 `open` + `onOpenChange`；`disabled` 时不响应触发并收起。
 * `placement="auto"` 时优选上方，边挡住则朝相反方向展开，箭头跟随实际方位。
 * 浮层经 {@link Portal} 挂到 `document.body` 且 `position: fixed`，与触发器视口坐标对齐，避免被祖先 `overflow` 裁剪；
 * 显示期间用 `requestAnimationFrame` 持续同步 `getBoundingClientRect`（与 Popconfirm、Dropdown 的 body + fixed 浮层策略一致）以跟滚动同帧。
 */

import {
  createEffect,
  createMemo,
  createSignal,
  Portal,
  Show,
} from "@dreamer/view";
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import {
  type ControlledOpenInput,
  readControlledOpenInput,
} from "../../shared/feedback/controlled-open.ts";
import {
  type AutoPopPlacement,
  computeArrowAnchorStyle,
  computeAutoPopFixedStyle,
  type FullPopStylePlacement,
  popArrowSide,
  type PopSize,
} from "./popFixedStyle.ts";

/** 含 `auto`：优选上方并在贴边时翻转；写死方位不翻转 */
export type PopoverPlacement = AutoPopPlacement;

export interface PopoverProps {
  /** 面板标题（可选） */
  title?: string | null;
  /** 面板内容 */
  content: string | unknown;
  /** 气泡位置，默认 `"top"`；传 `"auto"` 时优选上方，边挡住则朝相反方向展开，箭头跟随实际方位 */
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
   * 仅 `trigger="hover"` 时生效。
   */
  hoverOpenDelay?: number;
  /**
   * 离开触发/浮层后多少 ms 再收起，默认 100。
   * 仅 `trigger="hover"` 时生效。
   */
  hoverCloseDelay?: number;
  /**
   * 触发方式，默认 `"hover"`。
   * `"click"` 时点击触发器开关，再次点击、点击外部或按 Escape 关闭。
   */
  trigger?: "hover" | "click";
  /**
   * 受控展开。不传则内部维护。
   * 传 `createSignal` 返回值、`() => boolean` 或 boolean（与 Dropdown / Modal 一致；勿传 `sig.value` 快照）。
   */
  open?: ControlledOpenInput;
  /** 打开/关闭时回调；受控时须在此写回 `open` 对应 signal */
  onOpenChange?: (open: boolean) => void;
  /**
   * 为 true 时不响应触发且强制收起。
   * 可传零参 getter 以订阅 Signal。
   */
  disabled?: boolean | (() => boolean);
}

/** 解析 {@link PopoverProps.disabled}（字面量或零参 getter）。 */
function readPopoverDisabled(
  disabled: boolean | (() => boolean) | undefined,
): boolean {
  if (disabled == null) return false;
  return typeof disabled === "function" ? disabled() : disabled;
}

/**
 * 箭头外观 class（色彩、缺边）；沿边位置由 {@link computeArrowAnchorStyle} 对准触发器中线。
 *
 * @param p - 气泡方位
 * @returns 箭头根节点 class
 */
function arrowClass(p: FullPopStylePlacement): string {
  const base =
    "absolute w-2 h-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600";
  const side = popArrowSide(p);
  if (side === "bottom") return `${base} border-t-0 border-l-0`;
  if (side === "top") return `${base} border-b-0 border-r-0`;
  if (side === "right") return `${base} border-b-0 border-l-0`;
  if (side === "left") return `${base} border-t-0 border-r-0`;
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
    trigger = "hover",
    onOpenChange,
  } = props;
  const isClick = trigger === "click";

  /** 本组件实例的悬停延迟，避免多 Popover 共用导致互相取消计时器 */
  const hoverTimers: {
    open: ReturnType<typeof globalThis.setTimeout> | 0;
    close: ReturnType<typeof globalThis.setTimeout> | 0;
  } = { open: 0, close: 0 };
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

  /** 非受控时的内部展开状态 */
  const openState = createSignal(false);
  const isControlled = () => props.open !== undefined;
  /** 当前是否展开（受控读 `props.open`，否则读内部 signal） */
  const isOpen = createMemo(() =>
    isControlled() ? readControlledOpenInput(props.open) : openState.value
  );
  /** 写展开态：非受控改内部 signal；始终通知 onOpenChange（受控方须写回） */
  const setOpen = (value: boolean) => {
    if (readPopoverDisabled(props.disabled) && value) return;
    if (!isControlled()) openState.value = value;
    onOpenChange?.(value);
  };
  /** 挂到 body 的 `fixed` 外层的内联位置（`computeAutoPopFixedStyle` 结果） */
  const portalFixedStyle = createSignal<Record<string, string>>({});
  const preferred: AutoPopPlacement = placement;
  const initialResolved: FullPopStylePlacement = preferred === "auto"
    ? "top"
    : preferred;
  const resolvedPlacement = createSignal<FullPopStylePlacement>(
    initialResolved,
  );
  const popupSize = createSignal<PopSize>({ width: 0, height: 0 });
  const arrowStyle = createSignal<Record<string, string>>({});
  let triggerEl: HTMLElement | null = null;
  let overlayEl: HTMLElement | null = null;

  /**
   * 点击触发：打开后在 document 冒泡阶段关外部点击，并监听 Escape。
   * 双 rAF 后再武装，避免打开的同一次点击立刻关掉（与 Popconfirm 相同）。
   */
  createEffect(() => {
    if (readPopoverDisabled(props.disabled) && isOpen()) {
      setOpen(false);
    }
  });

  createEffect(() => {
    if (
      !isClick || !isOpen() ||
      typeof globalThis.document === "undefined"
    ) {
      return;
    }
    const doc = globalThis.document;
    let armed = false;
    let armRaf0 = 0;
    let armRaf1 = 0;
    armRaf0 = globalThis.requestAnimationFrame(() => {
      armRaf1 = globalThis.requestAnimationFrame(() => {
        armed = true;
      });
    });
    const onDocumentClickBubble = (e: Event) => {
      if (!armed) return;
      const t = e.target;
      if (!(t instanceof globalThis.Node)) return;
      if (triggerEl != null && triggerEl.contains(t)) return;
      if (overlayEl != null && overlayEl.contains(t)) return;
      setOpen(false);
    };
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    doc.addEventListener("click", onDocumentClickBubble, false);
    doc.addEventListener("keydown", onKeydown);
    return () => {
      globalThis.cancelAnimationFrame(armRaf0);
      globalThis.cancelAnimationFrame(armRaf1);
      doc.removeEventListener("click", onDocumentClickBubble, false);
      doc.removeEventListener("keydown", onKeydown);
    };
  });

  /**
   * 显示浮层时：rAF 循环 + resize 复用与 Dropdown/Popconfirm 同策略，保证全页与容器内滚动不脱节。
   */
  createEffect(() => {
    if (!isOpen() || typeof globalThis.window === "undefined") {
      portalFixedStyle.value = {};
      popupSize.value = { width: 0, height: 0 };
      arrowStyle.value = {};
      return;
    }
    void preferred;
    void popupSize.value;
    const run = () => {
      if (!triggerEl) return;
      const tr = triggerEl.getBoundingClientRect();
      if (overlayEl) {
        const fr = overlayEl.getBoundingClientRect();
        if (fr.width > 0 && fr.height > 0) {
          const prev = popupSize.value;
          if (prev.width !== fr.width || prev.height !== fr.height) {
            popupSize.value = { width: fr.width, height: fr.height };
          }
        }
      }
      const computed = computeAutoPopFixedStyle(
        tr,
        preferred,
        popupSize.value,
        {
          autoPrefers: "top",
        },
      );
      portalFixedStyle.value = computed.style;
      if (resolvedPlacement.value !== computed.placement) {
        resolvedPlacement.value = computed.placement;
      }
      if (overlayEl) {
        const panel = overlayEl.getBoundingClientRect();
        if (panel.width > 0 && panel.height > 0) {
          arrowStyle.value = computeArrowAnchorStyle(
            computed.placement,
            tr,
            panel,
          );
        }
      }
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
    if (isClick || readPopoverDisabled(props.disabled)) return;
    if (hoverTimers.close) {
      globalThis.clearTimeout(hoverTimers.close);
      hoverTimers.close = 0;
    }
    if (hoverOpenDelay <= 0) {
      setOpen(true);
    } else {
      hoverTimers.open = globalThis.setTimeout(() => {
        setOpen(true);
        hoverTimers.open = 0;
      }, hoverOpenDelay);
    }
  };

  /**
   * 离开触发/浮层：若未进入另一侧则延迟收起。
   */
  const onHoverLeave = () => {
    if (isClick || readPopoverDisabled(props.disabled)) return;
    if (hoverTimers.open) {
      globalThis.clearTimeout(hoverTimers.open);
      hoverTimers.open = 0;
    }
    hoverTimers.close = globalThis.setTimeout(() => {
      setOpen(false);
      hoverTimers.close = 0;
    }, hoverCloseDelay);
  };

  const onTriggerClick = (e: Event) => {
    if (!isClick || readPopoverDisabled(props.disabled)) return;
    e.stopPropagation();
    setOpen(!isOpen());
  };

  return (
    <span
      class={twMerge("relative inline-flex", className)}
      ref={(el: HTMLElement) => {
        triggerEl = el;
      }}
      onMouseEnter={onHoverEnter as (e: Event) => void}
      onMouseLeave={onHoverLeave as (e: Event) => void}
      onClick={onTriggerClick as (e: Event) => void}
    >
      {children}
      {typeof globalThis.document !== "undefined" && (
        <Show when={() => isOpen()}>
          <Portal mount={globalThis.document.body}>
            <div
              class="pointer-events-auto fixed z-50 min-w-0 max-w-[min(320px,calc(100vw-1rem))] overflow-visible transition-opacity duration-150"
              style={() =>
                portalFixedStyle.value}
              data-dreamer-placement={() => resolvedPlacement.value}
              onMouseEnter={onHoverEnter as (e: Event) => void}
              onMouseLeave={onHoverLeave as (e: Event) => void}
            >
              <span
                ref={(el: HTMLElement) => {
                  overlayEl = el;
                }}
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
                {arrow && (
                  <span
                    class={() => arrowClass(resolvedPlacement.value)}
                    style={() => arrowStyle.value}
                    data-dreamer-arrow=""
                  />
                )}
              </span>
            </div>
          </Portal>
        </Show>
      )}
    </span>
  );
}

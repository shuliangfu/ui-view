/**
 * BackTop 回到顶部（View）。
 * 长列表/长页时显示按钮，点击平滑滚动到顶部；支持可见阈值、滚动容器、位置、自定义内容。
 * 未指定 `target` 时同时考虑 `window` 与常见 `<main overflow-y-auto>` 主栏滚动（与 ui-preact 对齐）。
 */

import { twMerge } from "tailwind-merge";
import type { JSXRenderable } from "@dreamer/view";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconChevronUp } from "../basic/icons/ChevronUp.tsx";

/** 滚动目标：不传为 window；传字符串为 document.querySelector 选择器；传函数返回元素 */
export type BackTopTarget = (() => Element | null) | string | Element | null;

export interface BackTopProps {
  /** 滚动超过该高度（px）后显示按钮，默认 200 */
  visibilityHeight?: number;
  /** 滚动容器；不传则使用 window */
  target?: BackTopTarget;
  /** 是否显示（受控）；需配合 onVisibilityChange 由父级根据滚动更新 */
  visible?: boolean;
  /** 显示/隐藏变化时回调 */
  onVisibilityChange?: (visible: boolean) => void;
  /** 点击时先调用；之后仍会平滑滚顶 */
  onClick?: () => void;
  /** 距离视口右侧（px），默认 24 */
  right?: number;
  /** 距离视口底部（px），默认 24 */
  bottom?: number;
  /** 自定义按钮内容；不传则使用默认箭头图标 */
  children?: unknown;
  /** 额外 class（作用于按钮） */
  class?: string;
}

type BackTopEntry = {
  el: HTMLElement;
  getScrollTop: () => number;
  visibilityHeight: number;
  onVisibilityChange: (v: boolean) => void;
};

const entries: BackTopEntry[] = [];
let windowScrollAttached = false;
const elementScrollRoots = new WeakSet<Element>();

function getScrollTarget(target: BackTopTarget | undefined): Element | null {
  if (target == null) return null;
  if (typeof target === "function") return target();
  if (typeof target === "string") {
    return globalThis.document?.querySelector(target) ?? null;
  }
  return target;
}

/**
 * 未指定 `target` 时解析常见主滚动容器（如文档站 `main.overflow-y-auto`）。
 */
function getDefaultScrollContainer(): HTMLElement | null {
  const doc = globalThis.document;
  if (!doc) return null;
  const main = doc.querySelector("main");
  if (!(main instanceof HTMLElement)) return null;
  const oy = globalThis.getComputedStyle(main).overflowY;
  if (oy === "auto" || oy === "scroll" || oy === "overlay") return main;
  return null;
}

function getScrollTopFromTarget(explicitTarget: Element | null): number {
  if (explicitTarget) {
    return (explicitTarget as HTMLElement).scrollTop ?? 0;
  }
  const win = globalThis.scrollY ?? globalThis.pageYOffset ?? 0;
  const mainTop = getDefaultScrollContainer()?.scrollTop ?? 0;
  return Math.max(win, mainTop);
}

function onScroll() {
  const next = entries.filter((e) => e.el.isConnected);
  entries.length = 0;
  entries.push(...next);
  for (const e of entries) {
    const top = e.getScrollTop();
    e.onVisibilityChange(top >= e.visibilityHeight);
  }
}

function attachScrollListeners(explicitTarget: Element | null): void {
  if (explicitTarget != null) {
    if (!elementScrollRoots.has(explicitTarget)) {
      elementScrollRoots.add(explicitTarget);
      explicitTarget.addEventListener("scroll", onScroll, { passive: true });
    }
    return;
  }
  if (!windowScrollAttached) {
    windowScrollAttached = true;
    globalThis.addEventListener("scroll", onScroll, { passive: true });
  }
  const main = getDefaultScrollContainer();
  if (main != null && !elementScrollRoots.has(main)) {
    elementScrollRoots.add(main);
    main.addEventListener("scroll", onScroll, { passive: true });
  }
}

function scrollToTopSmooth(explicitTarget: Element | null): void {
  const opts: ScrollToOptions = { top: 0, behavior: "smooth" };
  if (explicitTarget instanceof HTMLElement) {
    explicitTarget.scrollTo(opts);
    return;
  }
  globalThis.scrollTo?.(opts);
  const doc = globalThis.document;
  doc?.scrollingElement?.scrollTo?.(opts);
  doc?.documentElement?.scrollTo?.(opts);
  doc?.body?.scrollTo?.(opts);
  getDefaultScrollContainer()?.scrollTo?.(opts);
}

export function BackTop(props: BackTopProps): JSXRenderable {
  const {
    visibilityHeight = 200,
    target: targetProp,
    visible = true,
    onVisibilityChange,
    onClick,
    right = 24,
    bottom = 24,
    children,
    class: className,
  } = props;

  const setWrapperRef = (el: unknown) => {
    const div = el as HTMLDivElement | null;
    if (!div) return;
    if (!onVisibilityChange) return;
    if (entries.some((e) => e.el === div)) return;
    const explicitTarget = getScrollTarget(targetProp);
    const getScrollTop = () => getScrollTopFromTarget(explicitTarget);
    entries.push({
      el: div,
      getScrollTop,
      visibilityHeight,
      onVisibilityChange,
    });
    attachScrollListeners(explicitTarget);
    onScroll();
  };

  const handleClick = () => {
    onClick?.();
    scrollToTopSmooth(getScrollTarget(targetProp));
  };

  return (
    <div
      ref={setWrapperRef}
      class={twMerge(
        "back-top-host",
        !visible && "pointer-events-none invisible opacity-0",
      )}
      style={{
        position: "fixed",
        right: `${right}px`,
        bottom: `${bottom}px`,
        zIndex: 100,
        transition: "opacity 0.2s, visibility 0.2s",
      }}
    >
      <button
        type="button"
        class={twMerge(
          "flex items-center justify-center w-10 h-10 rounded-full shadow-lg hover:opacity-90 active:scale-95 transition",
          "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white",
          className,
        )}
        onClick={handleClick}
        aria-label="回到顶部"
      >
        {children != null
          ? children
          : <IconChevronUp class="w-5 h-5 text-inherit" />}
      </button>
    </div>
  );
}

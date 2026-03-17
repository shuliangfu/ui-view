/**
 * BackTop 回到顶部（View）。
 * 长列表/长页时显示按钮，点击平滑滚动到顶部；支持可见阈值、滚动容器、位置、自定义内容。
 */

import { twMerge } from "tailwind-merge";
import { IconChevronUp } from "../basic/icons/mod.ts";

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
  /** 点击回调；不传则默认滚动到顶部 */
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
let scrollListenerAttached = false;

function getScrollTarget(target: BackTopTarget | undefined): Element | null {
  if (target == null) return null;
  if (typeof target === "function") return target();
  if (typeof target === "string") {
    return globalThis.document?.querySelector(target) ?? null;
  }
  return target;
}

function getScrollTopFromTarget(target: Element | null): number {
  if (!target) {
    const doc = globalThis.document;
    if (!doc) return 0;
    return doc.documentElement?.scrollTop ?? doc.body?.scrollTop ??
      globalThis.scrollY ?? 0;
  }
  return (target as HTMLElement).scrollTop ?? 0;
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

function attachScrollListener(target: Element | null) {
  if (scrollListenerAttached) return;
  scrollListenerAttached = true;
  if (target) {
    target.addEventListener("scroll", onScroll, { passive: true });
  } else {
    globalThis.addEventListener("scroll", onScroll, { passive: true });
  }
}

export function BackTop(props: BackTopProps) {
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
    const target = getScrollTarget(targetProp);
    const getScrollTop = () => getScrollTopFromTarget(target);
    entries.push({
      el: div,
      getScrollTop,
      visibilityHeight,
      onVisibilityChange,
    });
    attachScrollListener(target ?? null);
    onScroll();
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    const t = getScrollTarget(targetProp);
    if (t) {
      (t as HTMLElement).scrollTo?.({ top: 0, behavior: "smooth" });
    } else {
      globalThis.document?.documentElement?.scrollTo?.({
        top: 0,
        behavior: "smooth",
      });
      globalThis.scrollTo?.({ top: 0, behavior: "smooth" });
    }
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

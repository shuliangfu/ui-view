/**
 * PullRefresh 下拉刷新（View）。
 * 移动端列表页常用：下拉触发 onRefresh，支持自定义提示文案、禁用、阈值与动画时长。
 * `loading` 支持 `Signal` / 零参 getter，勿仅传 `sig.value`（Hybrid 下可能不更新）。
 */

import { createMemo } from "@dreamer/view";
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import {
  type ControlledOpenInput,
  readControlledOpenInput,
} from "../../shared/feedback/controlled-open.ts";

export type PullRefreshStatus =
  | "idle"
  | "pulling"
  | "loosing"
  | "loading"
  | "success";

export interface PullRefreshProps {
  /** 是否处于加载中；推荐 `loading={sig}`，勿 `loading={sig.value}` */
  loading?: ControlledOpenInput;
  /** 下拉释放后触发的刷新回调；父级应在回调内拉取数据并随后将 loading 设为 false */
  onRefresh?: () => void | Promise<void>;
  /** 下拉过程提示文案 */
  pullingText?: string;
  /** 释放过程提示文案 */
  loosingText?: string;
  /** 加载过程提示文案 */
  loadingText?: string;
  /** 刷新成功提示文案；传空则不显示成功态 */
  successText?: string | null;
  /** 成功提示展示时长（ms），默认 500 */
  successDuration?: number;
  /** 头部区域高度（px），默认 50 */
  headHeight?: number;
  /** 触发刷新的下拉距离（px），默认与 headHeight 一致 */
  pullDistance?: number;
  /** 是否禁用下拉刷新 */
  disabled?: boolean;
  /** 子内容（通常为可滚动列表） */
  children?: unknown;
  /** 额外 class（作用于最外层） */
  class?: string;
  /**
   * 内层可滚动容器（`data-pull-refresh-content`）挂载/卸载时回调；
   * 供 {@link ScrollList} 等组合组件挂 `IntersectionObserver` 或 `scroll` 做上拉加载。
   */
  scrollContainerRef?: (el: HTMLDivElement | null) => void;
}

const DEFAULT_PULLING = "下拉即可刷新…";
const DEFAULT_LOOSING = "释放即可刷新…";
const DEFAULT_LOADING = "加载中…";

export function PullRefresh(props: PullRefreshProps): JSXRenderable {
  const {
    onRefresh,
    pullingText = DEFAULT_PULLING,
    loosingText: _loosingText = DEFAULT_LOOSING,
    loadingText = DEFAULT_LOADING,
    successText: _successText = null,
    successDuration: _successDuration = 500,
    headHeight = 50,
    pullDistance: pullDistanceProp,
    disabled = false,
    children,
    class: className,
    scrollContainerRef,
  } = props;

  /** 在 memo 内读 `Signal` / getter，触摸与展示态与父级受控同步 */
  const isLoading = createMemo(() => readControlledOpenInput(props.loading));

  const pullDistance = pullDistanceProp ?? headHeight;

  /** 用于 touch 与头部位移的 ref，在闭包中复用 */
  const refs: {
    head: HTMLDivElement | null;
    wrap: HTMLDivElement | null;
    startY: number;
    startScrollTop: number;
    currentY: number;
  } = {
    head: null,
    wrap: null,
    startY: 0,
    startScrollTop: 0,
    currentY: 0,
  };

  const setHeadRef = (el: unknown) => {
    refs.head = el as HTMLDivElement | null;
  };
  const setWrapRef = (el: unknown) => {
    refs.wrap = el as HTMLDivElement | null;
  };

  const getScrollTop = (): number => {
    const wrap = refs.wrap;
    if (!wrap) return 0;
    const content = wrap.querySelector("[data-pull-refresh-content]");
    if (content && content instanceof HTMLDivElement) return content.scrollTop;
    return 0;
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isLoading()) return;
    refs.startY = e.touches[0].clientY;
    refs.startScrollTop = getScrollTop();
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || isLoading() || !refs.head) return;
    const scrollTop = getScrollTop();
    if (scrollTop > 0) return;
    refs.currentY = e.touches[0].clientY;
    const delta = refs.currentY - refs.startY;
    if (delta <= 0) return;
    e.preventDefault();
    const damp = delta > pullDistance
      ? pullDistance + (delta - pullDistance) * 0.3
      : delta;
    refs.head.style.transform = `translateY(${damp}px)`;
  };

  const handleTouchEnd = () => {
    if (disabled || isLoading() || !refs.head) return;
    const delta = refs.currentY - refs.startY;
    refs.head.style.transform = "";
    if (refs.startScrollTop === 0 && delta >= pullDistance && onRefresh) {
      onRefresh();
    }
    refs.currentY = 0;
    refs.startY = 0;
  };

  const status: PullRefreshStatus = isLoading() ? "loading" : "idle";
  const tip = status === "loading" ? loadingText : pullingText;

  return (
    <div
      ref={setWrapRef}
      class={twMerge("pull-refresh relative", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        ref={setHeadRef}
        class="absolute left-0 right-0 top-0 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 transition-transform duration-200"
        style={{ height: `${headHeight}px`, marginTop: `-${headHeight}px` }}
      >
        {status === "loading" && (
          <span class="inline-block w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin mr-2" />
        )}
        {tip}
      </div>
      <div
        data-pull-refresh-content
        ref={(el: HTMLDivElement | null) => {
          scrollContainerRef?.(el);
        }}
        class="min-h-full overflow-auto"
        style={{ minHeight: "100%" }}
      >
        {children}
      </div>
    </div>
  );
}

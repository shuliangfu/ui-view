/**
 * VirtualList 虚拟列表（View）。
 * 仅渲染可视区附近行，适合长列表；定高行优先（`itemHeight`）。
 */

import {
  createEffect,
  createSignal,
  type JSXRenderable,
  onCleanup,
} from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { isHtmlElement } from "../dom-guards.ts";

export interface VirtualListProps<T = unknown> {
  /** 数据源 */
  data: T[];
  /** 行高（px），定高模式 */
  itemHeight: number;
  /** 可视容器高度（px），默认 320 */
  height?: number;
  /** 额外上下缓冲行数，默认 4 */
  overscan?: number;
  /** 行渲染 */
  renderItem: (item: T, index: number) => unknown;
  /** 行 key；默认 index */
  rowKey?: (item: T, index: number) => string | number;
  class?: string;
  /** 空态 */
  empty?: unknown;
}

export function VirtualList<T = unknown>(
  props: VirtualListProps<T>,
): JSXRenderable {
  const {
    itemHeight,
    height = 320,
    overscan = 4,
    renderItem,
    rowKey,
    class: className,
    empty,
  } = props;

  const scrollTop = createSignal(0);
  let scroller: HTMLElement | null = null;

  const setRef = (el: unknown) => {
    if (!isHtmlElement(el)) return;
    scroller = el;
  };

  createEffect(() => {
    const el = scroller;
    if (!el) return;
    const onScroll = () => {
      scrollTop.value = el.scrollTop;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onCleanup(() => el.removeEventListener("scroll", onScroll));
  });

  return () => {
    const data = props.data ?? [];
    const total = data.length;
    if (total === 0) {
      return (
        <div
          class={twMerge("virtual-list overflow-auto", className)}
          style={{ height: `${height}px` }}
        >
          {empty ?? (
            <div class="p-6 text-center text-sm text-slate-400">暂无数据</div>
          )}
        </div>
      );
    }
    const start = Math.max(
      0,
      Math.floor(scrollTop.value / itemHeight) - overscan,
    );
    const visibleCount = Math.ceil(height / itemHeight) + overscan * 2;
    const end = Math.min(total, start + visibleCount);
    const offsetY = start * itemHeight;
    const items: unknown[] = [];
    for (let i = start; i < end; i++) {
      const item = data[i]!;
      const key = rowKey ? rowKey(item, i) : i;
      items.push(
        <div
          key={key}
          class="virtual-list-item box-border"
          style={{ height: `${itemHeight}px` }}
        >
          {renderItem(item, i)}
        </div>,
      );
    }
    return (
      <div
        ref={setRef}
        class={twMerge("virtual-list overflow-auto relative", className)}
        style={{ height: `${height}px` }}
      >
        <div style={{ height: `${total * itemHeight}px`, position: "relative" }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>{items}</div>
        </div>
      </div>
    );
  };
}

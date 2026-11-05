/**
 * VirtualList 虚拟列表（View）。
 * 仅渲染可视区附近行；支持定高 `itemHeight` 或按行 `getItemHeight` 动态行高。
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
  /**
   * 定高（px）。与 `getItemHeight` 二选一；二者都传时以 `getItemHeight` 为准。
   */
  itemHeight?: number;
  /**
   * 动态行高（px）。适合多行文案；内部会缓存 offsets 以二分定位。
   */
  getItemHeight?: (item: T, index: number) => number;
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

function buildOffsets(
  data: unknown[],
  heightAt: (i: number) => number,
): { offsets: number[]; total: number } {
  const offsets = new Array<number>(data.length + 1);
  offsets[0] = 0;
  for (let i = 0; i < data.length; i++) {
    offsets[i + 1] = offsets[i]! + Math.max(1, heightAt(i));
  }
  return { offsets, total: offsets[data.length]! };
}

/** 在 offsets 中找最后一个 <= scrollTop 的行下标 */
function lowerBound(offsets: number[], scrollTop: number): number {
  let lo = 0;
  let hi = offsets.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (offsets[mid]! <= scrollTop) lo = mid;
    else hi = mid - 1;
  }
  return Math.min(lo, Math.max(0, offsets.length - 2));
}

export function VirtualList<T = unknown>(
  props: VirtualListProps<T>,
): JSXRenderable {
  const {
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
    const totalCount = data.length;
    if (totalCount === 0) {
      return (
        <div
          ref={setRef}
          class={twMerge("virtual-list overflow-auto", className)}
          style={{ height: `${height}px` }}
        >
          {empty ?? (
            <div class="p-6 text-center text-sm text-slate-400">暂无数据</div>
          )}
        </div>
      );
    }

    const fixed = props.itemHeight;
    const dyn = props.getItemHeight;
    if (fixed == null && dyn == null) {
      return (
        <div class={twMerge("p-4 text-sm text-red-500", className)}>
          VirtualList 需要 `itemHeight` 或 `getItemHeight`
        </div>
      );
    }

    const heightAt = (i: number) =>
      dyn ? Math.max(1, dyn(data[i]!, i)) : Math.max(1, fixed!);

    let start: number;
    let end: number;
    let offsetY: number;
    let totalHeight: number;
    let rowHeightAt: (i: number) => number = heightAt;

    if (dyn) {
      const { offsets, total } = buildOffsets(data, heightAt);
      totalHeight = total;
      start = Math.max(0, lowerBound(offsets, scrollTop.value) - overscan);
      // 找 end：offsets[end] >= scrollTop+height
      let e = start;
      const limit = scrollTop.value + height;
      while (e < totalCount && offsets[e]! < limit) e++;
      end = Math.min(totalCount, e + overscan);
      offsetY = offsets[start]!;
      rowHeightAt = (i) => offsets[i + 1]! - offsets[i]!;
    } else {
      const ih = fixed!;
      totalHeight = totalCount * ih;
      start = Math.max(0, Math.floor(scrollTop.value / ih) - overscan);
      const visibleCount = Math.ceil(height / ih) + overscan * 2;
      end = Math.min(totalCount, start + visibleCount);
      offsetY = start * ih;
      rowHeightAt = () => ih;
    }

    const items: unknown[] = [];
    for (let i = start; i < end; i++) {
      const item = data[i]!;
      const key = rowKey ? rowKey(item, i) : i;
      items.push(
        <div
          key={key}
          class="virtual-list-item box-border"
          style={{ height: `${rowHeightAt(i)}px` }}
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
        <div style={{ height: `${totalHeight}px`, position: "relative" }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>{items}</div>
        </div>
      </div>
    );
  };
}

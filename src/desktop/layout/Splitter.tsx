/**
 * Splitter 分割面板（View）。
 * 桌面左右／上下可拖拽分隔；受控 `sizes`（百分比数组）。
 */

import { createSignal, type JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import {
  commitMaybeSignal,
  type MaybeSignal,
  readMaybeSignal,
} from "../../shared/form/maybe-signal.ts";

export interface SplitterProps {
  /** 方向，默认 horizontal（左右） */
  orientation?: "horizontal" | "vertical";
  /** 各面板尺寸百分比，长度 = 面板数；MaybeSignal */
  sizes?: MaybeSignal<number[]>;
  /** 尺寸变化 */
  onSizesChange?: (sizes: number[]) => void;
  /** 面板子节点（按顺序） */
  children?: unknown[];
  /** 最小面板百分比，默认 10 */
  minSize?: number;
  class?: string;
}

function normalizeSizes(
  raw: number[] | undefined,
  count: number,
  min: number,
): number[] {
  if (count <= 0) return [];
  let s = (raw && raw.length === count)
    ? [...raw]
    : Array.from({ length: count }, () => 100 / count);
  const sum = s.reduce((a, b) => a + b, 0) || 1;
  s = s.map((x) => (x / sum) * 100);
  s = s.map((x) => Math.max(min, x));
  const sum2 = s.reduce((a, b) => a + b, 0);
  return s.map((x) => (x / sum2) * 100);
}

export function Splitter(props: SplitterProps): JSXRenderable {
  const {
    orientation = "horizontal",
    onSizesChange,
    minSize = 10,
    class: className,
  } = props;

  const dragging = createSignal<number | null>(null);

  const panels = () => {
    const ch = props.children;
    return Array.isArray(ch) ? ch : ch != null ? [ch] : [];
  };

  const sizesNow = () => {
    const p = panels();
    return normalizeSizes(readMaybeSignal(props.sizes), p.length, minSize);
  };

  const setSizes = (next: number[]) => {
    commitMaybeSignal(props.sizes, next);
    onSizesChange?.(next);
  };

  const onPointerDown = (index: number, e: PointerEvent) => {
    e.preventDefault();
    dragging.value = index;
    const startPos = orientation === "horizontal" ? e.clientX : e.clientY;
    const startSizes = sizesNow();
    const target = e.currentTarget as HTMLElement | null;
    const root = target?.parentElement;
    if (!root) return;

    const onMove = (ev: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const total = orientation === "horizontal" ? rect.width : rect.height;
      if (total <= 0) return;
      const pos = orientation === "horizontal" ? ev.clientX : ev.clientY;
      const deltaPct = ((pos - startPos) / total) * 100;
      const next = [...startSizes];
      const i = index;
      const left = Math.max(minSize, startSizes[i]! + deltaPct);
      const right = Math.max(minSize, startSizes[i + 1]! - deltaPct);
      const used = left + right;
      const orig = startSizes[i]! + startSizes[i + 1]!;
      next[i] = (left / used) * orig;
      next[i + 1] = (right / used) * orig;
      setSizes(normalizeSizes(next, next.length, minSize));
    };
    const onUp = () => {
      dragging.value = null;
      globalThis.removeEventListener?.("pointermove", onMove);
      globalThis.removeEventListener?.("pointerup", onUp);
    };
    globalThis.addEventListener?.("pointermove", onMove);
    globalThis.addEventListener?.("pointerup", onUp);
  };

  return () => {
    const p = panels();
    const sizes = sizesNow();
    const horiz = orientation === "horizontal";
    const nodes: unknown[] = [];
    p.forEach((child, i) => {
      nodes.push(
        <div
          key={`p-${i}`}
          class="min-w-0 min-h-0 overflow-auto"
          style={{
            flexBasis: `${sizes[i] ?? 0}%`,
            flexGrow: 0,
            flexShrink: 0,
          }}
        >
          {child}
        </div>,
      );
      if (i < p.length - 1) {
        nodes.push(
          <div
            key={`s-${i}`}
            role="separator"
            aria-orientation={orientation}
            tabindex={0}
            class={twMerge(
              "shrink-0 bg-slate-200 dark:bg-slate-700 hover:bg-blue-400/80",
              horiz ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize",
              dragging.value === i && "bg-blue-500",
            )}
            onPointerDown={(e: Event) => onPointerDown(i, e as PointerEvent)}
          />,
        );
      }
    });
    return (
      <div
        class={twMerge(
          "splitter flex w-full h-full min-h-[120px]",
          horiz ? "flex-row" : "flex-col",
          className,
        )}
      >
        {nodes}
      </div>
    );
  };
}

/**
 * Splitter 分割面板（View）。
 * 桌面左右／上下可拖拽分隔；受控 `sizes`（百分比数组）。
 * 未传 `sizes` 时用内部 Signal 保存拖拽结果；勿把尺寸读进会重建整棵树的 `return () =>`。
 * 传入 `persist`（cookie 名）可记住拖拽位置；服务端把请求 Cookie 头交给 `cookie`，
 * 首屏即可用上次的比例（cookie 随请求走，避免 localStorage 在 SSR 对不齐、先均分再跳动）。
 */

import { createSignal, type JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import {
  createOptionalValueState,
  isControlledMaybeSignal,
  type MaybeSignal,
} from "../../shared/form/maybe-signal.ts";
import {
  parseSplitterSizesCookieName,
  readSplitterSizesCookie,
  writeSplitterSizesCookie,
} from "./splitter-sizes-cookie.ts";

export interface SplitterProps {
  /** 方向，默认 horizontal（左右） */
  orientation?: "horizontal" | "vertical";
  /** 各面板尺寸百分比，长度 = 面板数；MaybeSignal。未传则内部保存拖拽结果 */
  sizes?: MaybeSignal<number[]>;
  /** 尺寸变化 */
  onSizesChange?: (sizes: number[]) => void;
  /** 面板子节点（按顺序） */
  children?: unknown[];
  /** 最小面板百分比，默认 10 */
  minSize?: number;
  /**
   * 记住拖拽位置的名字（如 `"editor-split"`）。传入即开启读写；不传不记住。
   * 同一页多个 Splitter 须用不同名字。只允许字母数字、点、下划线、连字符，最长 64。
   * 值存在 cookie 里，有效期一年，拖拽结束时写入。
   * 非受控时初始比例：已记住的位置 ＞ `sizes` 字面量 ＞ 均分。
   */
  persist?: string;
  /**
   * 服务端渲染时传入请求的 `Cookie` 头（或 `document.cookie` 格式字符串）。
   * 浏览器可省略，组件会读 `document.cookie`。两端用同一份值，首屏才不会和客户端对不齐。
   */
  cookie?: string | null;
  class?: string;
}

function normalizeSizes(
  raw: number[] | undefined,
  count: number,
  min: number,
): number[] {
  if (count <= 0) return [];
  /** 全部面板都要能满足最小占比；否则退到均分下界。 */
  const floor = Math.min(min, 100 / count);
  const cap = 100 - floor * (count - 1);
  let s = (raw && raw.length === count)
    ? [...raw]
    : Array.from({ length: count }, () => 100 / count);
  const sum = s.reduce((a, b) => a + b, 0) || 1;
  s = s.map((x) => (x / sum) * 100);
  s = s.map((x) => Math.min(cap, Math.max(floor, x)));
  const sum2 = s.reduce((a, b) => a + b, 0);
  const diff = 100 - sum2;
  if (Math.abs(diff) < 1e-9) return s;
  /** 差额只在「还有空间」的面板上分配，避免把已夹到下限的面板再按比例缩小。 */
  const room = s.map((x) => diff > 0 ? cap - x : x - floor);
  const totalRoom = room.reduce((a, b) => a + b, 0);
  if (totalRoom <= 1e-9) return s;
  return s.map((x, i) => x + diff * (room[i]! / totalRoom));
}

export function Splitter(props: SplitterProps): JSXRenderable {
  const {
    orientation = "horizontal",
    onSizesChange,
    minSize = 10,
    class: className,
  } = props;

  const dragging = createSignal<number | null>(null);
  const cookieName = parseSplitterSizesCookieName(props.persist);
  const fromCookie = cookieName
    ? readSplitterSizesCookie(cookieName, props.cookie)
    : undefined;
  const sizesControlled = isControlledMaybeSignal(props.sizes);
  let defaultSizes: number[] = [];
  if (!sizesControlled && Array.isArray(props.sizes)) {
    defaultSizes = props.sizes as number[];
  }

  const sizesState = createOptionalValueState<number[]>(
    sizesControlled ? props.sizes : undefined,
    fromCookie ?? defaultSizes,
  );

  const panels = () => {
    const ch = props.children;
    return Array.isArray(ch) ? ch : ch != null ? [ch] : [];
  };

  const sizesNow = () =>
    normalizeSizes(sizesState.read(), panels().length, minSize);

  const setSizes = (next: number[]) => {
    sizesState.commit(next);
    onSizesChange?.(next);
  };

  const persistSizes = (next: number[]) => {
    if (cookieName) writeSplitterSizesCookie(cookieName, next);
  };

  const onPointerDown = (index: number, e: PointerEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement | null;
    try {
      target?.setPointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    dragging.value = index;
    const startPos = orientation === "horizontal" ? e.clientX : e.clientY;
    const startSizes = sizesNow();
    const root = target?.parentElement;
    if (!root) return;

    const onMove = (ev: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const total = orientation === "horizontal" ? rect.width : rect.height;
      if (total <= 0) return;
      const pos = orientation === "horizontal" ? ev.clientX : ev.clientY;
      const deltaPct = ((pos - startPos) / total) * 100;
      const next = [...startSizes];
      const left = Math.max(minSize, startSizes[index]! + deltaPct);
      const right = Math.max(minSize, startSizes[index + 1]! - deltaPct);
      const used = left + right;
      const orig = startSizes[index]! + startSizes[index + 1]!;
      next[index] = (left / used) * orig;
      next[index + 1] = (right / used) * orig;
      setSizes(normalizeSizes(next, next.length, minSize));
    };
    const onUp = (ev: PointerEvent) => {
      dragging.value = null;
      persistSizes(sizesNow());
      try {
        target?.releasePointerCapture?.(ev.pointerId);
      } catch {
        /* ignore */
      }
      globalThis.removeEventListener?.("pointermove", onMove);
      globalThis.removeEventListener?.("pointerup", onUp);
    };
    globalThis.addEventListener?.("pointermove", onMove);
    globalThis.addEventListener?.("pointerup", onUp);
  };

  /**
   * 稳定根节点。面板数变化才重建子树；尺寸与拖拽高亮只写在 style / class getter 里，
   * 避免拖动时重挂分隔条导致指针丢失。
   */
  return (
    <div
      class={twMerge(
        "splitter flex w-full h-full min-h-[120px]",
        orientation === "horizontal" ? "flex-row" : "flex-col",
        className,
      )}
    >
      {() => {
        const p = panels();
        const horiz = orientation === "horizontal";
        const nodes: unknown[] = [];
        p.forEach((child, i) => {
          nodes.push(
            <div
              key={`p-${i}`}
              class="min-w-0 min-h-0 overflow-auto"
              style={() => ({
                flexBasis: `${sizesNow()[i] ?? 0}%`,
                flexGrow: 0,
                flexShrink: 0,
              })}
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
                class={() =>
                  twMerge(
                    "shrink-0 touch-none bg-slate-200 dark:bg-slate-700 hover:bg-blue-400/80",
                    horiz ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize",
                    dragging.value === i && "bg-blue-500",
                  )}
                onPointerDown={(e: Event) =>
                  onPointerDown(i, e as PointerEvent)}
              />,
            );
          }
        });
        return nodes;
      }}
    </div>
  );
}

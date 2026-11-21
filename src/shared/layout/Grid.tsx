/**
 * Grid 栅格（View）。
 * 支持列数、gap、子项 span；可用 xs/sm/md/lg 按断点改列数与跨度。基于 CSS Grid。
 */

import { twMerge } from "tailwind-merge";
import type { JSXRenderable } from "@dreamer/view";

/** 列数 1–24（兼容原先的 6 / 12 / 24） */
type GridColCount = number;
type GridBreakpoint = "sm" | "md" | "lg";

export interface GridProps {
  /** 列数，默认 12（1–24） */
  cols?: GridColCount;
  /**
   * 响应式列数，与 {@link List} 的栅格同向：移动优先。
   * 最小屏取 `xs ?? cols ?? 12`，较大屏仅在传入对应键时追加 `sm:` / `md:` / `lg:`。
   */
  xs?: GridColCount;
  sm?: GridColCount;
  md?: GridColCount;
  lg?: GridColCount;
  /** 间距（Tailwind gap 值），默认 4 */
  gap?: number | string;
  /** 额外 class（作用于网格容器） */
  class?: string;
  /** 子节点（通常为 GridItem） */
  children?: unknown;
}

const COLS_1_12: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  7: "grid-cols-7",
  8: "grid-cols-8",
  9: "grid-cols-9",
  10: "grid-cols-10",
  11: "grid-cols-11",
  12: "grid-cols-12",
};

const COLS_13_24: Record<number, string> = {
  13: "grid-cols-[repeat(13,minmax(0,1fr))]",
  14: "grid-cols-[repeat(14,minmax(0,1fr))]",
  15: "grid-cols-[repeat(15,minmax(0,1fr))]",
  16: "grid-cols-[repeat(16,minmax(0,1fr))]",
  17: "grid-cols-[repeat(17,minmax(0,1fr))]",
  18: "grid-cols-[repeat(18,minmax(0,1fr))]",
  19: "grid-cols-[repeat(19,minmax(0,1fr))]",
  20: "grid-cols-[repeat(20,minmax(0,1fr))]",
  21: "grid-cols-[repeat(21,minmax(0,1fr))]",
  22: "grid-cols-[repeat(22,minmax(0,1fr))]",
  23: "grid-cols-[repeat(23,minmax(0,1fr))]",
  24: "grid-cols-[repeat(24,minmax(0,1fr))]",
};

/** 带断点前缀的列数 class，必须写完整字面量供 Tailwind 扫描（不可运行时拼接 `sm:` + util）。 */

const COLS_SM: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
  6: "sm:grid-cols-6",
  7: "sm:grid-cols-7",
  8: "sm:grid-cols-8",
  9: "sm:grid-cols-9",
  10: "sm:grid-cols-10",
  11: "sm:grid-cols-11",
  12: "sm:grid-cols-12",
  13: "sm:grid-cols-[repeat(13,minmax(0,1fr))]",
  14: "sm:grid-cols-[repeat(14,minmax(0,1fr))]",
  15: "sm:grid-cols-[repeat(15,minmax(0,1fr))]",
  16: "sm:grid-cols-[repeat(16,minmax(0,1fr))]",
  17: "sm:grid-cols-[repeat(17,minmax(0,1fr))]",
  18: "sm:grid-cols-[repeat(18,minmax(0,1fr))]",
  19: "sm:grid-cols-[repeat(19,minmax(0,1fr))]",
  20: "sm:grid-cols-[repeat(20,minmax(0,1fr))]",
  21: "sm:grid-cols-[repeat(21,minmax(0,1fr))]",
  22: "sm:grid-cols-[repeat(22,minmax(0,1fr))]",
  23: "sm:grid-cols-[repeat(23,minmax(0,1fr))]",
  24: "sm:grid-cols-[repeat(24,minmax(0,1fr))]",
};

const COLS_MD: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
  7: "md:grid-cols-7",
  8: "md:grid-cols-8",
  9: "md:grid-cols-9",
  10: "md:grid-cols-10",
  11: "md:grid-cols-11",
  12: "md:grid-cols-12",
  13: "md:grid-cols-[repeat(13,minmax(0,1fr))]",
  14: "md:grid-cols-[repeat(14,minmax(0,1fr))]",
  15: "md:grid-cols-[repeat(15,minmax(0,1fr))]",
  16: "md:grid-cols-[repeat(16,minmax(0,1fr))]",
  17: "md:grid-cols-[repeat(17,minmax(0,1fr))]",
  18: "md:grid-cols-[repeat(18,minmax(0,1fr))]",
  19: "md:grid-cols-[repeat(19,minmax(0,1fr))]",
  20: "md:grid-cols-[repeat(20,minmax(0,1fr))]",
  21: "md:grid-cols-[repeat(21,minmax(0,1fr))]",
  22: "md:grid-cols-[repeat(22,minmax(0,1fr))]",
  23: "md:grid-cols-[repeat(23,minmax(0,1fr))]",
  24: "md:grid-cols-[repeat(24,minmax(0,1fr))]",
};

const COLS_LG: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
  7: "lg:grid-cols-7",
  8: "lg:grid-cols-8",
  9: "lg:grid-cols-9",
  10: "lg:grid-cols-10",
  11: "lg:grid-cols-11",
  12: "lg:grid-cols-12",
  13: "lg:grid-cols-[repeat(13,minmax(0,1fr))]",
  14: "lg:grid-cols-[repeat(14,minmax(0,1fr))]",
  15: "lg:grid-cols-[repeat(15,minmax(0,1fr))]",
  16: "lg:grid-cols-[repeat(16,minmax(0,1fr))]",
  17: "lg:grid-cols-[repeat(17,minmax(0,1fr))]",
  18: "lg:grid-cols-[repeat(18,minmax(0,1fr))]",
  19: "lg:grid-cols-[repeat(19,minmax(0,1fr))]",
  20: "lg:grid-cols-[repeat(20,minmax(0,1fr))]",
  21: "lg:grid-cols-[repeat(21,minmax(0,1fr))]",
  22: "lg:grid-cols-[repeat(22,minmax(0,1fr))]",
  23: "lg:grid-cols-[repeat(23,minmax(0,1fr))]",
  24: "lg:grid-cols-[repeat(24,minmax(0,1fr))]",
};

/** 带断点前缀的跨度 class，必须写完整字面量供 Tailwind 扫描。 */

const SPAN_SM: Record<number, string> = {
  1: "sm:col-span-1",
  2: "sm:col-span-2",
  3: "sm:col-span-3",
  4: "sm:col-span-4",
  5: "sm:col-span-5",
  6: "sm:col-span-6",
  7: "sm:col-span-7",
  8: "sm:col-span-8",
  9: "sm:col-span-9",
  10: "sm:col-span-10",
  11: "sm:col-span-11",
  12: "sm:col-span-12",
  13: "sm:col-span-[13]",
  14: "sm:col-span-[14]",
  15: "sm:col-span-[15]",
  16: "sm:col-span-[16]",
  17: "sm:col-span-[17]",
  18: "sm:col-span-[18]",
  19: "sm:col-span-[19]",
  20: "sm:col-span-[20]",
  21: "sm:col-span-[21]",
  22: "sm:col-span-[22]",
  23: "sm:col-span-[23]",
  24: "sm:col-span-[24]",
};

const SPAN_MD: Record<number, string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  10: "md:col-span-10",
  11: "md:col-span-11",
  12: "md:col-span-12",
  13: "md:col-span-[13]",
  14: "md:col-span-[14]",
  15: "md:col-span-[15]",
  16: "md:col-span-[16]",
  17: "md:col-span-[17]",
  18: "md:col-span-[18]",
  19: "md:col-span-[19]",
  20: "md:col-span-[20]",
  21: "md:col-span-[21]",
  22: "md:col-span-[22]",
  23: "md:col-span-[23]",
  24: "md:col-span-[24]",
};

const SPAN_LG: Record<number, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
  10: "lg:col-span-10",
  11: "lg:col-span-11",
  12: "lg:col-span-12",
  13: "lg:col-span-[13]",
  14: "lg:col-span-[14]",
  15: "lg:col-span-[15]",
  16: "lg:col-span-[16]",
  17: "lg:col-span-[17]",
  18: "lg:col-span-[18]",
  19: "lg:col-span-[19]",
  20: "lg:col-span-[20]",
  21: "lg:col-span-[21]",
  22: "lg:col-span-[22]",
  23: "lg:col-span-[23]",
  24: "lg:col-span-[24]",
};

function clampCols(n: number, fallback = 12): number {
  const k = Math.floor(n);
  if (!Number.isFinite(k)) return fallback;
  return Math.min(24, Math.max(1, k));
}

/**
 * 将列数映射为 Tailwind `grid-cols-*`（须为静态类名以便打包器收录）。
 *
 * @param n - 列数 1–24
 * @param breakpoint - 可选 `sm` | `md` | `lg`
 */
function gridColsClass(n: number, breakpoint?: GridBreakpoint): string {
  const k = clampCols(n);
  if (breakpoint === "sm") return COLS_SM[k] ?? "sm:grid-cols-12";
  if (breakpoint === "md") return COLS_MD[k] ?? "md:grid-cols-12";
  if (breakpoint === "lg") return COLS_LG[k] ?? "lg:grid-cols-12";
  return k <= 12
    ? (COLS_1_12[k] ?? "grid-cols-12")
    : (COLS_13_24[k] ?? "grid-cols-12");
}

/**
 * 由 `cols` 与响应式断点生成容器列数 class。
 *
 * @param props - 列数配置
 */
function buildGridColsClass(
  props: Pick<GridProps, "cols" | "xs" | "sm" | "md" | "lg">,
): string {
  const hasBreakpoint = props.xs != null || props.sm != null ||
    props.md != null || props.lg != null;
  if (!hasBreakpoint) return gridColsClass(props.cols ?? 12);
  const parts = [gridColsClass(props.xs ?? props.cols ?? 12)];
  if (props.sm != null) parts.push(gridColsClass(props.sm, "sm"));
  if (props.md != null) parts.push(gridColsClass(props.md, "md"));
  if (props.lg != null) parts.push(gridColsClass(props.lg, "lg"));
  return parts.join(" ");
}

const gapClasses: Record<string, string> = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
};

export function Grid(props: GridProps): JSXRenderable {
  const { gap = 4, class: className, children } = props;
  const gapCls = typeof gap === "number"
    ? gapClasses[String(gap)] ?? "gap-4"
    : (gapClasses[String(gap)] ?? "gap-4");

  return (
    <div
      class={twMerge(
        "grid w-full",
        buildGridColsClass(props),
        gapCls,
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface GridItemProps {
  /** 列表渲染时的稳定标识（由框架消费，不传入 DOM） */
  key?: string | number;
  /** 占据列数（1 到 cols），默认 1；与 xs 同时出现时作为未设 xs 时的最小屏回退 */
  span?: number;
  /** 最小屏跨度（移动优先，与 Grid 的 xs/sm/md/lg 同向） */
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  /** 额外 class（与 className 二选一，最终都落到 DOM class） */
  class?: string;
  /** 额外 class，React 风格，与 class 二选一 */
  className?: string;
  /** 子节点 */
  children?: unknown;
}

/** 列跨度 1–24 的静态 class，供 Tailwind 扫描生成（13–24 用任意值） */
const SPAN_1_24: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
  13: "col-span-[13]",
  14: "col-span-[14]",
  15: "col-span-[15]",
  16: "col-span-[16]",
  17: "col-span-[17]",
  18: "col-span-[18]",
  19: "col-span-[19]",
  20: "col-span-[20]",
  21: "col-span-[21]",
  22: "col-span-[22]",
  23: "col-span-[23]",
  24: "col-span-[24]",
};

function clampSpan(n: number): number {
  const k = Math.floor(n);
  if (!Number.isFinite(k)) return 1;
  return Math.min(24, Math.max(1, k));
}

/**
 * 将跨度映射为 Tailwind `col-span-*`。
 *
 * @param n - 跨度 1–24
 * @param breakpoint - 可选 `sm` | `md` | `lg`
 */
function spanClass(n: number, breakpoint?: GridBreakpoint): string {
  const k = clampSpan(n);
  if (breakpoint === "sm") return SPAN_SM[k] ?? "sm:col-span-1";
  if (breakpoint === "md") return SPAN_MD[k] ?? "md:col-span-1";
  if (breakpoint === "lg") return SPAN_LG[k] ?? "lg:col-span-1";
  return SPAN_1_24[k] ?? "col-span-1";
}

/**
 * 由 `span` 与响应式断点生成跨度 class。
 *
 * @param props - 跨度配置
 */
function buildSpanClass(
  props: Pick<GridItemProps, "span" | "xs" | "sm" | "md" | "lg">,
): string {
  const hasBreakpoint = props.xs != null || props.sm != null ||
    props.md != null || props.lg != null;
  if (!hasBreakpoint) return spanClass(props.span ?? 1);
  const parts = [spanClass(props.xs ?? props.span ?? 1)];
  if (props.sm != null) parts.push(spanClass(props.sm, "sm"));
  if (props.md != null) parts.push(spanClass(props.md, "md"));
  if (props.lg != null) parts.push(spanClass(props.lg, "lg"));
  return parts.join(" ");
}

export function GridItem(props: GridItemProps): JSXRenderable {
  const {
    key,
    class: classProp,
    className: classNameProp,
    children,
  } = props;
  const extraClass = classProp ?? classNameProp ?? "";
  const combined = twMerge("min-w-0", buildSpanClass(props), extraClass);
  return (
    <div className={combined} key={key}>
      {children}
    </div>
  );
}

/**
 * Grid 栅格（View）。
 * 支持 12/24 列、gap、子项 span；基于 CSS Grid。
 */

import { twMerge } from "tailwind-merge";

export interface GridProps {
  /** 列数，默认 12 */
  cols?: 6 | 12 | 24;
  /** 间距（Tailwind gap 值），默认 4 */
  gap?: number | string;
  /** 额外 class（作用于网格容器） */
  class?: string;
  /** 子节点（通常为 GridItem） */
  children?: unknown;
}

const colsClasses: Record<6 | 12 | 24, string> = {
  6: "grid-cols-6",
  12: "grid-cols-12",
  24: "grid-cols-[repeat(24,minmax(0,1fr))]",
};

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

export function Grid(props: GridProps) {
  const { cols = 12, gap = 4, class: className, children } = props;
  const gapCls = typeof gap === "number"
    ? gapClasses[String(gap)] ?? "gap-4"
    : (gapClasses[String(gap)] ?? "gap-4");

  return () => (
    <div
      class={twMerge(
        "grid w-full",
        colsClasses[cols],
        gapCls,
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface GridItemProps {
  /** 占据列数（1 到 cols），默认 1 */
  span?: number;
  /** 额外 class */
  class?: string;
  /** 子节点 */
  children?: unknown;
}

const spanClasses: Record<number, string> = {
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
};

function getSpanClass(span: number): string {
  if (span >= 1 && span <= 12) return spanClasses[span];
  if (span >= 13 && span <= 24) return `col-span-[${span}]` as "col-span-12";
  return "col-span-1";
}

export function GridItem(props: GridItemProps) {
  const { span = 1, class: className, children } = props;
  const spanCls = getSpanClass(span);

  return () => (
    <div class={twMerge(spanCls, className)}>
      {children}
    </div>
  );
}

/**
 * Descriptions 描述列表（View）。
 * 键值对展示；支持标题、列数、边框、尺寸、垂直/水平布局。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../types.ts";

export interface DescriptionsItem {
  /** 标签（键） */
  label: string | unknown;
  /** 内容（值） */
  children?: unknown;
  /** 跨列数 */
  span?: number;
}

export interface DescriptionsProps {
  /** 描述项列表 */
  items: DescriptionsItem[];
  /** 标题 */
  title?: string | unknown;
  /** 列数（桌面）；默认 3 */
  column?: number;
  /** 是否带边框 */
  bordered?: boolean;
  /** 尺寸 */
  size?: SizeVariant;
  /** 布局：horizontal 标签在左，vertical 标签在上 */
  layout?: "horizontal" | "vertical";
  /** 标签后是否显示冒号，默认 true */
  colon?: boolean;
  /** 额外 class */
  class?: string;
  /** 标签列 class */
  labelClass?: string;
  /** 内容列 class */
  contentClass?: string;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "text-xs py-1.5 px-2",
  sm: "text-sm py-2 px-3",
  md: "text-sm py-2.5 px-4",
  lg: "text-base py-3 px-4",
};

export function Descriptions(props: DescriptionsProps) {
  const {
    items,
    title,
    column = 3,
    bordered = false,
    size = "md",
    layout = "horizontal",
    colon = true,
    class: className,
    labelClass,
    contentClass,
  } = props;

  const cellCls = sizeClasses[size];
  const labelCls = twMerge(
    "text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/50",
    cellCls,
    labelClass,
  );
  const contentCls = twMerge(cellCls, contentClass);

  return (
    <div class={twMerge("descriptions", className)}>
      {title != null && (
        <div class="text-base font-semibold text-slate-900 dark:text-white mb-3">
          {title}
        </div>
      )}
      <div
        class={twMerge(
          "grid gap-0",
          bordered &&
            "border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden",
        )}
        style={{ gridTemplateColumns: `repeat(${column}, minmax(0, 1fr))` }}
      >
        {items.map((item, index) => {
          const span = item.span ?? 1;
          const isLastInRow = (index + 1) % column === 0;
          return (
            <div
              key={index}
              class={twMerge(
                "flex min-w-0",
                layout === "horizontal" ? "flex-row" : "flex-col",
                bordered &&
                  "border-b border-r border-slate-200 dark:border-slate-600",
              )}
              style={{
                gridColumn: `span ${span}`,
                ...(bordered && isLastInRow ? { borderRight: "none" } : {}),
              }}
            >
              <div
                class={twMerge(labelCls, layout === "horizontal" && "shrink-0")}
              >
                {item.label}
                {colon ? "：" : null}
              </div>
              <div class={twMerge(contentCls, "min-w-0")}>{item.children}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

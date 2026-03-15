/**
 * Timeline 时间轴（View）。
 * 流程、动态；支持左右/交替、自定义节点、颜色、pending。
 */

import { twMerge } from "tailwind-merge";
import type { ColorVariant } from "../types.ts";

export interface TimelineItemProps {
  /** 唯一 key */
  key?: string;
  /** 节点颜色/语义 */
  color?: ColorVariant | "gray";
  /** 自定义节点（圆点）内容；不传则用默认圆点 */
  dot?: unknown;
  /** 时间/标签（左侧或上方） */
  label?: string | unknown;
  /** 主内容 */
  children?: unknown;
  /** 是否待定（灰色、虚线） */
  pending?: boolean;
}

export interface TimelineProps {
  /** 时间轴项 */
  items: TimelineItemProps[];
  /** 模式：left 标签在左，right 标签在右，alternate 交替 */
  mode?: "left" | "right" | "alternate";
  /** 是否最后一项为 pending 样式（与 items[].pending 可叠加） */
  pending?: boolean;
  /** 额外 class */
  class?: string;
  /** 单项 class */
  itemClass?: string;
}

const colorClasses: Record<ColorVariant | "gray", string> = {
  default: "bg-slate-400 dark:bg-slate-500",
  primary: "bg-blue-500 dark:bg-blue-400",
  secondary: "bg-slate-500 dark:bg-slate-400",
  success: "bg-green-500 dark:bg-green-400",
  warning: "bg-amber-500 dark:bg-amber-400",
  danger: "bg-red-500 dark:bg-red-400",
  ghost: "bg-slate-300 dark:bg-slate-600",
  gray: "bg-slate-300 dark:bg-slate-600",
};

export function Timeline(props: TimelineProps) {
  const {
    items,
    mode = "left",
    pending: listPending = false,
    class: className,
    itemClass,
  } = props;

  return () => (
    <div class={twMerge("timeline flex flex-col", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isPending = item.pending ?? (listPending && isLast);
        const color = item.color ?? "primary";
        const dotCls = twMerge(
          "shrink-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 shadow",
          isPending ? "bg-slate-200 dark:bg-slate-600" : colorClasses[color],
        );
        const isAlternateLeft = mode === "alternate" && index % 2 === 0;
        const isAlternateRight = mode === "alternate" && index % 2 === 1;
        const isRight = mode === "right" || isAlternateRight;

        return (
          <div
            key={item.key ?? index}
            class={twMerge(
              "flex gap-3 relative",
              mode === "left" && "flex-row",
              (mode === "right" || isAlternateRight) && "flex-row-reverse",
              mode === "alternate" &&
                (isAlternateLeft ? "flex-row" : "flex-row-reverse"),
              !isLast && "pb-6",
              itemClass,
            )}
          >
            <div class="flex flex-col items-center">
              <div class={dotCls}>{item.dot}</div>
              {!isLast && (
                <div
                  class={twMerge(
                    "absolute top-3 left-[5px] w-0.5 flex-1 bg-slate-200 dark:bg-slate-600",
                    isPending &&
                      "border-l-2 border-dashed border-slate-300 dark:border-slate-500",
                  )}
                  style={{ height: "calc(100% - 0.75rem)" }}
                />
              )}
            </div>
            <div class={twMerge("flex-1 min-w-0", isRight && "text-right")}>
              {item.label != null && (
                <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {item.label}
                </div>
              )}
              <div class="text-sm text-slate-700 dark:text-slate-300">
                {item.children}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

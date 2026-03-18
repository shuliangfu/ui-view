/**
 * Steps 步骤条（View）。
 * 流程、向导；支持水平/垂直、当前步、每步 title/description、状态。
 */

import { twMerge } from "tailwind-merge";
import { IconCheck } from "../basic/icons/mod.ts";

export type StepStatus = "wait" | "process" | "finish" | "error";

export interface StepItem {
  /** 标题 */
  title: string | unknown;
  /** 描述（可选） */
  description?: string | unknown;
  /** 状态（可选，不传则根据 index 与 current 推导） */
  status?: StepStatus;
}

export interface StepsProps {
  /** 步骤项 */
  items: StepItem[];
  /** 当前步骤（从 0 开始） */
  current?: number;
  /** 方向：水平 或 垂直，默认 "horizontal" */
  direction?: "horizontal" | "vertical";
  /** 点击某步时回调（可选，用于可点击跳转的步骤条） */
  onChange?: (current: number) => void;
  /** 额外 class */
  class?: string;
}

function getStatus(
  index: number,
  current: number,
  override?: StepStatus,
): StepStatus {
  if (override != null) return override;
  if (index < current) return "finish";
  if (index === current) return "process";
  return "wait";
}

export function Steps(props: StepsProps) {
  const {
    items,
    current = 0,
    direction = "horizontal",
    onChange,
    class: className,
  } = props;

  const safeCurrent = Math.max(0, Math.min(items.length - 1, current));

  return (
    <div
      class={twMerge(
        "flex w-full",
        direction === "horizontal" ? "flex-row items-flex-start" : "flex-col",
        className,
      )}
      role="list"
      aria-label="步骤"
    >
      {items.map((item, index) => {
        const status = getStatus(index, safeCurrent, item.status);
        const isLast = index === items.length - 1;
        const isFinish = status === "finish";
        const isProcess = status === "process";
        const isError = status === "error";

        const iconCls = twMerge(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 shrink-0",
          isFinish &&
            "border-green-500 bg-green-500 text-white dark:border-green-400 dark:bg-green-400 dark:text-slate-900",
          isProcess &&
            "border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-400",
          isError &&
            "border-red-500 bg-red-50 text-red-600 dark:border-red-400 dark:bg-red-900/30 dark:text-red-400",
          status === "wait" &&
            "border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500",
        );

        const titleCls = twMerge(
          "text-sm font-medium",
          isProcess && "text-blue-600 dark:text-blue-400",
          isFinish && "text-slate-700 dark:text-slate-300",
          status === "wait" && "text-slate-500 dark:text-slate-400",
          isError && "text-red-600 dark:text-red-400",
        );

        const canClick = onChange != null;
        return (
          <div
            key={index}
            role="listitem"
            class={twMerge(
              "flex",
              direction === "horizontal" && !isLast &&
                "flex-1 flex-col items-center",
              direction === "vertical" && "flex-row gap-3",
              canClick && "cursor-pointer",
            )}
            onClick={canClick ? () => onChange?.(index) : undefined}
          >
            <div
              class={twMerge(
                "flex relative",
                direction === "horizontal"
                  ? "flex-col items-center"
                  : "flex-row gap-3",
              )}
            >
              <span class={iconCls}>
                {isFinish ? <IconCheck class="w-4 h-4" /> : index + 1}
              </span>
              {direction === "horizontal" && !isLast && (
                <div
                  class={twMerge(
                    "flex-1 w-full min-w-[24px] h-0.5 -mb-4 mt-4",
                    isFinish
                      ? "bg-green-500 dark:bg-green-400"
                      : "bg-slate-200 dark:bg-slate-600",
                  )}
                />
              )}
              {direction === "vertical" && !isLast && (
                <div
                  class={twMerge(
                    "absolute left-4 top-8 w-0.5 bg-slate-200 dark:bg-slate-600",
                    isFinish && "bg-green-500 dark:bg-green-400",
                  )}
                  style={{ height: "calc(100% + 1.5rem)" }}
                />
              )}
              {direction === "vertical" && (
                <div class="flex-1 pb-6">
                  <div class={titleCls}>{item.title}</div>
                  {item.description != null && (
                    <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.description}
                    </div>
                  )}
                </div>
              )}
            </div>
            {direction === "horizontal" && (
              <div class="mt-2 text-center">
                <div class={titleCls}>{item.title}</div>
                {item.description != null && (
                  <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.description}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

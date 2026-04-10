/**
 * Steps 步骤条（View）。
 * 流程、向导；支持水平/垂直、当前步、每步 title/description、状态。
 *
 * **current**：须传 **`current={sig}`** 或 **`current={() => sig.value}`**；勿写 `current={sig.value}`，
 * 否则手写 JSX 只快照首帧，onChange 更新后步骤条不重渲。
 */

import { isSignal, type Signal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconCheck } from "../basic/icons/Check.tsx";

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
  /**
   * 当前步骤（从 0 开始）。可传 `number`、无参 getter `() => number`，或 **`createSignal` 返回的 `Signal<number>`**；
   * 推荐 `current={stepRef}`，勿 `current={stepRef.value}`。
   */
  current?: number | (() => number) | Signal<number>;
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
  itemsLength?: number,
): StepStatus {
  if (override != null) return override;
  /** current >= 步骤总数 表示全部完成，每一步都显示为 finish */
  if (itemsLength != null && current >= itemsLength) return "finish";
  if (index < current) return "finish";
  if (index === current) return "process";
  return "wait";
}

/**
 * 解析受控 `current`：在组件返回的 getter 内调用，以订阅 `Signal` / 零参 getter。
 *
 * @param v - props.current
 * @returns 当前步索引（从 0 起）
 */
function readStepsCurrent(
  v: number | (() => number) | Signal<number> | undefined,
): number {
  if (v === undefined) return 0;
  if (isSignal(v)) return Number((v as Signal<number>).value);
  if (typeof v === "function") {
    if ((v as () => unknown).length !== 0) return 0;
    return Number((v as () => number)());
  }
  return Number(v);
}

export function Steps(props: StepsProps) {
  const {
    items,
    direction = "horizontal",
    onChange,
    class: className,
  } = props;

  /** 渲染 getter：内联读 `readStepsCurrent`，随 `Signal` / 零参 getter 更新 */
  return () => {
    const currentVal = readStepsCurrent(props.current);

    return (
      <div
        class={twMerge(
          "flex w-full min-w-0 max-w-full",
          direction === "horizontal" ? "flex-row items-flex-start" : "flex-col",
          className,
        )}
        role="list"
        aria-label="步骤"
      >
        {items.map((item, index) => {
          const status = getStatus(
            index,
            currentVal,
            item.status,
            items.length,
          );
          const isLast = index === items.length - 1;
          const isFinish = status === "finish";
          const isProcess = status === "process";
          const isError = status === "error";

          const iconCls = twMerge(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 shrink-0",
            // 已完成：与进行中同风格，绿色描边圆 + 绿色勾
            isFinish &&
              "border-green-500 bg-green-50 text-green-600 dark:border-green-400 dark:bg-slate-800 dark:text-green-400",
            // process/error 使用不透明背景，避免垂直模式下上一步连接线从半透明图标中透出
            isProcess &&
              "border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-slate-800 dark:text-blue-400",
            isError &&
              "border-red-500 bg-red-50 text-red-600 dark:border-red-400 dark:bg-slate-800 dark:text-red-400",
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
          /** 直接返回 VNode，不包成 getter，避免客户端为每个 step 插入 data-view-dynamic 包装导致 flex 直接子节点变化、水合后步骤向左靠拢 */
          return (
            <div
              key={index}
              role="listitem"
              class={twMerge(
                "flex",
                direction === "horizontal" &&
                  "flex-1 flex-col items-center min-w-20",
                direction === "vertical" && "flex-row gap-3",
                canClick && "cursor-pointer",
              )}
              onClick={canClick ? () => onChange?.(index) : undefined}
            >
              {/* 水平模式下固定图标列高度，使有无连接线时文字块都在同一水平线 */}
              <div
                class={twMerge(
                  "flex relative",
                  direction === "horizontal"
                    ? "flex-col items-center w-full min-h-12.5"
                    : "flex-row gap-3",
                )}
              >
                {/* 垂直模式下图标需置于连接线之上，避免上一步的连接线穿过当前图标 */}
                <span
                  class={twMerge(
                    iconCls,
                    direction === "vertical" && "relative z-10",
                  )}
                >
                  {isFinish
                    ? (
                      <IconCheck class="w-4 h-4 text-green-600 dark:text-green-400" />
                    )
                    : (
                      index + 1
                    )}
                </span>
                {direction === "horizontal" && (
                  <>
                    {!isLast
                      ? (
                        <div
                          class={twMerge(
                            "w-full min-w-[24px] h-0.5 mt-4 shrink-0",
                            isFinish
                              ? "bg-green-500 dark:bg-green-400"
                              : "bg-slate-200 dark:bg-slate-600",
                          )}
                        />
                      )
                      : (
                        /* 最后一步的线：已完成时也变绿，与前面步骤一致 */
                        <div
                          class={twMerge(
                            "mt-4 h-0.5 w-full min-w-[24px] shrink-0",
                            isFinish
                              ? "bg-green-500 dark:bg-green-400"
                              : "bg-slate-200 dark:bg-slate-600",
                          )}
                          aria-hidden
                        />
                      )}
                  </>
                )}
                {direction === "vertical" && !isLast && (
                  <div
                    class={twMerge(
                      "absolute left-4 top-8 z-0 w-0.5 bg-slate-200 dark:bg-slate-600",
                      isFinish && "bg-green-500 dark:bg-green-400",
                    )}
                    style={{ height: "calc(100% - 2rem)" }}
                    aria-hidden
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
                <div class="mt-2 w-full text-center px-1">
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
  };
}

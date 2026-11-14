/**
 * Steps 步骤条（View）。
 * 流程、向导；支持水平/垂直、当前步、每步 title/description、状态。
 *
 * **current**：须传 **`current={sig}`** 或 **`current={() => sig.value}`**；勿写 `current={sig.value}`，
 * 否则手写 JSX 只快照首帧，onChange 更新后步骤条不重渲。
 */

import { type JSXRenderable, onCleanup, type Signal } from "@dreamer/view";
import { readSignalValue, safeIsSignal } from "../safe-signal.ts";
import { readContainerWidthPx } from "../container-width.ts";
import { isHtmlElement } from "../dom-guards.ts";
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
  /**
   * 方向：水平 或 垂直，默认 "horizontal"。
   * 声明为水平时，容器宽度 ≤639.98px 会自动改为垂直，避免步骤挤成一团；显式 `vertical` 始终垂直。
   */
  direction?: "horizontal" | "vertical";
  /** 点击某步时回调（可选，用于可点击跳转的步骤条） */
  onChange?: (current: number) => void;
  /** 额外 class */
  class?: string;
  /** 多语言/自定义文案；未传字段走 {@link defaultStepsMessages} */
  messages?: Partial<StepsMessages>;
}

/** Steps 内置文案 */
export interface StepsMessages {
  /** 列表 `aria-label` */
  ariaLabel: string;
}

/** 默认中文文案 */
export const defaultStepsMessages: StepsMessages = {
  ariaLabel: "步骤",
};

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
  if (safeIsSignal(v)) return Number(readSignalValue(v as Signal<number>));
  if (typeof v === "function") {
    if ((v as () => unknown).length !== 0) return 0;
    return Number((v as () => number)());
  }
  return Number(v);
}

/** 与 DataPanel 分页相同的移动端上限（含）。 */
export const STEPS_MOBILE_MAX_PX = 639.98;

/**
 * 按容器宽度决定实际方向：显式垂直始终垂直；水平在宽度未知（SSR）时保持水平，
 * 测得 ≤639.98px 时改为垂直。
 */
export function resolveStepsDirection(
  containerWidthPx: number | undefined,
  requested: "horizontal" | "vertical" = "horizontal",
): "horizontal" | "vertical" {
  if (requested === "vertical") return "vertical";
  if (
    containerWidthPx != null &&
    Number.isFinite(containerWidthPx) &&
    containerWidthPx <= STEPS_MOBILE_MAX_PX
  ) {
    return "vertical";
  }
  return "horizontal";
}

/**
 * 把实际方向写到根节点 `data-steps-direction`，只用 DOM，不写 signal。
 * 在 ref／微任务里写宽度 signal 会让父级把步骤条整棵卸掉再挂，死循环占满主线程。
 */
function bindStepsDirectionAttr(
  getRequested: () => "horizontal" | "vertical",
): (el: unknown) => void {
  let observer: ResizeObserver | null = null;
  let observed: Element | null = null;
  const apply = (el: HTMLElement) => {
    const dir = resolveStepsDirection(readContainerWidthPx(el), getRequested());
    if (el.getAttribute("data-steps-direction") !== dir) {
      el.setAttribute("data-steps-direction", dir);
    }
  };
  onCleanup(() => {
    observer?.disconnect();
    observer = null;
    observed = null;
  });
  return (el: unknown) => {
    if (!isHtmlElement(el)) {
      observer?.disconnect();
      observer = null;
      observed = null;
      return;
    }
    if (observed === el && observer != null) {
      apply(el);
      return;
    }
    observer?.disconnect();
    observer = null;
    observed = el;
    apply(el);
    if (typeof ResizeObserver === "undefined") return;
    observer = new ResizeObserver((entries) => {
      const target = entries[0]?.target ?? el;
      if (isHtmlElement(target)) apply(target);
    });
    observer.observe(el);
  };
}

export function Steps(props: StepsProps): JSXRenderable {
  const {
    items,
    onChange,
    class: className,
  } = props;
  /** 合并默认中文文案与外部传入 messages */
  const m: StepsMessages = {
    ...defaultStepsMessages,
    ...(props.messages ?? {}),
  };

  const setRootRef = bindStepsDirectionAttr(
    () => props.direction ?? "horizontal",
  );

  /** 渲染 getter：内联读 `readStepsCurrent`，随 `Signal` / 零参 getter 更新 */
  return () => {
    const currentVal = readStepsCurrent(props.current);
    /** SSR／首帧：未测宽时保持声明方向（水平则水平）；窄屏由 ref 改 data-steps-direction，样式走 group-data */
    const initialDirection = props.direction ?? "horizontal";

    return (
      <div
        ref={setRootRef}
        data-steps-direction={initialDirection}
        class={twMerge(
          "group flex w-full min-w-0 max-w-full",
          "data-[steps-direction=horizontal]:flex-row data-[steps-direction=horizontal]:items-start",
          "data-[steps-direction=vertical]:flex-col",
          className,
        )}
        role="list"
        aria-label={m.ariaLabel}
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
                "group-data-[steps-direction=horizontal]:flex-1 group-data-[steps-direction=horizontal]:flex-col group-data-[steps-direction=horizontal]:items-center group-data-[steps-direction=horizontal]:min-w-20",
                "group-data-[steps-direction=vertical]:flex-row group-data-[steps-direction=vertical]:gap-3",
                canClick && "cursor-pointer",
              )}
              onClick={canClick ? () => onChange?.(index) : undefined}
            >
              {/* 水平模式下固定图标列高度，使有无连接线时文字块都在同一水平线 */}
              <div
                class={twMerge(
                  "flex relative",
                  "group-data-[steps-direction=horizontal]:flex-col group-data-[steps-direction=horizontal]:items-center group-data-[steps-direction=horizontal]:w-full group-data-[steps-direction=horizontal]:min-h-12.5",
                  "group-data-[steps-direction=vertical]:flex-row group-data-[steps-direction=vertical]:gap-3",
                )}
              >
                {/* 垂直模式下图标需置于连接线之上，避免上一步的连接线穿过当前图标 */}
                <span
                  class={twMerge(
                    iconCls,
                    "group-data-[steps-direction=vertical]:relative group-data-[steps-direction=vertical]:z-10",
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
                <div
                  class={twMerge(
                    "hidden w-full min-w-[24px] h-0.5 mt-4 shrink-0 group-data-[steps-direction=horizontal]:block",
                    isFinish
                      ? "bg-green-500 dark:bg-green-400"
                      : "bg-slate-200 dark:bg-slate-600",
                  )}
                  aria-hidden={isLast ? true : undefined}
                />
                {!isLast && (
                  <div
                    class={twMerge(
                      "absolute left-4 top-8 z-0 hidden w-0.5 bg-slate-200 dark:bg-slate-600 group-data-[steps-direction=vertical]:block",
                      isFinish && "bg-green-500 dark:bg-green-400",
                    )}
                    style={{ height: "calc(100% - 2rem)" }}
                    aria-hidden
                  />
                )}
                <div class="hidden flex-1 pb-6 group-data-[steps-direction=vertical]:block">
                  <div class={titleCls}>{item.title}</div>
                  {item.description != null && (
                    <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.description}
                    </div>
                  )}
                </div>
              </div>
              <div class="mt-2 hidden w-full text-center px-1 group-data-[steps-direction=horizontal]:block">
                <div class={titleCls}>{item.title}</div>
                {item.description != null && (
                  <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
}

/**
 * Divider 分割线（View）。
 * 水平或垂直；可选虚线、可选中间文案（orientation：left/right/center）。
 */

import { twMerge } from "tailwind-merge";

export type DividerOrientation = "left" | "right" | "center";

export interface DividerProps {
  /** 水平 或 垂直，默认 "horizontal" */
  type?: "horizontal" | "vertical";
  /** 是否虚线，默认 false */
  dashed?: boolean;
  /** 中间文案时的对齐（仅 type=horizontal 且传入 children 时有效），默认 "center" */
  orientation?: DividerOrientation;
  /** 中间文案（可选）；不传则为纯线 */
  children?: unknown;
  /** 额外 class */
  class?: string;
}

export function Divider(props: DividerProps) {
  const {
    type = "horizontal",
    dashed = false,
    orientation = "center",
    children,
    class: className,
  } = props;

  if (type === "vertical") {
    return () => (
      <span
        role="separator"
        aria-orientation="vertical"
        class={twMerge(
          "inline-block self-stretch w-px border-l border-slate-200 dark:border-slate-600",
          dashed && "border-dashed",
          className,
        )}
      />
    );
  }

  const hasLabel = children != null;
  const orientationCls = orientation === "left"
    ? "flex-row"
    : orientation === "right"
    ? "flex-row-reverse"
    : "flex-row";

  return () => (
    <div
      role="separator"
      aria-orientation="horizontal"
      class={twMerge(
        "flex items-center w-full my-4",
        orientationCls,
        className,
      )}
    >
      {hasLabel
        ? (
          <>
            <span
              class={twMerge(
                "flex-1 border-t border-slate-200 dark:border-slate-600",
                dashed && "border-dashed",
              )}
            />
            <span class="shrink-0 px-4 text-sm text-slate-500 dark:text-slate-400">
              {children}
            </span>
            <span
              class={twMerge(
                "flex-1 border-t border-slate-200 dark:border-slate-600",
                dashed && "border-dashed",
              )}
            />
          </>
        )
        : (
          <span
            class={twMerge(
              "w-full border-t border-slate-200 dark:border-slate-600",
              dashed && "border-dashed",
            )}
          />
        )}
    </div>
  );
}

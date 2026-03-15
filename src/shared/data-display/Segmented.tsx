/**
 * Segmented 分段控制器（View）。
 * 多选一紧凑展示；支持选项列表或子节点、尺寸、禁用、块级。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../types.ts";

export interface SegmentedOption<T = string> {
  /** 选项值 */
  value: T;
  /** 显示文案或节点 */
  label: string | unknown;
  /** 是否禁用 */
  disabled?: boolean;
}

export interface SegmentedProps<T = string> {
  /** 选项列表（与 children 二选一） */
  options?: SegmentedOption<T>[];
  /** 当前选中的值（受控） */
  value?: T;
  /** 变更回调 */
  onChange?: (value: T) => void;
  /** 是否块级撑满 */
  block?: boolean;
  /** 尺寸 */
  size?: SizeVariant;
  /** 是否禁用整组 */
  disabled?: boolean;
  /** 子节点（自定义每段内容，需配合 value/onChange 自行高亮） */
  children?: unknown;
  /** 额外 class */
  class?: string;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "text-xs px-2 py-1",
  sm: "text-sm px-2.5 py-1.5",
  md: "text-sm px-3 py-2",
  lg: "text-base px-4 py-2.5",
};

export function Segmented<T extends string = string>(props: SegmentedProps<T>) {
  const {
    options,
    value,
    onChange,
    block = false,
    size = "md",
    disabled = false,
    children,
    class: className,
  } = props;

  const baseCls =
    "inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600";

  if (children != null) {
    return () => (
      <div
        class={twMerge(
          baseCls,
          block && "w-full",
          disabled && "opacity-60 pointer-events-none",
          className,
        )}
        role="group"
        aria-label="分段选择"
      >
        {children}
      </div>
    );
  }

  if (options == null || options.length === 0) return () => null;

  return () => (
    <div
      class={twMerge(
        baseCls,
        block && "w-full flex",
        !block && "inline-flex",
        disabled && "opacity-60 pointer-events-none",
        className,
      )}
      role="tablist"
      aria-label="分段选择"
    >
      {options.map((opt) => {
        const isSelected = value === opt.value;
        const isDisabled = disabled || opt.disabled;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="tab"
            aria-selected={isSelected}
            disabled={isDisabled}
            class={twMerge(
              "shrink-0 rounded-md font-medium transition-colors",
              sizeClasses[size],
              isSelected
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              isDisabled && "cursor-not-allowed opacity-60",
              block && "flex-1",
            )}
            onClick={() => !isDisabled && onChange?.(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

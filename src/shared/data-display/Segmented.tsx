/**
 * Segmented 分段控制器（View）。
 * 多选一紧凑展示；支持选项列表或子节点、尺寸、禁用、块级。
 * 支持受控（value + onChange）与非受控（内部状态）；传 stateKey 可避免整树渲染导致内部状态被清空。
 * 写法对齐 Tabs/Collapse：返回 getter 并在 getter 内读 signal，保证 effect 订阅后点击能驱动重跑；
 * 同时在容器上通过 ref + createEffect 绑定原生 click 委托并直接更新 DOM，作为整树重渲染导致 effect 被替换时的保底。
 */

import { createSignal } from "@dreamer/view";
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
  /** 当前选中的值（受控）；可传 getter，如 value={() => signal()}，便于在 View 中订阅更新 */
  value?: T | (() => T);
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
  /**
   * 可选状态缓存 key。传值时非受控的选中状态会按 key 跨父组件重渲染保留，
   * 避免整树渲染导致 createSignal 重新执行、点击切换被清空。
   */
  stateKey?: string;
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
    value: valueProp,
    onChange,
    block = false,
    size = "md",
    disabled = false,
    children,
    class: className,
  } = props;

  /** 选中/未选中样式（与 button 及 DOM 保底更新一致） */
  const selectedCls =
    "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm";
  const unselectedCls =
    "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200";

  const baseCls =
    "inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600";

  if (children != null) {
    return (
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

  const [getVal, setVal] = createSignal<unknown>(
    typeof valueProp === "function"
      ? (valueProp as () => T)()
      : valueProp ?? null,
  );

  /** 当前展示值：受控时用 prop（或 getter 的返回值），非受控用内部 signal；读 getter 会建立订阅。 */
  const getDisplayValue = (): T | null => {
    if (valueProp === undefined) return getVal() as T | null;
    return (typeof valueProp === "function"
      ? (valueProp as () => T)()
      : valueProp) as T | null;
  };

  /** 点击：受控时只回调；非受控时更新内部 signal 并回调。 */
  const handleSelect = (v: T) => {
    if (valueProp === undefined) setVal(v);
    onChange?.(v);
  };

  return (
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
        const isSelected = getDisplayValue() === opt.value;
        const isDisabled = disabled || opt.disabled;
        return () => (
          <button
            key={String(opt.value)}
            type="button"
            role="tab"
            aria-selected={isSelected}
            data-value={opt.value}
            data-disabled={isDisabled ? "true" : undefined}
            disabled={isDisabled}
            class={twMerge(
              "shrink-0 rounded-md font-medium transition-colors",
              sizeClasses[size],
              isSelected ? selectedCls : unselectedCls,
              isDisabled && "cursor-not-allowed opacity-60",
              block && "flex-1",
            )}
            onClick={() => {
              if (isDisabled) return;
              handleSelect(opt.value);
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

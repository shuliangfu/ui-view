/**
 * InputNumber 数字输入（View）。
 * 对齐 Input：value 可为 getter、主体不读 value()，加减按钮由子组件内读 value() 计算 disabled，避免失焦。light/dark 主题。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../types.ts";

export interface InputNumberProps {
  /** 尺寸 */
  size?: SizeVariant;
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位文案 */
  placeholder?: string;
  /** 当前值（受控可选）；可为 getter 以在 View 细粒度下只更新 value 不重建节点，避免失焦 */
  value?: number | string | (() => number) | (() => string);
  /** 步进 */
  step?: number;
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 额外 class */
  class?: string;
  /** 变更回调 */
  onChange?: (e: Event) => void;
  /** 原生 name */
  name?: string;
  /** 原生 id */
  id?: string;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-2.5 py-1 text-xs rounded-md",
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-3 py-2 text-sm rounded-lg",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

/** 基础样式：不含宽度，需全宽时由调用方加 class="w-full" */
const base =
  "border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

/**
 * 加减按钮：仅在内部读 value() 计算 canDecrease/canIncrease，避免 InputNumber 主体订阅 signal 导致整块重渲染、input 失焦。
 */
function InputNumberButtons(props: {
  value?: number | string | (() => number) | (() => string);
  step: number;
  min?: number;
  max?: number;
  disabled: boolean;
  onTriggerChange: (newVal: number) => void;
}) {
  const { value, step, min, max, disabled, onTriggerChange } = props;
  const raw = typeof value === "function" ? value() : value;
  const val = value === undefined || raw === undefined || raw === ""
    ? ""
    : String(raw);
  const num = val === "" ? NaN : Number(val);
  const canDecrease = !disabled && (min == null || (num - step) >= min);
  const canIncrease = !disabled && (max == null || (num + step) <= max);

  return (
    <span class="flex flex-col min-w-12 w-12 border border-l-0 border-slate-300 dark:border-slate-600 rounded-r-lg overflow-hidden">
      <button
        type="button"
        class="flex-1 min-h-[22px] px-3 border-b border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
        disabled={!canIncrease}
        aria-label="增加"
        onClick={() =>
          onTriggerChange(
            Number.isNaN(num) ? step : Math.min(max ?? Infinity, num + step),
          )}
      >
        +
      </button>
      <button
        type="button"
        class="flex-1 min-h-[22px] px-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
        disabled={!canDecrease}
        aria-label="减少"
        onClick={() =>
          onTriggerChange(
            Number.isNaN(num)
              ? min ?? 0
              : Math.max(min ?? -Infinity, num - step),
          )}
      >
        −
      </button>
    </span>
  );
}

export function InputNumber(props: InputNumberProps) {
  const {
    size = "md",
    disabled = false,
    placeholder,
    value,
    step = 1,
    min,
    max,
    class: className,
    onChange,
    name,
    id,
  } = props;

  const sizeCls = sizeClasses[size];
  // 禁止在组件体内读 value()：会订阅 signal，导致整树重跑、input 失焦。value 透传给 <input value={value} />。

  const onTriggerChange = (newVal: number) => {
    const synthetic = {
      target: { value: String(newVal) },
    } as unknown as Event;
    onChange?.(synthetic);
  };

  const inputProps = {
    type: "number" as const,
    id,
    name,
    value,
    placeholder,
    disabled,
    step,
    min,
    max,
    class: twMerge(base, sizeCls, "rounded-r-none"),
    onChange,
  };

  return () => (
    <span class={twMerge("inline-flex items-stretch", className)}>
      <input {...inputProps} />
      <InputNumberButtons
        value={value}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        onTriggerChange={onTriggerChange}
      />
    </span>
  );
}

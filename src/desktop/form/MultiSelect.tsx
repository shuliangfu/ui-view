/**
 * MultiSelect 多选下拉（桌面版）。
 * 桌面：多选、标签展示；D/M 约定，桌面实现放 desktop/form。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../../shared/types.ts";

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  /** 当前选中值；可为 getter 以配合 View 细粒度更新 */
  value?: string[] | (() => string[]);
  size?: SizeVariant;
  disabled?: boolean;
  onChange?: (e: Event) => void;
  class?: string;
  name?: string;
  id?: string;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-2.5 py-1 text-xs rounded-md",
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-3 py-2 text-sm rounded-lg",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

const base =
  "w-full border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors appearance-none cursor-pointer min-h-[80px]";

const btnCls =
  "text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50";

export function MultiSelect(props: MultiSelectProps) {
  const {
    options,
    value = [],
    size = "md",
    disabled = false,
    onChange,
    class: className,
    name,
    id,
  } = props;
  const sizeCls = sizeClasses[size];
  const allValues = options.map((o) => o.value);

  const triggerChange = (newVal: string[]) => {
    const synthetic = { target: { value: newVal } } as unknown as Event;
    onChange?.(synthetic);
  };

  return () => {
    const resolvedValue = typeof value === "function" ? value() : (value ?? []);
    const allSelected = allValues.length > 0 &&
      allValues.every((v) => resolvedValue.includes(v));

    return (
      <span class="block">
        <div class="flex gap-1 mb-1">
          <button
            type="button"
            class={btnCls}
            disabled={disabled || allSelected}
            onClick={() => triggerChange([...allValues])}
          >
            全选
          </button>
          <button
            type="button"
            class={btnCls}
            disabled={disabled || resolvedValue.length === 0}
            onClick={() => triggerChange([])}
          >
            清空
          </button>
        </div>
        <select
          multiple
          id={id}
          name={name}
          disabled={disabled}
          class={twMerge(base, sizeCls, className)}
          onChange={onChange}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              selected={resolvedValue.includes(opt.value)}
            >
              {opt.label}
            </option>
          ))}
        </select>
      </span>
    );
  };
}

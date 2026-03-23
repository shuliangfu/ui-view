/**
 * MultiSelect 多选下拉（桌面版）。
 * 自定义多选列表（非原生 select multiple）：全选/清空 + 选项列表，支持 disabled 选项样式。
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

/** 列表容器：不含宽度，需全宽时由调用方加 class="w-full" */
const listBase =
  "border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 overflow-auto min-h-[80px] max-h-48";

const btnCls =
  "text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

const optionRowBase =
  "flex items-center gap-2 px-3 py-2 text-sm text-left w-full cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors";

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

  const triggerChange = (newVal: string[]) => {
    const synthetic = { target: { value: newVal } } as unknown as Event;
    onChange?.(synthetic);
  };

  const toggleOption = (optValue: string, optDisabled?: boolean) => {
    if (disabled || optDisabled) return;
    const resolved = typeof value === "function" ? value() : (value ?? []);
    const next = resolved.includes(optValue)
      ? resolved.filter((v) => v !== optValue)
      : [...resolved, optValue];
    triggerChange(next);
  };

  /**
   * 渲染列表与 hidden inputs；与 `return () =>` 分支共用，避免重复 JSX。
   * @param resolvedValue 当前选中 key 列表（已在调用方从 value / getter 解析）
   */
  const renderMultiSelectBody = (resolvedValue: string[]) => {
    const selectableValues = options
      .filter((o) => !o.disabled)
      .map((o) => o.value);
    const allSelected = selectableValues.length > 0 &&
      selectableValues.every((v) => resolvedValue.includes(v));

    return (
      <span class={twMerge("block", className)} id={id}>
        {/* 表单提交：多选用多个同名 hidden input */}
        {name &&
          resolvedValue.map((v) => (
            <input key={v} type="hidden" name={name} value={v} />
          ))}
        <div class="flex gap-1 mb-1">
          <button
            type="button"
            class={btnCls}
            disabled={disabled || allSelected}
            onClick={() => triggerChange([...selectableValues])}
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
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label="多选列表"
          class={twMerge(
            "w-full",
            listBase,
            sizeCls,
            disabled && "opacity-50 pointer-events-none",
          )}
        >
          {options.map((opt) => {
            const selected = resolvedValue.includes(opt.value);
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={selected}
                aria-disabled={opt.disabled}
                class={twMerge(
                  optionRowBase,
                  selected &&
                    "bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
                  opt.disabled &&
                    "opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent",
                )}
                onClick={() => toggleOption(opt.value, opt.disabled)}
              >
                <span
                  class={twMerge(
                    "shrink-0 size-4 rounded border flex items-center justify-center",
                    selected
                      ? "bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500 text-white"
                      : "border-slate-300 dark:border-slate-500",
                    opt.disabled && "opacity-50",
                  )}
                  aria-hidden
                >
                  {selected && (
                    <svg
                      class="size-3"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </span>
                <span class="flex-1">{opt.label}</span>
              </div>
            );
          })}
        </div>
      </span>
    );
  };

  /**
   * `value` 为 getter 时必须返回渲染函数：在 getter 内调用 `value()` 才能登记 View 的 signal 依赖。
   * 静态 `string[]` 时直接返回 VNode，与 Cascader 等纯 props 组件一致。
   */
  if (typeof value === "function") {
    return () => renderMultiSelectBody(value());
  }
  return renderMultiSelectBody(value ?? []);
}

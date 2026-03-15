/**
 * Input 单行输入（View）。
 * 支持 size、disabled、placeholder、allowClear（右侧清除），light/dark 主题。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../types.ts";

export interface InputProps {
  /** 尺寸 */
  size?: SizeVariant;
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位文案 */
  placeholder?: string;
  /** 输入值（受控可选）；可为 getter 以在 View 细粒度下只更新 value 不重建节点，避免失焦 */
  value?: string | (() => string);
  /** 原生 type，如 text、password、email */
  type?: string;
  /** 是否只读 */
  readOnly?: boolean;
  /** 是否必填（设置 aria-required） */
  required?: boolean;
  /** 错误状态（红框 + aria-invalid） */
  error?: boolean;
  /** 前缀 */
  prefix?: unknown;
  /** 后缀 */
  suffix?: unknown;
  /** 是否显示右侧清除按钮（有内容且非 disabled/readOnly 时显示） */
  allowClear?: boolean;
  /** 额外 class */
  class?: string;
  /** 输入回调 */
  onInput?: (e: Event) => void;
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

const base =
  "w-full border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
const errorCls =
  "border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500";
const readOnlyCls = "bg-slate-50 dark:bg-slate-800/80 cursor-default";

/** 清除按钮用的 X 图标（内联 SVG，避免 form 依赖 icons） */
const ClearIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="w-full h-full"
    aria-hidden
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export function Input(props: InputProps) {
  const {
    size = "md",
    disabled = false,
    placeholder,
    value,
    type = "text",
    readOnly = false,
    required = false,
    error = false,
    prefix,
    suffix,
    allowClear = false,
    class: className,
    onInput,
    onChange,
    name,
    id,
  } = props;

  const sizeCls = sizeClasses[size];
  // 不在组件体内读 value()，否则会订阅 signal、每次输入导致 Input() 重跑并返回新函数引用，
  // View reconcile 会因 oldItem !== newItem 整块 replaceChild，input 被替换、光标丢失。
  // showClear 改在返回的函数内按需读取 value，保持返回的 getter 引用稳定，由 View 做 patch 更新。

  const handleClear = () => {
    if (!onInput) return;
    const el = document.createElement("input");
    el.value = "";
    onInput({ target: el } as unknown as Event);
  };

  const inputProps = {
    type,
    id,
    name,
    value,
    placeholder,
    disabled,
    readOnly,
    "aria-required": required,
    "aria-invalid": error,
    class: twMerge(
      base,
      sizeCls,
      error && errorCls,
      readOnly && readOnlyCls,
      prefix && "pl-10",
      suffix && "pr-10",
      className,
    ),
    onInput,
    onChange,
  };

  return () => {
    const val = typeof value === "function" ? value() : value;
    const showClear = allowClear && val && !disabled && !readOnly;

    if (!prefix && !suffix && !allowClear) {
      return (
        <input
          {...inputProps}
          value={val}
        />
      );
    }

    return (
      <div class="relative w-full">
        {prefix && (
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500 dark:text-slate-400">
            {prefix}
          </div>
        )}
        <input
          {...inputProps}
          value={val}
          class={twMerge(
            inputProps.class,
            prefix && "pl-10",
            (suffix || showClear) && "pr-10",
          )}
        />
        {showClear && (
          <button
            type="button"
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
            onClick={handleClear}
          >
            <ClearIcon />
          </button>
        )}
        {!showClear && suffix && (
          <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500 dark:text-slate-400">
            {suffix}
          </div>
        )}
      </div>
    );
  };
}

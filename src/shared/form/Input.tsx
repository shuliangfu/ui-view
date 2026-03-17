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

/**
 * 右侧清除或后缀：仅在内部读 value()，避免 Input 主体订阅 signal 导致整块重渲染失焦。
 * 仅此子组件随 value 重跑，reconcile 只更新该槽位，input 节点保留。
 */
function InputClearOrSuffix(props: {
  value?: string | (() => string);
  allowClear: boolean;
  disabled: boolean;
  readOnly: boolean;
  suffix?: unknown;
  onClear: () => void;
}) {
  const { value, allowClear, disabled, readOnly, suffix, onClear } = props;
  const val = typeof value === "function" ? value() : value;
  const showClear = allowClear && val && !disabled && !readOnly;
  if (showClear) {
    return () => (
      <button
        type="button"
        class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
        onClick={onClear}
      >
        <ClearIcon />
      </button>
    );
  }
  if (suffix) {
    return () => (
      <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500 dark:text-slate-400">
        {suffix}
      </div>
    );
  }
  return null;
}

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
  // 禁止在组件体内读 value()：会订阅 signal，导致根 effect 重跑、整树重建、input 被替换失焦。
  // value 透传给 <input value={value} />，由 View applyProps 对 getter 做 createEffect 仅更新 .value。

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
      prefix ? "pl-10" : undefined,
      suffix || allowClear ? "pr-10" : undefined,
      className,
    ),
    onInput,
    onChange,
  };

  if (!prefix && !suffix && !allowClear) {
    return () => <input {...inputProps} />;
  }

  return () => (
    <div class="relative w-full">
      {prefix && (
        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500 dark:text-slate-400">
          {prefix}
        </div>
      )}
      <input
        {...inputProps}
        class={twMerge(
          inputProps.class,
          prefix ? "pl-10" : undefined,
          suffix || allowClear ? "pr-10" : undefined,
        )}
      />
      <InputClearOrSuffix
        value={value}
        allowClear={allowClear}
        disabled={disabled}
        readOnly={readOnly}
        suffix={suffix}
        onClear={handleClear}
      />
    </div>
  );
}

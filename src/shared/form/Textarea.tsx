/**
 * Textarea 多行输入（View）。
 * 对齐 Input：value 可为 getter、主体不读 value()，maxLength 字数由子组件读 value()，避免失焦。light/dark 主题。
 */

import { twMerge } from "tailwind-merge";

export interface TextareaProps {
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位文案 */
  placeholder?: string;
  /** 行数（高度） */
  rows?: number;
  /** 输入值（受控可选）；可为 getter 以在 View 细粒度下只更新 value 不重建节点，避免失焦 */
  value?: string | (() => string);
  /** 最大字数（展示已用/总数）；由子组件内读 value()，仅该槽位重跑 */
  maxLength?: number;
  /** 是否只读 */
  readOnly?: boolean;
  /** 是否必填（aria-required） */
  required?: boolean;
  /** 错误状态（红框 + aria-invalid） */
  error?: boolean;
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

/** 基础样式：不含宽度，需全宽时由调用方加 class="w-full" */
const base =
  "border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-3 py-2 text-sm rounded-lg resize-y min-h-[80px]";
const errorCls =
  "border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500";
const readOnlyCls = "bg-slate-50 dark:bg-slate-800/80 cursor-default";

/**
 * 仅此子组件读 value() 展示字数，避免 Textarea 主体订阅 signal 导致整块重渲染、textarea 失焦。
 * 在 textarea 下方一行、左侧显示剩余字符数。
 */
function TextareaLengthDisplay(props: {
  value?: string | (() => string);
  maxLength: number;
}) {
  const { value, maxLength } = props;
  const s = typeof value === "function" ? value() : (value ?? "");
  const len = s.length;
  const remaining = Math.max(0, maxLength - len);
  return (
    <span
      class="mt-1 block text-left text-xs text-slate-500 dark:text-slate-400"
      aria-live="polite"
    >
      剩余 {remaining} / {maxLength}
    </span>
  );
}

export function Textarea(props: TextareaProps) {
  const {
    disabled = false,
    placeholder,
    rows = 3,
    value,
    maxLength,
    readOnly = false,
    required = false,
    error = false,
    class: className,
    onInput,
    onChange,
    name,
    id,
  } = props;

  // 禁止在组件体内读 value()：会订阅 signal，导致整树重跑、textarea 失焦。value 透传给 <textarea value={value} />。

  const textareaProps = {
    id,
    name,
    rows,
    value,
    placeholder,
    disabled,
    readOnly,
    maxLength,
    "aria-required": required,
    "aria-invalid": error,
    class: twMerge(base, error && errorCls, readOnly && readOnlyCls, className),
    onInput,
    onChange,
  };

  if (maxLength == null) {
    return () => <textarea {...textareaProps} />;
  }

  return () => (
    <div>
      <textarea {...textareaProps} />
      <TextareaLengthDisplay value={value} maxLength={maxLength} />
    </div>
  );
}

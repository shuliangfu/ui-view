/**
 * Textarea 多行输入（View）。
 * 支持 rows、disabled、placeholder，light/dark 主题。
 */

import { twMerge } from "tailwind-merge";

export interface TextareaProps {
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位文案 */
  placeholder?: string;
  /** 行数（高度） */
  rows?: number;
  /** 输入值（受控可选）；可为 getter 以配合 View 细粒度更新 */
  value?: string | (() => string);
  /** 最大字数（展示已用/总数） */
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

const base =
  "w-full border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-3 py-2 text-sm rounded-lg resize-y min-h-[80px]";
const errorCls =
  "border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500";
const readOnlyCls = "bg-slate-50 dark:bg-slate-800/80 cursor-default";

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

  const len = value?.length ?? 0;

  return () => (
    <span class="block">
      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        aria-required={required}
        aria-invalid={error}
        class={twMerge(
          base,
          error && errorCls,
          readOnly && readOnlyCls,
          className,
        )}
        onInput={onInput}
        onChange={onChange}
      />
      {maxLength != null && (
        <span
          class="mt-1 block text-right text-xs text-slate-500 dark:text-slate-400"
          aria-live="polite"
        >
          {len} / {maxLength}
        </span>
      )}
    </span>
  );
}

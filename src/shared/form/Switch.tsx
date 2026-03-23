/**
 * Switch 开关（View）。
 * 支持 disabled、checked，light/dark 主题；label + 隐藏 input + peer 样式。
 */

import { twMerge } from "tailwind-merge";

export interface SwitchProps {
  /** 是否开启；可为 getter / `() => ref.value`（SignalRef），由 View 对属性做细粒度更新 */
  checked?: boolean | (() => boolean);
  /** 是否禁用 */
  disabled?: boolean;
  /** 额外 class（作用于 label） */
  class?: string;
  /** 变更回调 */
  onChange?: (e: Event) => void;
  /** 原生 name */
  name?: string;
  /** 原生 id */
  id?: string;
  /** 开启时文案（可选） */
  checkedChildren?: unknown;
  /** 关闭时文案（可选） */
  unCheckedChildren?: unknown;
  /** 错误状态（红框/红字） */
  error?: boolean;
}

const trackCls =
  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-600 transition-colors peer-focus:ring-2 peer-focus:ring-blue-500 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed peer-checked:bg-blue-600 peer-checked:border-blue-600 dark:peer-checked:bg-blue-500 dark:peer-checked:border-blue-500";
const thumbCls =
  "pointer-events-none absolute left-0.5 top-0.5 inline-block h-5 w-5 rounded-full bg-white dark:bg-slate-200 shadow ring-0 transition-transform peer-checked:translate-x-5";

export function Switch(props: SwitchProps) {
  const {
    checked = false,
    disabled = false,
    error = false,
    class: className,
    onChange,
    name,
    id,
    checkedChildren,
    unCheckedChildren,
  } = props;

  const errorTrackCls = error
    ? "border-red-500 dark:border-red-500 peer-checked:border-red-500"
    : "";

  return (
    <label
      class={twMerge(
        "relative inline-flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300",
        error && "text-red-600 dark:text-red-400",
        className,
      )}
    >
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        disabled={disabled}
        aria-invalid={error}
        class="peer sr-only"
        onChange={onChange}
      />
      <span class={twMerge(trackCls, errorTrackCls)} />
      <span class={thumbCls} />
      {unCheckedChildren != null && (
        <span class="peer-checked:hidden">{unCheckedChildren}</span>
      )}
      {checkedChildren != null && (
        <span class="hidden peer-checked:inline">{checkedChildren}</span>
      )}
    </label>
  );
}

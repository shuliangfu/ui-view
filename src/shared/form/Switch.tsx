/**
 * Switch 开关（View）。
 * 支持 disabled、checked，light/dark 主题；label + 隐藏 input + peer 样式。
 */

import type { Signal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";

export interface SwitchProps {
  /**
   * 是否开启。支持：`boolean`、零参 getter、`createSignal` 的返回值（`Signal<boolean>`，可直接 `checked={sig}`）。
   * 内部透传至原生 `input`，由 View 对 `checked` 做细粒度绑定。
   */
  checked?: boolean | (() => boolean) | Signal<boolean>;
  /** 是否禁用 */
  disabled?: boolean;
  /** 额外 class（作用于 label） */
  class?: string;
  /** 变更回调 */
  onChange?: (e: Event) => void;
  /** 失焦回调 */
  onBlur?: (e: Event) => void;
  /** 聚焦回调 */
  onFocus?: (e: Event) => void;
  /** 键盘按下 */
  onKeyDown?: (e: Event) => void;
  /** 键盘抬起 */
  onKeyUp?: (e: Event) => void;
  /** 点击控件 */
  onClick?: (e: Event) => void;
  /** 粘贴 */
  onPaste?: (e: Event) => void;
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
  /** 为 true 时隐藏轨道在 peer 聚焦时的蓝色 ring；默认 false 显示 */
  hideFocusRing?: boolean;
}

/** 开关轨道底纹；peer 聚焦 ring 由 `!hideFocusRing` 控制 */
const trackSurface =
  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-600 transition-colors peer-disabled:opacity-50 peer-disabled:cursor-not-allowed peer-checked:bg-blue-600 peer-checked:border-blue-600 dark:peer-checked:bg-blue-500 dark:peer-checked:border-blue-500";
const thumbCls =
  "pointer-events-none absolute left-0.5 top-0.5 inline-block h-5 w-5 rounded-full bg-white dark:bg-slate-200 shadow ring-0 transition-transform peer-checked:translate-x-5";

export function Switch(props: SwitchProps) {
  const {
    checked = false,
    disabled = false,
    error = false,
    class: className,
    onChange,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    onClick,
    onPaste,
    name,
    id,
    checkedChildren,
    unCheckedChildren,
    hideFocusRing = false,
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
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onClick={onClick}
        onPaste={onPaste}
      />
      <span
        class={twMerge(
          trackSurface,
          hideFocusRing
            ? "peer-focus:ring-0"
            : "peer-focus:ring-2 peer-focus:ring-blue-500",
          errorTrackCls,
        )}
      />
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

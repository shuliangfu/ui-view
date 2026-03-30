/**
 * Password 密码输入（View）。
 * 完全对齐 Input：value 可为 getter、主体不读 value()、右侧槽位由子组件读 value()；支持显隐切换、强度提示。light/dark 主题。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../types.ts";
import { controlBlueFocusRing } from "./input-focus-ring.ts";

export interface PasswordProps {
  /** 尺寸 */
  size?: SizeVariant;
  /** 是否禁用 */
  disabled?: boolean;
  /** 为 true 时隐藏聚焦激活态边框（输入框与显隐按钮）；默认 false 显示 */
  hideFocusRing?: boolean;
  /** 占位文案 */
  placeholder?: string;
  /** 输入值（受控可选）；可为 getter 以在 View 细粒度下只更新 value 不重建节点，避免失焦 */
  value?: string | (() => string);
  /** 是否显示明文（由父组件控制，用于显隐切换） */
  showPassword?: boolean;
  /** 点击显隐按钮时回调，父组件切换 showPassword */
  onToggleShow?: () => void;
  /** 额外 class（作用于包裹容器） */
  class?: string;
  /** 输入回调 */
  onInput?: (e: Event) => void;
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
  /** 点击输入区域 */
  onClick?: (e: Event) => void;
  /** 粘贴 */
  onPaste?: (e: Event) => void;
  /** 原生 name */
  name?: string;
  /** 原生 id */
  id?: string;
  /** 是否显示强度提示（弱/中/强）；由子组件内读 value()，仅该槽位重跑 */
  showStrength?: boolean;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-2.5 py-1 pr-8 text-xs rounded-md",
  sm: "px-3 py-1.5 pr-9 text-sm rounded-md",
  md: "px-3 py-2 pr-10 text-sm rounded-lg",
  lg: "px-4 py-2.5 pr-11 text-base rounded-lg",
};

/** 输入区底纹（不含 ring） */
const inputSurface =
  "border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

/**
 * 强度提示：仅在内部读 value()，避免 Password 主体订阅 signal 导致整块重渲染失焦。
 * 仅此子组件随 value 重跑，reconcile 只更新该槽位，input 节点保留。与 Input 的 InputClearOrSuffix 同模式。
 */
function PasswordStrength(props: {
  value?: string | (() => string);
  showStrength: boolean;
}) {
  const { value, showStrength } = props;
  if (!showStrength) return null;
  /**
   * 在渲染 getter 内读 `value()`，保证与 SignalRef / getter 同步；避免仅在父级首次执行时算一次强度导致 stale。
   */
  return () => {
    const s = typeof value === "function" ? value() : (value ?? "");
    if (s.length === 0) return null;
    let score = 0;
    if (s.length >= 6) score++;
    if (s.length >= 10) score++;
    if (/[0-9]/.test(s)) score++;
    if (/[a-zA-Z]/.test(s)) score++;
    if (/[^a-zA-Z0-9]/.test(s)) score++;
    let level: string;
    let cls: string;
    if (score <= 2) {
      level = "弱";
      cls = "text-red-600 dark:text-red-400";
    } else if (score <= 4) {
      level = "中";
      cls = "text-amber-600 dark:text-amber-400";
    } else {
      level = "强";
      cls = "text-green-600 dark:text-green-400";
    }
    return (
      <span class={twMerge("block mt-1 text-xs", cls)} aria-live="polite">
        强度：{level}
      </span>
    );
  };
}

export function Password(props: PasswordProps) {
  const {
    size = "md",
    disabled = false,
    placeholder,
    value,
    showPassword = false,
    onToggleShow,
    showStrength = false,
    hideFocusRing = false,
    class: className,
    onInput,
    onChange,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    onClick,
    onPaste,
    name,
    id,
  } = props;

  const sizeCls = sizeClasses[size];
  // 禁止在组件体内读 value()：会订阅 signal，导致根 effect 重跑、整树重建、input 被替换失焦。
  // value 透传给 <input value={value} />，由 View applyProps 对 getter 做 createEffect 仅更新 .value。

  const inputProps = {
    type: showPassword ? "text" : "password",
    id,
    name,
    value,
    placeholder,
    disabled,
    class: twMerge(
      inputSurface,
      controlBlueFocusRing(!hideFocusRing),
      sizeCls,
      onToggleShow || showStrength ? "pr-10" : undefined,
      !onToggleShow && !showStrength ? className : undefined,
    ),
    onInput,
    onChange,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    onClick,
    onPaste,
  };

  if (!onToggleShow && !showStrength) {
    return () => <input {...inputProps} />;
  }

  return () => (
    <div class={twMerge("relative", className)}>
      <input {...inputProps} class={twMerge("w-full", inputProps.class)} />
      {onToggleShow && (
        <button
          type="button"
          class={twMerge(
            "absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none",
            controlBlueFocusRing(!hideFocusRing),
          )}
          onClick={onToggleShow}
          aria-label={showPassword ? "隐藏密码" : "显示密码"}
          tabIndex={-1}
        >
          {showPassword
            ? (
              <svg
                class="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            )
            : (
              <svg
                class="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
        </button>
      )}
      <PasswordStrength value={value} showStrength={showStrength} />
    </div>
  );
}

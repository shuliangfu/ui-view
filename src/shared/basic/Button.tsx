/**
 * Button 基础组件（View 细粒度渲染）。
 * 使用 Tailwind v4 类名，支持 light/dark 主题（需应用层在根节点使用 .dark 切换）。
 */

import { createContext } from "@dreamer/view/context";
import { twMerge } from "tailwind-merge";
import type { ColorVariant, SizeVariant } from "../../shared/types.ts";

export interface ButtonProps {
  /**
   * 列表等场景下的稳定标识，写到原生 `data-key` 上便于调试与 E2E 选择器。
   * 勿与 JSX 的 `key={...}` 混淆： reconciler 的 key 写在标签上即可，不必传本属性。
   */
  itemKey?: string | number;
  /** 语义变体，对应 shared ColorVariant */
  variant?: ColorVariant;
  /** 尺寸，对应 shared SizeVariant */
  size?: SizeVariant;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 原生 type */
  type?: "button" | "submit" | "reset";
  /** 额外 class，与 Tailwind 合并 */
  class?: string;
  /** 点击回调 */
  onClick?: (e: Event) => void;
  /** 子节点（文案或图标等） */
  children?: unknown;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-2.5 py-1 text-xs rounded-md",
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-5 py-2.5 text-base rounded-lg",
};

/** 各变体样式：显式区分浅色/深色，避免白天模式白底白字或深色模式不可见 */
const variantClasses: Record<ColorVariant, string> = {
  default:
    "bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:border-slate-600",
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 border border-transparent dark:bg-blue-500 dark:hover:bg-blue-600",
  secondary:
    "bg-gray-200 text-gray-800 hover:bg-gray-300 border border-gray-300 dark:bg-slate-600 dark:text-slate-100 dark:hover:bg-slate-500 dark:border-slate-500",
  success:
    "bg-green-600 text-white hover:bg-green-700 border border-transparent dark:bg-green-500 dark:hover:bg-green-600",
  warning:
    "bg-amber-500 text-white hover:bg-amber-600 border border-transparent dark:bg-amber-500 dark:hover:bg-amber-600",
  danger:
    "bg-red-600 text-white hover:bg-red-700 border border-transparent dark:bg-red-500 dark:hover:bg-red-600",
  ghost:
    "bg-transparent text-gray-800 hover:bg-gray-100 border border-gray-300 dark:border-transparent dark:text-slate-200 dark:hover:bg-slate-700 dark:border-slate-600",
};

/**
 * 紧凑按钮组内：无焦点环，focus/active 背景与对应变体的 hover 同色（与 variantClasses 一致）。
 */
const variantGroupFocusActiveClasses: Record<ColorVariant, string> = {
  default:
    "focus:bg-gray-200 active:bg-gray-200 dark:focus:bg-slate-600 dark:active:bg-slate-600",
  primary:
    "focus:bg-blue-700 active:bg-blue-700 dark:focus:bg-blue-600 dark:active:bg-blue-600",
  secondary:
    "focus:bg-gray-300 active:bg-gray-300 dark:focus:bg-slate-500 dark:active:bg-slate-500",
  success:
    "focus:bg-green-700 active:bg-green-700 dark:focus:bg-green-600 dark:active:bg-green-600",
  warning:
    "focus:bg-amber-600 active:bg-amber-600 dark:focus:bg-amber-600 dark:active:bg-amber-600",
  danger:
    "focus:bg-red-700 active:bg-red-700 dark:focus:bg-red-600 dark:active:bg-red-600",
  ghost:
    "focus:bg-gray-100 active:bg-gray-100 dark:focus:bg-slate-700 dark:active:bg-slate-700",
};

/** 默认不在任何 ButtonGroup 内；Provider 注入 { attached: true } 时子级 Button 切换为组内样式 */
const ButtonGroupContext = createContext<{ attached: boolean }>(
  { attached: false },
  "dreamer.ui-view.ButtonGroup",
);

/** ButtonGroup 容器 props（与 {@link Button} 同文件）。 */
export interface ButtonGroupProps {
  /** 是否紧凑相连（默认 true：中间无间隙、仅首尾圆角；false 时保留间距） */
  attached?: boolean;
  /** 额外 class，与 Tailwind 合并 */
  class?: string;
  /** 子节点（通常为多个 {@link Button}） */
  children?: unknown;
}

/**
 * 按钮组容器：横向排列多个按钮。
 * - `attached` 时下面 `class` 直接写 Tailwind，只负责子项圆角与相邻边框；焦点/按下样式由子级 {@link Button} 通过 Context 自行合并。
 * - 勿用模块级变量传递「是否在组内」，请始终用本组件 + Provider。
 */
export function ButtonGroup(props: ButtonGroupProps) {
  const { attached = true, class: className, children } = props;
  return (
    <ButtonGroupContext.Provider value={{ attached }}>
      <div
        class={twMerge(
          "inline-flex items-center",
          attached
            ? "gap-0 [&>*:first-child]:rounded-tr-none! [&>*:first-child]:rounded-br-none! [&>*:last-child]:rounded-tl-none! [&>*:last-child]:rounded-bl-none! [&>*:not(:first-child):not(:last-child)]:rounded-none! [&>*:not(:last-child)]:border-r-0!"
            : "gap-2",
          className,
        )}
        role="group"
      >
        {children}
      </div>
    </ButtonGroupContext.Provider>
  );
}

export function Button(props: ButtonProps) {
  const {
    itemKey,
    variant = "primary",
    size = "md",
    disabled = false,
    loading = false,
    type = "button",
    class: className,
    onClick,
    children,
  } = props;

  const { attached: inAttachedGroup } = ButtonGroupContext.useContext();

  /** 默认带蓝色焦点环；在紧凑组内去掉 ring，改由 variant 的 focus/active 背景提示 */
  const base = inAttachedGroup
    ? "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0 disabled:opacity-40 disabled:grayscale disabled:pointer-events-none disabled:cursor-not-allowed"
    : "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 disabled:opacity-40 disabled:grayscale disabled:pointer-events-none disabled:cursor-not-allowed";

  const sizeCls = sizeClasses[size];
  const variantCls = variantClasses[variant];
  const groupFocusCls = inAttachedGroup
    ? variantGroupFocusActiveClasses[variant]
    : "";

  return (
    <button
      type={type}
      class={twMerge(base, sizeCls, variantCls, groupFocusCls, className)}
      disabled={disabled || loading}
      onClick={onClick}
      data-variant={variant}
      data-key={itemKey !== undefined ? String(itemKey) : undefined}
    >
      {loading && (
        <svg
          class="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

/**
 * Button 基础组件（View 细粒度渲染）。
 * 使用 Tailwind v4 类名，支持 light/dark 主题（需应用层在根节点使用 .dark 切换）。
 */

import { twMerge } from "tailwind-merge";
import type { ColorVariant, SizeVariant } from "../../shared/types.ts";

export interface ButtonProps {
  /** 列表渲染时的 key（框架用于 diff）；有值时同时以 data-key 写到原生 button 上便于调试/选择器 */
  key?: string | number;
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

export function Button(props: ButtonProps) {
  const {
    key,
    variant = "primary",
    size = "md",
    disabled = false,
    loading = false,
    type = "button",
    class: className,
    onClick,
    children,
  } = props;

  const base =
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 disabled:opacity-40 disabled:grayscale disabled:pointer-events-none disabled:cursor-not-allowed";
  const sizeCls = sizeClasses[size];
  const variantCls = variantClasses[variant];

  return (
    <button
      type={type}
      class={twMerge(base, sizeCls, variantCls, className)}
      disabled={disabled || loading}
      onClick={onClick}
      data-key={key !== undefined ? String(key) : undefined}
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

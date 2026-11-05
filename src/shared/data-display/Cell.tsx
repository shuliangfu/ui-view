/**
 * Cell／CellGroup 单元格（View）。
 * 移动端常见列表行：标题、描述、右侧额外、箭头、点击；`CellGroup` 提供分组圆角与标题。
 */

import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";

export interface CellProps {
  /** 主标题 */
  title?: unknown;
  /** 下方描述 */
  description?: unknown;
  /** 左侧图标／自定义 */
  icon?: unknown;
  /** 右侧额外内容（文案／开关等） */
  extra?: unknown;
  /** 显示右侧箭头 */
  arrow?: boolean;
  /** 整行点击 */
  onClick?: () => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 必填星号 */
  required?: boolean;
  /** 点击反馈（按下底色） */
  clickable?: boolean;
  class?: string;
  children?: unknown;
}

export interface CellGroupProps {
  /** 分组标题 */
  title?: unknown;
  /** 额外 class */
  class?: string;
  /** 是否插入分割线（子 Cell 之间），默认 true */
  inset?: boolean;
  children?: unknown;
}

export function Cell(props: CellProps): JSXRenderable {
  const {
    title,
    description,
    icon,
    extra,
    arrow = false,
    onClick,
    disabled = false,
    required = false,
    clickable,
    class: className,
    children,
  } = props;
  const canClick = !disabled && (clickable ?? onClick != null);

  return (
    <div
      class={twMerge(
        "cell flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
        canClick && "cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/80",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
      role={canClick ? "button" : undefined}
      tabindex={canClick ? 0 : undefined}
      onClick={() => {
        if (!disabled) onClick?.();
      }}
      onKeyDown={(e: KeyboardEvent) => {
        if (!canClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {icon != null && <div class="shrink-0 text-slate-500">{icon}</div>}
      <div class="min-w-0 flex-1">
        {(title != null || required) && (
          <div class="text-sm font-medium truncate">
            {required && <span class="text-red-500 mr-0.5">*</span>}
            {title}
          </div>
        )}
        {description != null && (
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {description}
          </div>
        )}
        {children}
      </div>
      {extra != null && (
        <div class="shrink-0 text-sm text-slate-500 dark:text-slate-400">
          {extra}
        </div>
      )}
      {arrow && (
        <span class="shrink-0 text-slate-400" aria-hidden>
          ›
        </span>
      )}
    </div>
  );
}

export function CellGroup(props: CellGroupProps): JSXRenderable {
  const { title, class: className, inset = true, children } = props;
  return (
    <div class={twMerge("cell-group", className)}>
      {title != null && (
        <div class="px-4 py-2 text-xs text-slate-500 dark:text-slate-400">
          {title}
        </div>
      )}
      <div
        class={twMerge(
          "overflow-hidden bg-white dark:bg-slate-900",
          inset && "mx-3 rounded-xl border border-slate-200/80 dark:border-slate-700",
          "[&_.cell+_.cell]:border-t [&_.cell+_.cell]:border-slate-100 dark:[&_.cell+_.cell]:border-slate-800",
        )}
      >
        {children}
      </div>
    </div>
  );
}

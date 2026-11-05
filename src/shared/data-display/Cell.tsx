/**
 * Cell／CellGroup 单元格（View）。
 * 移动端常见列表行：标题、描述、右侧额外、箭头、点击；`CellGroup` 提供分组圆角与标题。
 *
 * 有 `arrow`／可点击意图时须传 `onClick` 或 `href`，否则仅有箭头外观、无法触发（文档示例须绑回调）。
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
  /** 显示右侧箭头；通常配合 `onClick`／`href` 表示可进入 */
  arrow?: boolean;
  /** 整行点击 */
  onClick?: () => void;
  /** 可选链接：有 `href` 时渲染为 `<a>`，与 `onClick` 可并存 */
  href?: string;
  /** 是否禁用（降低透明度且不可点；文档应标明） */
  disabled?: boolean;
  /** 必填星号 */
  required?: boolean;
  /**
   * 点击反馈（按下底色）。
   * 默认：有 `onClick`／`href` 时为 true；也可对仅展示箭头的行强制打开／关闭。
   */
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
    href,
    disabled = false,
    required = false,
    clickable,
    class: className,
    children,
  } = props;
  const hasAction = onClick != null || (href != null && href !== "");
  const canClick = !disabled && (clickable ?? hasAction);

  const classNames = twMerge(
    "cell flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-left w-full",
    canClick &&
      "cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/80 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
    disabled && "opacity-50 pointer-events-none cursor-not-allowed",
    !canClick && !disabled && arrow && "cursor-default",
    className,
  );

  const body = (
    <>
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
        <div
          class="shrink-0 text-sm text-slate-500 dark:text-slate-400"
          data-dreamer-cell-extra=""
        >
          {extra}
        </div>
      )}
      {arrow && (
        <span
          class="shrink-0 text-slate-400"
          aria-hidden
          data-dreamer-cell-arrow=""
        >
          ›
        </span>
      )}
    </>
  );

  const activate = () => {
    if (disabled) return;
    onClick?.();
  };

  if (href != null && href !== "" && !disabled) {
    return (
      <a
        href={href}
        class={classNames}
        data-dreamer-cell=""
        data-clickable={canClick ? "true" : "false"}
        aria-disabled={disabled ? "true" : undefined}
        onClick={(e: Event) => {
          if (onClick) {
            e.preventDefault();
            activate();
          }
        }}
        onKeyDown={(e: KeyboardEvent) => {
          if (!canClick) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            activate();
          }
        }}
      >
        {body}
      </a>
    );
  }

  return (
    <div
      class={classNames}
      role={canClick ? "button" : undefined}
      tabIndex={canClick ? 0 : undefined}
      data-dreamer-cell=""
      data-clickable={canClick ? "true" : "false"}
      aria-disabled={disabled ? "true" : undefined}
      onClick={() => activate()}
      onKeyDown={(e: KeyboardEvent) => {
        if (!canClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      }}
    >
      {body}
    </div>
  );
}

export function CellGroup(props: CellGroupProps): JSXRenderable {
  const { title, class: className, inset = true, children } = props;
  return (
    <div class={twMerge("cell-group", className)} data-dreamer-cell-group="">
      {title != null && (
        <div class="px-4 py-2 text-xs text-slate-500 dark:text-slate-400">
          {title}
        </div>
      )}
      <div
        class={twMerge(
          "overflow-hidden bg-white dark:bg-slate-900",
          inset &&
            "mx-3 rounded-xl border border-slate-200/80 dark:border-slate-700",
          "[&_.cell+_.cell]:border-t [&_.cell+_.cell]:border-slate-100 dark:[&_.cell+_.cell]:border-slate-800",
        )}
      >
        {children}
      </div>
    </div>
  );
}

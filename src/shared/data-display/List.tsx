/**
 * List 列表（View）。
 * 桌面/移动均常用；支持 header、footer、分割线、加载态、栅格模式、尺寸。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../types.ts";

export interface ListItemProps {
  /** 唯一 key */
  key?: string;
  /** 主内容（或使用 children 自定义整项） */
  children?: unknown;
  /** 左侧缩略图/图标（可选） */
  thumb?: unknown;
  /** 右侧额外操作/文案（可选） */
  extra?: unknown;
  /** 是否禁用 */
  disabled?: boolean;
  /** 点击回调 */
  onClick?: (e: Event) => void;
}

export interface ListProps {
  /** 列表项数据（每项渲染为一项，可配合 renderItem 自定义） */
  items?: ListItemProps[] | unknown[];
  /** 自定义每项渲染；不传则用 items[].children + thumb + extra */
  renderItem?: (item: unknown, index: number) => unknown;
  /** 列表头部 */
  header?: unknown;
  /** 列表底部 */
  footer?: unknown;
  /** 是否加载态（底部显示 loading） */
  loading?: boolean;
  /** 加载更多区域（如「加载更多」按钮或骨架，用于无限滚动） */
  loadMore?: unknown;
  /** 是否显示分割线，默认 true */
  split?: boolean;
  /** 尺寸 */
  size?: SizeVariant;
  /** 是否带边框容器 */
  bordered?: boolean;
  /** 栅格模式：每行几列（响应式），不传则单列 */
  grid?: {
    column?: number;
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  /** 额外 class */
  class?: string;
  /** 单项 class */
  itemClass?: string;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "py-2 px-3 text-xs",
  sm: "py-2.5 px-3 text-sm",
  md: "py-3 px-4 text-sm",
  lg: "py-4 px-4 text-base",
};

export function List(props: ListProps) {
  const {
    items = [],
    renderItem,
    header,
    footer,
    loading = false,
    loadMore,
    split = true,
    size = "md",
    bordered = false,
    grid,
    class: className,
    itemClass,
  } = props;

  const listItems = Array.isArray(items) ? items : [];
  const paddingCls = sizeClasses[size];

  const renderOne = (item: unknown, index: number): unknown => {
    if (renderItem) return renderItem(item, index);
    const it = item as ListItemProps;
    const hasThumb = it.thumb != null;
    const hasExtra = it.extra != null;
    return (
      <div
        key={it.key ?? index}
        class={twMerge(
          "flex items-center gap-3 min-w-0",
          paddingCls,
          it.onClick &&
            "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50",
          it.disabled && "opacity-60 cursor-not-allowed",
          itemClass,
        )}
        onClick={it.onClick as (e: Event) => void}
      >
        {hasThumb && <div class="shrink-0">{it.thumb}</div>}
        <div class="flex-1 min-w-0">{it.children}</div>
        {hasExtra && <div class="shrink-0">{it.extra}</div>}
      </div>
    );
  };

  const gridStyle = grid
    ? {
      display: "grid",
      gap: "0.5rem",
      gridTemplateColumns: `repeat(${grid.column ?? 1}, minmax(0, 1fr))`,
    }
    : undefined;

  return (
    <div
      class={twMerge(
        "list",
        bordered &&
          "border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden",
        className,
      )}
    >
      {header != null && (
        <div class="px-4 py-2 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-sm font-medium text-slate-700 dark:text-slate-300">
          {header}
        </div>
      )}
      <div class={grid ? "" : "flex flex-col"} style={gridStyle}>
        {listItems.map((item, i) => (
          <div
            key={i}
            class={split && !grid
              ? "border-b border-slate-100 dark:border-slate-700 last:border-b-0"
              : ""}
          >
            {renderOne(item, i)}
          </div>
        ))}
      </div>
      {loading && (
        <div class="px-4 py-3 text-center text-sm text-slate-500 dark:text-slate-400">
          加载中…
        </div>
      )}
      {loadMore != null && <div class="px-4 py-3">{loadMore}</div>}
      {footer != null && (
        <div class="px-4 py-2 border-t border-slate-200 dark:border-slate-600 text-sm text-slate-500 dark:text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
}

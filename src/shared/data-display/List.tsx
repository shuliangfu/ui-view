/**
 * List 列表（View）。
 * 桌面/移动均常用；支持 header、footer、分割线、加载态、栅格模式、尺寸。
 * 适用于设置项、轻量数据行、带头尾的清单等；超长列表请业务侧做虚拟滚动或分页。
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
  /**
   * 栅格模式（多列卡片式排布）。
   * - 仅设 `column`：各断点列数相同（1–12）。
   * - 设 `xs` / `sm` / `md` / `lg` 任一项：按 Tailwind 移动优先；最小屏列数取 `xs ?? column ?? 1`，
   *   较大屏仅在传入对应键时追加 `sm:` / `md:` / `lg:` 列数。
   */
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

/** 列数夹取到 1–12，避免非法 grid 模板 */
function clampGridColumns(n: number): number {
  const k = Math.floor(n);
  if (!Number.isFinite(k)) return 1;
  return Math.min(12, Math.max(1, k));
}

/**
 * 将列数映射为 Tailwind `grid-cols-*`（须为静态类名以便打包器收录）。
 *
 * @param n - 列数 1–12
 * @param breakpoint - 可选 `sm` | `md` | `lg` 生成响应式类
 */
function gridColsClass(
  n: number,
  breakpoint?: "sm" | "md" | "lg",
): string {
  const k = clampGridColumns(n);
  const map: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    7: "grid-cols-7",
    8: "grid-cols-8",
    9: "grid-cols-9",
    10: "grid-cols-10",
    11: "grid-cols-11",
    12: "grid-cols-12",
  };
  const util = map[k] ?? "grid-cols-1";
  return breakpoint != null ? `${breakpoint}:${util}` : util;
}

/**
 * 由 {@link ListProps.grid} 生成容器 class：`grid` + `gap-2` + 列数工具类。
 *
 * @param grid - 栅格配置
 */
function buildListGridContainerClass(
  grid: NonNullable<ListProps["grid"]>,
): string {
  const hasBreakpoint = grid.xs != null || grid.sm != null || grid.md != null ||
    grid.lg != null;
  const parts = ["grid", "gap-2"];
  if (!hasBreakpoint) {
    parts.push(gridColsClass(grid.column ?? 1));
    return parts.join(" ");
  }
  const base = grid.xs ?? grid.column ?? 1;
  parts.push(gridColsClass(base));
  if (grid.sm != null) parts.push(gridColsClass(grid.sm, "sm"));
  if (grid.md != null) parts.push(gridColsClass(grid.md, "md"));
  if (grid.lg != null) parts.push(gridColsClass(grid.lg, "lg"));
  return parts.join(" ");
}

/**
 * 列表行稳定 key：优先 `item.key`，否则回退索引前缀，减轻重排抖动。
 *
 * @param item - 原始项
 * @param index - 下标
 */
function listItemRowKey(item: unknown, index: number): string {
  const it = item as ListItemProps;
  if (it.key != null && String(it.key) !== "") {
    return String(it.key);
  }
  return `__list-row-${index}`;
}

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
    const hasHandler = typeof it.onClick === "function";
    /** 可交互：有回调且未禁用；禁用时绝不触发 onClick */
    const interactive = hasHandler && !it.disabled;

    return (
      <div
        class={twMerge(
          "flex items-center gap-3 min-w-0",
          paddingCls,
          interactive &&
            "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50",
          it.disabled && "opacity-60 cursor-not-allowed",
          itemClass,
        )}
        aria-disabled={it.disabled ? "true" : undefined}
        onClick={interactive
          ? (e: Event) => {
            it.onClick?.(e);
          }
          : undefined}
      >
        {hasThumb && <div class="shrink-0">{it.thumb}</div>}
        <div class="flex-1 min-w-0">{it.children}</div>
        {hasExtra && <div class="shrink-0">{it.extra}</div>}
      </div>
    );
  };

  const bodyClass = grid ? buildListGridContainerClass(grid) : "flex flex-col";

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
      <div class={bodyClass}>
        {listItems.map((item, i) => (
          <div
            key={listItemRowKey(item, i)}
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

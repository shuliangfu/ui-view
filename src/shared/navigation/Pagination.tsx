/**
 * Pagination 分页（View）。
 * 桌面/移动通用，移动可简化；支持当前页、总条数、每页条数、跳转、上一页/下一页。
 */

import { twMerge } from "tailwind-merge";
import { IconChevronLeft, IconChevronRight } from "../basic/icons/mod.ts";
import { getPaginationState } from "./pagination-utils.ts";

export interface PaginationProps {
  /** 当前页码（从 1 开始） */
  current: number;
  /** 总条数（用于计算总页数）；与 total 二选一 */
  total?: number;
  /** 总页数（与 total 二选一，传了 total 则据此计算） */
  totalPages?: number;
  /** 每页条数，默认 10（仅 total 存在时用于计算总页数） */
  pageSize?: number;
  /** 每页条数选项（如 [10, 20, 50]）；传了则渲染条数切换器，onChange 会收到 (page, pageSize) */
  pageSizeOptions?: number[];
  /** 页码/条数变化回调；当有 pageSizeOptions 时可能收到 (page, pageSize) */
  onChange: (page: number, pageSize?: number) => void;
  /** 是否显示上一页/下一页，默认 true */
  showPrevNext?: boolean;
  /** 是否显示页码（false 时仅显示上一页/下一页 + 可选 total，极简模式），默认 true */
  showPageNumbers?: boolean;
  /** 是否显示快速跳转（输入框），默认 false */
  showQuickJumper?: boolean;
  /** 是否显示总条数/范围；true 时显示「共 total 条」，也可传函数 (total, [from, to]) => 节点 */
  showTotal?: boolean | ((total: number, range: [number, number]) => unknown);
  /** 是否禁用 */
  disabled?: boolean;
  /** 额外 class */
  class?: string;
}

export function Pagination(props: PaginationProps) {
  const {
    current,
    total,
    totalPages: totalPagesProp,
    pageSize: pageSizeProp = 10,
    pageSizeOptions,
    onChange,
    showPrevNext = true,
    showPageNumbers = true,
    showQuickJumper = false,
    showTotal = false,
    disabled = false,
    class: className,
  } = props;

  const pageSize = pageSizeProp;
  const {
    totalPages,
    safeCurrent,
    from,
    to,
    canPrev,
    canNext,
    pages,
  } = getPaginationState(current, pageSize, total, totalPagesProp);

  const btnCls =
    "min-w-8 h-8 px-2 inline-flex items-center justify-center rounded-md text-sm font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed";
  const activeCls =
    "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 pointer-events-none";

  return () => (
    <nav
      role="navigation"
      aria-label="分页"
      class={twMerge("flex items-center gap-1 flex-wrap", className)}
    >
      {showTotal && total != null && (
        <span class="mr-2 text-sm text-slate-600 dark:text-slate-400 shrink-0">
          {typeof showTotal === "function"
            ? showTotal(total, [from, to])
            : `共 ${total} 条`}
        </span>
      )}
      {showPrevNext && (
        <button
          type="button"
          class={twMerge(btnCls, "shrink-0")}
          disabled={disabled || !canPrev}
          aria-label="上一页"
          onClick={() => onChange(safeCurrent - 1)}
        >
          <IconChevronLeft class="w-4 h-4" />
        </button>
      )}
      {showPageNumbers &&
        pages.map((p, i) =>
          p < 0
            ? (
              <span
                key={`ellipsis-${i}`}
                class="min-w-8 h-8 flex items-center justify-center text-slate-400"
              >
                …
              </span>
            )
            : (
              <button
                key={p}
                type="button"
                class={twMerge(btnCls, safeCurrent === p && activeCls)}
                disabled={disabled}
                aria-label={`第 ${p} 页`}
                aria-current={safeCurrent === p ? "page" : undefined}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            )
        )}
      {showPrevNext && (
        <button
          type="button"
          class={twMerge(btnCls, "shrink-0")}
          disabled={disabled || !canNext}
          aria-label="下一页"
          onClick={() => onChange(safeCurrent + 1)}
        >
          <IconChevronRight class="w-4 h-4" />
        </button>
      )}
      {pageSizeOptions != null && pageSizeOptions.length > 0 && total != null &&
        (
          <span class="ml-2 inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 shrink-0">
            <select
              class="h-8 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
              value={String(pageSize)}
              onChange={(e: Event) => {
                const v = parseInt((e.target as HTMLSelectElement).value, 10);
                if (!Number.isNaN(v)) onChange(1, v);
              }}
              aria-label="每页条数"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n} 条/页
                </option>
              ))}
            </select>
          </span>
        )}
      {showQuickJumper && (
        <span class="ml-2 inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
          跳至
          <input
            type="number"
            min={1}
            max={totalPages}
            class="w-12 h-8 px-1 text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
            onBlur={(e: Event) => {
              const v = parseInt((e.target as HTMLInputElement).value, 10);
              if (!Number.isNaN(v) && v >= 1 && v <= totalPages) onChange(v);
            }}
            onKeyDown={(e: KeyboardEvent) => {
              if (e.key === "Enter") {
                const v = parseInt((e.target as HTMLInputElement).value, 10);
                if (!Number.isNaN(v) && v >= 1 && v <= totalPages) onChange(v);
              }
            }}
          />
          页
        </span>
      )}
    </nav>
  );
}

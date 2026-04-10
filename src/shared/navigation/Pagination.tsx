/**
 * Pagination 分页（View）。
 * 桌面/移动通用，移动可简化；支持当前页、总条数、每页条数、跳转、上一页/下一页。
 */

import { createSignal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconChevronLeft } from "../basic/icons/ChevronLeft.tsx";
import { IconChevronRight } from "../basic/icons/ChevronRight.tsx";
import { getPaginationState } from "./pagination-utils.ts";

export interface PaginationProps {
  /** 当前页码（受控）；不传则内部 `Signal`（`createSignal`）；可为 getter / `() => ref.value` */
  current?: number | (() => number);
  /** 非受控时的默认当前页，默认 1 */
  defaultCurrent?: number;
  /** 总条数（用于计算总页数）；与 total 二选一 */
  total?: number;
  /** 总页数（与 total 二选一，传了 total 则据此计算） */
  totalPages?: number;
  /** 每页条数（受控）；不传则内部 `Signal`（`createSignal`）；可为 getter / `() => ref.value` */
  pageSize?: number | (() => number);
  /** 非受控时的默认每页条数，默认 10 */
  defaultPageSize?: number;
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
  /**
   * 是否与 URL 同步：为 true 时，页码/每页条数变化会写入当前 URL 的 search（如 ?page=1&pageSize=10），
   * 不刷新页面；默认 false。初始值需由调用方从 URL 读取后传入 current/pageSize。
   */
  syncUrl?: boolean;
  /** 额外 class */
  class?: string;
}

/** 将当前 URL 的 search 与 page/pageSize 合并后写入，不刷新页面 */
function updateUrlSearch(page: number, pageSize: number) {
  if (typeof globalThis.location === "undefined") return;
  const u = new URL(globalThis.location.href);
  u.searchParams.set("page", String(page));
  u.searchParams.set("pageSize", String(pageSize));
  globalThis.history.replaceState(
    globalThis.history.state,
    "",
    u.pathname + u.search,
  );
}

export function Pagination(props: PaginationProps) {
  const {
    pageSize: pageSizeProp,
    defaultCurrent = 1,
    defaultPageSize = 10,
    pageSizeOptions,
    onChange: onChangeProp,
    showPrevNext = true,
    showPageNumbers = true,
    showQuickJumper = false,
    showTotal = false,
    disabled = false,
    syncUrl = false,
    class: className,
  } = props;

  const internalCurrentRef = createSignal(defaultCurrent);
  const internalPageSizeRef = createSignal(defaultPageSize);

  const btnCls =
    "min-w-8 h-8 px-2 inline-flex items-center justify-center rounded-md text-sm font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed";
  const activeCls =
    "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 pointer-events-none";

  /**
   * 页码或每页条数变化时更新受控/非受控状态、可选 URL，并通知业务回调。
   * @param page 目标页码（1-based）
   * @param pageSize 若传入则同步每页条数（非受控时写入内部 Signal）
   */
  const onChange = (page: number, pageSize?: number) => {
    if (props.current === undefined) internalCurrentRef.value = page;
    if (pageSize != null && props.pageSize === undefined) {
      internalPageSizeRef.value = pageSize;
    }
    if (syncUrl) {
      const ps = pageSize ??
        (props.pageSize === undefined
          ? internalPageSizeRef.value
          : (typeof pageSizeProp === "function"
            ? pageSizeProp()
            : pageSizeProp) ?? 10);
      updateUrlSearch(page, ps);
    }
    onChangeProp(page, pageSize);
  };

  /**
   * 根节点固定为 `<nav>`，**勿**再包一层 `return () => …` 作为组件返回值：
   * 否则在父级 `insert` 展平 thunk 时，外层 effect 会订阅 `internalCurrentRef`，
   * 重跑时 `cleanNode` 销毁组件 Owner，再次执行 `Pagination()` 会重新 `createSignal(defaultCurrent)`，页码永远回到默认页（表现为点击无反应）。
   * 将读 Signal 的片段放在 `nav` 的 **children 函数**里，由子级 `insert` 单独挂 effect，与 DatePicker 等一致。
   */
  return (
    <nav
      role="navigation"
      aria-label="分页"
      class={twMerge("flex items-center gap-1 flex-wrap", className)}
    >
      {() => {
        const { total, totalPages: totalPagesProp } = props;
        const currentVal = props.current !== undefined
          ? (typeof props.current === "function"
            ? props.current()
            : props.current)
          : internalCurrentRef.value;
        const pageSizeVal = props.pageSize !== undefined
          ? ((typeof pageSizeProp === "function"
            ? pageSizeProp()
            : pageSizeProp) ??
            defaultPageSize)
          : internalPageSizeRef.value;
        const {
          totalPages,
          safeCurrent,
          from,
          to,
          canPrev,
          canNext,
          pages,
        } = getPaginationState(
          currentVal,
          pageSizeVal,
          total,
          totalPagesProp,
        );

        return (
          <>
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
            {pageSizeOptions != null && pageSizeOptions.length > 0 &&
              total != null &&
              (
                <span class="ml-2 inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 shrink-0">
                  <select
                    class="h-8 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                    value={String(pageSizeVal)}
                    onChange={(e: Event) => {
                      const v = parseInt(
                        (e.target as HTMLSelectElement).value,
                        10,
                      );
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
                    const v = parseInt(
                      (e.target as HTMLInputElement).value,
                      10,
                    );
                    if (!Number.isNaN(v) && v >= 1 && v <= totalPages) {
                      onChange(v);
                    }
                  }}
                  onKeyDown={(e: KeyboardEvent) => {
                    if (e.key === "Enter") {
                      const v = parseInt(
                        (e.target as HTMLInputElement).value,
                        10,
                      );
                      if (!Number.isNaN(v) && v >= 1 && v <= totalPages) {
                        onChange(v);
                      }
                    }
                  }}
                />
                页
              </span>
            )}
          </>
        );
      }}
    </nav>
  );
}

/**
 * Pagination 分页（View）。
 * 桌面/移动通用，移动可简化；支持当前页、总条数、每页条数、跳转、上一页/下一页。
 * pageSize 选择器用库内 {@link Select}（自绘下拉），不渲染原生 `<select>`。
 */

import { createSignal } from "@dreamer/view";
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconChevronLeft } from "../basic/icons/ChevronLeft.tsx";
import { IconChevronRight } from "../basic/icons/ChevronRight.tsx";
import { Select } from "../form/Select.tsx";
import { getPaginationState } from "./pagination-utils.ts";

/**
 * Pagination 内置文案。函数式项接收上下文（如页码、总数）并返回最终文本，便于多语言/复数处理。
 */
export interface PaginationMessages {
  /** 根 `<nav>` 的 `aria-label` */
  nav: string;
  /** 上一页按钮 `aria-label` */
  prev: string;
  /** 下一页按钮 `aria-label` */
  next: string;
  /** 单个页码按钮 `aria-label`，参数为该页码 */
  pageLabel: (page: number) => string;
  /** 每页条数选择器 `aria-label` / Select 兜底文案 */
  pageSize: string;
  /** 每页条数下拉项文本，参数为条数 */
  pageSizeUnit: (n: number) => string;
  /** 快速跳转输入框前的提示文本 */
  jumpTo: string;
  /** 快速跳转输入框后的单位文本 */
  pageUnit: string;
  /** showTotal=true 时的「共 N 条」默认渲染 */
  totalText: (total: number) => string;
}

/** 默认中文文案 */
export const defaultPaginationMessages: PaginationMessages = {
  nav: "分页",
  prev: "上一页",
  next: "下一页",
  pageLabel: (p) => `第 ${p} 页`,
  pageSize: "每页条数",
  pageSizeUnit: (n) => `${n} 条/页`,
  jumpTo: "跳至",
  pageUnit: "页",
  totalText: (total) => `共 ${total} 条`,
};

/** 分页尺寸：影响页码按钮、条数 Select、跳转输入框；默认 md（现视觉） */
export type PaginationSize = "xs" | "sm" | "md" | "lg";

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
  /** 每页条数选项（如 [10, 20, 50]）；传了则渲染条数切换器（库内 Select），onChange 会收到 (page, pageSize) */
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
  /**
   * 尺寸：`xs`｜`sm`｜`md`｜`lg`；默认 `md`（与改造前视觉一致）。
   * 同步作用于页码按钮、每页条数 Select、快速跳转输入框。
   */
  size?: PaginationSize;
  /** 额外 class */
  class?: string;
  /** 多语言/自定义文案；未传字段走 {@link defaultPaginationMessages} */
  messages?: Partial<PaginationMessages>;
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

const sizeBtnCls: Record<PaginationSize, string> = {
  xs:
    "min-w-6 h-6 px-1 inline-flex items-center justify-center rounded text-xs font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed",
  sm:
    "min-w-7 h-7 px-1.5 inline-flex items-center justify-center rounded text-xs font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed",
  md:
    "min-w-8 h-8 px-2 inline-flex items-center justify-center rounded-md text-sm font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed",
  lg:
    "min-w-10 h-10 px-3 inline-flex items-center justify-center rounded-lg text-base font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed",
};

const sizeEllipsisCls: Record<PaginationSize, string> = {
  xs: "min-w-6 h-6 flex items-center justify-center text-slate-400 text-xs",
  sm: "min-w-7 h-7 flex items-center justify-center text-slate-400 text-xs",
  md: "min-w-8 h-8 flex items-center justify-center text-slate-400",
  lg: "min-w-10 h-10 flex items-center justify-center text-slate-400 text-base",
};

const sizeJumpInputCls: Record<PaginationSize, string> = {
  xs:
    "w-9 h-6 px-1 text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs",
  sm:
    "w-10 h-7 px-1 text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs",
  md:
    "w-12 h-8 px-1 text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm",
  lg:
    "w-14 h-10 px-1 text-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-base",
};

/**
 * pageSize Select：宽度跟文案＋箭头走（fit-content），禁止固定过宽留空；
 * nowrap 防「页」掉行。各 size 仅字号／高度不同，宽度一律自适应。
 */
const sizeSelectWrapCls: Record<PaginationSize, string> = {
  xs: "w-fit max-w-none",
  sm: "w-fit max-w-none",
  md: "w-fit max-w-none",
  lg: "w-fit max-w-none",
};

const sizeTextCls: Record<PaginationSize, string> = {
  xs: "text-xs",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

const sizeIconCls: Record<PaginationSize, string> = {
  xs: "w-3 h-3",
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
}

export function Pagination(props: PaginationProps): JSXRenderable {
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
    size = "md",
    class: className,
    messages,
  } = props;
  const m = { ...defaultPaginationMessages, ...messages };
  const btnCls = sizeBtnCls[size];
  const ellipsisCls = sizeEllipsisCls[size];
  const jumpInputCls = sizeJumpInputCls[size];
  const selectWrapCls = sizeSelectWrapCls[size];
  const textCls = sizeTextCls[size];
  const iconCls = sizeIconCls[size];

  const internalCurrentRef = createSignal(defaultCurrent);
  const internalPageSizeRef = createSignal(defaultPageSize);

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
      aria-label={m.nav}
      data-pagination-size={size}
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
              <span
                class={twMerge(
                  "mr-2 text-slate-600 dark:text-slate-400 shrink-0",
                  textCls,
                )}
              >
                {typeof showTotal === "function"
                  ? showTotal(total, [from, to])
                  : m.totalText(total)}
              </span>
            )}
            {showPrevNext && (
              <button
                type="button"
                class={twMerge(btnCls, "shrink-0")}
                disabled={disabled || !canPrev}
                aria-label={m.prev}
                onClick={() => onChange(safeCurrent - 1)}
              >
                <IconChevronLeft class={iconCls} />
              </button>
            )}
            {showPageNumbers &&
              pages.map((p, i) =>
                p < 0
                  ? (
                    <span
                      key={`ellipsis-${i}`}
                      class={ellipsisCls}
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
                      aria-label={m.pageLabel(p)}
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
                aria-label={m.next}
                onClick={() => onChange(safeCurrent + 1)}
              >
                <IconChevronRight class={iconCls} />
              </button>
            )}
            {pageSizeOptions != null && pageSizeOptions.length > 0 &&
              total != null &&
              (
                <span
                  class={twMerge(
                    "ml-2 inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 shrink-0 whitespace-nowrap",
                    textCls,
                  )}
                  data-testid="pagination-pagesize"
                >
                  <Select
                    size={size}
                    disabled={disabled}
                    class={twMerge(
                      selectWrapCls,
                      // 触发器贴文案（仅 >button）；listbox 竖排；面板按最长项；选项整行 nowrap
                      "inline-flex w-fit shrink-0 align-middle whitespace-nowrap [&>button]:!w-auto [&>button]:inline-flex [&>button]:whitespace-nowrap [&_[role=listbox]]:!flex [&_[role=listbox]]:!flex-col [&_[role=listbox]]:!w-max [&_[role=listbox]]:!min-w-full [&_[role=listbox]]:!right-auto [&_[role=option]]:!block [&_[role=option]]:!w-full [&_[role=option]]:whitespace-nowrap",
                    )}
                    value={createSignal(String(pageSizeVal))}
                    options={pageSizeOptions.map((n) => ({
                      value: String(n),
                      label: m.pageSizeUnit(n),
                    }))}
                    messages={{ triggerFallback: m.pageSize }}
                    onChange={(e: Event) => {
                      const v = parseInt(
                        (e.target as unknown as { value: string }).value,
                        10,
                      );
                      if (!Number.isNaN(v)) onChange(1, v);
                    }}
                  />
                </span>
              )}
            {showQuickJumper && (
              <span
                class={twMerge(
                  "ml-2 inline-flex items-center gap-1 text-slate-600 dark:text-slate-400",
                  textCls,
                )}
              >
                {m.jumpTo}
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  class={jumpInputCls}
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
                {m.pageUnit}
              </span>
            )}
          </>
        );
      }}
    </nav>
  );
}

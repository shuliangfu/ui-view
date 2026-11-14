/**
 * Pagination 分页（View）。
 * 桌面/移动通用；用 {@link PaginationPreset}（`full` / `default` / `simple`）选择能力档。
 * `full` 含第一页／最后一页（双箭头《》）、页码、每页条数、跳转、总条数；
 * `default` 为上一页／下一页＋页码；`simple` 为上一页／下一页＋「第 n / m 页」。
 * pageSize 选择器用库内 {@link Select}（自绘下拉），不渲染原生 `<select>`。
 */

import { createSignal } from "@dreamer/view";
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconChevronLeft } from "../basic/icons/ChevronLeft.tsx";
import { IconChevronRight } from "../basic/icons/ChevronRight.tsx";
import { IconChevronsLeft } from "../basic/icons/ChevronsLeft.tsx";
import { IconChevronsRight } from "../basic/icons/ChevronsRight.tsx";
import { Select } from "../form/Select.tsx";
import {
  type PaginationPreset,
  resolvePaginationPreset,
  getPaginationState,
} from "./pagination-utils.ts";

export type { PaginationPreset } from "./pagination-utils.ts";
export {
  PAGINATION_PRESET_FLAGS,
  resolvePaginationPreset,
} from "./pagination-utils.ts";

/**
 * Pagination 内置文案。函数式项接收上下文（如页码、总数）并返回最终文本，便于多语言/复数处理。
 */
export interface PaginationMessages {
  /** 根 `<nav>` 的 `aria-label` */
  nav: string;
  /** 第一页按钮 `aria-label` */
  first: string;
  /** 上一页按钮 `aria-label` */
  prev: string;
  /** 下一页按钮 `aria-label` */
  next: string;
  /** 最后一页按钮 `aria-label` */
  last: string;
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
  /** `preset="simple"` 时上一页／下一页之间的当前页文案 */
  simpleCurrent: (page: number, totalPages: number) => string;
}

/** 默认中文文案 */
export const defaultPaginationMessages: PaginationMessages = {
  nav: "分页",
  first: "第一页",
  prev: "上一页",
  next: "下一页",
  last: "最后一页",
  pageLabel: (p) => `第 ${p} 页`,
  pageSize: "每页条数",
  pageSizeUnit: (n) => `${n} 条/页`,
  jumpTo: "跳至",
  pageUnit: "页",
  totalText: (total) => `共 ${total} 条`,
  simpleCurrent: (page, totalPages) => `第 ${page} / ${totalPages} 页`,
};

/** 分页尺寸：影响页码按钮、条数 Select、跳转输入框；默认 md（现视觉） */
export type PaginationSize = "xs" | "sm" | "md" | "lg";

export interface PaginationProps {
  /**
   * 能力档，与富文本 `toolbarPreset` 相同的三档用词（分页无工具栏，故名为 `preset`）：
   * - `"full"` 全部能力：第一页、上一页、页码、下一页、最后一页；默认开启快速跳转，传入 `total` 时显示总条数，传入 `pageSizeOptions` 时显示每页条数
   * - `"default"` 一般能力（默认）：上一页、页码、下一页；无第一页／最后一页／跳转
   * - `"simple"` 极简：上一页、「第 n / m 页」、下一页；无页码、无第一页／最后一页／跳转
   *
   * 显式传入的 `showFirstLast` / `showPrevNext` / `showPageNumbers` / `showQuickJumper` / `showTotal` 会覆盖该档默认值。
   */
  preset?: PaginationPreset;
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
  /**
   * 是否显示第一页／最后一页（双箭头）。不传时跟随 `preset`：`full` 为 true，其余为 false。
   */
  showFirstLast?: boolean;
  /** 是否显示上一页/下一页；不传时跟随 `preset`（三档均为 true） */
  showPrevNext?: boolean;
  /** 是否显示页码；不传时跟随 `preset`（`simple` 为 false，其余为 true） */
  showPageNumbers?: boolean;
  /** 是否显示快速跳转（输入框）；不传时跟随 `preset`（仅 `full` 为 true）。越界页码会夹到 1..总页数。 */
  showQuickJumper?: boolean;
  /** 是否显示总条数/范围；true 时显示「共 total 条」，也可传函数 (total, [from, to]) => 节点。不传时跟随 `preset`（仅 `full` 默认 true，且须有 `total` 才渲染） */
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
  /**
   * 测试 id 前缀。按钮／跳转／条数选择器会输出 `{prefix}-first`、`{prefix}-prev`、`{prefix}-page-N`、
   * `{prefix}-next`、`{prefix}-last`、`{prefix}-jump`、`{prefix}-pagesize`、`{prefix}-simple-current`。
   * 默认 `"pagination"`。数据面板传入 `"dp"`。
   */
  testIdPrefix?: string;
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
    "w-9 h-6 px-1 text-center rounded border border-slate-300 dark:border-slate-600 bg-slate-100 shadow-inner dark:shadow-[inset_0_2px_5px_rgb(0_0_0_/_0.55),inset_0_-1px_0_rgb(255_255_255_/_0.06)] dark:bg-slate-900/70 text-xs",
  sm:
    "w-10 h-7 px-1 text-center rounded border border-slate-300 dark:border-slate-600 bg-slate-100 shadow-inner dark:shadow-[inset_0_2px_5px_rgb(0_0_0_/_0.55),inset_0_-1px_0_rgb(255_255_255_/_0.06)] dark:bg-slate-900/70 text-xs",
  md:
    "w-12 h-8 px-1 text-center rounded border border-slate-300 dark:border-slate-600 bg-slate-100 shadow-inner dark:shadow-[inset_0_2px_5px_rgb(0_0_0_/_0.55),inset_0_-1px_0_rgb(255_255_255_/_0.06)] dark:bg-slate-900/70 text-sm",
  lg:
    "w-14 h-10 px-1 text-center rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 shadow-inner dark:shadow-[inset_0_2px_5px_rgb(0_0_0_/_0.55),inset_0_-1px_0_rgb(255_255_255_/_0.06)] dark:bg-slate-900/70 text-base",
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
};

function testId(prefix: string, name: string): string {
  return `${prefix}-${name}`;
}

export function Pagination(props: PaginationProps): JSXRenderable {
  const {
    pageSize: pageSizeProp,
    defaultCurrent = 1,
    defaultPageSize = 10,
    pageSizeOptions,
    onChange: onChangeProp,
    disabled = false,
    syncUrl = false,
    size = "md",
    class: className,
    messages,
    testIdPrefix = "pagination",
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

  const jumpTo = (raw: string, totalPages: number) => {
    const v = parseInt(raw, 10);
    if (Number.isNaN(v)) return;
    const page = Math.min(totalPages, Math.max(1, v));
    onChange(page);
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
      data-pagination-preset={props.preset ?? "default"}
      class={twMerge("flex items-center gap-1 flex-wrap", className)}
    >
      {() => {
        const { total, totalPages: totalPagesProp } = props;
        const flags = resolvePaginationPreset(props.preset, {
          showFirstLast: props.showFirstLast,
          showPrevNext: props.showPrevNext,
          showPageNumbers: props.showPageNumbers,
          showQuickJumper: props.showQuickJumper,
          showTotal: props.showTotal,
        });
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
          canFirst,
          canLast,
          pages,
        } = getPaginationState(
          currentVal,
          pageSizeVal,
          total,
          totalPagesProp,
        );

        return (
          <>
            {flags.showTotal && total != null && (
              <span
                class={twMerge(
                  "mr-2 text-slate-600 dark:text-slate-400 shrink-0",
                  textCls,
                )}
              >
                {typeof flags.showTotal === "function"
                  ? flags.showTotal(total, [from, to])
                  : m.totalText(total)}
              </span>
            )}
            {flags.showFirstLast && (
              <button
                type="button"
                class={twMerge(btnCls, "shrink-0")}
                disabled={disabled || !canFirst}
                aria-label={m.first}
                data-testid={testId(testIdPrefix, "first")}
                onClick={() => onChange(1)}
              >
                <IconChevronsLeft class={iconCls} />
              </button>
            )}
            {flags.showPrevNext && (
              <button
                type="button"
                class={twMerge(btnCls, "shrink-0")}
                disabled={disabled || !canPrev}
                aria-label={m.prev}
                data-testid={testId(testIdPrefix, "prev")}
                onClick={() => onChange(safeCurrent - 1)}
              >
                <IconChevronLeft class={iconCls} />
              </button>
            )}
            {flags.showSimpleCurrent && (
              <span
                class={twMerge(
                  "px-1 shrink-0 tabular-nums text-slate-600 dark:text-slate-400",
                  textCls,
                )}
                data-testid={testId(testIdPrefix, "simple-current")}
              >
                {m.simpleCurrent(safeCurrent, totalPages)}
              </span>
            )}
            {flags.showPageNumbers &&
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
                      data-testid={testId(testIdPrefix, `page-${p}`)}
                      onClick={() => onChange(p)}
                    >
                      {p}
                    </button>
                  )
              )}
            {flags.showPrevNext && (
              <button
                type="button"
                class={twMerge(btnCls, "shrink-0")}
                disabled={disabled || !canNext}
                aria-label={m.next}
                data-testid={testId(testIdPrefix, "next")}
                onClick={() => onChange(safeCurrent + 1)}
              >
                <IconChevronRight class={iconCls} />
              </button>
            )}
            {flags.showFirstLast && (
              <button
                type="button"
                class={twMerge(btnCls, "shrink-0")}
                disabled={disabled || !canLast}
                aria-label={m.last}
                data-testid={testId(testIdPrefix, "last")}
                onClick={() => onChange(totalPages)}
              >
                <IconChevronsRight class={iconCls} />
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
                  data-testid={testId(testIdPrefix, "pagesize")}
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
            {flags.showQuickJumper && (
              <span
                class={twMerge(
                  "ml-2 inline-flex items-center gap-1 text-slate-600 dark:text-slate-400",
                  textCls,
                )}
                data-testid={testId(testIdPrefix, "jump")}
              >
                {m.jumpTo}
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  class={jumpInputCls}
                  onBlur={(e: Event) => {
                    jumpTo((e.target as HTMLInputElement).value, totalPages);
                  }}
                  onKeyDown={(e: KeyboardEvent) => {
                    if (e.key === "Enter") {
                      jumpTo((e.target as HTMLInputElement).value, totalPages);
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

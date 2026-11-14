/**
 * Pagination 分页组件的纯逻辑，便于单测与复用。
 */

/** 能力档：与富文本 `toolbarPreset` 相同的三档用词，分页无工具栏故参数名为 `preset`。 */
export type PaginationPreset = "full" | "default" | "simple";

export interface PaginationState {
  /** 总页数 */
  totalPages: number;
  /** 当前页（已钳在 1..totalPages） */
  safeCurrent: number;
  /** 当前页在总条数中的起始序号（1-based），仅 total 存在时有意义 */
  from: number;
  /** 当前页在总条数中的结束序号（1-based），仅 total 存在时有意义 */
  to: number;
  /** 是否可上一页（亦为是否可到第一页） */
  canPrev: boolean;
  /** 是否可下一页（亦为是否可到最后一页） */
  canNext: boolean;
  /** 是否可跳到第一页，与 canPrev 相同 */
  canFirst: boolean;
  /** 是否可跳到最后一页，与 canNext 相同 */
  canLast: boolean;
  /** 要展示的页码数组，负数表示省略号（-1 前省略，-2 后省略） */
  pages: number[];
}

/**
 * 各 `preset` 对应的默认能力开关。显式传入的 show* 会覆盖这里的值。
 *
 * - `full`：全部能力（第一页／上一页／页码／下一页／最后一页，以及快速跳转；总条数在传入 `total` 时显示）
 * - `default`：一般能力（上一页／下一页＋页码，无第一页／最后一页／跳转）
 * - `simple`：极简（上一页／下一页＋「第 n / m 页」，无页码、无第一页／最后一页／跳转）
 */
export interface PaginationPresetFlags {
  showFirstLast: boolean;
  showPrevNext: boolean;
  showPageNumbers: boolean;
  showQuickJumper: boolean;
  /** 仅 `simple`：在上一页／下一页之间显示「第 n / m 页」 */
  showSimpleCurrent: boolean;
  /** `true` 表示默认开启总条数（仍须传入 `total` 才会渲染） */
  showTotal: boolean;
}

export const PAGINATION_PRESET_FLAGS: Record<
  PaginationPreset,
  PaginationPresetFlags
> = {
  full: {
    showFirstLast: true,
    showPrevNext: true,
    showPageNumbers: true,
    showQuickJumper: true,
    showSimpleCurrent: false,
    showTotal: true,
  },
  default: {
    showFirstLast: false,
    showPrevNext: true,
    showPageNumbers: true,
    showQuickJumper: false,
    showSimpleCurrent: false,
    showTotal: false,
  },
  simple: {
    showFirstLast: false,
    showPrevNext: true,
    showPageNumbers: false,
    showQuickJumper: false,
    showSimpleCurrent: true,
    showTotal: false,
  },
};

export interface PaginationPresetOverrides {
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  showPageNumbers?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean | ((total: number, range: [number, number]) => unknown);
}

export interface ResolvedPaginationFlags {
  showFirstLast: boolean;
  showPrevNext: boolean;
  showPageNumbers: boolean;
  showQuickJumper: boolean;
  showSimpleCurrent: boolean;
  showTotal: boolean | ((total: number, range: [number, number]) => unknown);
}

/**
 * 按 `preset`（缺省 `default`）解析能力开关，显式传入的 show* 优先。
 */
export function resolvePaginationPreset(
  preset: PaginationPreset | undefined,
  overrides: PaginationPresetOverrides = {},
): ResolvedPaginationFlags {
  const base = PAGINATION_PRESET_FLAGS[preset ?? "default"];
  const showPageNumbers = overrides.showPageNumbers ?? base.showPageNumbers;
  return {
    showFirstLast: overrides.showFirstLast ?? base.showFirstLast,
    showPrevNext: overrides.showPrevNext ?? base.showPrevNext,
    showPageNumbers,
    showQuickJumper: overrides.showQuickJumper ?? base.showQuickJumper,
    showSimpleCurrent: base.showSimpleCurrent && !showPageNumbers,
    showTotal: overrides.showTotal !== undefined
      ? overrides.showTotal
      : base.showTotal,
  };
}

/**
 * 计算分页状态。
 * @param current 当前页码（1-based）
 * @param pageSize 每页条数
 * @param total 总条数（与 totalPages 二选一）
 * @param totalPagesProp 总页数（传了则优先，否则由 total/pageSize 计算）
 */
export function getPaginationState(
  current: number,
  pageSize: number,
  total?: number,
  totalPagesProp?: number,
): PaginationState {
  const totalPages = totalPagesProp ??
    (total != null ? Math.max(1, Math.ceil(total / pageSize)) : 1);
  const safeCurrent = Math.min(totalPages, Math.max(1, current));
  const canPrev = safeCurrent > 1;
  const canNext = safeCurrent < totalPages;

  const pages: number[] = [];
  const showEllipsisStart = safeCurrent > 3;
  const showEllipsisEnd = safeCurrent < totalPages - 2;
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (showEllipsisStart) pages.push(1);
    if (showEllipsisStart) pages.push(-1);
    const start = Math.max(1, safeCurrent - 1);
    const end = Math.min(totalPages, safeCurrent + 1);
    for (let i = start; i <= end; i++) if (!pages.includes(i)) pages.push(i);
    if (showEllipsisEnd) pages.push(-2);
    if (showEllipsisEnd) pages.push(totalPages);
  }

  const from = total != null ? (safeCurrent - 1) * pageSize + 1 : 0;
  const to = total != null
    ? Math.min(safeCurrent * pageSize, total)
    : safeCurrent * pageSize;

  return {
    totalPages,
    safeCurrent,
    from,
    to,
    canPrev,
    canNext,
    canFirst: canPrev,
    canLast: canNext,
    pages,
  };
}

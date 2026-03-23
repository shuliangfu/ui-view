/**
 * Table 表格（View）。
 * 桌面为主，移动可卡片化；支持列定义、排序、固定列、展开行、分页、loading、尺寸、边框、行选择。
 */

import { createEffect, createSignal, type SignalRef } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconChevronDown } from "../../shared/basic/icons/ChevronDown.tsx";
import { IconChevronUp } from "../../shared/basic/icons/ChevronUp.tsx";
import type { SizeVariant } from "../../shared/types.ts";

export type SortOrder = "ascend" | "descend" | null;

export interface TableColumn<T = unknown> {
  /** 列 key / dataIndex */
  key: string;
  /** 列标题 */
  title?: string | unknown;
  /** 对应数据字段名（不传则用 key） */
  dataIndex?: keyof T | string;
  /** 自定义渲染 */
  render?: (value: unknown, record: T, index: number) => unknown;
  /** 列宽 */
  width?: number | string;
  /** 对齐 */
  align?: "left" | "center" | "right";
  /** 是否固定左侧 */
  fixed?: "left";
  /** 是否可排序 */
  sorter?: boolean | ((a: T, b: T) => number);
  /** 默认排序 */
  defaultSortOrder?: SortOrder;
  /** 是否可收缩 */
  ellipsis?: boolean;
}

export interface TableProps<T = unknown> {
  /** 列定义 */
  columns: TableColumn<T>[];
  /** 数据源 */
  dataSource: T[];
  /** 行 key 的字段名或函数 */
  rowKey?: keyof T | string | ((record: T, index: number) => string);
  /** 是否显示边框 */
  bordered?: boolean;
  /** 尺寸 */
  size?: SizeVariant;
  /** 是否条纹行 */
  striped?: boolean;
  /** 是否加载态 */
  loading?: boolean;
  /** 行点击 */
  onRow?: (record: T, index: number) => { onClick?: (e: Event) => void };
  /** 可展开行：自定义展开内容 */
  expandable?: {
    expandedRowRender?: (record: T, index: number) => unknown;
    expandedRowKeys?: string[];
    onExpand?: (expanded: boolean, record: T) => void;
    rowExpandable?: (record: T) => boolean;
  };
  /** 表尾合计行（函数返回节点，会渲染在 tfoot） */
  summary?: (data: T[]) => unknown;
  /** 文案配置，如 emptyText */
  locale?: { emptyText?: string };
  /** 自定义空状态渲染（dataSource 为空时），不传则用 locale.emptyText 或「暂无数据」 */
  renderEmpty?: () => unknown;
  /** 表格上方标题 */
  title?: unknown;
  /** 表格上方右侧区域（筛选、导出等） */
  extra?: unknown;
  /** 分页配置；false 不显示；不传则不分页 */
  pagination?: false | {
    current?: number;
    pageSize?: number;
    total?: number;
    onChange?: (page: number, pageSize: number) => void;
  };
  /** 选中变化时回调当前选中的整行数据；传了则显示选择列 */
  onSelectChange?: (selectedRows: T[]) => void;
  /** 受控时的选中行 key 列表 */
  selectedRowKeys?: string[];
  /** 选择列类型：checkbox 多选 / radio 单选，默认 checkbox */
  selectionType?: "checkbox" | "radio";
  /** 某行是否禁用勾选 */
  getCheckboxProps?: (record: T) => { disabled?: boolean };
  /** 行 class（根据 record、index 返回） */
  rowClassName?: (record: T, index: number) => string;
  /** 是否开启行悬停高亮（默认 false） */
  hoverable?: boolean;
  /** 表头 class */
  headerClass?: string;
  /** 表格 class */
  class?: string;
  /**
   * 可选状态缓存 key。传值时非受控的 rowSelection/expandable 状态会按 key 跨父组件重渲染保留，
   * 避免整树渲染导致 createSignal 重新执行、选中/展开态被清空。
   */
  stateKey?: string;
}

/** 按 stateKey 缓存非受控的选中/展开状态，避免父组件整树重渲染时丢失 */
const stateCache = new Map<
  string,
  {
    selected: SignalRef<Set<string>>;
    expanded: SignalRef<string[]>;
  }
>();

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-2 py-1 text-xs",
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-4 py-3 text-sm",
};

export function Table<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  props: TableProps<T>,
) {
  const {
    columns,
    dataSource,
    rowKey = "key",
    bordered = false,
    size = "md",
    striped = false,
    loading = false,
    onRow,
    expandable,
    summary,
    locale,
    renderEmpty,
    title,
    extra,
    pagination: paginationConfig,
    onSelectChange,
    selectedRowKeys: selectedRowKeysProp,
    selectionType = "checkbox",
    getCheckboxProps,
    rowClassName,
    hoverable = false,
    headerClass,
    class: className,
    stateKey,
  } = props;

  /** 分页当前页（非受控时使用） */
  const internalPage = createSignal(1);

  /** 由扁平 props 合成的行选择配置，供内部逻辑复用 */
  const rowSelection = onSelectChange
    ? {
      type: selectionType,
      selectedRowKeys: selectedRowKeysProp,
      onChange: onSelectChange,
      getCheckboxProps,
    }
    : undefined;

  // 内部排序状态；若有列配置了 defaultSortOrder 则作为初始值
  const defaultSortCol = columns.find(
    (c) => c.sorter && c.defaultSortOrder != null,
  );
  const sortState = createSignal<
    { key: string | null; order: SortOrder }
  >({
    key: defaultSortCol?.key ?? null,
    order: defaultSortCol?.defaultSortOrder ?? null,
  });

  /**
   * 内部选择/展开状态（非受控时使用）；有 stateKey 时从缓存取，避免整树重渲染丢失。
   * 使用 SignalRef（.value 读写），与 @dreamer/view 的 createSignal 一致。
   */
  let selectedRef: SignalRef<Set<string>>;
  let expandedRef: SignalRef<string[]>;

  if (stateKey) {
    let cached = stateCache.get(stateKey);
    if (!cached) {
      cached = {
        selected: createSignal<Set<string>>(new Set()),
        expanded: createSignal<string[]>([]),
      };
      stateCache.set(stateKey, cached);
    }
    selectedRef = cached.selected;
    expandedRef = cached.expanded;
  } else {
    selectedRef = createSignal<Set<string>>(new Set());
    expandedRef = createSignal<string[]>([]);
  }

  const getKey = (record: T, index: number): string => {
    if (typeof rowKey === "function") return rowKey(record, index);
    const k = record[rowKey as keyof T];
    return k != null ? String(k) : `row-${index}`;
  };

  const paddingCls = sizeClasses[size];

  const handleSort = (
    key: string,
    sorter: boolean | ((a: T, b: T) => number),
  ) => {
    if (!sorter) return;
    const current = sortState.value;
    let nextOrder: SortOrder = "ascend";
    if (current.key === key) {
      if (current.order === "ascend") nextOrder = "descend";
      else if (current.order === "descend") nextOrder = null;
    }
    sortState.value = { key: nextOrder ? key : null, order: nextOrder };
  };

  /** 全选/取消全选当前传入的数据；startIndex 为数据在 dataSource 中的起始下标，用于 getKey(record, index) */
  const handleSelectAll = (
    checked: boolean,
    currentData: T[],
    startIndex = 0,
  ) => {
    if (!rowSelection) return;
    const newSelected = new Set(
      rowSelection.selectedRowKeys ?? selectedRef.value,
    );
    if (checked) {
      currentData.forEach((record, i) => {
        const key = getKey(record, startIndex + i);
        const props = rowSelection.getCheckboxProps?.(record);
        if (!props?.disabled) {
          newSelected.add(key);
        }
      });
    } else {
      currentData.forEach((record, i) => {
        const key = getKey(record, startIndex + i);
        newSelected.delete(key);
      });
    }

    if (rowSelection.selectedRowKeys === undefined) {
      selectedRef.value = newSelected;
    }

    const selectedRows = dataSource.filter((record, index) =>
      newSelected.has(getKey(record, index))
    );
    rowSelection.onChange?.(selectedRows);
  };

  const handleSelect = (checked: boolean, record: T, index: number) => {
    if (!rowSelection) return;
    const key = getKey(record, index);
    const newSelected = new Set(
      rowSelection.selectedRowKeys ?? selectedRef.value,
    );

    if (rowSelection.type === "radio") {
      newSelected.clear();
      if (checked) newSelected.add(key);
    } else {
      if (checked) newSelected.add(key);
      else newSelected.delete(key);
    }

    if (rowSelection.selectedRowKeys === undefined) {
      selectedRef.value = newSelected;
    }

    const selectedRows = dataSource.filter((r, i) =>
      newSelected.has(getKey(r, i))
    );
    rowSelection.onChange?.(selectedRows);
  };

  return () => {
    // 展开行：受控用 props，非受控用内部 signal（在 getter 内读以保证 effect 订阅、点击 + 能更新）
    const expandedKeysSource = expandable?.expandedRowKeys ??
      expandedRef.value;
    const expandedSet = new Set(
      Array.isArray(expandedKeysSource) ? expandedKeysSource : [],
    );

    // 处理排序
    const data = [...dataSource];
    const { key: sortKey, order: sortOrder } = sortState.value;
    if (sortKey && sortOrder) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sorter) {
        if (typeof col.sorter === "function") {
          data.sort((a, b) =>
            (col.sorter as (a: T, b: T) => number)(a, b) *
            (sortOrder === "descend" ? -1 : 1)
          );
        } else {
          // 默认字符串/数字排序
          data.sort((a, b) => {
            const va = (a as any)[col.dataIndex || col.key];
            const vb = (b as any)[col.dataIndex || col.key];
            if (va === vb) return 0;
            const result = va > vb ? 1 : -1;
            return sortOrder === "descend" ? -result : result;
          });
        }
      }
    }

    // 分页：计算当前页数据与总数（pagination 为对象时启用，false/undefined 不启用）
    const paginationEnabled = paginationConfig !== undefined &&
      paginationConfig !== false;
    const pageSize = paginationEnabled
      ? (paginationConfig?.pageSize ?? 10)
      : data.length || 1;
    const currentPage = paginationEnabled
      ? (paginationConfig?.current ?? internalPage.value)
      : 1;
    const total = paginationEnabled
      ? (paginationConfig?.total ?? data.length)
      : data.length;
    const displayData = paginationEnabled
      ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize)
      : data;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // 处理选择状态（基于全量 data 的 key，与当前页 displayData 一致）
    const selectedKeys = new Set(
      rowSelection?.selectedRowKeys ?? selectedRef.value,
    );
    const allSelected = displayData.length > 0 && displayData.every(
      (record, index) => {
        const originalIndex = (currentPage - 1) * pageSize + index;
        const key = getKey(record, originalIndex);
        const props = rowSelection?.getCheckboxProps?.(record);
        return props?.disabled || selectedKeys.has(key);
      },
    );

    /**
     * 选择列原生 input 的 `checked` 须传布尔，勿传 `() => boolean`：
     * react-jsx 产出 VNode 后由 `applyIntrinsicVNodeProps` 写 DOM，其中会 `continue` 跳过 function 类型，
     * 导致勾选态永远不反映到 DOM（onSelectChange 仍会触发）。
     */

    /** 固定列 left 偏移（仅 fixed === "left" 的列有值，用于 sticky 定位） */
    const fixedLeftOffsets: (number | null)[] = [];
    let leftAcc = 0;
    for (const col of columns) {
      if (col.fixed === "left") {
        fixedLeftOffsets.push(leftAcc);
        const w = col.width;
        leftAcc += typeof w === "number"
          ? w
          : (typeof w === "string" ? parseFloat(w) || 80 : 80);
      } else {
        fixedLeftOffsets.push(null);
      }
    }

    const handlePageChange = (page: number) => {
      if (paginationConfig !== undefined && paginationConfig !== false) {
        if (paginationConfig.current === undefined) {
          internalPage.value = page;
        }
        paginationConfig.onChange?.(page, pageSize);
      }
    };

    return (
      <>
        {(title != null || extra != null) && (
          <div class="flex justify-between items-center gap-4 mb-2">
            <div class="text-base font-medium text-slate-800 dark:text-slate-200">
              {title}
            </div>
            <div>{extra}</div>
          </div>
        )}
        <div
          class={twMerge(
            "table-wrapper overflow-x-auto relative",
            className,
          )}
        >
          {loading && (
            <div class="absolute inset-0 bg-white/50 dark:bg-slate-800/50 flex items-center justify-center z-10 rounded-lg">
              <span class="text-sm text-slate-500">加载中…</span>
            </div>
          )}
          <table
            class={twMerge(
              "w-full border-collapse",
              bordered && "border border-slate-200 dark:border-slate-600",
            )}
          >
            <thead>
              <tr class="bg-slate-50 dark:bg-slate-800/50">
                {rowSelection && (
                  <th
                    class={twMerge(
                      "w-8 text-center",
                      paddingCls,
                      rowSelection.type !== "radio" &&
                        "cursor-pointer select-none",
                    )}
                    onClick={rowSelection.type !== "radio"
                      ? (e: Event) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const cur = rowSelection?.selectedRowKeys ??
                          selectedRef.value;
                        const set = cur instanceof Set
                          ? cur
                          : new Set((cur as string[]) ?? []);
                        const all = displayData.length > 0 &&
                          displayData.every((r, i) => {
                            const k = getKey(
                              r,
                              (currentPage - 1) * pageSize + i,
                            );
                            const p = rowSelection?.getCheckboxProps?.(r);
                            return p?.disabled || set.has(k);
                          });
                        handleSelectAll(
                          !all,
                          displayData,
                          (currentPage - 1) * pageSize,
                        );
                        const input = (
                          e.currentTarget as HTMLElement
                        ).querySelector(
                          'input[type="checkbox"]',
                        ) as HTMLInputElement | null;
                        if (input) {
                          const nextSet =
                            rowSelection?.selectedRowKeys === undefined
                              ? selectedRef.value
                              : new Set(
                                rowSelection?.selectedRowKeys ?? [],
                              );
                          const nextAll = displayData.length > 0 &&
                            displayData.every((r, i) => {
                              const k = getKey(
                                r,
                                (currentPage - 1) * pageSize + i,
                              );
                              const p = rowSelection?.getCheckboxProps?.(r);
                              return p?.disabled || nextSet.has(k);
                            });
                          const nextSome = displayData.some((r, i) =>
                            nextSet.has(
                              getKey(r, (currentPage - 1) * pageSize + i),
                            )
                          );
                          input.checked = nextAll;
                          input.indeterminate = !nextAll && nextSome;
                        }
                      }
                      : undefined}
                  >
                    {rowSelection.type !== "radio" && (
                      <input
                        type="checkbox"
                        class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                        checked={allSelected}
                        tabIndex={-1}
                        readOnly
                        ref={(el: HTMLInputElement | null) => {
                          if (!el) return;
                          createEffect(() => {
                            const src = rowSelection?.selectedRowKeys ??
                              selectedRef.value;
                            const set = src instanceof Set
                              ? src
                              : new Set((src as string[]) ?? []);
                            const all = displayData.length > 0 &&
                              displayData.every((r, i) => {
                                const k = getKey(
                                  r,
                                  (currentPage - 1) * pageSize + i,
                                );
                                const p = rowSelection?.getCheckboxProps?.(r);
                                return p?.disabled || set.has(k);
                              });
                            const some = displayData.some((r, i) =>
                              set.has(
                                getKey(r, (currentPage - 1) * pageSize + i),
                              )
                            );
                            el.indeterminate = !all && some;
                          });
                        }}
                      />
                    )}
                  </th>
                )}
                {expandable?.expandedRowRender && (
                  <th class={twMerge("w-8", paddingCls)} />
                )}
                {columns.map((col, colIndex) => (
                  <th
                    key={col.key}
                    class={twMerge(
                      "text-left font-medium text-slate-700 dark:text-slate-300 select-none",
                      col.fixed === "left" &&
                        "bg-slate-50 dark:bg-slate-800 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)]",
                      paddingCls,
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right",
                      col.sorter &&
                        "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700",
                      headerClass,
                    )}
                    style={{
                      ...(fixedLeftOffsets[colIndex] != null
                        ? {
                          position: "sticky" as const,
                          left: `${fixedLeftOffsets[colIndex]}px`,
                          zIndex: 2,
                        }
                        : {}),
                      ...(col.width != null
                        ? {
                          width: typeof col.width === "number"
                            ? `${col.width}px`
                            : col.width,
                        }
                        : {}),
                    }}
                    onClick={() =>
                      col.sorter && handleSort(col.key, col.sorter)}
                  >
                    <div class="flex items-center gap-1">
                      {col.title}
                      {col.sorter && (
                        <div class="flex flex-col text-[10px] text-slate-400">
                          <IconChevronUp
                            class={twMerge(
                              "w-3 h-3 -mb-1",
                              sortKey === col.key && sortOrder === "ascend" &&
                                "text-blue-500",
                            )}
                          />
                          <IconChevronDown
                            class={twMerge(
                              "w-3 h-3",
                              sortKey === col.key && sortOrder === "descend" &&
                                "text-blue-500",
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.length === 0
                ? (
                  <tr>
                    <td
                      colSpan={(rowSelection ? 1 : 0) +
                        (expandable?.expandedRowRender ? 1 : 0) +
                        columns.length}
                      class={twMerge(
                        "text-center text-slate-500 dark:text-slate-400",
                        paddingCls,
                      )}
                    >
                      {renderEmpty?.() ?? (locale?.emptyText ?? "暂无数据")}
                    </td>
                  </tr>
                )
                : displayData.flatMap((record, index) => {
                  const originalIndex = (currentPage - 1) * pageSize + index;
                  const key = getKey(record, originalIndex);
                  const isExpanded = expandedSet.has(key);
                  const canExpand = expandable?.rowExpandable?.(record) ?? true;
                  const isSelected = selectedKeys.has(key);
                  const checkboxProps = rowSelection?.getCheckboxProps?.(
                    record,
                  );
                  const rowProps = onRow?.(record, originalIndex) ?? {};

                  const rows: unknown[] = [
                    <tr
                      key={key}
                      class={twMerge(
                        "border-b border-slate-100 dark:border-slate-700",
                        bordered &&
                          "[&_td]:border-r [&_td]:border-slate-200 dark:[&_td]:border-slate-600 [&_td:last-child]:border-r-0",
                        striped && index % 2 === 1 &&
                          "bg-slate-50/50 dark:bg-slate-800/30",
                        isSelected && "bg-blue-50 dark:bg-blue-900/20",
                        hoverable &&
                          "hover:bg-slate-50 dark:hover:bg-slate-700/30",
                        rowProps.onClick &&
                          "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30",
                        rowClassName?.(record, originalIndex),
                      )}
                      onClick={rowProps.onClick}
                    >
                      {rowSelection && (
                        <td
                          class={twMerge(
                            "text-center",
                            paddingCls,
                            !checkboxProps?.disabled &&
                              "cursor-pointer select-none",
                          )}
                          onClick={(e: Event) => {
                            if (checkboxProps?.disabled) return;
                            e.preventDefault();
                            e.stopPropagation();
                            const cur = rowSelection?.selectedRowKeys ??
                              selectedRef.value;
                            const set = cur instanceof Set
                              ? cur
                              : new Set((cur as string[]) ?? []);
                            const nextChecked = !set.has(key);
                            handleSelect(nextChecked, record, originalIndex);
                            const input = (
                              e.currentTarget as HTMLElement
                            ).querySelector(
                              'input[type="checkbox"], input[type="radio"]',
                            ) as HTMLInputElement | null;
                            if (input) input.checked = nextChecked;
                          }}
                        >
                          <input
                            type={rowSelection.type === "radio"
                              ? "radio"
                              : "checkbox"}
                            class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                            checked={isSelected}
                            disabled={checkboxProps?.disabled}
                            tabIndex={-1}
                            readOnly
                          />
                        </td>
                      )}
                      {expandable?.expandedRowRender && (
                        <td class={paddingCls}>
                          {canExpand && (
                            <button
                              type="button"
                              class="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
                              onClick={(e: Event) => {
                                e.stopPropagation();
                                // 非受控时更新内部展开态，保证 getter 重跑、UI 更新
                                if (expandable.expandedRowKeys === undefined) {
                                  expandedRef.value = (prev) =>
                                    isExpanded
                                      ? prev.filter((k) => k !== key)
                                      : [...prev, key];
                                }
                                expandable.onExpand?.(!isExpanded, record);
                              }}
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? "−" : "+"}
                            </button>
                          )}
                        </td>
                      )}
                      {columns.map((col, colIndex) => {
                        const dataIndex = (col.dataIndex ?? col.key) as keyof T;
                        const value = record[dataIndex];
                        const content = col.render
                          ? col.render(value, record, originalIndex)
                          : value;
                        const isStickyLeft = col.fixed === "left";
                        return (
                          <td
                            key={col.key}
                            class={twMerge(
                              "text-slate-700 dark:text-slate-300",
                              paddingCls,
                              col.align === "center" && "text-center",
                              col.align === "right" && "text-right",
                              col.ellipsis && "max-w-0 truncate",
                              isStickyLeft &&
                                "shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.25)]",
                              isStickyLeft && isSelected &&
                                "bg-blue-50 dark:bg-blue-900/20",
                              isStickyLeft && !isSelected &&
                                striped &&
                                index % 2 === 1 &&
                                "bg-slate-50/50 dark:bg-slate-800/30",
                              isStickyLeft && !isSelected &&
                                (!striped || index % 2 !== 1) &&
                                "bg-white dark:bg-slate-900",
                            )}
                            style={{
                              ...(fixedLeftOffsets[colIndex] != null
                                ? {
                                  position: "sticky" as const,
                                  left: `${fixedLeftOffsets[colIndex]}px`,
                                  zIndex: 1,
                                }
                                : {}),
                              ...(col.width != null
                                ? {
                                  width: typeof col.width === "number"
                                    ? `${col.width}px`
                                    : col.width,
                                }
                                : {}),
                            }}
                          >
                            {content}
                          </td>
                        );
                      })}
                    </tr>,
                  ];
                  if (
                    expandable?.expandedRowRender && isExpanded && canExpand
                  ) {
                    rows.push(
                      <tr
                        key={`${key}-exp`}
                        class="bg-slate-50/50 dark:bg-slate-800/30"
                      >
                        <td
                          colSpan={(expandable ? 1 : 0) + columns.length +
                            (rowSelection ? 1 : 0)}
                          class={paddingCls}
                        >
                          {expandable.expandedRowRender(record, originalIndex)}
                        </td>
                      </tr>,
                    );
                  }
                  return rows;
                })}
            </tbody>
            {summary != null && (
              <tfoot>
                <tr class="bg-slate-50 dark:bg-slate-800/50 font-medium border-t border-slate-200 dark:border-slate-600">
                  <td
                    colSpan={(expandable?.expandedRowRender ? 1 : 0) +
                      columns.length +
                      (rowSelection ? 1 : 0)}
                    class={paddingCls}
                  >
                    {summary(dataSource)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {paginationEnabled && (
          <div class="flex items-center justify-between gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
            <span>
              第 {currentPage} / {totalPages} 页，共 {total} 条
            </span>
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                上一页
              </button>
              <button
                type="button"
                class="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </>
    );
  };
}

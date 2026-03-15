/**
 * Table 表格（View）。
 * 桌面为主，移动可卡片化；支持列定义、排序、固定列、展开行、分页、loading、尺寸、边框、行选择。
 */

import { twMerge } from "tailwind-merge";
import { createSignal } from "@dreamer/view";
import type { SizeVariant } from "../../shared/types.ts";
import { IconChevronUp, IconChevronDown } from "../../shared/basic/icons/mod.ts";

export type SortOrder = "ascend" | "descend" | null;

export interface TableRowSelection<T> {
  type?: "checkbox" | "radio";
  selectedRowKeys?: string[];
  onChange?: (selectedRowKeys: string[], selectedRows: T[]) => void;
  getCheckboxProps?: (record: T) => { disabled?: boolean };
}

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
  /** 行选择配置 */
  rowSelection?: TableRowSelection<T>;
  /** 行 class（根据 record、index 返回） */
  rowClassName?: (record: T, index: number) => string;
  /** 表头 class */
  headerClass?: string;
  /** 表格 class */
  class?: string;
}

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
    rowSelection,
    rowClassName,
    headerClass,
    class: className,
  } = props;

  // 内部排序状态
  const [sortState, setSortState] = createSignal<{ key: string | null; order: SortOrder }>({
    key: null,
    order: null,
  });

  // 内部选择状态（非受控时使用）
  const [internalSelectedKeys, setInternalSelectedKeys] = createSignal<Set<string>>(new Set());

  const getKey = (record: T, index: number): string => {
    if (typeof rowKey === "function") return rowKey(record, index);
    const k = record[rowKey as keyof T];
    return k != null ? String(k) : `row-${index}`;
  };

  const paddingCls = sizeClasses[size];
  const expandedSet = new Set(expandable?.expandedRowKeys ?? []);

  const handleSort = (key: string, sorter: boolean | ((a: T, b: T) => number)) => {
    if (!sorter) return;
    const current = sortState();
    let nextOrder: SortOrder = "ascend";
    if (current.key === key) {
      if (current.order === "ascend") nextOrder = "descend";
      else if (current.order === "descend") nextOrder = null;
    }
    setSortState({ key: nextOrder ? key : null, order: nextOrder });
  };

  const handleSelectAll = (checked: boolean, currentData: T[]) => {
    if (!rowSelection) return;
    const newSelected = new Set(
      rowSelection.selectedRowKeys ?? internalSelectedKeys()
    );
    if (checked) {
      currentData.forEach((record, index) => {
        const key = getKey(record, index);
        const props = rowSelection.getCheckboxProps?.(record);
        if (!props?.disabled) {
          newSelected.add(key);
        }
      });
    } else {
      currentData.forEach((record, index) => {
        const key = getKey(record, index);
        newSelected.delete(key);
      });
    }
    
    if (rowSelection.selectedRowKeys === undefined) {
      setInternalSelectedKeys(newSelected);
    }
    
    // 触发 onChange
    if (rowSelection.onChange) {
      const keys = Array.from(newSelected);
      const rows = dataSource.filter((record, index) => keys.includes(getKey(record, index)));
      rowSelection.onChange(keys, rows);
    }
  };

  const handleSelect = (checked: boolean, record: T, index: number) => {
    if (!rowSelection) return;
    const key = getKey(record, index);
    const newSelected = new Set(
      rowSelection.selectedRowKeys ?? internalSelectedKeys()
    );
    
    if (rowSelection.type === "radio") {
      newSelected.clear();
      if (checked) newSelected.add(key);
    } else {
      if (checked) newSelected.add(key);
      else newSelected.delete(key);
    }

    if (rowSelection.selectedRowKeys === undefined) {
      setInternalSelectedKeys(newSelected);
    }

    if (rowSelection.onChange) {
      const keys = Array.from(newSelected);
      const rows = dataSource.filter((r, i) => keys.includes(getKey(r, i)));
      rowSelection.onChange(keys, rows);
    }
  };

  return () => {
    // 处理排序
    const data = [...dataSource];
    const { key: sortKey, order: sortOrder } = sortState();
    if (sortKey && sortOrder) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sorter) {
        if (typeof col.sorter === "function") {
          data.sort((a, b) => (col.sorter as (a: T, b: T) => number)(a, b) * (sortOrder === "descend" ? -1 : 1));
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

    // 处理选择状态
    const selectedKeys = new Set(
      rowSelection?.selectedRowKeys ?? internalSelectedKeys()
    );
    const allSelected = data.length > 0 && data.every((record, index) => {
      const key = getKey(record, index);
      const props = rowSelection?.getCheckboxProps?.(record);
      return props?.disabled || selectedKeys.has(key);
    });
    const indeterminate = !allSelected && data.some((record, index) => selectedKeys.has(getKey(record, index)));

    return (
    <div class={twMerge("table-wrapper overflow-x-auto", className)}>
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
              <th class={twMerge("w-8 text-center", paddingCls)}>
                {rowSelection.type !== "radio" && (
                  <input
                    type="checkbox"
                    class="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={allSelected}
                    // indeterminate={indeterminate} // HTML attribute, handled via ref usually
                    onChange={(e) => handleSelectAll((e.target as HTMLInputElement).checked, data)}
                    ref={(el) => { if (el) (el as HTMLInputElement).indeterminate = indeterminate; }}
                  />
                )}
              </th>
            )}
            {expandable?.expandedRowRender && (
              <th class={twMerge("w-8", paddingCls)} />
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                class={twMerge(
                  "text-left font-medium text-slate-700 dark:text-slate-300 select-none",
                  paddingCls,
                  col.align === "center" && "text-center",
                  col.align === "right" && "text-right",
                  col.sorter && "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700",
                  headerClass,
                )}
                style={col.width != null
                  ? {
                    width: typeof col.width === "number"
                      ? `${col.width}px`
                      : col.width,
                  }
                  : undefined}
                onClick={() => col.sorter && handleSort(col.key, col.sorter)}
              >
                <div class="flex items-center gap-1">
                  {col.title}
                  {col.sorter && (
                    <div class="flex flex-col text-[10px] text-slate-400">
                      <IconChevronUp
                        class={twMerge("w-3 h-3 -mb-1", sortKey === col.key && sortOrder === "ascend" && "text-blue-500")}
                      />
                      <IconChevronDown
                        class={twMerge("w-3 h-3", sortKey === col.key && sortOrder === "descend" && "text-blue-500")}
                      />
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.flatMap((record, index) => {
            const key = getKey(record, index);
            const isExpanded = expandedSet.has(key);
            const canExpand = expandable?.rowExpandable?.(record) ?? true;
            const isSelected = selectedKeys.has(key);
            const checkboxProps = rowSelection?.getCheckboxProps?.(record);
            const rowProps = onRow?.(record, index) ?? {};

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
                  rowProps.onClick &&
                    "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30",
                  rowClassName?.(record, index),
                )}
                onClick={rowProps.onClick}
              >
                {rowSelection && (
                  <td class={twMerge("text-center", paddingCls)}>
                    <input
                      type={rowSelection.type === "radio" ? "radio" : "checkbox"}
                      class="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={isSelected}
                      disabled={checkboxProps?.disabled}
                      onChange={(e) => handleSelect((e.target as HTMLInputElement).checked, record, index)}
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
                          expandable.onExpand?.(!isExpanded, record);
                        }}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? "−" : "+"}
                      </button>
                    )}
                  </td>
                )}
                {columns.map((col) => {
                  const dataIndex = (col.dataIndex ?? col.key) as keyof T;
                  const value = record[dataIndex];
                  const content = col.render
                    ? col.render(value, record, index)
                    : value;
                  return (
                    <td
                      key={col.key}
                      class={twMerge(
                        "text-slate-700 dark:text-slate-300",
                        paddingCls,
                        col.align === "center" && "text-center",
                        col.align === "right" && "text-right",
                        col.ellipsis && "max-w-0 truncate",
                      )}
                      style={col.width != null
                        ? {
                          width: typeof col.width === "number"
                            ? `${col.width}px`
                            : col.width,
                        }
                        : undefined}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>,
            ];
            if (expandable?.expandedRowRender && isExpanded && canExpand) {
              rows.push(
                <tr
                  key={`${key}-exp`}
                  class="bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <td
                    colSpan={(expandable ? 1 : 0) + columns.length + (rowSelection ? 1 : 0)}
                    class={paddingCls}
                  >
                    {expandable.expandedRowRender(record, index)}
                  </td>
                </tr>
              );
            }
            return rows;
          })}
        </tbody>
        {summary != null && (
          <tfoot>
            <tr class="bg-slate-50 dark:bg-slate-800/50 font-medium border-t border-slate-200 dark:border-slate-600">
              <td
                colSpan={(expandable?.expandedRowRender ? 1 : 0) + columns.length}
                class={paddingCls}
              >
                {summary(dataSource)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )};
}

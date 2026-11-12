/**
 * Table 表格（View）。
 * 桌面为主，移动可卡片化；支持列定义、排序、固定列、展开行、分页、loading、尺寸、边框、行选择、
 * 列级可编辑（text、{@link InputNumber} 数字、email/url/tel/date/time/select/checkbox/radio，受控 onCellChange；默认只读展示，双击进入编辑，失焦退出）。
 * date/time 使用 {@link DatePicker}、{@link TimePicker}（自研浮层 + 确定），非浏览器原生控件。
 *
 * **数据源与 View 函数槽 patch：** 首轮挂载后父级 VNode patch 只会 merge 同一 `liveProps` 对象并 bump 子树，
 * **不会再次调用** `Table()`；若在组件体顶层解构 `dataSource`，内层 `return () =>` 会永远读到首帧数组，
 * `onCellChange` 更新父级后表格仍展示旧数据。故 **`dataSource` 须在每次渲染 getter 内从 `props.dataSource` 读取**
 * （或行选择回调里读 `props.dataSource`）；运行时见 `@dreamer/view` 的 `reconcileIntrinsicFunctionChild`（`vnode-mount.ts`）。
 */

import { createEffect, createSignal, type Signal } from "@dreamer/view";
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
/** 按需：单文件图标，避免经 icons/mod 拉入全表 */
import { IconChevronDown } from "../../shared/basic/icons/ChevronDown.tsx";
import { IconChevronLeft } from "../../shared/basic/icons/ChevronLeft.tsx";
import { IconChevronRight } from "../../shared/basic/icons/ChevronRight.tsx";
import { IconChevronUp } from "../../shared/basic/icons/ChevronUp.tsx";
import { getPaginationState } from "../../shared/navigation/pagination-utils.ts";
import {
  focusSelectAllHost,
  isSelectAllHotkey,
  preventSelectAllDefault,
} from "../../shared/select-all-hotkey.ts";
import {
  defaultTableMessages,
  type SortOrder,
  TABLE_PAGINATION_ACTIVE_CLS,
  TABLE_PAGINATION_BTN_CLS,
  type TableColumnEditable,
  type TableMessages,
  type TableProps,
} from "./table-types.ts";
import {
  isEditableConfig,
  paginationPadXClasses,
  renderEditableCell,
  renderEditableCellDisplay,
  resolveEditableDisabled,
  scheduleTableEditRefocus,
  sizeClasses,
  stateCache,
  TABLE_EDIT_DOM_SNAP_MAX_WAIT_STEPS,
  TABLE_EDIT_PENDING_REFOCUS_MAX_WAIT_STEPS,
  TABLE_EDIT_PICKER_FOCUS_SETTLE_MAX_STEPS,
  tableEditFindOpenPickerDialogRoot,
  type TableEditingTarget,
  tableEditSlotToken,
} from "./table-editable.tsx";

export type {
  SortOrder,
  TableCellChangePayload,
  TableColumn,
  TableColumnEditable,
  TableEditableOption,
  TableMessages,
  TableProps,
} from "./table-types.ts";
export { defaultTableMessages } from "./table-types.ts";

export function Table<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  props: TableProps<T>,
): JSXRenderable {
  const {
    columns,
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
    onCellChange,
  } = props;
  /** 合并默认中文文案与外部传入 messages */
  const tableMessages: TableMessages = {
    ...defaultTableMessages,
    ...(props.messages ?? {}),
  };

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
   * 使用 Signal（.value 读写），与 @dreamer/view 的 createSignal 一致。
   */
  let selectedRef: Signal<Set<string>>;
  let expandedRef: Signal<string[]>;
  /** 当前正在编辑的单元格（rowKey + columnKey）；有 stateKey 时与选中/展开一并缓存，避免父级重挂 Table 后丢失 */
  let editingCell: Signal<TableEditingTarget | null>;

  /** 可编辑聚焦与失焦竞态用 ref；有 stateKey 时必须来自 stateCache，与 `editingCell` 同寿命 */
  let tableEditRootRef: { current: HTMLElement | null };
  let pendingEditRefocusCount: { current: number };
  let pendingEditTextSelectionRef: {
    current: { start: number; end: number } | null;
  };

  if (stateKey) {
    let cached = stateCache.get(stateKey);
    if (!cached) {
      cached = {
        selected: createSignal<Set<string>>(new Set()),
        expanded: createSignal<string[]>([]),
        editing: createSignal<TableEditingTarget | null>(null),
        tableEditRootRef: { current: null },
        pendingEditRefocusCount: { current: 0 },
        pendingEditTextSelectionRef: { current: null },
      };
      stateCache.set(stateKey, cached);
    } else {
      /**
       * 兼容旧版缓存条目（仅 selected/expanded 或缺 ref 字段）：同进程 HMR / 长期存活 Map 可能遗留。
       */
      if (cached.editing == null) {
        cached.editing = createSignal<TableEditingTarget | null>(null);
      }
      if (!("tableEditRootRef" in cached)) {
        Object.assign(cached, {
          tableEditRootRef: { current: null },
          pendingEditRefocusCount: { current: 0 },
          pendingEditTextSelectionRef: { current: null },
        });
      }
    }
    selectedRef = cached.selected;
    expandedRef = cached.expanded;
    editingCell = cached.editing;
    tableEditRootRef = cached.tableEditRootRef;
    pendingEditRefocusCount = cached.pendingEditRefocusCount;
    pendingEditTextSelectionRef = cached.pendingEditTextSelectionRef;
  } else {
    selectedRef = createSignal<Set<string>>(new Set());
    expandedRef = createSignal<string[]>([]);
    editingCell = createSignal<TableEditingTarget | null>(null);
    tableEditRootRef = { current: null };
    pendingEditRefocusCount = { current: 0 };
    pendingEditTextSelectionRef = { current: null };
  }

  /** 双击进入编辑时聚焦一次，光标置于文本末尾（避免默认在行首） */
  createEffect(() => {
    const t = editingCell.value;
    if (t == null) return;
    scheduleTableEditRefocus(
      tableEditRootRef,
      () => editingCell.value,
      undefined,
      pendingEditTextSelectionRef,
      { initialCaretToEnd: true },
    );
  });

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

    /** 须读 `props.dataSource`：函数槽 patch 会更新 `liveProps`，顶层解构的数组会停留在首帧 */
    const selectedRows = props.dataSource.filter((record, index) =>
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

    const selectedRows = props.dataSource.filter((r, i) =>
      newSelected.has(getKey(r, i))
    );
    rowSelection.onChange?.(selectedRows);
  };

  /**
   * 勿用外层 `return () => …` 包住整表：那会读 `expandedRef` / `sortState` / `selectedRef` / `internalPage` 等，
   * 父级 `insert` 的 effect 会订阅这些 signal；展开行变化时 effect 重跑与 `cleanNode` 可能破坏与兄弟节点（如文档页下方 CodeBlock）的 DOM 顺序，表现为表格与代码块上下错位。
   * 将整段依赖上述状态的 JSX 放进 `children` 函数，由子级 `insert` 单独挂 effect（与 Affix、Menu、Pagination 一致）。
   * 根上须有一层**稳定 DOM**（如下方 `div`）：若根仅为 Fragment + 函数子，内层数组插入会把表体插在文档父级与 CodeBlock 同级，响应式重跑时可能与数组尾锚不同步导致兄弟错位；壳内更新则不影响与外侧兄弟的顺序。
   */
  return (
    <div class="w-full min-w-0">
      {() => {
        /**
         * 每次子槽 bump 后重跑须从 `props` 取最新数据源（与运行时 `liveProps` 同一引用，patch 时会 assign 覆盖）。
         * 禁止依赖组件首次调用时在闭包内缓存的 `dataSource` 常量。
         */
        const dataSource = props.dataSource;
        /**
         * 列定义须同步从 `props.columns` 读取：若仍用函数组件首帧解构的 `columns` 闭包，
         * patch 后表体仍渲染旧列（含 `render`/`onClick`），行内按钮等会表现为点击无响应。
         */
        const columns = props.columns;
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

        /** 空状态 / 加载行等单行占满表宽时的 colSpan（选择列 + 展开列 + 数据列） */
        const bodyColSpan = (rowSelection ? 1 : 0) +
          (expandable?.expandedRowRender ? 1 : 0) +
          columns.length;

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
              ref={(el: HTMLElement | null) => {
                tableEditRootRef.current = el;
              }}
              class={twMerge(
                "table-wrapper overflow-x-auto",
                className,
              )}
              tabIndex={rowSelection && rowSelection.type !== "radio"
                ? -1
                : undefined}
              onMouseDown={rowSelection && rowSelection.type !== "radio"
                ? focusSelectAllHost
                : undefined}
              onKeyDown={(event: KeyboardEvent) => {
                if (!rowSelection || rowSelection.type === "radio") return;
                if (!isSelectAllHotkey(event)) return;
                preventSelectAllDefault(event);
                handleSelectAll(
                  !allSelected,
                  displayData,
                  (currentPage - 1) * pageSize,
                );
              }}
            >
              <table
                class={twMerge(
                  "w-full border-collapse",
                  // 外框用 0.5px，避免默认 1px 在 light 下显得偏粗（高 DPR 下仍可见细线）
                  bordered &&
                    "box-border border-0.5 border-slate-200 dark:border-slate-600",
                )}
              >
                <thead>
                  <tr class="border-b border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50">
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
                                    const p = rowSelection?.getCheckboxProps?.(
                                      r,
                                    );
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
                    {columns.map((col, colIndex) => {
                      const headerTextAlign: "left" | "center" | "right" =
                        col.headerAlign !== undefined
                          ? col.headerAlign
                          : (col.align !== undefined ? col.align : "left");
                      return (
                        <th
                          key={col.key}
                          class={twMerge(
                            "font-medium text-slate-700 dark:text-slate-300 select-none",
                            col.fixed === "left" &&
                              "bg-slate-50 dark:bg-slate-800 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)]",
                            paddingCls,
                            headerTextAlign === "left" && "text-left",
                            headerTextAlign === "center" && "text-center",
                            headerTextAlign === "right" && "text-right",
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
                          <div
                            class={twMerge(
                              "flex w-full min-w-0 items-center gap-1",
                              headerTextAlign === "center" && "justify-center",
                              headerTextAlign === "right" && "justify-end",
                              headerTextAlign === "left" && "justify-start",
                            )}
                          >
                            {col.title}
                            {col.sorter && (
                              <div class="flex flex-col text-[10px] text-slate-400">
                                <IconChevronUp
                                  class={twMerge(
                                    "w-3 h-3 -mb-1",
                                    sortKey === col.key &&
                                      sortOrder === "ascend" &&
                                      "text-blue-500",
                                  )}
                                />
                                <IconChevronDown
                                  class={twMerge(
                                    "w-3 h-3",
                                    sortKey === col.key &&
                                      sortOrder === "descend" &&
                                      "text-blue-500",
                                  )}
                                />
                              </div>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {displayData.length === 0
                    ? (
                      <tr>
                        <td
                          colSpan={bodyColSpan}
                          class={twMerge(
                            "text-center text-slate-500 dark:text-slate-400",
                            paddingCls,
                            // 加载态背景铺在整格；勿只写内层 div，否则 flex 块易收缩、与 thead 视觉宽度不齐
                            loading &&
                              "bg-slate-50/90 dark:bg-slate-900/50",
                          )}
                        >
                          {/* 加载态写在 td 内；内层须 w-full 撑满单元格内容区 */}
                          {loading
                            ? (
                              <div
                                class="flex w-full min-w-0 flex-col items-center justify-center"
                                aria-busy="true"
                                aria-live="polite"
                              >
                                <span class="text-sm">
                                  {tableMessages.loading}
                                </span>
                              </div>
                            )
                            : (
                              renderEmpty?.() ??
                                (locale?.emptyText ?? tableMessages.emptyText)
                            )}
                        </td>
                      </tr>
                    )
                    : (
                      <>
                        {displayData.flatMap((record, index) => {
                          const originalIndex = (currentPage - 1) * pageSize +
                            index;
                          const key = getKey(record, originalIndex);
                          const isExpanded = expandedSet.has(key);
                          const canExpand =
                            expandable?.rowExpandable?.(record) ??
                              true;
                          const isSelected = selectedKeys.has(key);
                          const checkboxProps = rowSelection
                            ?.getCheckboxProps?.(
                              record,
                            );
                          const rowProps = onRow?.(record, originalIndex) ?? {};

                          /**
                           * 斑马纹/行底色须落在每个 td：`border-collapse: collapse` 下 tr 的背景常被单元格遮住，浅色里会整表发白；
                           * light 下 `slate-50/50` 对比太弱，奇数行用 `bg-slate-100` 才能看出条纹。
                           */
                          const bodyRowCellBg = isSelected
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : striped && index % 2 === 1
                            ? "bg-slate-100 dark:bg-slate-800/40"
                            : "bg-white dark:bg-slate-900";

                          const rows: unknown[] = [
                            <tr
                              key={key}
                              class={twMerge(
                                "border-b border-slate-200 dark:border-slate-700",
                                bordered &&
                                  "[&_td]:border-r [&_td]:border-slate-200 dark:[&_td]:border-slate-600 [&_td:last-child]:border-r-0",
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
                                    bodyRowCellBg,
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
                                    handleSelect(
                                      nextChecked,
                                      record,
                                      originalIndex,
                                    );
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
                                <td class={twMerge(paddingCls, bodyRowCellBg)}>
                                  {canExpand && (
                                    <button
                                      type="button"
                                      // 文本符号受 line-height 影响会纵向拉长；用固定正方形 + flex 居中，hover 底四边一致
                                      class="inline-flex size-5 shrink-0 items-center justify-center rounded-md p-0 leading-none hover:bg-slate-200 dark:hover:bg-slate-600"
                                      onClick={(e: Event) => {
                                        e.stopPropagation();
                                        // 非受控时更新内部展开态，保证 getter 重跑、UI 更新
                                        if (
                                          expandable.expandedRowKeys ===
                                            undefined
                                        ) {
                                          expandedRef((prev) =>
                                            isExpanded
                                              ? prev.filter((k: string) =>
                                                k !== key
                                              )
                                              : [...prev, key]
                                          );
                                        }
                                        expandable.onExpand?.(
                                          !isExpanded,
                                          record,
                                        );
                                      }}
                                      aria-expanded={isExpanded}
                                    >
                                      {isExpanded ? "−" : "+"}
                                    </button>
                                  )}
                                </td>
                              )}
                              {columns.map((col, colIndex) => {
                                const dataIndex =
                                  (col.dataIndex ?? col.key) as keyof T;
                                const value = record[dataIndex];
                                const cellEditable = isEditableConfig(
                                  col.editable,
                                );
                                const editTarget = editingCell.value;
                                const isEditing = cellEditable &&
                                  editTarget != null &&
                                  editTarget.rowKey === key &&
                                  editTarget.columnKey === col.key;

                                let content: unknown;
                                if (cellEditable) {
                                  const edResolved = col
                                    .editable as TableColumnEditable<T>;
                                  const dis = resolveEditableDisabled(
                                    edResolved,
                                    record,
                                    originalIndex,
                                  );
                                  const canActivate = Boolean(onCellChange) &&
                                    !dis;
                                  if (isEditing) {
                                    content = (
                                      <div
                                        class="w-full min-w-0 outline-hidden"
                                        tabIndex={-1}
                                        data-view-table-edit-root="1"
                                        data-view-table-edit-slot={tableEditSlotToken(
                                          key,
                                          col.key,
                                        )}
                                        /**
                                         * 必须用 `focusout`（`onFocusOut`）：`blur` 不冒泡，子 input 失焦时父级
                                         * `onBlur` 永远不会触发，`editingCell` 无法清空，单元格会一直停在编辑态。
                                         */
                                        onFocusOut={(e: FocusEvent) => {
                                          const cur = e
                                            .currentTarget as HTMLElement;
                                          const rel = e.relatedTarget as
                                            | Node
                                            | null;
                                          if (
                                            rel != null && cur.contains(rel)
                                          ) {
                                            return;
                                          }
                                          /**
                                           * 受控 input 被替换时先失焦、relatedTarget 常为空；不能与
                                           * `scheduleTableEditRefocus` 抢跑：后者是 microtask+2×rAF，
                                           * 若此处双 rAF 先执行会误清空 editingCell。
                                           * 始终用 `tableEditRootRef`+slot 查当前槽位（整段重挂后 `cur` 可能已 detached）。
                                           */
                                          const rowK = key;
                                          const colK = col.key;
                                          /**
                                           * 等待 `pendingEditRefocusCount` 归零的轮询步数（须与「判 activeElement」分开计数）。
                                           * 安全上限见 {@link TABLE_EDIT_PENDING_REFOCUS_MAX_WAIT_STEPS}。
                                           */
                                          let pendingRefocusWaitSteps = 0;
                                          /**
                                           * `tableEditRootRef` / 槽位晚一帧挂上时的短轮询步数；
                                           * 上限见 {@link TABLE_EDIT_DOM_SNAP_MAX_WAIT_STEPS}。
                                           */
                                          let domSnapWaitSteps = 0;
                                          /** 日期/时间浮层打开时焦点尚未落稳的轮询步数；上限见 {@link TABLE_EDIT_PICKER_FOCUS_SETTLE_MAX_STEPS} */
                                          let pickerFocusSettleSteps = 0;
                                          const tryBlurExit = (): void => {
                                            const t = editingCell.value;
                                            if (
                                              t == null ||
                                              t.rowKey !== rowK ||
                                              t.columnKey !== colK
                                            ) {
                                              return;
                                            }
                                            if (
                                              pendingEditRefocusCount.current >
                                                0
                                            ) {
                                              pendingRefocusWaitSteps++;
                                              if (
                                                pendingRefocusWaitSteps >
                                                  TABLE_EDIT_PENDING_REFOCUS_MAX_WAIT_STEPS
                                              ) {
                                                return;
                                              }
                                              requestAnimationFrame(() => {
                                                requestAnimationFrame(
                                                  tryBlurExit,
                                                );
                                              });
                                              return;
                                            }
                                            const root =
                                              tableEditRootRef.current;
                                            const slot = tableEditSlotToken(
                                              rowK,
                                              colK,
                                            );
                                            const host = root?.querySelector(
                                              `[data-view-table-edit-slot="${slot}"]`,
                                            ) as HTMLElement | null;
                                            if (root == null || host == null) {
                                              domSnapWaitSteps++;
                                              if (
                                                domSnapWaitSteps <=
                                                  TABLE_EDIT_DOM_SNAP_MAX_WAIT_STEPS
                                              ) {
                                                requestAnimationFrame(() => {
                                                  requestAnimationFrame(
                                                    tryBlurExit,
                                                  );
                                                });
                                                return;
                                              }
                                              const tOrphan = editingCell.value;
                                              if (
                                                tOrphan?.rowKey === rowK &&
                                                tOrphan.columnKey === colK
                                              ) {
                                                editingCell.value = null;
                                              }
                                              return;
                                            }
                                            const doc = globalThis.document;
                                            const ae = doc.activeElement;
                                            if (
                                              ae === host ||
                                              host.contains(ae)
                                            ) {
                                              return;
                                            }
                                            /**
                                             * 格内 Picker 主面板仍打开时：焦点可能在面板内按钮上（须视为仍在编辑），
                                             * 或短暂落在 `body` / `documentElement`（须延后重判，勿清空编辑态）。
                                             */
                                            const pickerRoot =
                                              tableEditFindOpenPickerDialogRoot(
                                                host,
                                              );
                                            if (pickerRoot != null) {
                                              if (
                                                ae instanceof Node &&
                                                pickerRoot.contains(ae)
                                              ) {
                                                return;
                                              }
                                              if (
                                                ae === doc.body ||
                                                ae === doc.documentElement ||
                                                ae == null
                                              ) {
                                                pickerFocusSettleSteps++;
                                                if (
                                                  pickerFocusSettleSteps <=
                                                    TABLE_EDIT_PICKER_FOCUS_SETTLE_MAX_STEPS
                                                ) {
                                                  requestAnimationFrame(() => {
                                                    requestAnimationFrame(
                                                      tryBlurExit,
                                                    );
                                                  });
                                                  return;
                                                }
                                                /**
                                                 * 重试耗尽后焦点仍在 document 默认锚点：常见于仅用鼠标操作月/年面板、
                                                 * 或子控件未实现 `tabindex` 夺焦。只要选择器浮层仍连接且可见，视为仍在编辑，
                                                 * 勿清空 `editingCell`（否则会卸载格内组件、面板被关掉）。
                                                 */
                                                if (
                                                  pickerRoot.isConnected
                                                ) {
                                                  const pr = pickerRoot
                                                    .getBoundingClientRect();
                                                  if (
                                                    pr.width > 0 &&
                                                    pr.height > 0
                                                  ) {
                                                    return;
                                                  }
                                                }
                                              }
                                            }
                                            const t2 = editingCell.value;
                                            if (
                                              t2?.rowKey === rowK &&
                                              t2.columnKey === colK
                                            ) {
                                              editingCell.value = null;
                                            }
                                          };
                                          requestAnimationFrame(() => {
                                            requestAnimationFrame(tryBlurExit);
                                          });
                                        }}
                                      >
                                        {renderEditableCell(
                                          col,
                                          record,
                                          originalIndex,
                                          key,
                                          size,
                                          col.align,
                                          onCellChange,
                                          () => {
                                            scheduleTableEditRefocus(
                                              tableEditRootRef,
                                              () => editingCell.value,
                                              () => {
                                                pendingEditRefocusCount
                                                  .current = Math.max(
                                                    0,
                                                    pendingEditRefocusCount
                                                      .current - 1,
                                                  );
                                              },
                                              pendingEditTextSelectionRef,
                                            );
                                          },
                                          pendingEditTextSelectionRef,
                                          pendingEditRefocusCount,
                                        )}
                                      </div>
                                    );
                                  } else {
                                    content = (
                                      <div
                                        class={twMerge(
                                          "min-w-0 max-w-full",
                                          canActivate
                                            ? "cursor-cell select-none"
                                            : "cursor-not-allowed opacity-60",
                                        )}
                                        title={canActivate
                                          ? tableMessages.doubleClickToEdit
                                          : undefined}
                                        onDblClick={(e: Event) => {
                                          e.stopPropagation();
                                          if (!canActivate) return;
                                          editingCell.value = {
                                            rowKey: key,
                                            columnKey: col.key,
                                          };
                                        }}
                                      >
                                        {renderEditableCellDisplay(
                                          col,
                                          value,
                                          edResolved,
                                          size,
                                          col.align,
                                          {
                                            yes: tableMessages.yes,
                                            no: tableMessages.no,
                                          },
                                        )}
                                      </div>
                                    );
                                  }
                                } else {
                                  content = col.render
                                    ? col.render(value, record, originalIndex)
                                    : value;
                                }
                                const isStickyLeft = col.fixed === "left";
                                return (
                                  <td
                                    key={col.key}
                                    class={twMerge(
                                      "text-slate-700 dark:text-slate-300",
                                      bodyRowCellBg,
                                      paddingCls,
                                      col.align === "center" && "text-center",
                                      col.align === "right" && "text-right",
                                      col.ellipsis &&
                                        (!cellEditable || !isEditing) &&
                                        "max-w-0 truncate",
                                      isStickyLeft &&
                                        "shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.25)]",
                                      cellEditable && "align-middle",
                                    )}
                                    style={{
                                      ...(fixedLeftOffsets[colIndex] != null
                                        ? {
                                          position: "sticky" as const,
                                          left: `${
                                            fixedLeftOffsets[colIndex]
                                          }px`,
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
                            expandable?.expandedRowRender && isExpanded &&
                            canExpand
                          ) {
                            rows.push(
                              <tr key={`${key}-exp`}>
                                <td
                                  colSpan={(expandable ? 1 : 0) +
                                    columns.length +
                                    (rowSelection ? 1 : 0)}
                                  class={twMerge(
                                    paddingCls,
                                    "bg-slate-100 dark:bg-slate-800/40",
                                  )}
                                >
                                  {expandable.expandedRowRender(
                                    record,
                                    originalIndex,
                                  )}
                                </td>
                              </tr>,
                            );
                          }
                          return rows;
                        })}
                        {loading && (
                          <tr key="__view-table-loading">
                            <td
                              colSpan={bodyColSpan}
                              class={twMerge(
                                "border-t border-slate-100 bg-slate-50/80 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400",
                                paddingCls,
                              )}
                              aria-busy="true"
                              aria-live="polite"
                            >
                              <div class="flex w-full min-w-0 items-center justify-center py-6">
                                <span>{tableMessages.loading}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )}
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
            {paginationEnabled && (() => {
              const {
                safeCurrent,
                from,
                to,
                canPrev,
                canNext,
                pages: pageButtons,
              } = getPaginationState(
                currentPage,
                pageSize,
                total,
                totalPages,
              );
              const totalHint = total > 0
                ? tableMessages.paginationRange(from, to, total)
                : tableMessages.paginationTotalZero(total);
              return (
                <nav
                  role="navigation"
                  aria-label={tableMessages.paginationAriaLabel}
                  class={twMerge(
                    "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-3 pt-3 pb-3 border-t border-slate-200 dark:border-slate-700",
                    paginationPadXClasses[size],
                  )}
                >
                  <span class="text-sm text-slate-600 dark:text-slate-400 tabular-nums shrink-0">
                    {totalHint}
                    <span class="text-slate-400 dark:text-slate-500 mx-1.5">
                      ·
                    </span>
                    {tableMessages.paginationOfPages(safeCurrent, totalPages)}
                  </span>
                  <div class="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      class={TABLE_PAGINATION_BTN_CLS}
                      disabled={!canPrev}
                      aria-label={tableMessages.prev}
                      onClick={() => handlePageChange(safeCurrent - 1)}
                    >
                      <IconChevronLeft class="w-4 h-4" />
                    </button>
                    {pageButtons.map((p, i) =>
                      p < 0
                        ? (
                          <span
                            key={`ellipsis-${i}`}
                            class="min-w-8 h-8 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm"
                          >
                            …
                          </span>
                        )
                        : (
                          <button
                            key={p}
                            type="button"
                            class={twMerge(
                              TABLE_PAGINATION_BTN_CLS,
                              safeCurrent === p && TABLE_PAGINATION_ACTIVE_CLS,
                            )}
                            aria-label={tableMessages.pageLabel(p)}
                            aria-current={safeCurrent === p
                              ? "page"
                              : undefined}
                            onClick={() => handlePageChange(p)}
                          >
                            {p}
                          </button>
                        )
                    )}
                    <button
                      type="button"
                      class={TABLE_PAGINATION_BTN_CLS}
                      disabled={!canNext}
                      aria-label={tableMessages.next}
                      onClick={() => handlePageChange(safeCurrent + 1)}
                    >
                      <IconChevronRight class="w-4 h-4" />
                    </button>
                  </div>
                </nav>
              );
            })()}
          </>
        );
      }}
    </div>
  );
}

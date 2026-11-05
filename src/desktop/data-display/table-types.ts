/**
 * @module desktop/data-display/table-types
 * @description Table 列／编辑／文案类型与分页按钮样式常量。
 */

import type { SizeVariant } from "../../shared/types.ts";

/** Table 底部分页：与 {@link ../../shared/navigation/Pagination.tsx} 视觉对齐 */
export const TABLE_PAGINATION_BTN_CLS =
  "min-w-8 h-8 px-2 inline-flex items-center justify-center rounded-md text-sm font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-colors";
export const TABLE_PAGINATION_ACTIVE_CLS =
  "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 pointer-events-none";

export type SortOrder = "ascend" | "descend" | null;

/** 可编辑列：下拉 / 单选项 */
export type TableEditableOption = {
  label: string;
  value: string | number;
};

/** 可编辑列是否禁用（整列或按行） */
export type TableEditableDisabled<T> =
  | boolean
  | ((record: T, rowIndex: number) => boolean);

type TableEditableCore<T> = {
  /** 禁用当前格或按行判断 */
  disabled?: TableEditableDisabled<T>;
};

/**
 * 列级可编辑配置（不含 textarea；由父组件受控更新 `dataSource`）。
 * 设置后该列**优先渲染控件**，忽略 `render`。
 */
export type TableColumnEditable<T = unknown> =
  | (TableEditableCore<T> & {
    type: "text";
    placeholder?: string;
    maxLength?: number;
  })
  | (TableEditableCore<T> & {
    type: "number";
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number | "any";
  })
  | (TableEditableCore<T> & { type: "email"; placeholder?: string })
  | (TableEditableCore<T> & { type: "url"; placeholder?: string })
  | (TableEditableCore<T> & { type: "tel"; placeholder?: string })
  | (TableEditableCore<T> & { type: "date" })
  | (TableEditableCore<T> & { type: "time" })
  | (TableEditableCore<T> & {
    type: "select";
    options: TableEditableOption[];
    placeholder?: string;
  })
  | (TableEditableCore<T> & { type: "checkbox" })
  | (TableEditableCore<T> & {
    type: "radio";
    options: TableEditableOption[];
  });

/** 单元格编辑回调载荷（无内部草稿，由父组件写回数据源） */
export type TableCellChangePayload<T> = {
  columnKey: string;
  dataIndex: keyof T | string;
  value: unknown;
  record: T;
  rowIndex: number;
};

export interface TableColumn<T = unknown> {
  /** 列 key / dataIndex */
  key: string;
  /** 列标题 */
  title?: string | unknown;
  /** 对应数据字段名（不传则用 key） */
  dataIndex?: keyof T | string;
  /** 自定义渲染 */
  render?: (value: unknown, record: T, index: number) => unknown;
  /**
   * 单元格可编辑：`false` 或省略为只读；传入配置则默认只读展示、双击进入编辑（忽略 `render`）。
   */
  editable?: false | TableColumnEditable<T>;
  /** 列宽 */
  width?: number | string;
  /** 对齐 */
  align?: "left" | "center" | "right";
  /**
   * 表头 th 内标题对齐；**不传**时与 `align` 一致；`align` 也未设时与现网一致为**左**。
   * 用于「表头居中、单元格仍左/右对齐」等布局。
   */
  headerAlign?: "left" | "center" | "right";
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
  /** 多语言/自定义文案；未传字段走 {@link defaultTableMessages} */
  messages?: Partial<TableMessages>;
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
   * 当前正在编辑的单元格（双击 editable）及「编辑重聚焦」用 ref（`pendingEditRefocusCount`、`tableEditRootRef` 等）
   * 也按同一 key 缓存；**可编辑列 + `onCellChange` 且父级会重跑 `Table()`（如 `{() => <Table … />}`）时请务必传入**，
   * 否则每次调用会新建 ref，受控输入一字后重挂易导致失焦退回只读。
   */
  stateKey?: string;
  /**
   * 可编辑列变更回调（受控）。双击单元格进入编辑、失焦退出；父组件应据此更新 `dataSource`。未传时不可进入编辑。
   */
  onCellChange?: (payload: TableCellChangePayload<T>) => void;
}

/** Table 内置文案 */
export interface TableMessages {
  /** 加载中文案 */
  loading: string;
  /** 空数据兜底（同时 fallback 也用 `locale.emptyText`） */
  emptyText: string;
  /** 布尔列：true 文本 */
  yes: string;
  /** 布尔列：false 文本 */
  no: string;
  /** 可编辑单元格 `title` 提示 */
  doubleClickToEdit: string;
  /** 分页 `nav` `aria-label` */
  paginationAriaLabel: string;
  /** 上一页按钮 `aria-label` */
  prev: string;
  /** 下一页按钮 `aria-label` */
  next: string;
  /** 单个页码按钮 `aria-label` */
  pageLabel: (page: number) => string;
  /** 分页区「第 from–to 条 / 共 total 条」摘要 */
  paginationRange: (from: number, to: number, total: number) => string;
  /** 总数为 0 时摘要 */
  paginationTotalZero: (total: number) => string;
  /** 「第 N / M 页」摘要 */
  paginationOfPages: (current: number, total: number) => string;
}

/** 默认中文文案 */
export const defaultTableMessages: TableMessages = {
  loading: "加载中…",
  emptyText: "暂无数据",
  yes: "是",
  no: "否",
  doubleClickToEdit: "双击编辑",
  paginationAriaLabel: "表格分页",
  prev: "上一页",
  next: "下一页",
  pageLabel: (p) => `第 ${p} 页`,
  paginationRange: (from, to, total) => `第 ${from}–${to} 条 / 共 ${total} 条`,
  paginationTotalZero: (total) => `共 ${total} 条`,
  paginationOfPages: (current, total) => `第 ${current} / ${total} 页`,
};

/** 当前编辑中的单元格（与 editingCell signal 存值一致） */

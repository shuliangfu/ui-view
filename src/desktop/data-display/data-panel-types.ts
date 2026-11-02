/**
 * DataPanel 公共类型：列、搜索项、表单项、查询、数据源与文案。
 * 与具体后端无关：所有数据读写通过 {@link DataPanelDataSource} 注入。
 */

/** 数据行：键值对；主键字段默认为 `id`（见 `DataPanelProps.rowKey`）。 */
export type DataPanelRow = Record<string, unknown>;

/** 标签 / 提示色调 */
export type DataPanelTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "default";

/** 列展示类型 */
export type DataPanelColumnType =
  | "text"
  | "number"
  | "money"
  | "date"
  | "datetime"
  | "tag"
  | "bool"
  | "image"
  | "link";

/** 选项（tag 列、select 搜索 / 表单项共用） */
export interface DataPanelOption {
  value: string;
  label: string;
  tone?: DataPanelTone;
}

/** 列定义 */
export interface DataPanelColumn {
  /** 行字段名 */
  prop: string;
  /** 表头文案 */
  label: string;
  /** 展示类型，默认 text */
  type?: DataPanelColumnType;
  /** 是否可点击表头排序（服务端 / 本地数据源均走 `list(query)`） */
  sortable?: boolean;
  /** 列宽（px） */
  width?: number;
  /** tag 列：值 → 文案 / 色调；switch/select 行内编辑也用 */
  options?: DataPanelOption[];
  /**
   * 行内编辑（单元格编辑）：
   * - `switch`：两个 options 的开关，点击即切换并保存；
   * - 其余类型双击进入编辑：`text` / `number` / `textarea` / `date` / `datetime` / `select`（单选，需 options）/
   *   `multiselect`（多选，需 options，值为数组）；
   * - 失焦或 Enter 保存并回到展示态；Esc 取消并恢复原值；保存失败提示错误并保持原值。
   */
  inline?:
    | "switch"
    | "select"
    | "multiselect"
    | "text"
    | "number"
    | "textarea"
    | "date"
    | "datetime";
  /** 页脚合计行：显示 `list()` 返回 `totals[prop]` */
  total?: boolean;
  /** 默认隐藏，可在「列设置」里打开 */
  hidden?: boolean;
  /** 不参与导出 */
  noExport?: boolean;
}

/** 搜索项 */
export interface DataPanelSearchField {
  name: string;
  label: string;
  type?: "text" | "select" | "date";
  options?: DataPanelOption[];
  /** 本地数据源匹配方式：contains（text 默认）/ eq（select 默认）/ from / to / num */
  match?: "contains" | "eq" | "from" | "to" | "num";
  /** 行字段名，缺省与 `name` 相同 */
  field?: string;
}

/** 表单控件类型 */
export type DataPanelFormType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multiselect"
  | "switch"
  | "password"
  | "date"
  | "datetime";

/** 新增 / 编辑 Modal 里的表单项 */
export interface DataPanelFormField {
  name: string;
  label: string;
  type?: DataPanelFormType;
  options?: DataPanelOption[];
  required?: boolean;
  min?: number;
  max?: number;
  /** 正则（字符串） */
  pattern?: string;
  placeholder?: string;
  /** 新建时的初始值 */
  initial?: string | number | boolean;
  /** 创建后不可再改（编辑时只读） */
  createOnly?: boolean;
  /** 仅编辑时显示 */
  editOnly?: boolean;
  /** switch：存储值 [开, 关]，默认 [true, false] */
  onOff?: [string, string];
}

/** 列表查询（page 从 1 起；order 1 升序 / -1 降序） */
export interface DataPanelQuery {
  page: number;
  pageSize: number;
  sort: string;
  order: 1 | -1;
  /** 搜索字段 → 原始字符串（仅非空） */
  filters: Record<string, string>;
}

/** `list()` 返回 */
export interface DataPanelListResult {
  rows: DataPanelRow[];
  total: number;
  /** 合计行数据：列 prop → 数值 */
  totals?: Record<string, number>;
}

/** 新增 / 编辑结果；失败时可带整体或字段级错误 */
export type DataPanelWriteResult =
  | void
  | { ok: true }
  | {
    ok: false;
    /** 顶部错误文案 */
    message?: string;
    /** 出错的字段名 */
    fields?: string[];
    /** 字段名 → 错误文案 */
    messages?: Record<string, string>;
  };

/** 批量操作结果 */
export interface DataPanelBulkResult {
  /** 成功处理条数 */
  removed: number;
  failed: { id: string; error: string }[];
}

/** 导入结果 */
export interface DataPanelImportResult {
  created: number;
  failed: number;
}

type MaybePromise<T> = T | Promise<T>;

/**
 * 数据源：所有读写都经过它。`list` 必需，其余按需提供，缺省的能力对应按钮 / 列会自动隐藏。
 * `list` 同步返回时首屏可 SSR 直出（`createLocalDataSource` 即如此）。
 */
export interface DataPanelDataSource {
  /** 为 true 表示 `list` 同步返回：首帧（含 SSR）直接渲染，无需挂载后再请求 */
  sync?: boolean;
  list(query: DataPanelQuery): MaybePromise<DataPanelListResult>;
  create?(values: Record<string, unknown>): MaybePromise<DataPanelWriteResult>;
  update?(
    id: string,
    values: Record<string, unknown>,
  ): MaybePromise<DataPanelWriteResult>;
  /** 删除；面板保证只在用户确认对话后才会调用 */
  remove?(ids: string[]): MaybePromise<DataPanelBulkResult>;
  /** 给多行设置同一字段（批量状态 / 行内编辑） */
  setField?(
    ids: string[],
    field: string,
    value: unknown,
  ): MaybePromise<DataPanelBulkResult>;
  /** 导入 CSV / JSON 解析后的行 */
  importRows?(
    rows: Record<string, string>[],
  ): MaybePromise<DataPanelImportResult>;
}

/** 能力开关（缺省按数据源方法是否存在推断） */
export interface DataPanelCaps {
  create: boolean;
  update: boolean;
  view: boolean;
  remove: boolean;
  batchStatus: boolean;
  import: boolean;
  export: boolean;
  print: boolean;
  columns: boolean;
}

/** 导出格式 */
export type DataPanelExportFormat = "xlsx" | "csv" | "json" | "xml" | "html";

/** 界面语言 */
export type DataPanelLocale = "zh-CN" | "en-US";

/** 可本地化文案；`{x}` 为占位符 */
export interface DataPanelMessages {
  search: string;
  create: string;
  refresh: string;
  print: string;
  import: string;
  export: string;
  columns: string;
  resetColumns: string;
  all: string;
  reset: string;
  searchSubmit: string;
  total: string;
  totalCount: string;
  range: string;
  rangeEmpty: string;
  perPage: string;
  jump: string;
  page: string;
  selected: string;
  batchSet: string;
  batchDelete: string;
  clearSelection: string;
  deleteTitle: string;
  deleteAsk: string;
  deleteMany: string;
  batchConfirmTitle: string;
  batchStatusAsk: string;
  partial: string;
  importDone: string;
  importBad: string;
  doubleClickToEdit: string;
  add: string;
  edit: string;
  view: string;
  delete: string;
  actions: string;
  confirm: string;
  cancel: string;
  saved: string;
  deleted: string;
  loading: string;
  empty: string;
  networkError: string;
  invalid: string;
  required: string;
  min: string;
  max: string;
  patternMismatch: string;
  yes: string;
  no: string;
  exportFailed: string;
  formatXlsx: string;
  formatCsv: string;
  formatJson: string;
  formatXml: string;
  formatHtml: string;
}

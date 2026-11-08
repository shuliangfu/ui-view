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
  /**
   * Batch「设为…」capability fallback for `toolbar.batchStatus` (a TOOLBAR_BUILTIN).
   * UI still lives in the selection batch bar (`dp-batch-bar`) when rows are
   * selected; show / disable follow `toolbar.batchStatus` (undeclared → this caps).
   * Needs `statusField` / `statusValues` + dataSource.setField.
   */
  batchStatus: boolean;
  import: boolean;
  export: boolean;
  print: boolean;
  columns: boolean;
  /** 行高密度切换 */
  density: boolean;
  /** 面板全屏 */
  fullscreen: boolean;
  /** 复制选中行到剪贴板 */
  copy: boolean;
}

/**
 * Unified toolbar entry (no row).
 * - `true` / `false` = show only (`disable` defaults false → clickable)
 * - object may override show / disable / icon / label / action
 * - omit `show` → true; omit `disable` → false (both optional)
 * - show / disable may be zero-arg functions (evaluated when building slots)
 * - `disable: true` (or fn→true) = still visible, button disabled — NOT the same as show:false
 * - `ctrl === undefined` (e.g. admin capGate allow) → show falls back to caller-supplied caps
 * - unknown keys are custom; custom keys MUST provide `action` (asserted at mount)
 * - object literal key order = display order; undeclared builtins append after, in default order
 * - no `confirm` field: callers who need confirmation open Popconfirm/dialog inside `action`
 * - `batchStatus` is a TOOLBAR_BUILTIN (Record-gated); UI is the selection batch bar, not a toolbar icon
 */
/**
 * Action button tone — full Button ColorVariant set.
 * Toolbar custom keys map to Button `variant`; row icon buttons use hover color classes.
 * Builtin remove defaults to `danger`.
 */
export type ActionTone =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "ghost";

export type ActionCtrl =
  | boolean
  | {
    show?: boolean | (() => boolean);
    /** Default false. true / fn→true = disabled but still visible. */
    disable?: boolean | (() => boolean);
    icon?: unknown;
    /**
     * Visible text when no icon (toolbar custom) / aria. Omit → fall back to `title` then key.
     */
    label?: string;
    /**
     * Optional Tooltip text. Empty string treated as omit.
     * Final tip = title ?? label ?? builtinMessages ?? key.
     * Also used as display text when `label` is omitted.
     */
    title?: string | (() => string);
    /** Visual tone (Button ColorVariant). Default "default". Toolbar → variant; row icons → hover color. */
    tone?: ActionTone;
    /** Builtin: omit → default handler. Custom key: required (assert throws if missing). */
    action?: () => void;
  };

/**
 * Row-action entry; show / disable / action / title may be per-item functions
 * (`item` = current row).
 * `disable: true` (or fn→true) = still visible, button disabled.
 */
export type RowActionCtrl =
  | boolean
  | {
    show?: boolean | ((item: DataPanelRow) => boolean);
    /** Default false. true / fn→true = disabled but still visible. */
    disable?: boolean | ((item: DataPanelRow) => boolean);
    icon?: unknown;
    /**
     * Visible / aria text. Omit → fall back to resolved `title` then key.
     */
    label?: string;
    /**
     * Optional Tooltip text (may be (item)=>…). Empty string treated as omit.
     * Final tip = title ?? label ?? builtinMessages ?? key.
     * Also used as display text when `label` is omitted.
     * Confirm UX belongs in `action` (caller-managed) — no confirm field.
     */
    title?: string | ((item: DataPanelRow) => string);
    /** Visual tone (Button ColorVariant). Default "default"; builtin remove uses danger. */
    tone?: ActionTone;
    /** Builtin: omit → default handler. Custom key: required (assert throws if missing). */
    action?: (item: DataPanelRow) => void;
  };

export type ToolbarBuiltin =
  | "create"
  | "batchStatus"
  | "search"
  | "refresh"
  | "print"
  | "import"
  | "export"
  | "columns"
  | "density"
  | "fullscreen"
  | "copy";

export type RowBuiltin = "view" | "edit" | "remove";

/** Default toolbar display order for undeclared builtins. */
export const TOOLBAR_BUILTINS: readonly ToolbarBuiltin[] = [
  "create",
  "batchStatus",
  "search",
  "refresh",
  "print",
  "import",
  "export",
  "columns",
  "density",
  "fullscreen",
  "copy",
] as const;

/** Default row-action display order for undeclared builtins. */
export const ROW_BUILTINS: readonly RowBuiltin[] = [
  "view",
  "edit",
  "remove",
] as const;

const TOOLBAR_BUILTIN_SET = new Set<string>(TOOLBAR_BUILTINS);
const ROW_BUILTIN_SET = new Set<string>(ROW_BUILTINS);

export function isToolbarBuiltin(key: string): key is ToolbarBuiltin {
  return TOOLBAR_BUILTIN_SET.has(key);
}

export function isRowBuiltin(key: string): key is RowBuiltin {
  return ROW_BUILTIN_SET.has(key);
}

/**
 * Unified Record config. Key write order = display order.
 * Builtins: create/search/… Custom keys sit beside them; must have `action`.
 * Abolished: `extra` arrays and `order` mix fields.
 */
/**
 * Unified Record config. Values may be `undefined` (e.g. admin `capGate(allow)` →
 * undefined keeps caps fallback; `false` force-hides).
 * Abolished: `extra` arrays and `order` mix fields.
 */
export type DataPanelToolbarConfig = Record<string, ActionCtrl | undefined>;

/**
 * Unified Record config (same shape as toolbar; show/disable/action may be (item)=>…).
 * `undefined` entries = fall back to caps (admin capGate pattern).
 * Abolished: `extra` arrays and `order` mix fields.
 */
export type DataPanelRowActionsConfig = Record<string, RowActionCtrl | undefined>;

/** Evaluate boolean | (() => boolean); undefined → fallback. */
function evalFlag(
  val: boolean | (() => boolean) | undefined,
  fallback: boolean,
): boolean {
  if (val === undefined) return fallback;
  return typeof val === "function" ? val() : val;
}

/** Evaluate boolean | ((item) => boolean); undefined → fallback. */
function evalRowFlag(
  val: boolean | ((item: DataPanelRow) => boolean) | undefined,
  item: DataPanelRow,
  fallback: boolean,
): boolean {
  if (val === undefined) return fallback;
  return typeof val === "function" ? val(item) : val;
}

/** Evaluate title; omit / empty → undefined (no Tooltip). */
function evalTitle(
  val: string | (() => string) | undefined,
): string | undefined {
  if (val === undefined) return undefined;
  const s = typeof val === "function" ? val() : val;
  return s === "" ? undefined : s;
}

function evalRowTitle(
  val: string | ((item: DataPanelRow) => string) | undefined,
  item: DataPanelRow,
): string | undefined {
  if (val === undefined) return undefined;
  const s = typeof val === "function" ? val(item) : val;
  return s === "" ? undefined : s;
}

/**
 * Final Tooltip / accessible tip for a toolbar/row action:
 * `title ?? label ?? builtinDefault ?? key` (empty strings = omit).
 * Builtin messages stay preferred over bare English key.
 * Display text helper: {@link actionDisplayText}.
 */
export function actionTipText(
  key: string,
  title?: string,
  label?: string,
  builtinDefault?: string,
): string {
  if (title) return title;
  if (label) return label;
  if (builtinDefault != null && builtinDefault !== "") return builtinDefault;
  return key;
}

/**
 * Visible button text / aria when rendering a custom (or labeled) control:
 * `label ?? title ?? key` (empty strings = omit).
 */
export function actionDisplayText(
  key: string,
  label?: string,
  title?: string,
): string {
  if (label) return label;
  if (title) return title;
  return key;
}

/**
 * Resolve toolbar ActionCtrl → { show, disable, action? }.
 * - `undefined` ctrl → show = fallbackShow (caps / undeclared); disable = false
 * - boolean → show = that value; disable = false
 * - object → omit show defaults **true** (caller truth; NOT caps); omit disable defaults false
 * Functions for show/disable are invoked with no args.
 */
export function resolveActionCtrl(
  ctrl: ActionCtrl | undefined,
  fallbackShow: boolean,
): {
  show: boolean;
  disable: boolean;
  title?: string;
  tone?: ActionTone;
  label?: string;
  icon?: unknown;
  action?: () => void;
} {
  if (ctrl === undefined) return { show: fallbackShow, disable: false };
  if (typeof ctrl === "boolean") return { show: ctrl, disable: false };
  return {
    show: evalFlag(ctrl.show, true),
    disable: evalFlag(ctrl.disable, false),
    title: evalTitle(ctrl.title),
    tone: ctrl.tone,
    label: ctrl.label,
    icon: ctrl.icon,
    action: typeof ctrl.action === "function" ? ctrl.action : undefined,
  };
}

/**
 * Resolve a row-action entry for one item (current row).
 * Same defaults: object omit show → true; omit disable → false;
 * `undefined` ctrl → fallbackShow (caps).
 */
export function resolveRowActionCtrl(
  ctrl: RowActionCtrl | undefined,
  item: DataPanelRow,
  fallbackShow: boolean,
): {
  show: boolean;
  disable: boolean;
  icon?: unknown;
  label?: string;
  title?: string;
  tone?: ActionTone;
  action?: (item: DataPanelRow) => void;
} {
  if (ctrl === undefined) return { show: fallbackShow, disable: false };
  if (typeof ctrl === "boolean") return { show: ctrl, disable: false };
  return {
    show: evalRowFlag(ctrl.show, item, true),
    disable: evalRowFlag(ctrl.disable, item, false),
    icon: ctrl.icon,
    label: ctrl.label,
    title: evalRowTitle(ctrl.title, item),
    tone: ctrl.tone,
    action: ctrl.action,
  };
}

/** Throw if any custom toolbar key lacks `action`. Call at mount / before render. */
export function assertToolbarConfig(
  cfg: DataPanelToolbarConfig | undefined,
): void {
  if (!cfg) return;
  for (const [key, val] of Object.entries(cfg)) {
    if (isToolbarBuiltin(key)) continue;
    if (typeof val === "object" && val !== null && typeof val.action === "function") {
      continue;
    }
    throw new Error(
      `DataPanel toolbar custom key "${key}" requires action(); ` +
        `got ${val === null ? "null" : typeof val === "object" ? typeof (val as { action?: unknown }).action : typeof val}`,
    );
  }
}

/** Throw if any custom rowActions key lacks `action`. Call at mount / before render. */
export function assertRowActionsConfig(
  cfg: DataPanelRowActionsConfig | undefined,
): void {
  if (!cfg) return;
  for (const [key, val] of Object.entries(cfg)) {
    if (isRowBuiltin(key)) continue;
    if (typeof val === "object" && val !== null && typeof val.action === "function") {
      continue;
    }
    throw new Error(
      `DataPanel rowActions custom key "${key}" requires action(row); ` +
        `got ${val === null ? "null" : typeof val === "object" ? typeof (val as { action?: unknown }).action : typeof val}`,
    );
  }
}

/** 表格行高密度 */
export type DataPanelDensity = "compact" | "comfortable" | "loose";

/** 导出格式 */
export type DataPanelExportFormat = "xlsx" | "csv" | "json" | "xml" | "html";

/** 界面语言 */
export type DataPanelLocale = "zh-CN" | "en-US";

/** 可本地化文案；`{x}` 为占位符 */
export interface DataPanelMessages {
  search: string;
  create: string;
  refresh: string;
  /** 工具栏刷新成功提示 */
  refreshed: string;
  print: string;
  import: string;
  export: string;
  columns: string;
  resetColumns: string;
  /** 行高／密度 */
  density: string;
  densityCompact: string;
  densityComfortable: string;
  densityLoose: string;
  /** 切换密度后的提示，{mode} 为当前档文案 */
  densitySet: string;
  enterFullscreen: string;
  exitFullscreen: string;
  copy: string;
  /** 已复制 {n} 行 */
  copyDone: string;
  /** 无选中时的提示 */
  copyEmpty: string;
  copyFailed: string;
  /** 列设置里「多选」列的显示名 */
  colSelect: string;
  /** 列设置里「序号」列的显示名 */
  colIndex: string;
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
  /** 查看详情弹窗页脚的「关闭」按钮 */
  close: string;
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
